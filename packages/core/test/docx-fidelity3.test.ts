/**
 * docx 保真增强（三）测试：版记分隔线变体 + 合并单元格往返。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import type { JSONContent } from "@tiptap/core";
import { toDocxBuffer, fromDocx } from "@maxoyed/ode-core/docx";

const PNG_1x1 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const cellText = (cell: JSONContent | undefined): string =>
  ((cell?.content?.[0]?.content ?? [])[0]?.text as string) ?? "";

test("分隔线变体往返：红头反线 reverse / 版记线 record", async () => {
  const doc: JSONContent = {
    type: "doc",
    content: [
      { type: "horizontalRule", attrs: { variant: "reverse" } },
      { type: "horizontalRule", attrs: { variant: "record" } },
    ],
  };
  const back = fromDocx(new Uint8Array(await toDocxBuffer(doc)));
  const hrs = (back.content ?? []).filter((n) => n.type === "horizontalRule");
  assert.equal(hrs.length, 2);
  assert.equal(hrs[0].attrs?.variant, "reverse");
  assert.equal(hrs[1].attrs?.variant, "record");
});

test("合并单元格往返：横向合并 colspan 保留", async () => {
  const doc: JSONContent = {
    type: "doc",
    content: [
      {
        type: "table",
        content: [
          {
            type: "tableRow",
            content: [
              { type: "tableCell", attrs: { colspan: 2 }, content: [{ type: "paragraph", content: [{ type: "text", text: "合并" }] }] },
            ],
          },
          {
            type: "tableRow",
            content: [
              { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "C" }] }] },
              { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "D" }] }] },
            ],
          },
        ],
      },
    ],
  };
  const back = fromDocx(new Uint8Array(await toDocxBuffer(doc)));
  const table = (back.content ?? []).find((n) => n.type === "table")!;
  const r0 = table.content?.[0].content ?? [];
  assert.equal(r0.length, 1, "首行只有一个（合并）单元格");
  assert.equal(r0[0].attrs?.colspan, 2, "colspan 应为 2");
  assert.equal(cellText(r0[0]), "合并");
  const r1 = table.content?.[1].content ?? [];
  assert.equal(r1.length, 2);
  assert.equal(cellText(r1[0]), "C");
  assert.equal(cellText(r1[1]), "D");
});

test("印章往返：浮动图片导出/导入还原为 seal 图片", async () => {
  const doc: JSONContent = {
    type: "doc",
    content: [
      { type: "paragraph", attrs: { officialRole: "dateline" }, content: [{ type: "text", text: "2026年6月13日" }] },
      { type: "image", attrs: { src: `data:image/png;base64,${PNG_1x1}`, seal: true } },
    ],
  };
  const back = fromDocx(new Uint8Array(await toDocxBuffer(doc)));
  const img = (back.content ?? []).find((n) => n.type === "image");
  assert.ok(img, "应还原图片");
  assert.equal(img!.attrs?.seal, true, "浮动图片应还原为印章");
});

test("合并单元格往返：纵向合并 rowspan 保留", async () => {
  // 2×2：A 跨两行；row1 = [A(rowspan2), B]；row2 = [D]（A 下方被合并省略）
  const doc: JSONContent = {
    type: "doc",
    content: [
      {
        type: "table",
        content: [
          {
            type: "tableRow",
            content: [
              { type: "tableCell", attrs: { rowspan: 2 }, content: [{ type: "paragraph", content: [{ type: "text", text: "A" }] }] },
              { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "B" }] }] },
            ],
          },
          {
            type: "tableRow",
            content: [
              { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "D" }] }] },
            ],
          },
        ],
      },
    ],
  };
  const back = fromDocx(new Uint8Array(await toDocxBuffer(doc)));
  const table = (back.content ?? []).find((n) => n.type === "table")!;
  const r0 = table.content?.[0].content ?? [];
  assert.equal(r0.length, 2);
  assert.equal(r0[0].attrs?.rowspan, 2, "A 的 rowspan 应为 2");
  assert.equal(cellText(r0[0]), "A");
  assert.equal(cellText(r0[1]), "B");
  const r1 = table.content?.[1].content ?? [];
  assert.equal(r1.length, 1, "第二行仅余 D（A 下方为合并延续）");
  assert.equal(cellText(r1[0]), "D");
});
