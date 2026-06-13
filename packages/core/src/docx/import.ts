/**
 * docx → 公文导入。
 *
 * 纯前端解析：fflate 解压 .docx（zip），fast-xml-parser 以 preserveOrder 读取
 * word/document.xml（保留段落/表格的相对顺序）。优先用命名样式 w:pStyle（odoc-*）
 * 无损还原公文要素角色；缺失时退回按字体/字号/对齐/缩进推断。支持表格与分隔线。
 */
import { unzipSync, strFromU8 } from "fflate";
import { XMLParser } from "fast-xml-parser";
import type { JSONContent } from "@tiptap/core";
import { ELEMENT_SPEC, type OfficialElement } from "../spec/elements";
import { toHalfPoint } from "../spec/font-size";
import { FONT_ROLE_BY_DOCX_NAME } from "./font-map";
import { STYLE_ID_PREFIX } from "./export";

const DEFAULT_ROLE: OfficialElement = "body";
const KNOWN_ROLES = new Set(Object.keys(ELEMENT_SPEC));

// ---- preserveOrder 遍历辅助 ----
type PO = Record<string, unknown>;
const tagOf = (n: PO): string => Object.keys(n).find((k) => k !== ":@") ?? "";
const childrenOf = (n: PO): PO[] => (n[tagOf(n)] as PO[]) ?? [];
const kids = (n: PO, tag: string): PO[] => (n[tag] as PO[]) ?? [];
const attr = (n: PO | undefined, name: string): string | undefined =>
  n ? ((n[":@"] as Record<string, string> | undefined)?.[`@_${name}`]) : undefined;
const find = (arr: PO[], tag: string): PO | undefined => arr.find((n) => tagOf(n) === tag);
const findAll = (arr: PO[], tag: string): PO[] => arr.filter((n) => tagOf(n) === tag);

function collectText(nodes: PO[]): string {
  let s = "";
  for (const n of nodes) {
    if ("#text" in n) s += String((n as { "#text": unknown })["#text"]);
    else s += collectText(childrenOf(n));
  }
  return s;
}

function normAlign(a?: string): string {
  if (!a) return "left";
  if (a === "justify" || a === "both") return "both";
  return a;
}

interface ParaProps {
  fontName?: string;
  sizeHalfPoint?: number;
  align: string;
  hasIndent: boolean;
  bold: boolean;
}

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

function paragraphToNode(pChildren: PO[]): JSONContent {
  const pPr = find(pChildren, "w:pPr");
  const pPrKids = pPr ? childrenOf(pPr) : [];
  const runs = findAll(pChildren, "w:r");
  const text = runs.map((r) => collectText(childrenOf(r))).join("");

  // 分隔线：段落下边框且无文字
  const hasBorder = !!find(pPrKids, "w:pBdr");
  if (hasBorder && text.trim() === "") return { type: "horizontalRule" };

  // 优先命名样式（无损）
  const styleVal = attr(find(pPrKids, "w:pStyle"), "w:val");
  let role: OfficialElement | undefined;
  if (styleVal && styleVal.startsWith(STYLE_ID_PREFIX)) {
    const candidate = styleVal.slice(STYLE_ID_PREFIX.length);
    if (KNOWN_ROLES.has(candidate)) role = candidate as OfficialElement;
  }

  if (!role) {
    const firstRpr = runs[0] ? find(childrenOf(runs[0]), "w:rPr") : undefined;
    const rprKids = firstRpr ? childrenOf(firstRpr) : [];
    const fontName = attr(find(rprKids, "w:rFonts"), "w:eastAsia");
    const szVal = attr(find(rprKids, "w:sz"), "w:val");
    const ind = find(pPrKids, "w:ind");
    role = inferRole({
      fontName,
      sizeHalfPoint: szVal !== undefined ? Number(szVal) : undefined,
      align: normAlign(attr(find(pPrKids, "w:jc"), "w:val")),
      hasIndent: attr(ind, "w:firstLine") !== undefined || attr(ind, "w:firstLineChars") !== undefined,
      bold: !!find(rprKids, "w:b"),
    });
  }

  const node: JSONContent = { type: "paragraph", attrs: { officialRole: role } };
  if (text.length) node.content = [{ type: "text", text }];
  return node;
}

function tableToNode(tblChildren: PO[]): JSONContent {
  const rows = findAll(tblChildren, "w:tr").map((tr) => {
    const cells = findAll(kids(tr, "w:tr"), "w:tc").map((tc) => {
      const paras = findAll(kids(tc, "w:tc"), "w:p").map((p) => paragraphToNode(kids(p, "w:p")));
      return {
        type: "tableCell",
        content: paras.length ? paras : [{ type: "paragraph" }],
      } satisfies JSONContent;
    });
    return { type: "tableRow", content: cells } satisfies JSONContent;
  });
  return { type: "table", content: rows };
}

/** 解析 docx 数据为 Tiptap JSON 文档。 */
export function fromDocx(data: ArrayBuffer | Uint8Array): JSONContent {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const files = unzipSync(bytes);
  const docXml = files["word/document.xml"];
  if (!docXml) throw new Error("无效的 docx：未找到 word/document.xml");

  const parser = new XMLParser({
    preserveOrder: true,
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });
  const tree = parser.parse(strFromU8(docXml)) as PO[];

  const docNode = find(tree, "w:document");
  const bodyNode = docNode ? find(childrenOf(docNode), "w:body") : undefined;
  const bodyChildren = bodyNode ? childrenOf(bodyNode) : [];

  const content: JSONContent[] = [];
  for (const child of bodyChildren) {
    const tag = tagOf(child);
    if (tag === "w:p") content.push(paragraphToNode(kids(child, "w:p")));
    else if (tag === "w:tbl") content.push(tableToNode(kids(child, "w:tbl")));
    // 跳过 w:sectPr 等
  }

  return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] };
}
