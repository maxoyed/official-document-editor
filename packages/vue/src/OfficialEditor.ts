import {
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type PropType,
} from "vue";
import {
  createOfficialDocumentEditor,
  type Editor,
  type JSONContent,
} from "@maxoyed/ode-core";

/**
 * 公文编辑器 Vue 3 组件。支持 v-model（Tiptap JSON），渲染
 * .odoc-canvas > .odoc-page 结构，默认即符合 GB/T 9704-2012 版式。
 * 请记得引入 `@maxoyed/ode-core/styles.css`。
 *
 * 用法：<OfficialEditor v-model="doc" :pagination="true" @ready="onReady" />
 */
export const OfficialEditor = defineComponent({
  name: "OfficialEditor",
  props: {
    /** v-model 内容（Tiptap JSON） */
    modelValue: {
      type: Object as PropType<JSONContent>,
      default: undefined,
    },
    /** 是否启用编辑器内联实时分页 */
    pagination: { type: Boolean, default: false },
    /** 是否可编辑 */
    editable: { type: Boolean, default: true },
  },
  emits: {
    "update:modelValue": (_doc: JSONContent) => true,
    ready: (_editor: Editor) => true,
  },
  setup(props, { emit, expose }) {
    const pageRef = ref<HTMLDivElement | null>(null);
    let editor: Editor | null = null;

    onMounted(() => {
      if (!pageRef.value) return;
      editor = createOfficialDocumentEditor({
        element: pageRef.value,
        content: props.modelValue,
        pagination: props.pagination,
        editable: props.editable,
      });
      editor.on("update", () => emit("update:modelValue", editor!.getJSON()));
      emit("ready", editor);
    });

    onBeforeUnmount(() => {
      editor?.destroy();
      editor = null;
    });

    // 外部 v-model 变更同步（不回emit，避免环）
    watch(
      () => props.modelValue,
      (val) => {
        if (!editor || val == null) return;
        if (JSON.stringify(editor.getJSON()) !== JSON.stringify(val)) {
          editor.commands.setContent(val, false);
        }
      },
      { deep: true },
    );

    watch(
      () => props.editable,
      (v) => editor?.setEditable(v),
    );

    expose({
      get editor() {
        return editor;
      },
    });

    return () =>
      h("div", { class: "odoc-canvas" }, [
        h("div", { class: "odoc-page", ref: pageRef }),
      ]);
  },
});
