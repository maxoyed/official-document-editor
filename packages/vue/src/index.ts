/**
 * @maxoyed/ode-vue —— 公文编辑器 Vue 3 适配（薄封装）。
 *
 * 用法：
 *   import { OfficialEditor } from "@maxoyed/ode-vue";
 *   import "@maxoyed/ode-core/styles.css";
 *   <OfficialEditor v-model="doc" :pagination="true" />
 */
export { OfficialEditor } from "./OfficialEditor";
export { useOfficialEditor } from "./useOfficialEditor";
export type { UseOfficialEditorResult } from "./useOfficialEditor";

// 透传常用能力，免去再依赖 @maxoyed/ode-core
export {
  redHeadDocumentTemplate,
  blankDocumentTemplate,
  type Editor,
  type JSONContent,
  type OfficialElement,
} from "@maxoyed/ode-core";
