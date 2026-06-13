/**
 * docx 保真增强测试：命名样式无损往返 + 表格往返。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import type { JSONContent } from "@tiptap/core";
import { ELEMENT_SPEC, type OfficialElement } from "@maxoyed/ode-core";
import { toDocxBuffer, fromDocx } from "@maxoyed/ode-core/docx";

const text = (n: JSONContent): string =>
  (n.content ?? []).map((c) => c.text ?? "").join("");

test("命名样式无损往返：每个公文要素角色精确还原（含同规格要素区分）", async () => {
  const roles = Object.keys(ELEMENT_SPEC) as OfficialElement[];
  const doc: JSONContent = {
    type: "doc",
    content: roles.map((role, i) => ({
      type: "paragraph",
      attrs: { officialRole: role },
      content: [{ type: "text", text: `R${i}-${role}` }],
    })),
  };

  const buf = await toDocxBuffer(doc);
  const back = fromDocx(new Uint8Array(buf));
  const got = (back.content ?? []).filter((n) => n.type === "paragraph");

  assert.equal(got.length, roles.length, "段落数应一致");
  roles.forEach((role, i) => {
    assert.equal(got[i].attrs?.officialRole, role, `第 ${i} 段角色应为 ${role}`);
    assert.equal(text(got[i]), `R${i}-${role}`, `第 ${i} 段文字应保留`);
  });
});

test("命名样式无损往返：署名与成文日期（同规格）不再混淆", async () => {
  const doc: JSONContent = {
    type: "doc",
    content: [
      { type: "paragraph", attrs: { officialRole: "signature" }, content: [{ type: "text", text: "某某机关" }] },
      { type: "paragraph", attrs: { officialRole: "dateline" }, content: [{ type: "text", text: "2026年6月13日" }] },
    ],
  };
  const back = fromDocx(new Uint8Array(await toDocxBuffer(doc)));
  const ps = (back.content ?? []).filter((n) => n.type === "paragraph");
  assert.equal(ps[0].attrs?.officialRole, "signature");
  assert.equal(ps[1].attrs?.officialRole, "dateline");
});

test("表格往返：保留行列结构、单元格文字与段落-表格相对顺序", async () => {
  const cell = (t: string): JSONContent => ({
    type: "tableCell",
    content: [{ type: "paragraph", content: [{ type: "text", text: t }] }],
  });
  const doc: JSONContent = {
    type: "doc",
    content: [
      { type: "paragraph", attrs: { officialRole: "body" }, content: [{ type: "text", text: "前段" }] },
      {
        type: "table",
        content: [
          { type: "tableRow", content: [cell("A1"), cell("B1")] },
          { type: "tableRow", content: [cell("A2"), cell("B2")] },
        ],
      },
      { type: "paragraph", attrs: { officialRole: "body" }, content: [{ type: "text", text: "后段" }] },
    ],
  };

  const back = fromDocx(new Uint8Array(await toDocxBuffer(doc)));
  const top = back.content ?? [];

  // 顺序：段落 → 表格 → 段落
  assert.deepEqual(top.map((n) => n.type), ["paragraph", "table", "paragraph"]);
  assert.equal(text(top[0]), "前段");
  assert.equal(text(top[2]), "后段");

  const rows = top[1].content ?? [];
  assert.equal(rows.length, 2, "应有 2 行");
  const cellText = (r: number, c: number) =>
    text((rows[r].content?.[c].content ?? [])[0]);
  assert.equal(cellText(0, 0), "A1");
  assert.equal(cellText(0, 1), "B1");
  assert.equal(cellText(1, 0), "A2");
  assert.equal(cellText(1, 1), "B2");
});
