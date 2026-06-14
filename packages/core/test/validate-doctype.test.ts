/**
 * 校验器分文种规则测试。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import type { JSONContent } from "@tiptap/core";
import { validateDocument, inferDocType } from "@maxoyed/ode-core";

const p = (role: string | null, text: string): JSONContent => ({
  type: "paragraph",
  ...(role ? { attrs: { officialRole: role } } : {}),
  ...(text ? { content: [{ type: "text", text }] } : {}),
});
const codes = (doc: JSONContent) => validateDocument(doc).map((i) => i.code);

test("inferDocType：由标题识别文种", () => {
  const t = (title: string): JSONContent => ({ type: "doc", content: [p("title", title)] });
  assert.equal(inferDocType(t("关于×的请示")), "request");
  assert.equal(inferDocType(t("关于×工作的报告")), "report");
  assert.equal(inferDocType(t("关于×的批复")), "reply");
  assert.equal(inferDocType(t("关于×的函")), "letter");
  assert.equal(inferDocType(t("关于×的通报")), "circular");
  assert.equal(inferDocType(t("×会议纪要")), "minutes");
  assert.equal(inferDocType(t("关于×的通知")), "notice");
});

test("请示：多个主送机关 → REQUEST_MULTIPLE_RECIPIENTS", () => {
  const doc: JSONContent = {
    type: "doc",
    content: [p("title", "关于×的请示"), p("mainRecipient", "省政府、省财政厅："), p("body", "妥否，请批示。")],
  };
  assert.ok(codes(doc).includes("REQUEST_MULTIPLE_RECIPIENTS"));
});

test("请示：缺请示用语结尾 → REQUEST_MISSING_CLOSING", () => {
  const doc: JSONContent = {
    type: "doc",
    content: [p("title", "关于×的请示"), p("mainRecipient", "省政府："), p("body", "现将有关情况说明如下。")],
  };
  assert.ok(codes(doc).includes("REQUEST_MISSING_CLOSING"));
});

test("请示：规范结尾不报 closing 警告", () => {
  const doc: JSONContent = {
    type: "doc",
    content: [
      p("title", "关于×的请示"),
      p("mainRecipient", "省政府："),
      p("body", "现请求批准事项。"),
      p("body", "妥否，请批示。"),
      p("signer", "签发人：×"),
      p("signature", "某机关"),
      p("dateline", "2026年6月13日"),
    ],
  };
  assert.ok(!codes(doc).includes("REQUEST_MISSING_CLOSING"));
});

test("报告：夹带请求批复 → REPORT_HAS_REQUEST", () => {
  const doc: JSONContent = {
    type: "doc",
    content: [p("title", "关于×工作的报告"), p("body", "现将工作报告如下。"), p("body", "以上事项，妥否，请批示。")],
  };
  assert.ok(codes(doc).includes("REPORT_HAS_REQUEST"));
});

test("上行文缺签发人 → MISSING_SIGNER（warn）", () => {
  const doc: JSONContent = {
    type: "doc",
    content: [p("title", "关于×的请示"), p("mainRecipient", "省政府："), p("body", "妥否，请批示。")],
  };
  assert.ok(codes(doc).includes("MISSING_SIGNER"));
});

test("会议纪要：含印章 → MINUTES_HAS_SEAL；不因缺主送/署名报警", () => {
  const doc: JSONContent = {
    type: "doc",
    content: [
      p("title", "×工作会议纪要"),
      p("body", "会议议定事项如下。"),
      { type: "image", attrs: { src: "data:image/png;base64,AA==", seal: true } },
    ],
  };
  const c = codes(doc);
  assert.ok(c.includes("MINUTES_HAS_SEAL"));
  assert.ok(!c.includes("MISSING_MAIN_RECIPIENT"));
  assert.ok(!c.includes("MISSING_SIGNATURE"));
});
