/**
 * docx 导入/导出往返测试。针对构建产物运行。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { unzipSync, strFromU8 } from "fflate";
import type { JSONContent } from "@tiptap/core";
import { redHeadDocumentTemplate } from "@odoc/core";
import { toDocxBuffer, fromDocx } from "@odoc/core/docx";

function textOf(node: JSONContent): string {
  return (node.content ?? []).map((n) => n.text ?? "").join("");
}
function findByText(doc: JSONContent, text: string): JSONContent | undefined {
  return (doc.content ?? []).find((n) => textOf(n).includes(text));
}

test("导出：产物为合法 docx（zip）并含 A4 页面与公文字体", async () => {
  const buf = await toDocxBuffer(redHeadDocumentTemplate());
  assert.ok(buf.length > 0);
  // zip magic "PK"
  assert.equal(buf[0], 0x50);
  assert.equal(buf[1], 0x4b);

  const xml = strFromU8(unzipSync(new Uint8Array(buf))["word/document.xml"]);
  // A4 页宽 210mm ≈ 11906 twip
  assert.match(xml, /w:pgSz[^>]*w:w="11906"/);
  // 公文字体名出现在文档中
  assert.ok(xml.includes("仿宋_GB2312"), "应含正文仿宋字体");
  assert.ok(xml.includes("方正小标宋简体"), "应含标题小标宋字体");
});

test("往返：导出再导入，标题/正文要素与文字得以还原", async () => {
  const original = redHeadDocumentTemplate();
  const buf = await toDocxBuffer(original);
  const doc = fromDocx(new Uint8Array(buf));

  const title = findByText(doc, "关于×××工作的通知");
  assert.ok(title, "应找回标题段落");
  assert.equal(title!.attrs?.officialRole, "title");

  const issuer = findByText(doc, "人民政府文件");
  assert.equal(issuer!.attrs?.officialRole, "issuer");

  const body = findByText(doc, "根据有关工作部署");
  assert.equal(body!.attrs?.officialRole, "body");

  // 分隔线往返为 horizontalRule
  assert.ok((doc.content ?? []).some((n) => n.type === "horizontalRule"), "应还原分隔线");
});

test("往返：一级/二级标题要素正确还原", async () => {
  const buf = await toDocxBuffer(redHeadDocumentTemplate());
  const doc = fromDocx(new Uint8Array(buf));
  const h1 = findByText(doc, "总体要求");
  const h2 = findByText(doc, "工作目标");
  assert.equal(h1!.attrs?.officialRole, "headingLevel1");
  assert.equal(h2!.attrs?.officialRole, "headingLevel2");
});
