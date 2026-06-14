/**
 * 成文日期中文 ↔ 阿拉伯数字转换（headless，纯函数）。
 *
 * GB/T 9704-2012 规定成文日期用阿拉伯数字，但实务中也常见汉字数字。
 * 提供两向转换与解析，便于规范化或显示。
 */

const CN_DIGITS = "〇一二三四五六七八九";
const DIGIT_VALUE: Record<string, number> = {
  〇: 0, 零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9,
};

export interface DateParts {
  year: number;
  month: number;
  day: number;
}

/** 年份逐字转汉字：2026 → 二〇二六 */
function yearToChinese(year: number): string {
  return [...String(year)].map((d) => CN_DIGITS[Number(d)]).join("");
}

/** 月/日（1–31）转汉字：6→六、10→十、13→十三、20→二十、31→三十一 */
function smallToChinese(n: number): string {
  if (n <= 10) return n === 10 ? "十" : CN_DIGITS[n];
  if (n < 20) return "十" + CN_DIGITS[n - 10];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return CN_DIGITS[tens] + "十" + (ones ? CN_DIGITS[ones] : "");
}

/** 汉字年份转整数：二〇二六 / 二零二六 → 2026 */
function chineseYearToInt(s: string): number {
  return Number([...s].map((c) => DIGIT_VALUE[c] ?? "").join(""));
}

/** 汉字月/日转整数：十三→13、二十→20、三十一→31、十→10、六→6 */
function chineseSmallToInt(s: string): number {
  if (!s.includes("十")) return DIGIT_VALUE[s[0]] ?? NaN;
  const [a, b] = s.split("十");
  const tens = a === "" ? 1 : DIGIT_VALUE[a[0]] ?? 0;
  const ones = b === "" ? 0 : DIGIT_VALUE[b[0]] ?? 0;
  return tens * 10 + ones;
}

const DATE_RE =
  /^\s*([0-9〇零一二三四五六七八九两]+)\s*年\s*([0-9〇零一二三四五六七八九两十]+)\s*月\s*([0-9〇零一二三四五六七八九两十]+)\s*日?\s*$/;

/** 解析成文日期文本（兼容阿拉伯与汉字数字）；无法解析返回 null。 */
export function parseDate(input: string | Date | DateParts): DateParts | null {
  if (input instanceof Date) {
    return { year: input.getFullYear(), month: input.getMonth() + 1, day: input.getDate() };
  }
  if (typeof input === "object") return input;
  const m = DATE_RE.exec(input);
  if (!m) return null;
  const num = (s: string, cn: (x: string) => number) => (/[0-9]/.test(s) ? parseInt(s, 10) : cn(s));
  const year = num(m[1], chineseYearToInt);
  const month = num(m[2], chineseSmallToInt);
  const day = num(m[3], chineseSmallToInt);
  if ([year, month, day].some((n) => Number.isNaN(n))) return null;
  return { year, month, day };
}

/** 转为汉字成文日期：2026年6月13日 → 二〇二六年六月十三日。无法解析时原样返回。 */
export function toChineseDate(input: string | Date | DateParts): string {
  const d = parseDate(input);
  if (!d) return typeof input === "string" ? input : "";
  return `${yearToChinese(d.year)}年${smallToChinese(d.month)}月${smallToChinese(d.day)}日`;
}

/** 转为阿拉伯数字成文日期（GB/T 规范）：二〇二六年六月十三日 → 2026年6月13日。无法解析时原样返回。 */
export function toArabicDate(input: string | Date | DateParts): string {
  const d = parseDate(input);
  if (!d) return typeof input === "string" ? input : "";
  return `${d.year}年${d.month}月${d.day}日`;
}
