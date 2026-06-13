/**
 * 公文页码（GB/T 9704-2012）。
 *
 * 规范：页码用 4 号半角宋体阿拉伯数字，数字左右各放一条“一字线”（即一字宽的横线），
 * 编排在版心下边缘之下、距下边缘 7mm；单页码居右空一字，双页码居左空一字。
 */
import { TYPE_AREA_MM } from "../spec/layout";

/** 一字线（占一字宽的横线），用全角破折号字符表示。 */
export const DASH = "—"; // —

/** 页码与版心下边缘的距离（毫米）。 */
export const PAGE_NUMBER_OFFSET_MM = 7;

export type PageNumberAlign = "left" | "right";

/** 格式化页码，如 1 → “— 1 —”。 */
export function formatPageNumber(pageNo: number): string {
  return `${DASH} ${pageNo} ${DASH}`;
}

/**
 * 页码对齐方式：单页（奇数）居右空一字，双页（偶数）居左空一字。
 * @param pageNo 从 1 开始的页码
 */
export function pageNumberAlign(pageNo: number): PageNumberAlign {
  return pageNo % 2 === 1 ? "right" : "left";
}

export interface PageNumberStyle {
  text: string;
  align: PageNumberAlign;
  /** 距版心下边缘的距离（毫米） */
  offsetMm: number;
  /** “空一字”的留白（毫米），等于版心每字网格宽度 */
  insetMm: number;
}

/** 给定页码，返回其完整排布信息（文本/对齐/偏移/留白）。 */
export function pageNumberStyle(pageNo: number): PageNumberStyle {
  return {
    text: formatPageNumber(pageNo),
    align: pageNumberAlign(pageNo),
    offsetMm: PAGE_NUMBER_OFFSET_MM,
    insetMm: TYPE_AREA_MM.width / 28, // 每行 28 字，空一字 = 版心宽/28
  };
}
