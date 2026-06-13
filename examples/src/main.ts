import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { OfficialEditor as ReactOfficialEditor, type Editor } from "@maxoyed/ode-react";
import { createApp, h, ref } from "vue";
import { OfficialEditor as VueOfficialEditor } from "@maxoyed/ode-vue";
import "@maxoyed/ode-core/styles.css";

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
