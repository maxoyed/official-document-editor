/**
 * 外部 docx 兼容加固测试：字体别名解析、规则推断、无 pStyle 的外部文档导入。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { zipSync, strToU8 } from "fflate";
import { roleFromDocxFont, inferRole, fromDocx } from "@maxoyed/ode-core/docx";

test("字体别名解析：兼容多种 Word 字体写法", () => {
  const cases: Record<string, string> = {
    FangSong: "fangsong",
    仿宋: "fangsong",
    "仿宋_GB2312": "fangsong",
    STFangsong: "fangsong",
    SimSun: "songti",
    宋体: "songti",
    NSimSun: "songti",
    SimHei: "heiti",
    黑体: "heiti",
    微软雅黑: "heiti",
    KaiTi: "kaiti",
    楷体: "kaiti",
    方正小标宋简体: "xiaobiaosong",
    华文中宋: "xiaobiaosong",
    STZhongsong: "xiaobiaosong",
  };
  for (const [name, role] of Object.entries(cases)) {
    assert.equal(roleFromDocxFont(name), role, `${name} → ${role}`);
  }
  assert.equal(roleFromDocxFont("Times New Roman"), undefined);
});

test("规则推断：按字体类+字号+对齐还原要素", () => {
  const hp = (pt: number) => pt * 2;
  assert.equal(inferRole({ fontName: "FangSong", sizeHalfPoint: hp(16), align: "both", hasIndent: true }), "body");
  assert.equal(inferRole({ fontName: "仿宋", sizeHalfPoint: hp(16), align: "left", hasIndent: false }), "body");
  assert.equal(inferRole({ fontName: "SimHei", sizeHalfPoint: hp(16), align: "left", hasIndent: false }), "headingLevel1");
  assert.equal(inferRole({ fontName: "KaiTi", sizeHalfPoint: hp(16), align: "left", hasIndent: true }), "headingLevel2");
  assert.equal(inferRole({ fontName: "KaiTi", sizeHalfPoint: hp(16), align: "right", hasIndent: false }), "signer");
  assert.equal(inferRole({ fontName: "方正小标宋简体", sizeHalfPoint: hp(22), align: "center", hasIndent: false }), "title");
  assert.equal(inferRole({ fontName: "方正小标宋简体", sizeHalfPoint: hp(42), align: "center", hasIndent: false }), "issuer");
  assert.equal(inferRole({ fontName: "仿宋", sizeHalfPoint: hp(16), align: "center", hasIndent: false }), "docNumber");
  assert.equal(inferRole({ fontName: "仿宋", sizeHalfPoint: hp(16), align: "right", hasIndent: false, text: "2026年6月13日" }), "dateline");
  assert.equal(inferRole({ fontName: "仿宋", sizeHalfPoint: hp(16), align: "right", hasIndent: false, text: "某某人民政府" }), "signature");
  assert.equal(inferRole({ fontName: "仿宋", sizeHalfPoint: hp(14), align: "left", hasIndent: false }), "ccOrgan");
});

function makeDocx(bodyXml: string): Uint8Array {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${bodyXml}</w:body></w:document>`;
  return zipSync({ "word/document.xml": strToU8(xml) });
}
const para = (font: string, sz: number, jc: string, text: string, ind = false) =>
  `<w:p><w:pPr><w:jc w:val="${jc}"/>${ind ? '<w:ind w:firstLine="640"/>' : ""}</w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="${font}"/><w:sz w:val="${sz}"/></w:rPr><w:t>${text}</w:t></w:r></w:p>`;

test("外部 docx（无 odoc 命名样式）：按字体推断要素角色", () => {
  const docx = makeDocx(
    para("方正小标宋简体", 44, "center", "关于test的通知") +
      para("仿宋", 32, "left", "各有关单位：") +
      para("SimHei", 32, "left", "一、总体要求") +
      para("FangSong", 32, "both", "现就有关事项通知如下。", true) +
      para("仿宋", 32, "right", "某某人民政府") +
      para("仿宋", 32, "right", "2026年6月13日"),
  );
  const roles = (fromDocx(docx).content ?? []).map((n) => n.attrs?.officialRole);
  assert.deepEqual(roles, ["title", "body", "headingLevel1", "body", "signature", "dateline"]);
});
