/**
 * 文种模板测试：结构完整、通过合规校验。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import type { JSONContent } from "@tiptap/core";
import { documentTemplates, validateDocument } from "@maxoyed/ode-core";

function roles(doc: JSONContent): string[] {
  return (doc.content ?? []).map((n) => (n.attrs?.officialRole as string) ?? n.type ?? "");
}

test("内置文种清单包含常见法定文种", () => {
  const keys = documentTemplates.map((t) => t.key);
  for (const k of ["notice", "request", "report", "reply", "letter", "circular", "minutes"]) {
    assert.ok(keys.includes(k), `应包含 ${k}`);
  }
});

test("各文种模板：含标题与正文，且无 error 级校验问题", () => {
  for (const t of documentTemplates) {
    if (t.key === "blank") continue; // 空白模板不参与
    const doc = t.build();
    const r = roles(doc);
    assert.ok(r.includes("title"), `${t.label} 应含标题`);
    assert.ok(r.includes("body"), `${t.label} 应含正文`);
    const errors = validateDocument(doc).filter((i) => i.level === "error");
    assert.deepEqual(errors, [], `${t.label} 不应有 error：${JSON.stringify(errors)}`);
  }
});

test("上行文（请示/报告）含签发人", () => {
  for (const key of ["request", "report"]) {
    const doc = documentTemplates.find((t) => t.key === key)!.build();
    assert.ok(roles(doc).includes("signer"), `${key} 应含签发人`);
  }
});

test("会议纪要：有标题正文、无署名（属正常）", () => {
  const doc = documentTemplates.find((t) => t.key === "minutes")!.build();
  const r = roles(doc);
  assert.ok(r.includes("title") && r.includes("body"));
  assert.ok(!r.includes("signature"));
});
