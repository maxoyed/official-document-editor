# 快速开始

## 安装

::: code-group

```bash [原生 / 核心]
pnpm add @maxoyed/ode-core
```

```bash [Vue 3]
pnpm add @maxoyed/ode-vue @maxoyed/ode-core vue
```

```bash [React]
pnpm add @maxoyed/ode-react @maxoyed/ode-core react
```

:::

## 最小用法（核心）

```ts
import { createOfficialDocumentEditor } from "@maxoyed/ode-core";
import "@maxoyed/ode-core/styles.css"; // 页面与版心样式

const editor = createOfficialDocumentEditor({
  element: document.querySelector("#page")!, // 一个 .odoc-page 容器
  pagination: true, // 可选：编辑器内联实时分页
});

// 把当前段落设为某个公文要素
editor.chain().focus().setOfficialRole("title").run();
```

容器结构（样式依赖 `.odoc-canvas > .odoc-page`）：

```html
<div class="odoc-canvas">
  <div class="odoc-page" id="page"></div>
</div>
```

## 子路径导出

核心包按需引入，互不牵连：

```ts
import { Layout, ELEMENT_SPEC } from "@maxoyed/ode-core/spec";        // 版式规范（纯数据）
import { paginate, blocksFromDoc } from "@maxoyed/ode-core/pagination"; // 分页引擎（纯函数）
import { validateDocument } from "@maxoyed/ode-core/validate";         // 合规校验（纯函数）
import { toDocxBlob, fromDocx } from "@maxoyed/ode-core/docx";         // docx 往返
```

## 内容数据结构

编辑器内容是 Tiptap / ProseMirror 的 JSON 文档。各公文要素以段落的 `attrs.officialRole` 标记（如 `title`、`body`、`headingLevel1`、`signature`、`dateline`…），样式由库统一渲染。

```ts
const doc = editor.getJSON();        // 取出
editor.commands.setContent(doc);     // 载入
```

下一步：[公文版式规范](./spec) · [在线演示](./demo)
