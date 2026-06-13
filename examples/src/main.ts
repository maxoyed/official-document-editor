import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { OfficialEditor as ReactOfficialEditor, type Editor } from "@odoc/react";
import { createApp, h, ref } from "vue";
import { OfficialEditor as VueOfficialEditor } from "@odoc/vue";
import "@odoc/core/styles.css";

declare global {
  interface Window {
    __react?: Editor;
    __vue?: Editor;
    __vueDoc?: unknown;
  }
}

// React 适配示例
createRoot(document.getElementById("react")!).render(
  createElement(ReactOfficialEditor, {
    pagination: false,
    onReady: (editor: Editor) => {
      window.__react = editor;
    },
    onChange: () => {},
  }),
);

// Vue 适配示例（v-model）
createApp({
  setup() {
    const doc = ref<unknown>(undefined);
    window.__vueDoc = doc;
    return () =>
      h(VueOfficialEditor, {
        modelValue: doc.value,
        pagination: false,
        "onUpdate:modelValue": (d: unknown) => {
          doc.value = d;
        },
        onReady: (editor: Editor) => {
          window.__vue = editor;
        },
      });
  },
}).mount("#vue");
