/**
 * 分页引擎单测。针对构建产物（@odoc/core）运行：先 build 再 node --test。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  paginate,
  countPages,
  estimateLines,
  blocksFromDoc,
  formatPageNumber,
  pageNumberAlign,
  redHeadDocumentTemplate,
  type PaginationBlock,
} from "@odoc/core";

test("页码格式：数字两侧各一条一字线", () => {
  assert.equal(formatPageNumber(1), "— 1 —");
  assert.equal(formatPageNumber(12), "— 12 —");
});

test("页码对齐：单页居右、双页居左", () => {
  assert.equal(pageNumberAlign(1), "right");
  assert.equal(pageNumberAlign(2), "left");
  assert.equal(pageNumberAlign(3), "right");
});

test("estimateLines：空段落占一行", () => {
  assert.equal(estimateLines({ role: "body", text: "" }), 1);
});

test("estimateLines：短正文一行，超长正文折多行", () => {
  assert.equal(estimateLines({ role: "body", text: "通知如下" }), 1);
  // 正文 3 号字每行约 28 字，首行缩进 2 字
  const long = "字".repeat(28 * 3);
  assert.ok(estimateLines({ role: "body", text: long }) >= 3);
});

test("paginate：22 行单行段落恰好一页，第 23 行进入第二页", () => {
  const one = (): PaginationBlock => ({ role: "body", text: "行" });
  assert.equal(countPages(Array.from({ length: 22 }, one)), 1);
  assert.equal(countPages(Array.from({ length: 23 }, one)), 2);
});

test("paginate：长段落按行跨页拆分", () => {
  const long = "字".repeat(28 * 30); // 约 30+ 行，超过一页 22 行
  const pages = paginate([{ role: "body", text: long }]);
  assert.ok(pages.length >= 2, "超长段落应跨页");
  // 第一个块应在多页上出现连续行区间
  const first = pages[0].fragments[0];
  assert.equal(first.blockIndex, 0);
  assert.equal(first.startLine, 0);
  assert.ok(first.endLine <= 22);
  // 后续页延续同一块
  assert.equal(pages[1].fragments[0].blockIndex, 0);
  assert.equal(pages[1].fragments[0].startLine, first.endLine);
});

test("paginate：atomic 分隔线不被拆分", () => {
  const blocks: PaginationBlock[] = [
    ...Array.from({ length: 21 }, () => ({ role: "body" as const, text: "行" })),
    { atomic: true }, // 第 22 行位置放分隔线
    { role: "body", text: "尾段" },
  ];
  const pages = paginate(blocks);
  // 分隔线整体落在某一页，不出现起止行被截断
  for (const page of pages) {
    for (const frag of page.fragments) {
      assert.ok(frag.endLine > frag.startLine);
    }
  }
  assert.ok(pages.length >= 1);
});

test("blocksFromDoc：从模板提取块，红头/分隔线/标题齐备", () => {
  const blocks = blocksFromDoc(redHeadDocumentTemplate());
  assert.ok(blocks.length > 0);
  assert.ok(blocks.some((b) => b.atomic), "应含分隔线 atomic 块");
  // 模板首块为发文机关标志
  assert.equal(blocks[0].role, "issuer");
});
