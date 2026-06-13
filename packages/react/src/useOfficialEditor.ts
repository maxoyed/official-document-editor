import { useEffect, useRef, useState } from "react";
import {
  createOfficialDocumentEditor,
  type Editor,
  type OfficialEditorOptions,
} from "@maxoyed/ode-core";

export interface UseOfficialEditorResult {
  /** 公文编辑器实例（挂载完成前为 null） */
  editor: Editor | null;
  /** 绑定到容器元素的 ref（编辑器会挂载于此） */
  containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * headless 用法：返回编辑器实例与容器 ref，自行控制渲染结构。
 * 选项变化不会重建编辑器（仅在挂载/卸载时创建/销毁）。
 */
export function useOfficialEditor(
  options: Omit<OfficialEditorOptions, "element"> = {},
): UseOfficialEditorResult {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const [editor, setEditor] = useState<Editor | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const instance = createOfficialDocumentEditor({
      ...optionsRef.current,
      element: containerRef.current,
    });
    setEditor(instance);
    return () => {
      instance.destroy();
      setEditor(null);
    };
    // 仅挂载时创建一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { editor, containerRef };
}
