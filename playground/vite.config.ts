import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const coreSrc = fileURLToPath(new URL("../packages/core/src", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      // 直接引用 core 源码，便于联调与 HMR（无需先 build）
      "@maxoyed/ode-core/styles.css": `${coreSrc}/styles/official-document.css`,
      "@maxoyed/ode-core/docx": `${coreSrc}/docx/index.ts`,
      "@maxoyed/ode-core/pagination": `${coreSrc}/pagination/index.ts`,
      "@maxoyed/ode-core": `${coreSrc}/index.ts`,
    },
  },
});
