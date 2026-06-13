/**
 * OfficialRole 扩展：为块级节点附加“公文要素角色”属性。
 *
 * 不直接写死样式，而是输出 data-odoc-role 与 class，由公文样式表（按 ELEMENT_SPEC
 * 生成）统一渲染字体/字号/对齐/缩进，保证渲染与 docx 导出共享同一份规范。
 */
import { Extension } from "@tiptap/core";
import type { OfficialElement } from "../spec/elements";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    officialRole: {
      /** 将当前段落设为指定公文要素（如 title、headingLevel1、dateline）。 */
      setOfficialRole: (role: OfficialElement) => ReturnType;
      /** 清除当前段落的公文要素角色（回退为普通正文）。 */
      unsetOfficialRole: () => ReturnType;
    };
  }
}

export interface OfficialRoleOptions {
  /** 应用角色属性的节点类型，默认作用于 paragraph。 */
  types: string[];
}

export const OfficialRole = Extension.create<OfficialRoleOptions>({
  name: "officialRole",

  addOptions() {
    return { types: ["paragraph"] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          officialRole: {
            default: null,
            parseHTML: (element) => element.getAttribute("data-odoc-role"),
            renderHTML: (attributes) => {
              const role = attributes.officialRole as OfficialElement | null;
              if (!role) return {};
              return {
                "data-odoc-role": role,
                class: `odoc-el odoc-el--${role}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setOfficialRole:
        (role) =>
        ({ commands }) =>
          this.options.types.some((type) =>
            commands.updateAttributes(type, { officialRole: role }),
          ),
      unsetOfficialRole:
        () =>
        ({ commands }) =>
          this.options.types.some((type) =>
            commands.resetAttributes(type, "officialRole"),
          ),
    };
  },
});
