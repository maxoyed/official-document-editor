/**
 * @odoc/core —— headless 公文编辑器核心。
 *
 * 设计目标：
 *  - 与前端框架无关（Vue/React/原生均可在其上封装）；
 *  - 默认排版即符合 GB/T 9704-2012《党政机关公文格式》；
 *  - 公文专用字体通过插槽由使用方提供，库本身不分发商业字体；
 *  - （规划中）支持 docx 导入导出，无损还原公文版式。
 *
 * 样式：使用前请引入 `@odoc/core/styles.css`（页面与版心），
 *       要素样式由 createOfficialDocumentEditor 自动注入。
 */
export * from "./spec";
export * from "./extensions";
export * from "./templates";
export { createOfficialDocumentEditor } from "./editor";
export type { OfficialEditorOptions } from "./editor";
export { registerFont } from "./fonts/register";
export type { RegisterFontOptions } from "./fonts/register";
export { injectOfficialStyles, buildElementStyles } from "./styles/inject";

// 透传常用 Tiptap 类型，便于使用方
export type { Editor, JSONContent } from "@tiptap/core";
