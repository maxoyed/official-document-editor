/**
 * 公文编辑器扩展集合：StarterKit + 公文要素角色 + 文本样式/对齐/颜色。
 */
import StarterKit from "@tiptap/starter-kit";
import TextStyle from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import Color from "@tiptap/extension-color";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Image from "@tiptap/extension-image";
import type { Extensions } from "@tiptap/core";
import { OfficialRole } from "./official-role";
import { Pagination } from "./pagination";

export interface OfficialExtensionsOptions {
  /** 占位提示文字 */
  placeholder?: string;
  /** 是否启用编辑器内联实时分页（默认关闭，需浏览器环境） */
  pagination?: boolean;
}

export function getOfficialExtensions(options: OfficialExtensionsOptions = {}): Extensions {
  const extensions: Extensions = [
    StarterKit.configure({
      // 公文标题层级用 officialRole 表达，禁用通用 heading 以免样式冲突
      heading: false,
    }),
    TextStyle,
    Color,
    TextAlign.configure({ types: ["paragraph"] }),
    OfficialRole.configure({ types: ["paragraph"] }),
    Table.configure({ resizable: false }),
    TableRow,
    TableHeader,
    TableCell,
    Image.configure({ allowBase64: true, inline: false }),
  ];
  if (options.pagination) extensions.push(Pagination);
  return extensions;
}

export { OfficialRole, Pagination };
export type { PaginationOptions } from "./pagination";
