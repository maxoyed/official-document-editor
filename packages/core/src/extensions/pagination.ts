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
 * 测量顶层块的“自然位置”（剔除已插入 spacer 抬高的偏移），
 * 使 computePageBreaks 基于连续布局计算，保证幂等收敛、不多断页。
 */
function measureBlocks(view: EditorView): { rects: BlockRect[]; positions: number[] } {
  const rootRect = view.dom.getBoundingClientRect();
  const rects: BlockRect[] = [];
  const positions: number[] = [];

  // 顶层块在文档中的起始位置
  const offsets: number[] = [];
  view.state.doc.forEach((_node, offset) => offsets.push(offset));

  const children = view.dom.children;
  const count = Math.min(children.length, offsets.length);
  let spacerOffset = 0; // 之前 spacer 抬高的累计高度
  for (let i = 0; i < count; i++) {
    const el = children[i] as HTMLElement;
    if (el.classList.contains("odoc-page-break")) {
      spacerOffset += el.getBoundingClientRect().height;
      continue;
    }
    const r = el.getBoundingClientRect();
    rects.push({ top: r.top - rootRect.top - spacerOffset, height: r.height });
    positions.push(offsets[i]);
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
            const { rects, positions } = measureBlocks(view);
            const { breaks } = computePageBreaks(rects, {
              pageContentPx: options.pageContentPx,
              breakExtraPx,
            });

            const sig = signatureOf(breaks);
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
