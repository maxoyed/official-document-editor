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
  HorizontalPositionAlign,
  HorizontalPositionRelativeFrom,
  ImageRun,
  LineRuleType,
  Packer,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  TextWrappingType,
  VerticalPositionRelativeFrom,
  WidthType,
  type IParagraphStyleOptions,
  type ISectionOptions,
  type IParagraphOptions,
} from "docx";
import type { JSONContent } from "@tiptap/core";
import { ELEMENT_SPEC, OFFICIAL_RED, type ElementSpec, type OfficialElement } from "../spec/elements";
import { PAGE_A4_MM, MARGIN_MM, TYPE_AREA_MM, LINE_HEIGHT_MM } from "../spec/layout";
import { toHalfPoint, toPt, PT_TO_MM } from "../spec/font-size";
import { DOCX_FONT_NAME } from "./font-map";
import { mmToTwip, ptToTwip } from "./units";
import { parseDataUrl, readImageSize } from "./image";

/** 版心宽度（px，96dpi），用于限制图片最大宽度。 */
const TYPE_AREA_WIDTH_PX = (TYPE_AREA_MM.width / 25.4) * 96;

const DEFAULT_ROLE: OfficialElement = "body";

/** 段落样式 id：用于在 docx 中以命名样式标记公文要素，实现无损往返。 */
export const STYLE_ID_PREFIX = "odoc-";
export function styleIdFor(role: OfficialElement): string {
  return `${STYLE_ID_PREFIX}${role}`;
}

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
    style: styleIdFor(role), // 命名样式，便于 Word 识别与无损往返
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

/** 依 ELEMENT_SPEC 生成全部公文要素的命名段落样式（写入 styles.xml）。 */
function buildParagraphStyles(): IParagraphStyleOptions[] {
  return (Object.keys(ELEMENT_SPEC) as OfficialElement[]).map((role) => {
    const spec = ELEMENT_SPEC[role];
    const sizePt = toPt(spec.size);
    const fontName = DOCX_FONT_NAME[spec.font];
    const indent: NonNullable<IParagraphOptions["indent"]> = {
      ...(spec.indent ? { firstLine: ptToTwip(spec.indent * sizePt) } : {}),
      ...(spec.marginLeft ? { left: ptToTwip(spec.marginLeft * sizePt) } : {}),
      ...(spec.marginRight ? { right: ptToTwip(spec.marginRight * sizePt) } : {}),
    };
    return {
      id: styleIdFor(role),
      name: `ODOC ${role}`,
      basedOn: "Normal",
      next: styleIdFor(DEFAULT_ROLE),
      quickFormat: true,
      run: {
        font: { ascii: fontName, eastAsia: fontName, hAnsi: fontName },
        size: toHalfPoint(spec.size),
        bold: spec.bold,
        color: (spec.color ?? "#000000").replace("#", ""),
      },
      paragraph: {
        alignment: alignmentOf(spec),
        indent: Object.keys(indent).length ? indent : undefined,
        spacing: { line: ptToTwip(LINE_HEIGHT_MM / PT_TO_MM), lineRule: LineRuleType.EXACT },
      },
    } satisfies IParagraphStyleOptions;
  });
}

/** 表格节点 → docx Table（全框线，单元格内段落沿用其要素角色，缺省正文）。 */
function tableForNode(node: JSONContent): Table {
  const rows = (node.content ?? []).filter((r) => r.type === "tableRow");
  const border = { style: BorderStyle.SINGLE, size: 4, color: "000000" } as const;
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
    rows: rows.map(
      (row) =>
        new TableRow({
          children: (row.content ?? [])
            .filter((c) => c.type === "tableCell" || c.type === "tableHeader")
            .map((cell) => {
              const nodes = (cell.content ?? []).filter(
                (n) => n.type === "paragraph" || n.type === "table" || n.type === "image" || n.type === "horizontalRule",
              );
              const children = (nodes.length ? nodes : [{ type: "paragraph" } as JSONContent]).map(
                nodeToBlock,
              );
              const colspan = Number(cell.attrs?.colspan ?? 1) || 1;
              const rowspan = Number(cell.attrs?.rowspan ?? 1) || 1;
              return new TableCell({
                children,
                columnSpan: colspan > 1 ? colspan : undefined,
                rowSpan: rowspan > 1 ? rowspan : undefined,
              });
            }),
        }),
    ),
  });
}

/** 图片节点 → 居中段落 + ImageRun（按版心宽度等比缩放）。 */
function imageParagraph(node: JSONContent): Paragraph {
  const src = (node.attrs?.src as string | undefined) ?? "";
  const parsed = parseDataUrl(src);
  if (!parsed) {
    // 非 base64 data URL（如外链）无法离线嵌入，导出为占位文字
    return paragraphForRole("body", node.attrs?.alt ? `[图片：${node.attrs.alt}]` : "[图片]");
  }
  const size = readImageSize(parsed.bytes) ?? { width: 400, height: 300 };
  const isSeal = !!node.attrs?.seal;
  const maxWidth = isSeal ? (40 / 25.4) * 96 : TYPE_AREA_WIDTH_PX; // 印章约 40mm
  const scale = size.width > maxWidth ? maxWidth / size.width : 1;
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new ImageRun({
        data: parsed.bytes,
        type: parsed.type,
        transformation: {
          width: Math.round(size.width * scale),
          height: Math.round(size.height * scale),
        },
        // 印章导出为浮动图片，允许叠压于成文日期之上
        ...(isSeal
          ? {
              floating: {
                horizontalPosition: {
                  relative: HorizontalPositionRelativeFrom.MARGIN,
                  align: HorizontalPositionAlign.CENTER,
                },
                // 上移约 0.8 倍印章高度，使其叠压在上一行成文日期之上
                verticalPosition: {
                  relative: VerticalPositionRelativeFrom.PARAGRAPH,
                  offset: -Math.round(size.height * scale * 0.8 * 9525), // px → EMU
                },
                allowOverlap: true,
                behindDocument: false,
                wrap: { type: TextWrappingType.NONE },
              },
            }
          : {}),
      }),
    ],
  });
}

/** 分隔线：用段落下边框表示。reverse=红头反线(红1.5pt)，record=版记线(黑0.75pt)。 */
function separatorParagraph(variant: "reverse" | "record" = "reverse"): Paragraph {
  const isRecord = variant === "record";
  return new Paragraph({
    border: {
      bottom: {
        style: BorderStyle.SINGLE,
        size: isRecord ? 6 : 12, // 八分之一磅为单位 → 0.75pt / 1.5pt
        color: isRecord ? "000000" : OFFICIAL_RED.replace("#", ""),
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

/** 顶层 / 单元格内的节点 → docx 块（支持表格内嵌段落/图片/分隔线/嵌套表格）。 */
function nodeToBlock(node: JSONContent): Paragraph | Table {
  if (node.type === "horizontalRule")
    return separatorParagraph((node.attrs?.variant as "reverse" | "record") ?? "reverse");
  if (node.type === "image") return imageParagraph(node);
  if (node.type === "table") return tableForNode(node);
  const role = (node.attrs?.officialRole as OfficialElement | undefined) ?? DEFAULT_ROLE;
  return paragraphForRole(role, textOf(node));
}

function buildChildren(doc: JSONContent): (Paragraph | Table)[] {
  const top = (doc.type === "doc" ? doc.content : [doc]) ?? [];
  return top.map(nodeToBlock);
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
    styles: { paragraphStyles: buildParagraphStyles() },
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
