/**
 * 复杂合并单元格往返探针（先跑出当前实现的问题，再据此加固）。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import type { JSONContent } from "@tiptap/core";
import { toDocxBuffer, fromDocx } from "@maxoyed/ode-core/docx";

const cell = (t: string, attrs?: Record<string, number>): JSONContent => ({
  type: "tableCell",
  ...(attrs ? { attrs } : {}),
  content: [{ type: "paragraph", content: [{ type: "text", text: t }] }],
});
const row = (...cells: JSONContent[]): JSONContent => ({ type: "tableRow", content: cells });
const table = (...rows: JSONContent[]): JSONContent => ({ type: "doc", content: [{ type: "table", content: rows }] });

async function roundtrip(doc: JSONContent) {
  const back = fromDocx(new Uint8Array(await toDocxBuffer(doc)));
  const t = (back.content ?? []).find((n) => n.type === "table")!;
  return (t.content ?? []).map((r) =>
    (r.content ?? []).map((c) => ({
      t: ((c.content?.[0]?.content ?? [])[0]?.text as string) ?? "",
      cs: (c.attrs?.colspan as number) ?? 1,
      rs: (c.attrs?.rowspan as number) ?? 1,
    })),
  );
}

test("探针 A：左上角 colspan2+rowspan2（3×3）", async () => {
  const doc = table(
    row(cell("A", { colspan: 2, rowspan: 2 }), cell("B")),
    row(cell("C")),
    row(cell("D"), cell("E"), cell("F")),
  );
  const g = await roundtrip(doc);
  assert.equal(g[0][0].t, "A");
  assert.equal(g[0][0].cs, 2);
  assert.equal(g[0][0].rs, 2);
  assert.equal(g[0][1].t, "B");
  assert.equal(g[1].length, 1);
  assert.equal(g[1][0].t, "C");
  assert.deepEqual(g[2].map((c) => c.t), ["D", "E", "F"]);
});

test("嵌套表格：单元格内嵌一个子表格，往返保留", async () => {
  const inner: JSONContent = {
    type: "table",
    content: [row(cell("x1"), cell("x2"))],
  };
  const doc = table(
    row(
      { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "前" }] }, inner] },
      cell("右"),
    ),
  );
  const back = fromDocx(new Uint8Array(await toDocxBuffer(doc)));
  const outer = (back.content ?? []).find((n) => n.type === "table")!;
  const c00 = outer.content?.[0].content?.[0];
  // 单元格内含一个段落 + 一个嵌套表格
  const nested = (c00?.content ?? []).find((n) => n.type === "table");
  assert.ok(nested, "单元格应保留嵌套表格");
  const innerText = (nested!.content?.[0].content ?? []).map(
    (cc) => (cc.content?.[0]?.content ?? [])[0]?.text,
  );
  assert.deepEqual(innerText, ["x1", "x2"]);
});

test("探针 B：纵向合并跨 3 行", async () => {
  const doc = table(
    row(cell("A", { rowspan: 3 }), cell("B")),
    row(cell("C")),
    row(cell("D")),
  );
  const g = await roundtrip(doc);
  assert.equal(g[0][0].rs, 3);
  assert.deepEqual([g[0][1].t, g[1][0].t, g[2][0].t], ["B", "C", "D"]);
});
