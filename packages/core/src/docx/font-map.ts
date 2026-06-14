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

/**
 * 字体名（小写、去空白）子串 → 公文字体角色，用于兼容外部 docx 的多种字体写法。
 * 顺序敏感：更具体的「小标宋/中宋」需先于通用「宋」匹配。
 */
const FONT_ALIAS_RULES: ReadonlyArray<readonly [substr: string, role: FontRole]> = [
  // 小标宋 / 中宋（标题用）——须在「宋」之前
  ["小标宋", "xiaobiaosong"],
  ["xiaobiaosong", "xiaobiaosong"],
  ["中宋", "xiaobiaosong"],
  ["zhongsong", "xiaobiaosong"],
  // 仿宋（正文用）——须在「宋」之前
  ["仿宋", "fangsong"],
  ["fangsong", "fangsong"],
  // 楷体
  ["楷", "kaiti"],
  ["kai", "kaiti"],
  // 黑体 / 雅黑 / 等线（无衬线归为黑体类）
  ["黑体", "heiti"],
  ["hei", "heiti"],
  ["雅黑", "heiti"],
  ["yahei", "heiti"],
  ["等线", "heiti"],
  ["sans", "heiti"],
  // 宋体（通用，放最后）
  ["宋", "songti"],
  ["song", "songti"],
  ["sun", "songti"], // SimSun / NSimSun
  ["serif", "songti"],
  ["ming", "songti"], // AR PL UMing
];

/** 由 docx 字体名解析公文字体角色（兼容大小写/中英别名），未知返回 undefined。 */
export function roleFromDocxFont(name?: string): FontRole | undefined {
  if (!name) return undefined;
  if (FONT_ROLE_BY_DOCX_NAME[name]) return FONT_ROLE_BY_DOCX_NAME[name];
  const n = name.toLowerCase().replace(/[\s_-]/g, "");
  for (const [substr, role] of FONT_ALIAS_RULES) {
    if (n.includes(substr.toLowerCase().replace(/[\s_-]/g, ""))) return role;
  }
  return undefined;
}
