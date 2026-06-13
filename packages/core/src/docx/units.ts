/**
 * docx（OOXML）单位换算。OOXML 长度多以 twip（1/20 pt = 1/1440 inch）为单位。
 */

/** 毫米 → twip */
export function mmToTwip(mm: number): number {
  return Math.round((mm * 1440) / 25.4);
}

/** 磅（pt）→ twip */
export function ptToTwip(pt: number): number {
  return Math.round(pt * 20);
}
