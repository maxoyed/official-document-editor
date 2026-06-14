/**
 * 附件页结构化测试：段前分页、附件模板、分页与 docx 往返。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import type { JSONContent } from "@tiptap/core";
import {
  attachmentTemplate,
  appendAttachment,
  redHeadDocumentTemplate,
  blocksFromDoc,
  paginate,
  validateDocument,
} from "@maxoyed/ode-core";
import { toDocxBuffer, fromDocx } from "@maxoyed/ode-core/docx";

const roleAt = (doc: JSONContent, i: number) => doc.content?.[i].attrs?.officialRole;

test("appendAttachment：附件说明在署名前，附件标识段前分页", () => {
  const doc = appendAttachment(redHeadDocumentTemplate(), {
    note: "附件：×表",
    label: "附件1",
    title: "×表",
    body: ["内容"],
  });
  const top = doc.content ?? [];
  const noteIdx = top.findIndex((n) => n.attrs?.officialRole === "attachmentNote");
  const sigIdx = top.findIndex((n) => n.attrs?.officialRole === "signature");
  assert.ok(noteIdx >= 0 && noteIdx < sigIdx, "附件说明应在署名之前");
  const label = top.find((n) => n.attrs?.officialRole === "attachmentLabel");
  assert.ok(label?.attrs?.pageBreakBefore, "附件标识应段前分页");
});

test("分页：段前分页强制另起一页", () => {
  // 一个短正文 + 段前分页的附件标识 → 应为 2 页
  const doc: JSONContent = {
    type: "doc",
    content: [
      { type: "paragraph", attrs: { officialRole: "body" }, content: [{ type: "text", text: "正文" }] },
      { type: "paragraph", attrs: { officialRole: "attachmentLabel", pageBreakBefore: true }, content: [{ type: "text", text: "附件1" }] },
      { type: "paragraph", attrs: { officialRole: "body" }, content: [{ type: "text", text: "附件内容" }] },
    ],
  };
  const pages = paginate(blocksFromDoc(doc));
  assert.equal(pages.length, 2, "段前分页应产生第二页");
  // 第二页首个片段为附件标识块（下标 1）
  assert.equal(pages[1].fragments[0].blockIndex, 1);
});

test("docx 往返：pageBreakBefore 与 attachmentLabel 保留", async () => {
  const doc = attachmentTemplate();
  const back = fromDocx(new Uint8Array(await toDocxBuffer(doc)));
  const label = (back.content ?? []).find((n) => n.attrs?.officialRole === "attachmentLabel");
  assert.ok(label, "应还原附件标识");
  assert.equal(label!.attrs?.pageBreakBefore, true, "应保留段前分页");
});

test("附件模板通过合规校验（无 error）", () => {
  const errors = validateDocument(attachmentTemplate()).filter((i) => i.level === "error");
  assert.deepEqual(errors, []);
});
