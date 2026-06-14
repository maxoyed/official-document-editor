/**
 * 成文日期中文 ↔ 阿拉伯转换测试。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { toChineseDate, toArabicDate, parseDate } from "@maxoyed/ode-core";

test("阿拉伯 → 汉字", () => {
  assert.equal(toChineseDate("2026年6月13日"), "二〇二六年六月十三日");
  assert.equal(toChineseDate("2026年10月1日"), "二〇二六年十月一日");
  assert.equal(toChineseDate("2026年11月20日"), "二〇二六年十一月二十日");
  assert.equal(toChineseDate("2020年12月31日"), "二〇二〇年十二月三十一日");
});

test("汉字 → 阿拉伯", () => {
  assert.equal(toArabicDate("二〇二六年六月十三日"), "2026年6月13日");
  assert.equal(toArabicDate("二零二六年十月一日"), "2026年10月1日"); // 零亦可
  assert.equal(toArabicDate("二〇二六年十一月二十日"), "2026年11月20日");
  assert.equal(toArabicDate("二〇二〇年十二月三十一日"), "2020年12月31日");
});

test("往返一致", () => {
  for (const s of ["2026年6月13日", "2026年1月9日", "2026年10月10日", "2026年12月25日"]) {
    assert.equal(toArabicDate(toChineseDate(s)), s);
  }
});

test("parseDate：兼容 Date / 字符串 / 对象", () => {
  assert.deepEqual(parseDate("2026年6月13日"), { year: 2026, month: 6, day: 13 });
  assert.deepEqual(parseDate("二〇二六年六月十三日"), { year: 2026, month: 6, day: 13 });
  assert.deepEqual(parseDate(new Date(2026, 5, 13)), { year: 2026, month: 6, day: 13 });
});

test("无法解析时原样返回", () => {
  assert.equal(toArabicDate("某年某月某日"), "某年某月某日");
  assert.equal(parseDate("不是日期"), null);
});
