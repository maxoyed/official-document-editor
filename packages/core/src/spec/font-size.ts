/**
 * 公文字号（中文“号”制）与磅值（pt）对照表。
 *
 * 中国大陆排版沿用“号”制字号，GB/T 9704-2012《党政机关公文格式》中
 * 各要素的字号均以“号”表示（如正文为 3 号字）。此处给出号制到磅值的
 * 标准换算，供排版引擎与 docx 导出（OOXML 以半磅为单位）复用。
 */

export type ChineseFontSizeName =
  | "初号"
  | "小初"
  | "一号"
  | "小一"
  | "二号"
  | "小二"
  | "三号"
  | "小三"
  | "四号"
  | "小四"
  | "五号"
  | "小五"
  | "六号"
  | "小六"
  | "七号"
  | "八号";

/** 号制字号 → 磅值（pt） */
export const FONT_SIZE_PT: Record<ChineseFontSizeName, number> = {
  初号: 42,
  小初: 36,
  一号: 26,
  小一: 24,
  二号: 22,
  小二: 18,
  三号: 16,
  小三: 15,
  四号: 14,
  小四: 12,
  五号: 10.5,
  小五: 9,
  六号: 7.5,
  小六: 6.5,
  七号: 5.5,
  八号: 5,
};

/** 1 磅（pt）= 1/72 英寸 = 25.4/72 毫米 */
export const PT_TO_MM = 25.4 / 72;
/** 1 磅（pt）按 96dpi 屏幕 = 96/72 像素 */
export const PT_TO_PX = 96 / 72;

/** 号制字号转磅值；传入数字则原样返回（已是磅值）。 */
export function toPt(size: ChineseFontSizeName | number): number {
  return typeof size === "number" ? size : FONT_SIZE_PT[size];
}

/** 号制字号转毫米。 */
export function ptToMm(pt: number): number {
  return pt * PT_TO_MM;
}

/** 号制字号转 CSS px（96dpi）。 */
export function ptToPx(pt: number): number {
  return pt * PT_TO_PX;
}

/** OOXML（docx）中字号以半磅（half-point）为单位，<w:sz w:val="32"/> 表示 16pt。 */
export function toHalfPoint(size: ChineseFontSizeName | number): number {
  return Math.round(toPt(size) * 2);
}
