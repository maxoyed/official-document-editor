/**
 * 编辑器内联实时分页（Tiptap/ProseMirror 扩展）。
 *
 * 测量可编辑区内各顶层块的真实位置，借助 headless computePageBreaks 计算断点，
 * 以 widget 装饰插入“分页间隔”，把单一 contenteditable 可视化为多张 A4 页面，
 * 并在每页版心下方编排页码（单页居右、双页居左空一字）。
 *
 * 说明：本扩展依赖浏览器布局，需在真实浏览器中目视核对；为可选扩展，
 * 不影响默认编辑器。断页几何（computePageBreaks）已单测覆盖。
 * v1 以块为断页粒度，超长段落跨页断行留待后续。
 */
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { EditorView } from "@tiptap/pm/view";
import { TYPE_AREA_MM, MARGIN_MM } from "../spec/layout";
import { computePageBreaks, type BlockRect } from "../pagination/layout";
import { pageNumberStyle } from "../pagination/page-number";

const MM_TO_PX = 96 / 25.4;

export interface PaginationOptions {
  /** 每页版心内容高度（px），默认 225mm */
  pageContentPx: number;
  /** 页间视觉间隔（px） */
  pageGapPx: number;
  /** 天头（上白边）px，用于页间留白 */
  topMarginPx: number;
  /** 地脚（下白边）px，用于页间留白 */
  bottomMarginPx: number;
  /** 是否渲染页码 */
  showPageNumbers: boolean;
}

const pluginKey = new PluginKey<DecorationSet>("odocPagination");

interface BreakMeta {
  decorations: DecorationSet;
}

function buildPageNumberEl(pageNo: number): HTMLElement {
  const style = pageNumberStyle(pageNo);
  const el = document.createElement("div");
  el.className = "odoc-inline-page-number";
  el.textContent = style.text;
  el.style.position = "absolute";
  // spacer 为全幅（含订口/切口），故页码自纸张边缘内缩 切口/订口 + 空一字
  if (style.align === "right") {
    el.style.right = `${(MARGIN_MM.right + style.insetMm) * MM_TO_PX}px`;
  } else {
    el.style.left = `${(MARGIN_MM.left + style.insetMm) * MM_TO_PX}px`;
  }
  return el;
}

interface SpacerMetrics {
  spacerPx: number;
  /** 上一页版心剩余空白（白），= spacerPx - breakExtraPx */
  remainingPx: number;
  gapPx: number;
  topMarginPx: number;
  bottomMarginPx: number;
  /** 版心下边缘距页码 7mm 的像素值 */
  pageNumberOffsetPx: number;
  endingPageNo: number;
  showPageNumbers: boolean;
}

function buildSpacer(m: SpacerMetrics): HTMLElement {
  const spacer = document.createElement("div");
  spacer.className = "odoc-page-break";
  spacer.style.display = "block"; // 置于段落内部时强制断行，把后续行推至下一页
  spacer.style.height = `${m.spacerPx}px`;
  spacer.setAttribute("contenteditable", "false");

  // 纵向构成：白(上一页剩余版心 + 地脚) → 灰(页间空隙) → 白(下一页天头)
  const whiteTop = m.remainingPx + m.bottomMarginPx;
  const grey = m.gapPx;
  spacer.style.background = `linear-gradient(to bottom, var(--odoc-page-bg) 0 ${whiteTop}px, var(--odoc-canvas-bg) ${whiteTop}px ${whiteTop + grey}px, var(--odoc-page-bg) ${whiteTop + grey}px 100%)`;

  if (m.showPageNumbers) {
    const num = buildPageNumberEl(m.endingPageNo);
    // 页码位于上一页版心下边缘之下 7mm
    num.style.top = `${m.remainingPx + m.pageNumberOffsetPx}px`;
    num.style.bottom = "";
    spacer.appendChild(num);
  }
  return spacer;
}

/**
 * 行级测量：取每个顶层块的逐行行盒（Range.getClientRects），换算为“自然位置”
 * （减去其上方所有 spacer 高度，兼容嵌在段落内部的内联 spacer），并用 posAtCoords
 * 求出每行起点的文档位置。据此即可在超长段落中间按行断页。
 *
 * 以行为单位喂给 computePageBreaks：断点落在某行起点时，若该行位于段落中部，
 * 插入的分隔 widget 即把后续行推至下一页，实现段落跨页断行。
 */
