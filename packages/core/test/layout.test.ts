/**
 * 断页几何单测（computePageBreaks）。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { computePageBreaks, type BlockRect } from "@maxoyed/ode-core";

const opts = { pageContentPx: 100, breakExtraPx: 20 };

test("空文档：1 页、无断点", () => {
  const r = computePageBreaks([], opts);
  assert.equal(r.pageCount, 1);
  assert.deepEqual(r.breaks, []);
});

test("内容不超一页：无断点", () => {
  const blocks: BlockRect[] = [
    { top: 0, height: 30 },
    { top: 30, height: 30 },
    { top: 60, height: 30 },
  ];
  const r = computePageBreaks(blocks, opts);
  assert.equal(r.pageCount, 1);
  assert.equal(r.breaks.length, 0);
});

test("跨页块整体下移，断点位置与间隔正确", () => {
  const blocks: BlockRect[] = [
    { top: 0, height: 30 },
    { top: 30, height: 30 },
    { top: 60, height: 30 }, // 底 90 ≤ 100，留在第 1 页
    { top: 90, height: 30 }, // 底 120 > 100，移至第 2 页
    { top: 120, height: 30 },
  ];
  const r = computePageBreaks(blocks, opts);
  assert.equal(r.pageCount, 2);
  assert.equal(r.breaks.length, 1);
  assert.equal(r.breaks[0].beforeIndex, 3);
  assert.equal(r.breaks[0].pageNo, 2);
  // 上一页剩余 100-90=10，加页间留白 20 = 30
  assert.equal(r.breaks[0].spacerPx, 30);
});

test("超长单块作为页首时允许溢出（不产生断点）", () => {
  const blocks: BlockRect[] = [{ top: 0, height: 300 }];
  const r = computePageBreaks(blocks, opts);
  assert.equal(r.pageCount, 1);
  assert.equal(r.breaks.length, 0);
});

test("跨多页：连续溢出产生多个断点", () => {
  // 每块高 60，页高 100：块 0(0-60) 第1页；块 1(60-120) 溢出→第2页；
  // 块 2(120-180) 相对第2页起点 60，底 120 溢出→第3页 ...
  const blocks: BlockRect[] = Array.from({ length: 4 }, (_, i) => ({
    top: i * 60,
    height: 60,
  }));
  const r = computePageBreaks(blocks, opts);
  assert.ok(r.pageCount >= 3, `期望至少 3 页，实际 ${r.pageCount}`);
  assert.equal(r.breaks[0].beforeIndex, 1);
});
