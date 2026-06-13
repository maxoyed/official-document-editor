/**
 * Headless 分页引擎（GB/T 9704-2012「每面 22 行」模型）。
 *
 * 纯函数、零 DOM 依赖：给定公文各块（段落/分隔线等）及其要素角色与文字，
 * 依版心高度与各要素字号，按“行”为粒度精确计算分页结果。
 * 可用于：页数计算、打印/导出分页、服务端校验，亦为编辑器可视化分页提供基准。
 *
 * 说明：浏览器内的所见即所得分页应以真实 DOM 测量为准（见 PaginationView），
 * 本引擎给出与规范一致的确定性估算，二者模型一致、结果相互印证。
 */
import { ELEMENT_SPEC, type OfficialElement } from "../spec/elements";
import { toPt, PT_TO_MM } from "../spec/font-size";
import { LINES_PER_PAGE, TYPE_AREA_MM, CHARS_PER_LINE } from "../spec/layout";

/** 版心高度（pt）。 */
export const TYPE_AREA_HEIGHT_PT = TYPE_AREA_MM.height / PT_TO_MM;
/** 正文标准行高（pt）：版心高 / 每面行数。 */
export const BODY_LINE_HEIGHT_PT = TYPE_AREA_HEIGHT_PT / LINES_PER_PAGE;

/** 待分页的块（与 Tiptap JSON 的顶层节点对应）。 */
export interface PaginationBlock {
  /** 公文要素角色；缺省按正文处理 */
  role?: OfficialElement;
  /** 块内纯文本（用于估算行数）；分隔线等可为空 */
  text?: string;
  /** 是否为不可断块（如分隔线、表格），不跨页拆分 */
  atomic?: boolean;
}

/** 分页结果中某页承载的一个片段。 */
export interface PageFragment {
  /** 对应输入块的下标 */
  blockIndex: number;
  role: OfficialElement;
  /** 该片段在本块中的起始行（从 0 计） */
  startLine: number;
  /** 该片段在本块中的结束行（不含） */
  endLine: number;
}

export interface Page {
  /** 页码，从 1 开始 */
  pageNo: number;
  fragments: PageFragment[];
  /** 本页已用行高合计（pt） */
  usedHeightPt: number;
}

export interface PaginateOptions {
  /** 版心可用高度（pt），默认按规范 225mm。 */
  pageHeightPt?: number;
}

const DEFAULT_ROLE: OfficialElement = "body";

/** 某要素单行的行高（pt）：取正文行高与字号约 1.2 倍中的较大者。 */
export function lineHeightPtFor(role: OfficialElement): number {
  const spec = ELEMENT_SPEC[role] ?? ELEMENT_SPEC[DEFAULT_ROLE];
  return Math.max(BODY_LINE_HEIGHT_PT, toPt(spec.size) * 1.2);
}

/** 某要素每行可容纳的字数（按字号相对版心宽度估算）。 */
export function charsPerLineFor(role: OfficialElement): number {
  const spec = ELEMENT_SPEC[role] ?? ELEMENT_SPEC[DEFAULT_ROLE];
  // 正文 3 号字固定为 28 字/行；其余按字号面积比例缩放
  const ratio = toPt("三号") / toPt(spec.size);
  const cols = Math.round(CHARS_PER_LINE * ratio);
  const reserved = (spec.marginLeft ?? 0) + (spec.marginRight ?? 0);
  return Math.max(1, cols - reserved);
}

/** 估算某块的折行数（至少 1 行）。 */
export function estimateLines(block: PaginationBlock): number {
  const role = block.role ?? DEFAULT_ROLE;
  const spec = ELEMENT_SPEC[role] ?? ELEMENT_SPEC[DEFAULT_ROLE];
  const text = block.text ?? "";
  const len = [...text].length; // 以码点计，兼顾中英文
  if (len === 0) return 1;

  const perLine = charsPerLineFor(role);
  const indent = spec.indent ?? 0;
  const firstLineCap = Math.max(1, perLine - indent);
  if (len <= firstLineCap) return 1;
  return 1 + Math.ceil((len - firstLineCap) / perLine);
}

/**
 * 执行分页。返回每页承载的片段（块 + 行区间）。
 * 长段落会按行跨页拆分；atomic 块不拆分（放不下则移至下一页）。
 */
export function paginate(
  blocks: PaginationBlock[],
  options: PaginateOptions = {},
): Page[] {
  const pageHeight = options.pageHeightPt ?? TYPE_AREA_HEIGHT_PT;
  const pages: Page[] = [];

  let current: Page = { pageNo: 1, fragments: [], usedHeightPt: 0 };
  const pushPage = () => {
    pages.push(current);
    current = { pageNo: current.pageNo + 1, fragments: [], usedHeightPt: 0 };
  };

  blocks.forEach((block, blockIndex) => {
    const role = block.role ?? DEFAULT_ROLE;
    const lh = lineHeightPtFor(role);
    const totalLines = estimateLines(block);

    if (block.atomic) {
      const blockHeight = totalLines * lh;
      if (current.usedHeightPt + blockHeight > pageHeight && current.fragments.length > 0) {
        pushPage();
      }
      current.fragments.push({ blockIndex, role, startLine: 0, endLine: totalLines });
      current.usedHeightPt += blockHeight;
      return;
    }

    // 逐行放置，必要时跨页拆分
    let line = 0;
    while (line < totalLines) {
      const remainingPt = pageHeight - current.usedHeightPt;
      // 加微小 epsilon，避免 22 行恰好填满整页时被浮点误差判为 21 行
      let fit = Math.floor((remainingPt + 1e-6) / lh);
      if (fit <= 0) {
        if (current.fragments.length > 0) {
          pushPage();
          continue;
        }
        fit = 1; // 单行已超过整页高度时，至少放一行避免死循环
      }
      const take = Math.min(fit, totalLines - line);
      current.fragments.push({ blockIndex, role, startLine: line, endLine: line + take });
      current.usedHeightPt += take * lh;
      line += take;
    }
  });

  if (current.fragments.length > 0 || pages.length === 0) pages.push(current);
  return pages;
}

/** 便捷方法：仅返回总页数。 */
export function countPages(blocks: PaginationBlock[], options?: PaginateOptions): number {
  return paginate(blocks, options).length;
}
