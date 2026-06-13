/**
 * 为分隔线（horizontalRule）增加公文变体属性：
 *  - reverse：红头反线（发文字号下方红色分隔线，默认）
 *  - record：版记分隔线（版记区上下黑色全幅线）
 *
 * 仅附加 data 属性与 class，颜色由样式表渲染；docx 导出/导入据此区分边框颜色。
 */
import { Extension } from "@tiptap/core";

export type HrVariant = "reverse" | "record";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    hrVariant: {
      /** 插入指定变体的分隔线 */
      setHorizontalRuleVariant: (variant: HrVariant) => ReturnType;
    };
  }
}

export interface HrVariantOptions {
  types: string[];
}

export const HorizontalRuleVariant = Extension.create<HrVariantOptions>({
  name: "hrVariant",

  addOptions() {
    return { types: ["horizontalRule"] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          variant: {
            default: "reverse",
            parseHTML: (element) => element.getAttribute("data-odoc-hr") || "reverse",
            renderHTML: (attributes) => {
              const variant = (attributes.variant as HrVariant) || "reverse";
              return { "data-odoc-hr": variant, class: `odoc-hr odoc-hr--${variant}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setHorizontalRuleVariant:
        (variant) =>
        ({ chain }) =>
          chain()
            .insertContent({ type: "horizontalRule", attrs: { variant } })
            .run(),
    };
  },
});
