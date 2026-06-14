/**
 * 段前分页（page-break-before）：为段落附加「另起一页」标记。
 *
 * 用于附件页等"另起一页"的场景，模型与 Word 的段落「段前分页」一致。
 * 仅附加 data 属性与 class；分页/打印/docx 据此在该段之前断页。
 */
import { Extension } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pageBreak: {
      /** 设置/取消当前段落的「段前分页」。 */
      setPageBreakBefore: (on?: boolean) => ReturnType;
    };
  }
}

export interface PageBreakOptions {
  types: string[];
}

export const PageBreakBefore = Extension.create<PageBreakOptions>({
  name: "pageBreakBefore",

  addOptions() {
    return { types: ["paragraph"] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          pageBreakBefore: {
            default: false,
            parseHTML: (element) => element.hasAttribute("data-odoc-page-break-before"),
            renderHTML: (attributes) =>
              attributes.pageBreakBefore
                ? { "data-odoc-page-break-before": "true", class: "odoc-break-before" }
                : {},
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setPageBreakBefore:
        (on = true) =>
        ({ commands }) =>
          this.options.types.some((type) => commands.updateAttributes(type, { pageBreakBefore: on })),
    };
  },
});
