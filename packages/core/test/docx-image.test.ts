/**
 * docx 图片往返测试：图片字节嵌入 word/media 并可从 docx 抽取还原。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { unzipSync } from "fflate";
import type { JSONContent } from "@tiptap/core";
import { toDocxBuffer, fromDocx } from "@odoc/core/docx";
import { readImageSize } from "@odoc/core/docx";

// 1×1 透明 PNG
const PNG_1x1_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
const PNG_BYTES = Buffer.from(PNG_1x1_B64, "base64");

test("readImageSize：识别 PNG 内置尺寸", () => {
  const size = readImageSize(new Uint8Array(PNG_BYTES));
  assert.deepEqual(size, { width: 1, height: 1, type: "png" });
});

test("图片往返：嵌入 word/media 并从 docx 抽取还原，保留前后段落顺序", async () => {
  const dataUrl = `data:image/png;base64,${PNG_1x1_B64}`;
  const doc: JSONContent = {
    type: "doc",
    content: [
      { type: "paragraph", attrs: { officialRole: "body" }, content: [{ type: "text", text: "图前" }] },
      { type: "image", attrs: { src: dataUrl } },
      { type: "paragraph", attrs: { officialRole: "body" }, content: [{ type: "text", text: "图后" }] },
    ],
  };

  const buf = await toDocxBuffer(doc);

  // 媒体已嵌入
  const files = unzipSync(new Uint8Array(buf));
  const media = Object.keys(files).filter((k) => k.startsWith("word/media/"));
  assert.ok(media.length >= 1, "应在 word/media 嵌入图片");

  // 往返还原
  const back = fromDocx(new Uint8Array(buf));
  const top = back.content ?? [];
  assert.deepEqual(top.map((n) => n.type), ["paragraph", "image", "paragraph"], "段落-图片-段落顺序应保留");

  const img = top[1];
  const src = String(img.attrs?.src ?? "");
  assert.ok(src.startsWith("data:image/png;base64,"), "应还原为 png data URL");

  // 字节完整（导入解码长度应等于原图字节数）
  const backLen = Buffer.from(src.split(",")[1], "base64").length;
  assert.equal(backLen, PNG_BYTES.length, "图片字节应完整保留");
});
