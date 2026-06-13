/**
 * 图片工具：data URL 解析、字节 ↔ base64、以及从图片字节读取内置尺寸与类型。
 * 纯前端/Node 通用，无需依赖图片库。
 */

export type DocxImageType = "png" | "jpg" | "gif" | "bmp";

export interface ParsedImage {
  bytes: Uint8Array;
  mime: string;
  type: DocxImageType;
}

const MIME_TO_TYPE: Record<string, DocxImageType> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/gif": "gif",
  "image/bmp": "bmp",
};

const TYPE_TO_MIME: Record<DocxImageType, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  gif: "image/gif",
  bmp: "image/bmp",
};

export function base64ToBytes(b64: string): Uint8Array {
  if (typeof atob === "function") {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  // Node 环境
  return new Uint8Array(Buffer.from(b64, "base64"));
}

export function bytesToBase64(bytes: Uint8Array): string {
  if (typeof btoa === "function") {
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  return Buffer.from(bytes).toString("base64");
}

/** 解析 data:[mime];base64,xxx；非 base64 data URL 返回 null。 */
export function parseDataUrl(src: string): ParsedImage | null {
  const m = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(src);
  if (!m) return null;
  const mime = m[1].toLowerCase();
  const type = MIME_TO_TYPE[mime];
  if (!type || !m[2]) return null; // 仅支持已知类型的 base64 data URL
  return { bytes: base64ToBytes(m[3]), mime, type };
}

/** 由类型与字节拼装 data URL。 */
export function toDataUrl(type: DocxImageType, bytes: Uint8Array): string {
  return `data:${TYPE_TO_MIME[type]};base64,${bytesToBase64(bytes)}`;
}

export interface ImageSize {
  width: number;
  height: number;
  type?: DocxImageType;
}

/** 从图片字节读取内置像素尺寸（支持 PNG / GIF / JPEG / BMP）。 */
export function readImageSize(bytes: Uint8Array): ImageSize | null {
  // PNG: 89 50 4E 47 0D 0A 1A 0A，IHDR 宽高在偏移 16..24（大端）
  if (bytes.length >= 24 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    const dv = new DataView(bytes.buffer, bytes.byteOffset);
    return { width: dv.getUint32(16), height: dv.getUint32(20), type: "png" };
  }
  // GIF: 'GIF8'，宽高在偏移 6..10（小端）
  if (bytes.length >= 10 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    const dv = new DataView(bytes.buffer, bytes.byteOffset);
    return { width: dv.getUint16(6, true), height: dv.getUint16(8, true), type: "gif" };
  }
  // BMP: 'BM'，宽高在偏移 18..26（小端）
  if (bytes.length >= 26 && bytes[0] === 0x42 && bytes[1] === 0x4d) {
    const dv = new DataView(bytes.buffer, bytes.byteOffset);
    return { width: dv.getInt32(18, true), height: Math.abs(dv.getInt32(22, true)), type: "bmp" };
  }
  // JPEG: FF D8，扫描 SOF 标记取宽高
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let off = 2;
    const dv = new DataView(bytes.buffer, bytes.byteOffset);
    while (off + 9 < bytes.length) {
      if (bytes[off] !== 0xff) {
        off++;
        continue;
      }
      const marker = bytes[off + 1];
      // SOF0..SOF15 除 DHT(C4)/JPG(C8)/DAC(CC)
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { width: dv.getUint16(off + 7), height: dv.getUint16(off + 5), type: "jpg" };
      }
      const len = dv.getUint16(off + 2);
      off += 2 + len;
    }
  }
  return null;
}
