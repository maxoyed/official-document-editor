/**
 * docx → 公文导入。
 *
 * 纯前端解析：fflate 解压 .docx（zip），fast-xml-parser 以 preserveOrder 读取
 * word/document.xml（保留段落/表格/图片的相对顺序）。优先用命名样式 w:pStyle（odoc-*）
 * 无损还原公文要素角色；缺失时退回按字体/字号/对齐/缩进推断。支持表格、分隔线与图片
 * （通过关系文件 word/_rels/document.xml.rels 解析 r:embed，从 word/media 抽取媒体）。
 */
import { unzipSync, strFromU8 } from "fflate";
import { XMLParser } from "fast-xml-parser";
import type { JSONContent } from "@tiptap/core";
import { ELEMENT_SPEC, type OfficialElement } from "../spec/elements";
import { roleFromDocxFont } from "./font-map";
import { STYLE_ID_PREFIX } from "./export";
import { readImageSize, toDataUrl } from "./image";

const DEFAULT_ROLE: OfficialElement = "body";
const KNOWN_ROLES = new Set(Object.keys(ELEMENT_SPEC));

// ---- preserveOrder 遍历辅助 ----
type PO = Record<string, unknown>;
const tagOf = (n: PO): string => Object.keys(n).find((k) => k !== ":@") ?? "";
const asArray = (v: unknown): PO[] => (Array.isArray(v) ? (v as PO[]) : []);
const childrenOf = (n: PO): PO[] => asArray(n[tagOf(n)]);
const kids = (n: PO, tag: string): PO[] => asArray(n[tag]);
const attr = (n: PO | undefined, name: string): string | undefined =>
  n ? ((n[":@"] as Record<string, string> | undefined)?.[`@_${name}`]) : undefined;
const find = (arr: PO[], tag: string): PO | undefined => arr.find((n) => tagOf(n) === tag);
const findAll = (arr: PO[], tag: string): PO[] => arr.filter((n) => tagOf(n) === tag);
function findDeep(nodes: PO[], tag: string): PO | undefined {
  for (const n of nodes) {
    if (tagOf(n) === tag) return n;
    const found = findDeep(childrenOf(n), tag);
    if (found) return found;
  }
  return undefined;
}

function collectText(nodes: PO[]): string {
  let s = "";
  for (const n of nodes) {
    if ("#text" in n) s += String((n as { "#text": unknown })["#text"]);
    else s += collectText(childrenOf(n));
  }
  return s;
}

interface ImportCtx {
  files: Record<string, Uint8Array>;
  rels: Record<string, string>;
}

function parseRels(xml?: Uint8Array): Record<string, string> {
  if (!xml) return {};
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    isArray: (name) => name === "Relationship",
  });
  const tree = parser.parse(strFromU8(xml));
  const list = tree?.Relationships?.Relationship ?? [];
  const map: Record<string, string> = {};
  for (const r of list) map[r["@_Id"]] = r["@_Target"];
  return map;
}

