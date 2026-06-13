/**
 * 公文 → docx 导出。
 *
 * 依 GB/T 9704-2012 生成符合公文版式的 .docx：A4 页面与版心边距、各要素字体/字号/
 * 对齐/缩进、正文固定行距，以及版心下方页码（单页居右、双页居左空一字）。
 * 纯前端可用（浏览器 toDocxBlob / Node toDocxBuffer），无需后端。
 */
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  LineRuleType,
  Packer,
  PageNumber,
  Paragraph,
  TextRun,
  type ISectionOptions,
  type IParagraphOptions,
} from "docx";
import type { JSONContent } from "@tiptap/core";
import { ELEMENT_SPEC, OFFICIAL_RED, type ElementSpec, type OfficialElement } from "../spec/elements";
import { PAGE_A4_MM, MARGIN_MM, LINE_HEIGHT_MM } from "../spec/layout";
import { toHalfPoint, toPt, PT_TO_MM } from "../spec/font-size";
import { DOCX_FONT_NAME } from "./font-map";
import { mmToTwip, ptToTwip } from "./units";

const DEFAULT_ROLE: OfficialElement = "body";

function alignmentOf(spec: ElementSpec): (typeof AlignmentType)[keyof typeof AlignmentType] | undefined {
  switch (spec.align) {
    case "center":
      return AlignmentType.CENTER;
    case "right":
      return AlignmentType.RIGHT;
    case "justify":
      return AlignmentType.JUSTIFIED;
    case "left":
      return AlignmentType.LEFT;
    default:
      return undefined;
  }
}

function textOf(node: JSONContent): string {
  return (node.content ?? [])
    .map((n) => (n.type === "text" ? (n.text ?? "") : ""))
    .join("");
}

/** 将一个公文段落块转为 docx Paragraph。 */
function paragraphForRole(role: OfficialElement, text: string): Paragraph {
  const spec = ELEMENT_SPEC[role] ?? ELEMENT_SPEC[DEFAULT_ROLE];
  const sizePt = toPt(spec.size);
  const fontName = DOCX_FONT_NAME[spec.font];

  const indent: NonNullable<IParagraphOptions["indent"]> = {
    ...(spec.indent ? { firstLine: ptToTwip(spec.indent * sizePt) } : {}),
    ...(spec.marginLeft ? { left: ptToTwip(spec.marginLeft * sizePt) } : {}),
    ...(spec.marginRight ? { right: ptToTwip(spec.marginRight * sizePt) } : {}),
  };

  return new Paragraph({
    alignment: alignmentOf(spec),
    indent: Object.keys(indent).length ? indent : undefined,
    // 正文固定行距按规范（每面 22 行）；标题等沿用同一固定行距，保证版式稳定
    spacing: { line: ptToTwip(LINE_HEIGHT_MM / PT_TO_MM), lineRule: LineRuleType.EXACT },
    children: [
      new TextRun({
        text,
        font: { ascii: fontName, eastAsia: fontName, hAnsi: fontName },
        size: toHalfPoint(spec.size),
        bold: spec.bold,
        color: (spec.color ?? "#000000").replace("#", ""),
      }),
    ],
  });
}

/** 红色分隔线（发文字号下的反线）：用段落下边框表示。 */
function separatorParagraph(): Paragraph {
  return new Paragraph({
    border: {
      bottom: {
        style: BorderStyle.SINGLE,
        size: 12, // 八分之一磅为单位 → 1.5pt
        color: OFFICIAL_RED.replace("#", ""),
        space: 1,
      },
    },
    children: [new TextRun("")],
  });
}

function pageNumberFooter(align: (typeof AlignmentType)[keyof typeof AlignmentType]): Footer {
  const fontName = DOCX_FONT_NAME.songti;
  return new Footer({
    children: [
      new Paragraph({
        alignment: align,
        children: [
          new TextRun({
            children: ["— ", PageNumber.CURRENT, " —"],
            font: { ascii: fontName, eastAsia: fontName, hAnsi: fontName },
            size: toHalfPoint("四号"),
          }),
        ],
      }),
    ],
  });
}

function buildChildren(doc: JSONContent): Paragraph[] {
  const top = (doc.type === "doc" ? doc.content : [doc]) ?? [];
  return top.map((node) => {
    if (node.type === "horizontalRule") return separatorParagraph();
    const role = (node.attrs?.officialRole as OfficialElement | undefined) ?? DEFAULT_ROLE;
    return paragraphForRole(role, textOf(node));
  });
}

function buildDocument(doc: JSONContent): Document {
  const section: ISectionOptions = {
    properties: {
      page: {
        size: {
          width: mmToTwip(PAGE_A4_MM.width),
          height: mmToTwip(PAGE_A4_MM.height),
        },
        margin: {
          top: mmToTwip(MARGIN_MM.top),
          right: mmToTwip(MARGIN_MM.right),
          bottom: mmToTwip(MARGIN_MM.bottom),
          left: mmToTwip(MARGIN_MM.left),
        },
      },
    },
    footers: {
      default: pageNumberFooter(AlignmentType.RIGHT), // 单页居右
      even: pageNumberFooter(AlignmentType.LEFT), // 双页居左
    },
    children: buildChildren(doc),
  };

  return new Document({
    evenAndOddHeaderAndFooters: true,
    sections: [section],
  });
}

/** 导出为 Blob（浏览器，可直接触发下载）。 */
export function toDocxBlob(doc: JSONContent): Promise<Blob> {
  return Packer.toBlob(buildDocument(doc));
}

/** 导出为 Buffer/Uint8Array（Node，便于测试与服务端）。 */
export function toDocxBuffer(doc: JSONContent): Promise<Buffer> {
  return Packer.toBuffer(buildDocument(doc));
}
