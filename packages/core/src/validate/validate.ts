/**
 * 公文合规校验器（headless，纯函数，零 DOM）。
 *
 * 依 GB/T 9704-2012 及各文种行文惯例对一篇公文（Tiptap/ProseMirror JSON）做结构与格式校验。
 * 通用规则 + 按文种（通知/请示/报告/批复/函/通报/纪要）的专属规则，返回问题列表。
 */
import type { JSONContent } from "@tiptap/core";
import type { OfficialElement } from "../spec/elements";

export type IssueLevel = "error" | "warn";

export type IssueCode =
  | "EMPTY_DOCUMENT"
  | "MISSING_TITLE"
  | "MISSING_BODY"
  | "MISSING_MAIN_RECIPIENT"
  | "MISSING_SIGNATURE"
  | "MISSING_DATELINE"
  | "MISSING_SIGNER"
  | "TITLE_TRAILING_PUNCT"
  | "DOC_NUMBER_FORMAT"
  | "DATELINE_FORMAT"
  | "DATELINE_BEFORE_SIGNATURE"
  | "REQUEST_MULTIPLE_RECIPIENTS"
  | "REQUEST_MISSING_CLOSING"
  | "REPORT_HAS_REQUEST"
  | "MINUTES_HAS_SEAL";

export interface Issue {
  level: IssueLevel;
  code: IssueCode;
  message: string;
  /** 相关块在 doc.content 中的下标（若适用） */
  blockIndex?: number;
}

/** 文种。 */
export type OfficialDocType =
  | "notice"
  | "request"
  | "report"
  | "reply"
  | "letter"
  | "circular"
  | "minutes"
  | "generic";

export interface ValidateOptions {
  /** 文种；缺省由标题推断 */
  docType?: OfficialDocType;
  /** 必备要素（缺失记为 error）；缺省由文种决定 */
  required?: OfficialElement[];
  /** 建议要素（缺失记为 warn）；缺省由文种决定 */
  recommended?: OfficialElement[];
}

interface Block {
  index: number;
  type: string;
  role: OfficialElement | null;
  text: string;
  seal: boolean;
}

function textOf(node: JSONContent): string {
  if (node.type === "text") return node.text ?? "";
  return (node.content ?? []).map(textOf).join("");
}

function toBlocks(doc: JSONContent): Block[] {
  const top = (doc.type === "doc" ? doc.content : [doc]) ?? [];
  return top.map((node, index) => ({
    index,
    type: node.type ?? "",
    role: (node.attrs?.officialRole as OfficialElement | undefined) ?? null,
    text: textOf(node).trim(),
    seal: node.type === "image" && !!node.attrs?.seal,
  }));
}

const MISSING_MESSAGE: Partial<Record<OfficialElement, string>> = {
  title: "缺少标题",
  body: "缺少正文",
  mainRecipient: "缺少主送机关",
  signature: "缺少发文机关署名",
  dateline: "缺少成文日期",
  signer: "缺少签发人（上行文应标注）",
};

const MISSING_CODE: Partial<Record<OfficialElement, IssueCode>> = {
  title: "MISSING_TITLE",
  body: "MISSING_BODY",
  mainRecipient: "MISSING_MAIN_RECIPIENT",
  signature: "MISSING_SIGNATURE",
  dateline: "MISSING_DATELINE",
  signer: "MISSING_SIGNER",
};

function hasElement(blocks: Block[], role: OfficialElement): boolean {
  return blocks.some((b) => b.role === role && b.text.length > 0);
}

/** 由标题文本推断文种。 */
export function inferDocType(doc: JSONContent): OfficialDocType {
  const title = toBlocks(doc).find((b) => b.role === "title")?.text ?? "";
  if (/请示/.test(title)) return "request";
  if (/报告/.test(title)) return "report";
  if (/批复/.test(title)) return "reply";
  if (/纪要/.test(title)) return "minutes";
  if (/通报/.test(title)) return "circular";
  if (/函/.test(title)) return "letter";
  if (/通知|决定|意见|公告|通告/.test(title)) return "notice";
  return "generic";
}

function recommendedFor(docType: OfficialDocType): OfficialElement[] {
  if (docType === "minutes") return []; // 纪要以会议名义、通常无主送/署名/印章
  if (docType === "request" || docType === "report") {
    return ["mainRecipient", "signature", "dateline", "signer"]; // 上行文应有签发人
  }
  return ["mainRecipient", "signature", "dateline"];
}

const REQUEST_CLOSING_RE = /请(批示|批复|审批|指示|批准)|妥否[，,]?\s*请|当否[，,]?\s*请/;

