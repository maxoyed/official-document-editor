import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const pkg = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@odoc/core/styles.css": pkg("../packages/core/src/styles/official-document.css"),
      "@odoc/core/docx": pkg("../packages/core/src/docx/index.ts"),
      "@odoc/core": pkg("../packages/core/src/index.ts"),
      "@odoc/react": pkg("../packages/react/src/index.ts"),
      "@odoc/vue": pkg("../packages/vue/src/index.ts"),
    },
  },
});
