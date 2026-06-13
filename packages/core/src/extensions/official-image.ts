/**
 * 在 Tiptap Image 基础上扩展公文图片属性：
 *  - seal：是否为印章（红色印章，排版时叠加于成文日期之上）
 *
 * 印章在编辑器内以叠加样式呈现（.odoc-seal）；docx 导出为浮动图片（允许叠压），
 * 导入时若图片为浮动锚定（wp:anchor）则还原为印章。
 */
import Image from "@tiptap/extension-image";

export const OfficialImage = Image.extend({
  name: "image",
  addAttributes() {
    return {
      ...this.parent?.(),
      seal: {
        default: false,
        parseHTML: (element) => element.hasAttribute("data-odoc-seal"),
        renderHTML: (attributes) =>
          attributes.seal ? { "data-odoc-seal": "true", class: "odoc-seal" } : {},
      },
    };
  },
});