/** 校验一篇公文，返回问题列表（空数组表示通过）。 */
export function validateDocument(doc: JSONContent, options: ValidateOptions = {}): Issue[] {
  const blocks = toBlocks(doc);
  const issues: Issue[] = [];

  const nonEmpty = blocks.filter((b) => b.text.length > 0 || b.type === "table" || b.type === "image");
  if (nonEmpty.length === 0) {
    issues.push({ level: "error", code: "EMPTY_DOCUMENT", message: "文档为空" });
    return issues;
  }

  const docType = options.docType ?? inferDocType(doc);
  const required = options.required ?? ["title", "body"];
  const recommended = options.recommended ?? recommendedFor(docType);

  // 必备 / 建议要素
  for (const role of required) {
    if (!hasElement(blocks, role)) {
      issues.push({ level: "error", code: MISSING_CODE[role] ?? "MISSING_BODY", message: MISSING_MESSAGE[role] ?? `缺少要素 ${role}` });
    }
  }
  for (const role of recommended) {
    if (!hasElement(blocks, role)) {
      issues.push({ level: "warn", code: MISSING_CODE[role] ?? "MISSING_SIGNATURE", message: MISSING_MESSAGE[role] ?? `建议补充 ${role}` });
    }
  }

  // 标题不应以句末标点结尾
  const title = blocks.find((b) => b.role === "title" && b.text.length > 0);
  if (title && /[。！？，、；：]$/.test(title.text)) {
    issues.push({ level: "warn", code: "TITLE_TRAILING_PUNCT", message: "标题不应以标点符号结尾", blockIndex: title.index });
  }

  // 发文字号格式
  const docNumber = blocks.find((b) => b.role === "docNumber" && b.text.length > 0);
  if (docNumber && !/〔\s*\d{4}\s*〕.*号/.test(docNumber.text)) {
    issues.push({ level: "warn", code: "DOC_NUMBER_FORMAT", message: "发文字号格式建议为「机关代字〔年份〕序号 号」", blockIndex: docNumber.index });
  }

  // 成文日期格式与位置
  const dateline = blocks.find((b) => b.role === "dateline" && b.text.length > 0);
  if (dateline && !/\d{4}\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*日/.test(dateline.text)) {
    issues.push({ level: "warn", code: "DATELINE_FORMAT", message: "成文日期应使用阿拉伯数字，形如「2026年6月13日」", blockIndex: dateline.index });
  }
  const sigIdx = blocks.find((b) => b.role === "signature" && b.text.length > 0)?.index;
  if (sigIdx !== undefined && dateline && dateline.index < sigIdx) {
    issues.push({ level: "warn", code: "DATELINE_BEFORE_SIGNATURE", message: "成文日期应排在发文机关署名之后", blockIndex: dateline.index });
  }

  // ---- 分文种规则 ----
  const bodies = blocks.filter((b) => b.role === "body" && b.text.length > 0);

  if (docType === "request") {
    const recipients = blocks.filter((b) => b.role === "mainRecipient" && b.text.length > 0);
    const multi =
      recipients.length > 1 ||
      recipients.some((r) => /[、,，]/.test(r.text.replace(/[：:]\s*$/, "")));
    if (multi) {
      issues.push({ level: "warn", code: "REQUEST_MULTIPLE_RECIPIENTS", message: "请示应一文一事、原则上只写一个主送机关", blockIndex: recipients[0]?.index });
    }
    const last = bodies[bodies.length - 1];
    if (last && !REQUEST_CLOSING_RE.test(last.text)) {
      issues.push({ level: "warn", code: "REQUEST_MISSING_CLOSING", message: "请示结尾宜用「妥否，请批示」等请示用语", blockIndex: last.index });
    }
  }

  if (docType === "report") {
    const offender = bodies.find((b) => REQUEST_CLOSING_RE.test(b.text));
    if (offender) {
      issues.push({ level: "warn", code: "REPORT_HAS_REQUEST", message: "报告不应夹带请示事项或请求批复", blockIndex: offender.index });
    }
  }

  if (docType === "minutes") {
    const seal = blocks.find((b) => b.seal);
    if (seal) {
      issues.push({ level: "warn", code: "MINUTES_HAS_SEAL", message: "会议纪要不加盖印章", blockIndex: seal.index });
    }
  }

  return issues;
}

/** 便捷方法：是否通过（无 error 级问题）。 */
export function isValid(doc: JSONContent, options?: ValidateOptions): boolean {
  return validateDocument(doc, options).every((i) => i.level !== "error");
}
