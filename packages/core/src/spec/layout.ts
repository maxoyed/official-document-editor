/**
 * GB/T 9704-2012《党政机关公文格式》页面与版心规范。
 *
 * 标准要点（A4 纸，210mm × 297mm）：
 *  - 版心尺寸：156mm（宽）× 225mm（高）。
 *  - 页边距：天头（上白边）37mm，订口（左白边）28mm；
 *    由版心尺寸反推：地脚（下白边）35mm，切口（右白边）26mm。
 *  - 正文每面排 22 行、每行 28 个字（3 号仿宋）。
 *  - 字间距与行距由版心尺寸均分得到，保证每面行数、每行字数固定。
 */

/** A4 纸张尺寸（毫米）。 */
export const PAGE_A4_MM = { width: 210, height: 297 } as const;

/** 版心尺寸（毫米）。 */
export const TYPE_AREA_MM = { width: 156, height: 225 } as const;

/**
 * 页边距（毫米）。
 * top = 天头(上白边)，left = 订口(左白边)，其余由版心尺寸反推。
 */
export const MARGIN_MM = {
  top: 37,
  left: 28,
  right: PAGE_A4_MM.width - 28 - TYPE_AREA_MM.width, // 26mm（切口）
  bottom: PAGE_A4_MM.height - 37 - TYPE_AREA_MM.height, // 35mm（地脚）
} as const;

/** 正文每面行数。 */
export const LINES_PER_PAGE = 22;
/** 正文每行字数。 */
export const CHARS_PER_LINE = 28;

/**
 * 正文标准行距（毫米）：版心高度 / 每面行数。
 * 225 / 22 ≈ 10.227mm ≈ 28.98pt，实务中常设为固定行距 28.8~29pt。
 */
export const LINE_HEIGHT_MM = TYPE_AREA_MM.height / LINES_PER_PAGE;

/**
 * 正文每字标准网格宽度（毫米）：版心宽度 / 每行字数。
 * 156 / 28 ≈ 5.571mm。
 */
export const CHAR_BOX_MM = TYPE_AREA_MM.width / CHARS_PER_LINE;

export const Layout = {
  page: PAGE_A4_MM,
  typeArea: TYPE_AREA_MM,
  margin: MARGIN_MM,
  linesPerPage: LINES_PER_PAGE,
  charsPerLine: CHARS_PER_LINE,
  lineHeightMm: LINE_HEIGHT_MM,
  charBoxMm: CHAR_BOX_MM,
} as const;

export type LayoutSpec = typeof Layout;
