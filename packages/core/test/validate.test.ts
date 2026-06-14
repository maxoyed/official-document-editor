/**
 * 公文校验器单测。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import type { JSONContent } from "@tiptap/core";
import { validateDocument, isValid, redHeadDocumentTemplate } from "@maxoyed/ode-core";

const p = (role: string | null, text: string): JSONContent => ({
  type: "paragraph",
  ...(role ? { attrs: { officialRole: role } } : {}),
  ...(text ? { content: [{ type: "text", text }] } : {}),
});

const codes = (doc: JSONContent) => validateDocument(doc).map((i) => i.code);

test("标准红头模板：无 error 级问题", () => {
  const issues = validateDocument(redHeadDocumentTemplate());
  const errors = issues.filter((i) => i.level === "error");
  assert.deepEqual(errors, [], `不应有 error，实际：${JSON.stringify(errors)}`);
  assert.equal(isValid(redHeadDocumentTemplate()), true);
});

test("空文档：EMPTY_DOCUMENT error", () => {
  const r = validateDocument({ type: "doc", content: [p(null, "")] });
  assert.equal(r.length, 1);
  assert.equal(r[0].code, "EMPTY_DOCUMENT");
  assert.equal(r[0].level, "error");
});

test("缺标题/正文：报 error；缺主送/署名/日期：报 warn", () => {
  const doc: JSONContent = { type: "doc", content: [p("docNumber", "○府〔2026〕1 号")] };
  const r = validateDocument(doc);
  const errs = r.filter((i) => i.level === "error").map((i) => i.code);
  const warns = r.filter((i) => i.level === "warn").map((i) => i.code);
  assert.ok(errs.includes("MISSING_TITLE"));
  assert.ok(errs.includes("MISSING_BODY"));
  assert.ok(warns.includes("MISSING_MAIN_RECIPIENT"));
  assert.ok(warns.includes("MISSING_SIGNATURE"));
  assert.ok(warns.includes("MISSING_DATELINE"));
});

test("标题以句号结尾：TITLE_TRAILING_PUNCT warn", () => {
  const doc: JSONContent = {
    type: "doc",
    content: [p("title", "关于×××工作的通知。"), p("body", "正文")],
  };
  assert.ok(codes(doc).includes("TITLE_TRAILING_PUNCT"));
});

test("发文字号格式不规范：DOC_NUMBER_FORMAT warn", () => {
  const doc: JSONContent = {
    type: "doc",
    content: [p("docNumber", "2026第1号"), p("title", "通知"), p("body", "正文")],
  };
  assert.ok(codes(doc).includes("DOC_NUMBER_FORMAT"));
});

test("成文日期用中文数字：DATELINE_FORMAT warn", () => {
  const doc: JSONContent = {
    type: "doc",
    content: [p("title", "通知"), p("body", "正文"), p("signature", "某机关"), p("dateline", "二〇二六年六月十三日")],
  };
  assert.ok(codes(doc).includes("DATELINE_FORMAT"));
});

test("成文日期排在署名之前：DATELINE_BEFORE_SIGNATURE warn", () => {
  const doc: JSONContent = {
    type: "doc",
    content: [p("title", "通知"), p("body", "正文"), p("dateline", "2026年6月13日"), p("signature", "某机关")],
  };
  assert.ok(codes(doc).includes("DATELINE_BEFORE_SIGNATURE"));
});

test("一篇规范公文：零问题", () => {
  const doc: JSONContent = {
    type: "doc",
    content: [
      p("issuer", "某某人民政府文件"),
      p("docNumber", "某府〔2026〕1 号"),
      { type: "horizontalRule", attrs: { variant: "reverse" } },
      p("title", "关于开展某项工作的通知"),
      p("mainRecipient", "各有关单位："),
      p("body", "现就有关事项通知如下。"),
      p("signature", "某某人民政府"),
      p("dateline", "2026年6月13日"),
    ],
  };
  assert.deepEqual(validateDocument(doc), []);
});
