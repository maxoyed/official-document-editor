import {
  createElement,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import {
  createOfficialDocumentEditor,
  type Editor,
  type JSONContent,
} from "@odoc/core";

export interface OfficialEditorProps {
  /** 受控内容（Tiptap JSON）。提供时随之同步。 */
  value?: JSONContent;
  /** 非受控初始内容；缺省加载标准红头模板。 */
  defaultValue?: JSONContent;
  /** 内容变更回调。 */
  onChange?: (doc: JSONContent) => void;
  /** 是否启用编辑器内联实时分页。 */
  pagination?: boolean;
  /** 是否可编辑，默认 true。 */
  editable?: boolean;
  /** 编辑器就绪回调，可拿到实例做命令调用（setOfficialRole、导出等）。 */
  onReady?: (editor: Editor) => void;
  /** 外层 className（附加在 .odoc-canvas 上）。 */
  className?: string;
}

export interface OfficialEditorHandle {
  readonly editor: Editor | null;
}

/**
 * 公文编辑器 React 组件。渲染 .odoc-canvas > .odoc-page 结构，
 * 默认即符合 GB/T 9704-2012 版式。请记得引入 `@odoc/core/styles.css`。
 */
export const OfficialEditor = forwardRef<OfficialEditorHandle, OfficialEditorProps>(
  function OfficialEditor(props, ref) {
    const pageRef = useRef<HTMLDivElement | null>(null);
    const editorRef = useRef<Editor | null>(null);
    const propsRef = useRef(props);
    propsRef.current = props;

    useEffect(() => {
      if (!pageRef.current) return;
      const p = propsRef.current;
      const editor = createOfficialDocumentEditor({
        element: pageRef.current,
        content: p.value ?? p.defaultValue,
        pagination: p.pagination,
        editable: p.editable,
      });
      editorRef.current = editor;
      editor.on("update", () => propsRef.current.onChange?.(editor.getJSON()));
      propsRef.current.onReady?.(editor);
      return () => {
        editor.destroy();
        editorRef.current = null;
      };
      // 仅挂载时创建
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 受控内容同步（不回emit，避免环）
    useEffect(() => {
      const editor = editorRef.current;
      if (!editor || props.value == null) return;
      const current = JSON.stringify(editor.getJSON());
      if (current !== JSON.stringify(props.value)) {
        editor.commands.setContent(props.value, false);
      }
    }, [props.value]);

    // 可编辑状态同步
    useEffect(() => {
      editorRef.current?.setEditable(props.editable ?? true);
    }, [props.editable]);

    useImperativeHandle(
      ref,
      () => ({
        get editor() {
          return editorRef.current;
        },
      }),
      [],
    );

    return createElement(
      "div",
      { className: ["odoc-canvas", props.className].filter(Boolean).join(" ") },
      createElement("div", { className: "odoc-page", ref: pageRef }),
    );
  },
);
