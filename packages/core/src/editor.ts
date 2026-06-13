/**
 * createOfficialDocumentEditor —— headless 公文编辑器工厂。
 *
 * 基于 Tiptap，与具体前端框架无关；Vue/React 适配层只需在其上做薄封装。
 * 创建时自动注入公文要素样式，并默认加载公文版式模板。
 */
import { Editor, type EditorOptions, type JSONContent } from "@tiptap/core";
import { getOfficialExtensions } from "./extensions";
import { injectOfficialStyles } from "./styles/inject";
import { redHeadDocumentTemplate } from "./templates";

export interface OfficialEditorOptions
  extends Partial<Omit<EditorOptions, "extensions" | "content">> {
  /** 挂载元素（headless 使用可不传，自行渲染） */
  element?: EditorOptions["element"];
  /** 初始内容；缺省加载标准红头文件模板 */
  content?: JSONContent | string;
  /** 占位提示 */
  placeholder?: string;
  /** 是否自动注入公文要素样式（默认 true） */
  injectStyles?: boolean;
  /** 是否启用编辑器内联实时分页（默认 false，需浏览器环境） */
  pagination?: boolean;
}

export function createOfficialDocumentEditor(
  options: OfficialEditorOptions = {},
): Editor {
  const {
    content,
    placeholder,
    pagination = false,
    injectStyles = true,
    editorProps,
    ...rest
  } = options;

  if (injectStyles) injectOfficialStyles();

  return new Editor({
    ...rest,
    editorProps: {
      ...editorProps,
      attributes: {
        class: "odoc-typearea",
        ...(editorProps?.attributes as Record<string, string> | undefined),
      },
    },
    extensions: getOfficialExtensions({ placeholder, pagination }),
    content: content ?? redHeadDocumentTemplate(),
  });
}
