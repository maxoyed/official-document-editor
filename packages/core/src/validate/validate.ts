/**
 * 公文合规校验器（headless，纯函数，零 DOM）。
 *
 * 依 GB/T 9704-2012 对一篇公文（Tiptap/ProseMirror JSON）做结构与格式校验，
 * 返回问题列表。当前规则集面向下行文（如「通知」），可通过 options 调整必备要素。
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
  | "TITLE_TRAILING_PUNCT"
  | "DOC_NUMBER_FORMAT"
  | "DATELINE_FORMAT"
  | "DATELINE_BEFORE_SIGNATURE";

export interface Issue {
  level: IssueLevel;
  code: IssueCode;
  message: string;
  /** 相关块在 doc.content 中的下标（若适用） */
  blockIndex?: number;
}

export interface ValidateOptions {
  /** 必备要素（缺失记为 error）；缺省为 ["title", "body"] */
  required?: OfficialElement[];
  /** 建议要素（缺失记为 warn）；缺省为 ["mainRecipient", "signature", "dateline"] */
  recommended?: OfficialElement[];
}

interface Block {
  index: number;
  type: string;
  role: OfficialElement | null;
  text: string;
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
  }));
}

const DEFAULT_REQUIRED: OfficialElement[] = ["title", "body"];
const DEFAULT_RECOMMENDED: OfficialElement[] = ["mainRecipient", "signature", "dateline"];

const MISSING_MESSAGE: Partial<Record<OfficialElement, string>> = {
  title: "缺少标题",
  body: "缺少正文",
  mainRecipient: "缺少主送机关",
  signature: "缺少发文机关署名",
  dateline: "缺少成文日期",
};

const MISSING_CODE: Partial<Record<OfficialElement, IssueCode>> = {
  title: "MISSING_TITLE",
  body: "MISSING_BODY",
  mainRecipient: "MISSING_MAIN_RECIPIENT",
  signature: "MISSING_SIGNATURE",
  dateline: "MISSING_DATELINE",
};

/** 某要素是否“存在且有内容”。 */
function hasElement(blocks: Block[], role: OfficialElement): boolean {
  return blocks.some((b) => b.role === role && b.text.length > 0);
}

/** 校验一篇公文，返回问题列表（空数组表示通过）。 */
export function validateDocument(doc: JSONContent, options: ValidateOptions = {}): Issue[] {
  const required = options.required ?? DEFAULT_REQUIRED;
  const recommended = options.recommended ?? DEFAULT_RECOMMENDED;
  const blocks = toBlocks(doc);
  const issues: Issue[] = [];

  const nonEmpty = blocks.filter((b) => b.text.length > 0 || b.type === "table" || b.type === "image");
  if (nonEmpty.length === 0) {
    issues.push({ level: "error", code: "EMPTY_DOCUMENT", message: "文档为空" });
    return issues;
  }

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

  // 发文字号格式：应形如「○府〔2026〕1 号」（含〔四位年〕与“号”）
  const docNumber = blocks.find((b) => b.role === "docNumber" && b.text.length > 0);
  if (docNumber && !/〔\s*\d{4}\s*〕.*号/.test(docNumber.text)) {
    issues.push({ level: "warn", code: "DOC_NUMBER_FORMAT", message: "发文字号格式建议为「机关代字〔年份〕序号 号」", blockIndex: docNumber.index });
  }

  // 成文日期：应使用阿拉伯数字的「YYYY年M月D日」
  const dateline = blocks.find((b) => b.role === "dateline" && b.text.length > 0);
  if (dateline && !/\d{4}\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*日/.test(dateline.text)) {
    issues.push({ level: "warn", code: "DATELINE_FORMAT", message: "成文日期应使用阿拉伯数字，形如「2026年6月13日」", blockIndex: dateline.index });
  }

  // 成文日期应在发文机关署名之后
  const sigIdx = blocks.find((b) => b.role === "signature" && b.text.length > 0)?.index;
  if (sigIdx !== undefined && dateline && dateline.index < sigIdx) {
    issues.push({ level: "warn", code: "DATELINE_BEFORE_SIGNATURE", message: "成文日期应排在发文机关署名之后", blockIndex: dateline.index });
  }

  return issues;
}

/** 便捷方法：是否通过（无 error 级问题）。 */
export function isValid(doc: JSONContent, options?: ValidateOptions): boolean {
  return validateDocument(doc, options).every((i) => i.level !== "error");
}
