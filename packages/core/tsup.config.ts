import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "spec/index": "src/spec/index.ts",
    "pagination/index": "src/pagination/index.ts",
    "validate/index": "src/validate/index.ts",
    "docx/index": "src/docx/index.ts",
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  // 公文版式样式表一起打包到 dist/styles.css，供使用方按需引入
  loader: { ".css": "copy" },
  external: [
    "@tiptap/core",
    "@tiptap/pm",
    "@tiptap/starter-kit",
    "@tiptap/extension-text-style",
    "@tiptap/extension-text-align",
    "@tiptap/extension-color",
    "@tiptap/extension-table",
    "@tiptap/extension-table-row",
    "@tiptap/extension-table-cell",
    "@tiptap/extension-table-header",
    "@tiptap/extension-image",
    "docx",
    "fflate",
    "fast-xml-parser",
  ],
  esbuildOptions(options) {
    options.entryPoints = {
      index: "src/index.ts",
      "spec/index": "src/spec/index.ts",
      "pagination/index": "src/pagination/index.ts",
      "validate/index": "src/validate/index.ts",
      "docx/index": "src/docx/index.ts",
      styles: "src/styles/official-document.css",
    };
  },
});
