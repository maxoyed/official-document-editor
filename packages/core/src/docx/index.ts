/**
 * 公文 docx 导入/导出（纯前端，离线可用）。
 */
export { toDocxBlob, toDocxBuffer, styleIdFor } from "./export";
export { fromDocx, inferRole } from "./import";
export { roleFromDocxFont } from "./font-map";
export { DOCX_FONT_NAME } from "./font-map";
export { readImageSize, parseDataUrl, toDataUrl } from "./image";
export type { DocxImageType, ImageSize } from "./image";
