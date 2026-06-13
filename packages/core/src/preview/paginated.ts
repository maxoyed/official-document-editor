/**
 * 分页预览渲染器（浏览器）。
 *
 * 以真实 DOM 测量为准，将公文内容按版心高度逐块流入 A4 页面，并按 GB/T 9704
 * 规则编排页码（单页居右空一字、双页居左空一字）。用于打印/导出前的所见即所得预览。
 *
 * v1 以“整块”为流动粒度（不在段落中间断行）；超长段落的跨页断行将随
 * 编辑器内联分页一并在后续迭代提供。headless paginate() 已支持按行精确分页，
 * 可用于页数与导出计算。
 */
import type { JSONContent } from "@tiptap/core";
import { MARGIN_MM, TYPE_AREA_MM } from "../spec/layout";
import type { OfficialElement } from "../spec/elements";
import { injectOfficialStyles } from "../styles/inject";
import { pageNumberStyle, PAGE_NUMBER_OFFSET_MM } from "../pagination/page-number";

const MM_TO_PX = 96 / 25.4;
const mm = (v: number): string => `${v}mm`;

export interface PaginatedPreviewOptions {
  /** 是否渲染页码，默认 true */
  showPageNumber?: boolean;
}

function renderBlock(node: JSONContent): HTMLElement {
  if (node.type === "horizontalRule") {
    const hr = document.createElement("hr");
    hr.className = "odoc-separator";
    return hr;
  }
  const p = document.createElement("p");
  const role = node.attrs?.officialRole as OfficialElement | undefined;
  if (role) {
    p.className = `odoc-el odoc-el--${role}`;
    p.dataset.odocRole = role;
  }
  const text = (node.content ?? [])
    .map((n) => (n.type === "text" ? (n.text ?? "") : ""))
    .join("");
  // 空段落需占位高度
  p.textContent = text.length ? text : " ";
  return p;
}

function createPageNumber(pageNo: number): HTMLElement {
  const style = pageNumberStyle(pageNo);
  const el = document.createElement("div");
  el.className = "odoc-page-number";
  el.textContent = style.text;
  el.style.position = "absolute";
  // 距版心下边缘 7mm，即距页面底边 (地脚 - 7mm)
  el.style.bottom = mm(MARGIN_MM.bottom - PAGE_NUMBER_OFFSET_MM);
  if (style.align === "right") {
    el.style.right = mm(MARGIN_MM.right + style.insetMm);
  } else {
    el.style.left = mm(MARGIN_MM.left + style.insetMm);
  }
  return el;
}

interface PageRefs {
  page: HTMLElement;
  area: HTMLElement;
}

/**
 * 将文档渲染为分页预览，挂载到 mount 容器。返回总页数。
 */
export function renderPaginatedPreview(
  doc: JSONContent,
  mount: HTMLElement,
  options: PaginatedPreviewOptions = {},
): number {
  if (typeof document === "undefined") {
    throw new Error("renderPaginatedPreview 只能在浏览器环境调用。");
  }
  const { showPageNumber = true } = options;
  injectOfficialStyles();

  mount.innerHTML = "";
  mount.classList.add("odoc-canvas");

  const pageContentPx = TYPE_AREA_MM.height * MM_TO_PX;
  const blocks = (doc.type === "doc" ? doc.content : [doc]) ?? [];

  let pageNo = 0;
  let refs: PageRefs;

  const newPage = (): PageRefs => {
    pageNo += 1;
    const page = document.createElement("div");
    page.className = "odoc-page";
    const area = document.createElement("div");
    area.className = "odoc-typearea";
    page.appendChild(area);
    if (showPageNumber) page.appendChild(createPageNumber(pageNo));
    mount.appendChild(page);
    return { page, area };
  };

  refs = newPage();
  let used = 0;

  for (const node of blocks) {
    const el = renderBlock(node);
    refs.area.appendChild(el);
    const h = el.getBoundingClientRect().height;
    // 按块高累计判断是否超出版心；不依赖容器 min-height（其等于版心高会导致误判）
    if (used + h > pageContentPx && refs.area.childElementCount > 1) {
      refs.area.removeChild(el);
      refs = newPage();
      refs.area.appendChild(el);
      used = el.getBoundingClientRect().height;
    } else {
      used += h;
    }
  }

  return pageNo;
}
