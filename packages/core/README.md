# @maxoyed/ode-core

Headless 的中国党政机关**公文编辑器核心**，默认排版即符合 **GB/T 9704-2012《党政机关公文格式》**，基于 [Tiptap](https://tiptap.dev/)（ProseMirror）构建，与前端框架无关。纯前端、离线可用。

> 框架封装见 [`@maxoyed/ode-vue`](https://www.npmjs.com/package/@maxoyed/ode-vue) / [`@maxoyed/ode-react`](https://www.npmjs.com/package/@maxoyed/ode-react)。

## 安装

```bash
pnpm add @maxoyed/ode-core
```

## 用法

```ts
import { createOfficialDocumentEditor } from "@maxoyed/ode-core";
import "@maxoyed/ode-core/styles.css";

const editor = createOfficialDocumentEditor({
  element: document.querySelector("#page")!, // 一个 .odoc-page 容器
  pagination: true, // 可选：编辑器内联实时分页
});

editor.chain().focus().setOfficialRole("title").run();
```

子路径导出：

- `@maxoyed/ode-core/spec` — GB/T 9704-2012 版式规范（纯数据，零依赖）
- `@maxoyed/ode-core/pagination` — headless 分页引擎（纯函数）
- `@maxoyed/ode-core/docx` — docx 导入/导出（`toDocxBlob` / `fromDocx`）

```ts
import { paginate, blocksFromDoc } from "@maxoyed/ode-core/pagination";
import { toDocxBlob, fromDocx } from "@maxoyed/ode-core/docx";
```

## 能力

- 公文版式渲染与编辑（红头、标题、各级标题、正文、署名、版记、页码…）
- 精确分页：headless 引擎 + 编辑器内联实时分页（行级跨页断行）+ 打印 / 导出 PDF
- docx 往返：命名样式无损 · 表格（含合并单元格）· 图片 · 印章 · 版记线
- 字体插槽 `registerFont`：开源字体兜底 + 用户授权字体注入

## 字体与版权

本库**不内置/不分发**仿宋_GB2312、方正小标宋等商业字体；以 `local()` 优先引用本机公文字体、开源字体兜底，并提供 `registerFont()` 由使用方提供已授权字体。

## 许可

[MIT](./LICENSE) · 详见仓库 [official-document-editor](https://github.com/maxoyed/official-document-editor)。
