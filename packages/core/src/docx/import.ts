/**
 * docx → 公文导入。
 *
 * 纯前端解析：fflate 解压 .docx（zip），fast-xml-parser 读取 word/document.xml，
 * 按段落的字体/字号/对齐/缩进反推公文要素角色，回填为编辑器可用的 Tiptap JSON。
 * 对本库导出的 docx 可较好往返；对外部 docx 则尽力映射，未知样式回退为正文。
 */
import { unzipSync, strFromU8 } from "fflate";
import { XMLParser } from "fast-xml-parser";
import type { JSONContent } from "@tiptap/core";
import { ELEMENT_SPEC, type OfficialElement } from "../spec/elements";
import { toHalfPoint } from "../spec/font-size";
import { FONT_ROLE_BY_DOCX_NAME } from "./font-map";

const DEFAULT_ROLE: OfficialElement = "body";

function toArray<T>(v: T | T[] | undefined): T[] {
  if (v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}

type AnyNode = Record<string, any>;

/** 规范化对齐值：justify ↔ both，缺省视为 left。 */
function normAlign(a?: string): string {
  if (!a || a === "justify") return a === "justify" ? "both" : "left";
  return a;
}

interface ParaProps {
  fontName?: string;
  sizeHalfPoint?: number;
  align: string;
  hasIndent: boolean;
  bold: boolean;
}

/** 依段落属性推断公文要素角色。 */
function inferRole(props: ParaProps): OfficialElement {
  const roleByFont = props.fontName ? FONT_ROLE_BY_DOCX_NAME[props.fontName] : undefined;

  for (const role of Object.keys(ELEMENT_SPEC) as OfficialElement[]) {
    const spec = ELEMENT_SPEC[role];
    if (roleByFont && spec.font !== roleByFont) continue;
    if (props.sizeHalfPoint !== undefined && toHalfPoint(spec.size) !== props.sizeHalfPoint) continue;
    if (normAlign(spec.align) !== props.align) continue;
    if (Boolean(spec.bold) !== props.bold) continue;
    if (Boolean(spec.indent) !== props.hasIndent) continue;
    return role;
  }
  return DEFAULT_ROLE;
}

function runText(run: AnyNode): string {
  const t = run["w:t"];
  if (t === undefined || t === null) return "";
  if (typeof t === "object") return String(t["#text"] ?? "");
  return String(t);
}

function paragraphToNode(p: AnyNode): JSONContent {
  const pPr: AnyNode | undefined = p["w:pPr"];
  const runs = toArray<AnyNode>(p["w:r"]);
  const text = runs.map(runText).join("");

  const hasBorder = pPr?.["w:pBdr"] !== undefined;
  if (hasBorder && text.trim() === "") {
    return { type: "horizontalRule" };
  }

  const firstRpr: AnyNode | undefined = runs[0]?.["w:rPr"];
  const fontName: string | undefined = firstRpr?.["w:rFonts"]?.["@_w:eastAsia"];
  const szVal = firstRpr?.["w:sz"]?.["@_w:val"];
  const sizeHalfPoint = szVal !== undefined ? Number(szVal) : undefined;
  const align = normAlign(pPr?.["w:jc"]?.["@_w:val"]);
  const ind = pPr?.["w:ind"];
  const hasIndent = ind?.["@_w:firstLine"] !== undefined || ind?.["@_w:firstLineChars"] !== undefined;
  const bold = firstRpr?.["w:b"] !== undefined;

  const role = inferRole({ fontName, sizeHalfPoint, align, hasIndent, bold });

  const node: JSONContent = { type: "paragraph", attrs: { officialRole: role } };
  if (text.length) node.content = [{ type: "text", text }];
  return node;
}

export interface FromDocxResult {
  doc: JSONContent;
}

/** 解析 docx 数据为 Tiptap JSON 文档。 */
export function fromDocx(data: ArrayBuffer | Uint8Array): JSONContent {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const files = unzipSync(bytes);
  const docXml = files["word/document.xml"];
  if (!docXml) throw new Error("无效的 docx：未找到 word/document.xml");

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    isArray: (name) => name === "w:p" || name === "w:r",
  });
  const tree = parser.parse(strFromU8(docXml));
  const body: AnyNode | undefined = tree?.["w:document"]?.["w:body"];
  const paras = toArray<AnyNode>(body?.["w:p"]);

  const content = paras.map(paragraphToNode);
  return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] };
}
