/**
 * 公文字体角色（与 GB/T 9704-2012 各要素字体要求对应）。
 *
 * ⚠️ 字体版权说明：
 *   仿宋_GB2312、楷体_GB2312、方正小标宋 等公文常用字体多为商业字体，
 *   本库不内置其字体文件，仅在 CSS 中通过 `local()` 优先引用用户系统已安装的
 *   公文字体，并以可商用开源字体（思源宋体 / 思源黑体等）兜底。
 *   如需在离线环境精确还原，请通过 registerFont() 由使用方自行提供授权字体。
 */

export type FontRole =
  | "xiaobiaosong" // 小标宋体：发文机关标志、标题
  | "fangsong" // 仿宋：正文及大多数要素
  | "heiti" // 黑体：一级标题、密级、紧急程度
  | "kaiti" // 楷体：二级标题、签发人姓名
  | "songti"; // 宋体：页码

/** 各字体角色的 CSS font-family 兜底栈（优先本机公文字体 → 开源字体 → 通用族）。 */
export const FONT_STACK: Record<FontRole, string> = {
  xiaobiaosong:
    '"方正小标宋简体", "FZXiaoBiaoSong-B05S", "STZhongsong", "华文中宋", "Source Han Serif SC", "Noto Serif SC", serif',
  fangsong:
    '"仿宋_GB2312", "仿宋", "FangSong", "STFangsong", "Source Han Serif SC", "Noto Serif SC", serif',
  heiti:
    '"黑体", "SimHei", "STHeiti", "Source Han Sans SC", "Noto Sans SC", sans-serif',
  kaiti:
    '"楷体_GB2312", "楷体", "KaiTi", "STKaiti", "Source Han Serif SC", "Noto Serif SC", serif',
  songti:
    '"宋体", "SimSun", "STSong", "Source Han Serif SC", "Noto Serif SC", serif',
};

/** CSS 变量名，运行时可被 registerFont() 覆盖以接入授权字体。 */
export const FONT_CSS_VAR: Record<FontRole, string> = {
  xiaobiaosong: "--odoc-font-xiaobiaosong",
  fangsong: "--odoc-font-fangsong",
  heiti: "--odoc-font-heiti",
  kaiti: "--odoc-font-kaiti",
  songti: "--odoc-font-songti",
};
