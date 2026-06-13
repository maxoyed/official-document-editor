/**
 * 公文字体角色 → Word（docx）字体名映射。
 *
 * 与 CSS 兜底栈不同：docx 面向 Word，目标机器通常已安装公文字体，故此处使用
 * 公文规范字体名本体（如“仿宋_GB2312”）。字体本身仍由使用方环境提供，本库不分发。
 */
import type { FontRole } from "../spec/fonts";

export const DOCX_FONT_NAME: Record<FontRole, string> = {
  xiaobiaosong: "方正小标宋简体",
  fangsong: "仿宋_GB2312",
  heiti: "黑体",
  kaiti: "楷体_GB2312",
  songti: "宋体",
};

/** 反向查找：docx 字体名 → 公文字体角色（用于导入时推断要素）。 */
export const FONT_ROLE_BY_DOCX_NAME: Record<string, FontRole> = Object.fromEntries(
  (Object.keys(DOCX_FONT_NAME) as FontRole[]).map((role) => [DOCX_FONT_NAME[role], role]),
);
