import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const pkg = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@maxoyed/ode-core/styles.css": pkg("../packages/core/src/styles/official-document.css"),
      "@maxoyed/ode-core/docx": pkg("../packages/core/src/docx/index.ts"),
      "@maxoyed/ode-core": pkg("../packages/core/src/index.ts"),
      "@maxoyed/ode-react": pkg("../packages/react/src/index.ts"),
      "@maxoyed/ode-vue": pkg("../packages/vue/src/index.ts"),
    },
  },
});
