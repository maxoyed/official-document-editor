/**
 * 公文模板：返回 Tiptap/ProseMirror JSON 文档内容。
 * 让编辑器“开箱即默认公文版式”，使用方可直接加载或在此基础上修改。
 *
 * 覆盖常见法定文种：通知、请示、报告、批复、函、通报、会议纪要。
 * 文本均为 ○○○ / ××× 占位，便于按需替换。
 */
import type { JSONContent } from "@tiptap/core";
import type { OfficialElement } from "./spec/elements";

function p(role: OfficialElement | null, text: string): JSONContent {
  const node: JSONContent = { type: "paragraph" };
  if (role) node.attrs = { officialRole: role };
  if (text) node.content = [{ type: "text", text }];
  return node;
}

/** 红色反线（红头分隔线）。 */
function hr(): JSONContent {
  return { type: "horizontalRule", attrs: { variant: "reverse" } };
}

const DATE = "2026 年 6 月 13 日";

/** 通知（下行文，标准红头文件）。 */
export function redHeadDocumentTemplate(): JSONContent {
  return {
    type: "doc",
    content: [
      p("issuer", "○○○人民政府文件"),
      p("docNumber", "○府〔2026〕1 号"),
      hr(),
      p("title", "关于×××工作的通知"),
      p("mainRecipient", "各有关单位："),
      p("body", "根据有关工作部署，现就×××工作通知如下。"),
      p("headingLevel1", "一、总体要求"),
      p("body", "（此处填写正文内容。）"),
      p("headingLevel2", "（一）工作目标"),
      p("body", "（此处填写正文内容。）"),
      p("signature", "○○○人民政府"),
      p("dateline", DATE),
    ],
  };
}

/** 请示（上行文，向上级机关请求指示/批准，含签发人）。 */
export function requestTemplate(): JSONContent {
  return {
    type: "doc",
    content: [
      p("issuer", "○○○（发文机关全称）"),
      p("docNumber", "○○〔2026〕1 号"),
      p("signer", "签发人：×××"),
      hr(),
      p("title", "关于×××的请示"),
      p("mainRecipient", "○○○（主送上级机关）："),
      p("body", "（请示缘由：说明请示的理由、依据和背景。）"),
      p("body", "（请示事项：提出具体、明确的请求。）"),
      p("body", "妥否，请批示。"),
      p("signature", "○○○（发文机关署名）"),
      p("dateline", DATE),
    ],
  };
}

/** 报告（上行文，向上级汇报工作、反映情况，不要求批复）。 */
export function reportTemplate(): JSONContent {
  return {
    type: "doc",
    content: [
      p("issuer", "○○○（发文机关全称）"),
      p("docNumber", "○○〔2026〕1 号"),
      p("signer", "签发人：×××"),
      hr(),
      p("title", "关于×××工作的报告"),
      p("mainRecipient", "○○○（主送上级机关）："),
      p("body", "（报告事由与工作情况：说明开展情况、成效、问题与下一步打算。）"),
      p("body", "特此报告。"),
      p("signature", "○○○（发文机关署名）"),
      p("dateline", DATE),
    ],
  };
}

/** 批复（下行文，答复下级机关请示）。 */
export function replyTemplate(): JSONContent {
  return {
    type: "doc",
    content: [
      p("issuer", "○○○人民政府文件"),
      p("docNumber", "○府〔2026〕1 号"),
      hr(),
      p("title", "关于×××的批复"),
      p("mainRecipient", "○○○（请示机关）："),
      p("body", "你单位《关于×××的请示》（○○〔2026〕○号）收悉。经研究，现批复如下："),
      p("body", "一、（批复意见……）"),
      p("body", "二、（其他要求……）"),
      p("body", "此复。"),
      p("signature", "○○○人民政府"),
      p("dateline", DATE),
    ],
  };
}

/** 函（平行文/不相隶属机关之间商洽、询问、答复）。 */
export function letterTemplate(): JSONContent {
  return {
    type: "doc",
    content: [
      p("issuer", "○○○（发文机关名称）函"),
      p("docNumber", "○函〔2026〕1 号"),
      hr(),
      p("title", "关于×××的函"),
      p("mainRecipient", "○○○（主送机关）："),
      p("body", "（去函事由与商洽/询问事项：说明发函的缘由与具体请求。）"),
      p("body", "特此函达，请予支持。"),
      p("signature", "○○○（发文机关署名）"),
      p("dateline", DATE),
    ],
  };
}

/** 通报（下行文，表彰先进、批评错误、传达情况）。 */
export function circularTemplate(): JSONContent {
  return {
    type: "doc",
    content: [
      p("issuer", "○○○人民政府文件"),
      p("docNumber", "○府〔2026〕1 号"),
      hr(),
      p("title", "关于×××的通报"),
      p("mainRecipient", "各有关单位："),
      p("body", "（通报事由与情况：说明事项经过、性质与处理意见。）"),
      p("body", "特此通报。"),
      p("signature", "○○○人民政府"),
      p("dateline", DATE),
    ],
  };
}

/** 会议纪要（记载会议主要情况和议定事项；不加盖印章）。 */
export function minutesTemplate(): JSONContent {
  return {
    type: "doc",
    content: [
      p("title", "○○○工作会议纪要"),
      p("body", "时间：2026 年 6 月 13 日"),
      p("body", "地点：○○○"),
      p("body", "主持人：×××　　记录人：×××"),
      p("body", "出席人员：……"),
      p("body", "会议听取了×××情况汇报，经研究，议定事项如下："),
      p("headingLevel1", "一、（议定事项……）"),
      p("body", "（落实要求……）"),
      p("headingLevel1", "二、（议定事项……）"),
      p("body", "（落实要求……）"),
    ],
  };
}

/** 空白公文（仅一个正文段落）。 */
export function blankDocumentTemplate(): JSONContent {
  return { type: "doc", content: [p("body", "")] };
}

export interface DocumentTemplate {
  /** 唯一标识 */
  key: string;
  /** 中文文种名 */
  label: string;
  /** 行文方向说明 */
  direction: "上行" | "下行" | "平行" | "—";
  build: () => JSONContent;
}

/** 内置文种模板清单，便于在 UI 中列举选择。 */
export const documentTemplates: DocumentTemplate[] = [
  { key: "notice", label: "通知", direction: "下行", build: redHeadDocumentTemplate },
  { key: "request", label: "请示", direction: "上行", build: requestTemplate },
  { key: "report", label: "报告", direction: "上行", build: reportTemplate },
  { key: "reply", label: "批复", direction: "下行", build: replyTemplate },
  { key: "letter", label: "函", direction: "平行", build: letterTemplate },
  { key: "circular", label: "通报", direction: "下行", build: circularTemplate },
  { key: "minutes", label: "会议纪要", direction: "—", build: minutesTemplate },
  { key: "blank", label: "空白", direction: "—", build: blankDocumentTemplate },
];
