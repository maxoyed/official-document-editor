/**
 * 从 Tiptap/ProseMirror JSON 文档抽取分页所需的块信息。
 */
import type { JSONContent } from "@tiptap/core";
import type { OfficialElement } from "../spec/elements";
import type { PaginationBlock } from "./paginate";

function textOf(node: JSONContent): string {
  if (node.type === "text") return node.text ?? "";
  if (!node.content) return "";
  return node.content.map(textOf).join("");
}

/** 将 doc 的顶层节点转为分页块列表。 */
export function blocksFromDoc(doc: JSONContent): PaginationBlock[] {
  const top = doc.type === "doc" ? (doc.content ?? []) : [doc];
  return top.map((node) => {
    const forceBreakBefore = node.attrs?.pageBreakBefore ? true : undefined;
    if (node.type === "horizontalRule") {
      return { atomic: true, forceBreakBefore } as PaginationBlock;
    }
    if (node.type === "table" || node.type === "image") {
      // 表格/图片不参与按行拆分
      return { atomic: true, text: textOf(node), forceBreakBefore } satisfies PaginationBlock;
    }
    const role = node.attrs?.officialRole as OfficialElement | undefined;
    return { role, text: textOf(node), forceBreakBefore } satisfies PaginationBlock;
  });
}