function measureLines(view: EditorView): { rects: BlockRect[]; positions: number[] } {
  const rootRect = view.dom.getBoundingClientRect();

  // 所有已插入的 spacer（含嵌套在段落内的内联 spacer）
  const spacers = Array.from(view.dom.querySelectorAll<HTMLElement>(".odoc-page-break")).map(
    (s) => {
      const r = s.getBoundingClientRect();
      return { top: r.top, h: r.height };
    },
  );
  const offsetAbove = (yTop: number) =>
    spacers.reduce((acc, s) => (s.top < yTop - 0.5 ? acc + s.h : acc), 0);

  const rects: BlockRect[] = [];
  const positions: number[] = [];
  let lastPos = -1;

  const children = view.dom.children;
  for (let i = 0; i < children.length; i++) {
    const el = children[i] as HTMLElement;
    if (el.classList.contains("odoc-page-break")) continue;

    // 取该块的行盒；空块/原子块退化为整块一行
    let lineRects: DOMRect[] = [];
    if (el.firstChild) {
      const range = document.createRange();
      range.selectNodeContents(el);
      lineRects = Array.from(range.getClientRects());
    }
    if (lineRects.length === 0) lineRects = [el.getBoundingClientRect()];

    const forcedBlock = el.hasAttribute("data-odoc-page-break-before");
    let firstLine = true;
    for (const lr of lineRects) {
      if (lr.height < 1) continue;
      const at = view.posAtCoords({ left: lr.left + 1, top: lr.top + lr.height / 2 });
      if (!at) continue;
      if (at.pos === lastPos) continue; // 同一行的重复行盒去重
      lastPos = at.pos;
      rects.push({
        top: lr.top - rootRect.top - offsetAbove(lr.top),
        height: lr.height,
        ...(forcedBlock && firstLine ? { forced: true } : {}),
      });
      positions.push(at.pos);
      firstLine = false;
    }
  }
  return { rects, positions };
}

function signatureOf(decoset: { beforeIndex: number; spacerPx: number }[]): string {
  return decoset.map((b) => `${b.beforeIndex}:${Math.round(b.spacerPx)}`).join("|");
}

export const Pagination = Extension.create<PaginationOptions>({
  name: "odocPagination",

  addOptions() {
    return {
      pageContentPx: TYPE_AREA_MM.height * MM_TO_PX,
      pageGapPx: 24,
      topMarginPx: MARGIN_MM.top * MM_TO_PX,
      bottomMarginPx: MARGIN_MM.bottom * MM_TO_PX,
      showPageNumbers: true,
    };
  },

  addProseMirrorPlugins() {
    const options = this.options;
    let lastSignature = "";
    let raf = 0;

    return [
      new Plugin<DecorationSet>({
        key: pluginKey,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, old) {
            const meta = tr.getMeta(pluginKey) as BreakMeta | undefined;
            if (meta) return meta.decorations;
            return old.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations(state) {
            return pluginKey.getState(state);
          },
        },
        view(view) {
          const breakExtraPx = options.bottomMarginPx + options.pageGapPx + options.topMarginPx;
          const pageNumberOffsetPx = 7 * MM_TO_PX; // 版心下边缘距页码 7mm

          const recompute = () => {
            const { rects, positions } = measureLines(view);
            const { breaks, pageCount } = computePageBreaks(rects, {
              pageContentPx: options.pageContentPx,
              breakExtraPx,
            });

            // 末页：补足整张 A4 白纸并编排末页页码
            let tailRemaining = 0;
            if (rects.length) {
              const last = rects[rects.length - 1];
              const lastPageStart = breaks.length
                ? rects[breaks[breaks.length - 1].beforeIndex].top
                : rects[0].top;
              tailRemaining = Math.max(
                0,
                options.pageContentPx - (last.top + last.height - lastPageStart),
              );
            }

            const sig = `${signatureOf(breaks)}#${pageCount}:${Math.round(tailRemaining)}`;
            if (sig === lastSignature) return;
            lastSignature = sig;

            const decos = breaks.map((b) =>
              Decoration.widget(
                positions[b.beforeIndex],
                () =>
                  buildSpacer({
                    spacerPx: b.spacerPx,
                    remainingPx: Math.max(0, b.spacerPx - breakExtraPx),
                    gapPx: options.pageGapPx,
                    topMarginPx: options.topMarginPx,
                    bottomMarginPx: options.bottomMarginPx,
                    pageNumberOffsetPx,
                    endingPageNo: b.pageNo - 1,
                    showPageNumbers: options.showPageNumbers,
                  }),
                { side: -1, key: `odoc-break-${b.beforeIndex}` },
              ),
            );

            if (rects.length && options.showPageNumbers) {
              // 末页补白：填满版心剩余 + 地脚（无页间空隙、无下一页天头），页码落于地脚
              decos.push(
                Decoration.widget(
                  view.state.doc.content.size,
                  () =>
                    buildSpacer({
                      spacerPx: tailRemaining + options.bottomMarginPx,
                      remainingPx: tailRemaining,
                      gapPx: 0,
                      topMarginPx: 0,
                      bottomMarginPx: options.bottomMarginPx,
                      pageNumberOffsetPx,
                      endingPageNo: pageCount,
                      showPageNumbers: true,
                    }),
                  { side: 1, key: `odoc-tail-${pageCount}` },
                ),
              );
            }
            const decorations = DecorationSet.create(view.state.doc, decos);
            const tr = view.state.tr.setMeta(pluginKey, { decorations } satisfies BreakMeta);
            view.dispatch(tr);
          };

          const schedule = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(recompute);
          };

          schedule();
          return {
            update: schedule,
            destroy: () => cancelAnimationFrame(raf),
          };
        },
      }),
    ];
  },
});
