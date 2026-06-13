/**
 * 依据 ELEMENT_SPEC 生成公文要素样式表并注入文档。
 *
 * 这样字体/字号/对齐/缩进只有一份“事实来源”（spec/elements.ts），
 * 渲染（CSS）与 docx 导出可保持一致，避免手写 CSS 与规范漂移。
 */
import { ELEMENT_SPEC, type ElementSpec, type OfficialElement } from "../spec/elements";
import { FONT_CSS_VAR, FONT_STACK, type FontRole } from "../spec/fonts";
import { toPt } from "../spec/font-size";

const STYLE_ELEMENT_ID = "odoc-element-styles";

function fontVar(role: FontRole): string {
  return `var(${FONT_CSS_VAR[role]}, ${FONT_STACK[role]})`;
}

function ruleFor(role: OfficialElement, spec: ElementSpec): string {
  const decls: string[] = [];
  decls.push(`font-family:${fontVar(spec.font)}`);
  decls.push(`font-size:${toPt(spec.size)}pt`);
  decls.push(`font-weight:${spec.bold ? 700 : 400}`);
  if (spec.align) decls.push(`text-align:${spec.align}`);
  if (spec.color) decls.push(`color:${spec.color}`);
  // 以“字”为单位的缩进用 em（1 中文字 ≈ 1em）
  if (spec.indent) decls.push(`text-indent:${spec.indent}em`);
  if (spec.marginLeft) decls.push(`margin-left:${spec.marginLeft}em`);
  if (spec.marginRight) decls.push(`margin-right:${spec.marginRight}em`);
  return `.odoc-el--${role}{${decls.join(";")}}`;
}

/** 生成全部公文要素样式的 CSS 文本。 */
export function buildElementStyles(): string {
  return (Object.keys(ELEMENT_SPEC) as OfficialElement[])
    .map((role) => ruleFor(role, ELEMENT_SPEC[role]))
    .join("\n");
}

/** 将公文要素样式注入页面（幂等，仅注入一次）。SSR 环境下静默跳过。 */
export function injectOfficialStyles(): void {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ELEMENT_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ELEMENT_ID;
  style.textContent = buildElementStyles();
  document.head.appendChild(style);
}
