import { onBeforeUnmount, onMounted, ref, shallowRef, type Ref } from "vue";
import {
  createOfficialDocumentEditor,
  type Editor,
  type OfficialEditorOptions,
} from "@odoc/core";

export interface UseOfficialEditorResult {
  /** 公文编辑器实例（挂载完成前为 null） */
  editor: Ref<Editor | null>;
  /** 绑定到容器元素的 ref（编辑器会挂载于此） */
  containerRef: Ref<HTMLDivElement | null>;
}

/**
 * headless 组合式用法：返回编辑器实例与容器 ref，自行控制模板结构。
 */
export function useOfficialEditor(
  options: Omit<OfficialEditorOptions, "element"> = {},
): UseOfficialEditorResult {
  const containerRef = ref<HTMLDivElement | null>(null);
  const editor = shallowRef<Editor | null>(null);

  onMounted(() => {
    if (!containerRef.value) return;
    editor.value = createOfficialDocumentEditor({
      ...options,
      element: containerRef.value,
    });
  });

  onBeforeUnmount(() => {
    editor.value?.destroy();
    editor.value = null;
  });

  return { editor, containerRef };
}
