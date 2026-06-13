/**
 * 字体插槽：允许使用方在运行时注入授权公文字体，覆盖默认开源兜底栈。
 *
 * 适用于内网 / 离线环境需要精确还原仿宋_GB2312、方正小标宋等商业字体的场景，
 * 字体文件由使用方自行提供并保证授权合规，本库不分发任何商业字体。
 */
import { FONT_CSS_VAR, type FontRole } from "../spec/fonts";

export interface RegisterFontOptions {
  /** 对应的公文字体角色 */
  role: FontRole;
  /** font-family 名称（将注入 @font-face 并设为该角色的最高优先级） */
  family: string;
  /** 字体文件来源：URL 字符串、ArrayBuffer、或 Blob */
  source?: string | ArrayBuffer | Blob;
  /** @font-face 格式提示，如 'woff2'、'truetype' */
  format?: string;
  /** 字重 */
  weight?: string | number;
  /** 作用范围根节点，默认 document.documentElement */
  target?: HTMLElement;
}

const STYLE_ELEMENT_ID = "odoc-registered-fonts";

function ensureStyleElement(): HTMLStyleElement {
  let el = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = STYLE_ELEMENT_ID;
    document.head.appendChild(el);
  }
  return el;
}

function toCssSource(source: string | ArrayBuffer | Blob, format?: string): string {
  if (typeof source === "string") {
    const fmt = format ? ` format("${format}")` : "";
    return `url("${source}")${fmt}`;
  }
  const blob = source instanceof Blob ? source : new Blob([source]);
  const url = URL.createObjectURL(blob);
  const fmt = format ? ` format("${format}")` : "";
  return `url("${url}")${fmt}`;
}

/**
 * 注册一个公文字体到指定角色。注册后该角色立即使用此字体（最高优先级）。
 *
 * @example
 * registerFont({ role: "fangsong", family: "FangSong_GB2312", source: "/fonts/fs.woff2", format: "woff2" });
 */
export function registerFont(options: RegisterFontOptions): void {
  if (typeof document === "undefined") {
    throw new Error("registerFont 只能在浏览器环境调用。");
  }
  const { role, family, source, format, weight = "normal", target } = options;

  if (source) {
    const style = ensureStyleElement();
    const face = `@font-face{font-family:"${family}";src:${toCssSource(
      source,
      format,
    )};font-weight:${weight};font-display:swap;}`;
    style.appendChild(document.createTextNode(face));
  }

  // 将该角色的 CSS 变量指向新字体，并保留原兜底栈
  const root = target ?? document.documentElement;
  const prev = getComputedStyle(root).getPropertyValue(FONT_CSS_VAR[role]).trim();
  const next = prev ? `"${family}", ${prev}` : `"${family}"`;
  root.style.setProperty(FONT_CSS_VAR[role], next);
}
