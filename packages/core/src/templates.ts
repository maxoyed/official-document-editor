/**
 * 公文模板：返回 Tiptap/ProseMirror JSON 文档内容。
 * 让编辑器“开箱即默认公文版式”，使用方可直接加载或在此基础上修改。
 */
import type { JSONContent } from "@tiptap/core";
import type { OfficialElement } from "./spec/elements";

function p(role: OfficialElement | null, text: string): JSONContent {
  const node: JSONContent = { type: "paragraph" };
  if (role) node.attrs = { officialRole: role };
  if (text) node.content = [{ type: "text", text }];
  return node;
}

/** 标准红头文件（下行文）骨架模板。 */
export function redHeadDocumentTemplate(): JSONContent {
  return {
    type: "doc",
    content: [
      p("issuer", "○○○人民政府文件"),
      p("docNumber", "○府〔2026〕1 号"),
      { type: "horizontalRule" },
      p("title", "关于×××工作的通知"),
      p("mainRecipient", "各有关单位："),
      p("body", "根据有关工作部署，现就×××工作通知如下。"),
      p("headingLevel1", "一、总体要求"),
      p("body", "（此处填写正文内容。）"),
      p("headingLevel2", "（一）工作目标"),
      p("body", "（此处填写正文内容。）"),
      p("signature", "○○○人民政府"),
      p("dateline", "2026 年 6 月 13 日"),
    ],
  };
}

/** 空白公文（仅一个正文段落）。 */
export function blankDocumentTemplate(): JSONContent {
  return { type: "doc", content: [p("body", "")] };
}
