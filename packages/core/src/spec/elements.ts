/**
 * GB/T 9704-2012 各公文要素的排版规格。
 *
 * 每个要素给出字体角色、字号（号制）、对齐、缩进（以“字”为单位）、颜色等，
 * 供 Tiptap 节点渲染与 docx 导出共享同一份“事实来源”。
 */
import type { ChineseFontSizeName } from "./font-size";
import type { FontRole } from "./fonts";

export interface ElementSpec {
  /** 字体角色 */
  font: FontRole;
  /** 字号（号制） */
  size: ChineseFontSizeName;
  /** 是否加粗 */
  bold?: boolean;
  /** 水平对齐 */
  align?: "left" | "center" | "right" | "justify";
  /** 首行缩进（字） */
  indent?: number;
  /** 整体左空（字） */
  marginLeft?: number;
  /** 整体右空（字） */
  marginRight?: number;
  /** 颜色（默认黑色 #000，红头为红色） */
  color?: string;
}

/** 公文标准红色（发文机关标志、分隔线）。GB/T 9704 未规定具体值，实务常用正红。 */
export const OFFICIAL_RED = "#e60012";

export type OfficialElement =
  | "copyNumber" // 份号
  | "secrecy" // 密级和保密期限
  | "urgency" // 紧急程度
  | "issuer" // 发文机关标志（红头）
  | "docNumber" // 发文字号
  | "signer" // 签发人
  | "title" // 标题
  | "mainRecipient" // 主送机关
  | "body" // 正文（默认段落）
  | "headingLevel1" // 一级标题  一、
  | "headingLevel2" // 二级标题  （一）
  | "headingLevel3" // 三级标题  1.
  | "headingLevel4" // 四级标题  （1）
  | "attachmentNote" // 附件说明（正文下方「附件：1.×××」）
  | "attachmentLabel" // 附件标识（附件页左上角「附件1」，黑体三号顶格）
  | "signature" // 发文机关署名
  | "dateline" // 成文日期
  | "note" // 附注
  | "ccOrgan" // 版记：抄送机关
  | "printOrgan" // 版记：印发机关和印发日期
  | "pageNumber"; // 页码

export const ELEMENT_SPEC: Record<OfficialElement, ElementSpec> = {
  copyNumber: { font: "songti", size: "六号", align: "left" },
  secrecy: { font: "heiti", size: "三号", align: "left" },
  urgency: { font: "heiti", size: "三号", align: "left" },
  issuer: { font: "xiaobiaosong", size: "初号", align: "center", color: OFFICIAL_RED },
  docNumber: { font: "fangsong", size: "三号", align: "center" },
  signer: { font: "kaiti", size: "三号", align: "right" },
  title: { font: "xiaobiaosong", size: "二号", align: "center" },
  mainRecipient: { font: "fangsong", size: "三号", align: "left" },
  body: { font: "fangsong", size: "三号", align: "justify", indent: 2 },
  headingLevel1: { font: "heiti", size: "三号", indent: 2 },
  headingLevel2: { font: "kaiti", size: "三号", indent: 2 },
  headingLevel3: { font: "fangsong", size: "三号", bold: true, indent: 2 },
  headingLevel4: { font: "fangsong", size: "三号", indent: 2 },
  attachmentNote: { font: "fangsong", size: "三号", indent: 2 },
  attachmentLabel: { font: "heiti", size: "三号", align: "left" },
  signature: { font: "fangsong", size: "三号", align: "right", marginRight: 4 },
  dateline: { font: "fangsong", size: "三号", align: "right", marginRight: 4 },
  note: { font: "fangsong", size: "三号", indent: 2 },
  ccOrgan: { font: "fangsong", size: "四号", align: "left" },
  printOrgan: { font: "fangsong", size: "四号", align: "left" },
  pageNumber: { font: "songti", size: "四号" },
};