function resolveImage(ctx: ImportCtx, relId: string): string | null {
  const target = ctx.rels[relId];
  if (!target) return null;
  const rel = target.replace(/^\/+/, "");
  const path = rel.startsWith("word/") ? rel : `word/${rel}`.replace(/word\/\.\.\//, "");
  const bytes = ctx.files[path] ?? ctx.files[rel];
  if (!bytes) return null;
  const size = readImageSize(bytes);
  return toDataUrl(size?.type ?? "png", bytes);
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
  text?: string;
}

const DATE_RE = /\d{4}\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*日/;

/**
 * 按「字体类 + 字号 + 对齐」推断公文要素（用于无 odoc- 命名样式的外部 docx）。
 * 兼容多种字体写法（仿宋/FangSong、宋体/SimSun、黑体/SimHei、楷体/KaiTi、小标宋/中宋…）。
 */
export function inferRole(props: ParaProps): OfficialElement {
  const role = roleFromDocxFont(props.fontName);
  const pt = props.sizeHalfPoint !== undefined ? props.sizeHalfPoint / 2 : undefined;
  const near = (target: number) => pt !== undefined && Math.abs(pt - target) <= 1.5;
  const big = pt !== undefined && pt >= 20; // 二号(22pt)及以上
  const a = props.align;
  const isDate = !!props.text && DATE_RE.test(props.text);

  if (role === "heiti") return "headingLevel1";
  if (role === "kaiti") return a === "right" ? "signer" : "headingLevel2";
  if (role === "xiaobiaosong") return pt !== undefined && pt >= 36 ? "issuer" : "title";

  if (role === "fangsong" || role === "songti") {
    if (big && a === "center") return "title";
    if (near(14) && a !== "center") return "ccOrgan"; // 四号：版记
    if (a === "center") return "docNumber";
    if (a === "right") return isDate ? "dateline" : "signature";
    return "body";
  }

  // 未识别字体：按字号/对齐兜底
  if (big && a === "center") return "title";
  if (a === "center") return "docNumber";
  if (a === "right") return isDate ? "dateline" : "signature";
  return DEFAULT_ROLE;
}

function paragraphToNode(pChildren: PO[], ctx: ImportCtx): JSONContent {
  // 图片：段落内含 w:drawing → a:blip r:embed。浮动锚定(wp:anchor)还原为印章
  const blip = findDeep(pChildren, "a:blip");
  if (blip) {
    const embed = attr(blip, "r:embed") ?? attr(blip, "r:link");
    const src = embed ? resolveImage(ctx, embed) : null;
    if (src) {
      const isSeal = !!findDeep(pChildren, "wp:anchor");
      return { type: "image", attrs: isSeal ? { src, seal: true } : { src } };
    }
  }

  const pPr = find(pChildren, "w:pPr");
  const pPrKids = pPr ? childrenOf(pPr) : [];
  const runs = findAll(pChildren, "w:r");
  const text = runs.map((r) => collectText(childrenOf(r))).join("");

  // 分隔线：段落下边框且无文字。按边框颜色区分红头反线 / 版记黑线
  const pBdr = find(pPrKids, "w:pBdr");
  if (pBdr && text.trim() === "") {
    const color = attr(find(childrenOf(pBdr), "w:bottom"), "w:color");
    const variant = color && color.toLowerCase() !== "e60012" ? "record" : "reverse";
    return { type: "horizontalRule", attrs: { variant } };
  }

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
      text,
    });
  }

  const node: JSONContent = { type: "paragraph", attrs: { officialRole: role } };
  if (text.length) node.content = [{ type: "text", text }];
  return node;
}

function tableToNode(tblChildren: PO[], ctx: ImportCtx): JSONContent {
  const rows: JSONContent[] = [];
  // grid 列 → 当前占据该列的合并起始单元格（用于纵向合并 vMerge=continue 累加 rowspan）
  const colOrigin = new Map<number, JSONContent>();

  for (const tr of findAll(tblChildren, "w:tr")) {
    const rowCells: JSONContent[] = [];
    let col = 0;
    for (const tc of findAll(kids(tr, "w:tr"), "w:tc")) {
      const tcPr = find(kids(tc, "w:tc"), "w:tcPr");
      const tcPrKids = tcPr ? childrenOf(tcPr) : [];
      const gridSpan = Number(attr(find(tcPrKids, "w:gridSpan"), "w:val") ?? "1") || 1;
      const vMerge = find(tcPrKids, "w:vMerge");
      const isContinue = !!vMerge && attr(vMerge, "w:val") !== "restart";

      if (isContinue) {
        // 纵向合并的延续格：累加起始格 rowspan，不产出单元格
        const origin = colOrigin.get(col);
        if (origin?.attrs) origin.attrs.rowspan = Number(origin.attrs.rowspan ?? 1) + 1;
        col += gridSpan;
        continue;
      }

      const paras = findAll(kids(tc, "w:tc"), "w:p").map((p) => paragraphToNode(kids(p, "w:p"), ctx));
      const cell: JSONContent = {
        type: "tableCell",
        attrs: { colspan: gridSpan, rowspan: 1 },
        content: paras.length ? paras : [{ type: "paragraph" }],
      };
      rowCells.push(cell);
      for (let k = 0; k < gridSpan; k++) colOrigin.set(col + k, cell);
      col += gridSpan;
    }
    rows.push({ type: "tableRow", content: rowCells });
  }
  return { type: "table", content: rows };
}

/** 解析 docx 数据为 Tiptap JSON 文档。 */
export function fromDocx(data: ArrayBuffer | Uint8Array): JSONContent {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const files = unzipSync(bytes);
  const docXml = files["word/document.xml"];
  if (!docXml) throw new Error("无效的 docx：未找到 word/document.xml");

  const ctx: ImportCtx = {
    files,
    rels: parseRels(files["word/_rels/document.xml.rels"]),
  };

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
    if (tag === "w:p") content.push(paragraphToNode(kids(child, "w:p"), ctx));
    else if (tag === "w:tbl") content.push(tableToNode(kids(child, "w:tbl"), ctx));
    // 跳过 w:sectPr 等
  }

  return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] };
}
