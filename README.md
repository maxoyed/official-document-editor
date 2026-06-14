# official-document-editor（公文编辑器）

[![CI](https://github.com/maxoyed/official-document-editor/actions/workflows/ci.yml/badge.svg)](https://github.com/maxoyed/official-document-editor/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

**📖 文档站**：<https://maxoyed.github.io/official-document-editor/> · [在线编辑器](https://maxoyed.github.io/official-document-editor/playground/) · [Vue/React 示例](https://maxoyed.github.io/official-document-editor/examples/)

一款**纯前端、离线可用、headless** 的中国党政机关公文编辑器，默认排版即符合
**GB/T 9704-2012《党政机关公文格式》**，基于 [Tiptap](https://tiptap.dev/)
（ProseMirror）构建，与前端框架无关，可在 Vue / React / 原生中封装使用。

> 目标：在不依赖 OnlyOffice 等后端服务、可在内网/离线环境运行的前提下，
> 提供开箱即用的公文版式编辑，并（规划中）支持 docx 的完整还原与导出。

## 为什么做这个

政府/国企项目常有公文编辑需求，传统方案要么后端部署 OnlyOffice/Collabora
（重、需联网、授权成本高），要么用 Word 模板手工排版（不可控、难嵌入业务系统）。
本项目专注于**纯前端**这一空白：组件即库，落地到任意业务系统，离线可跑。

## 已实现（MVP）

- **GB/T 9704-2012 版式规范**（`@maxoyed/ode-core/spec`，纯数据零依赖）
  - A4 版心 156×225mm，天头 37mm / 订口 28mm / 切口 26mm / 地脚 35mm
  - 每面 22 行 × 每行 28 字、号制字号 ↔ 磅值换算
  - 各公文要素（份号、密级、发文机关标志、发文字号、标题、主送机关、
    正文与各级标题、署名、成文日期、版记、页码…）的字体/字号/对齐/缩进规格
- **公文版式渲染 + 编辑**：开箱默认红头文件版式，可按要素角色排版
- **精确分页引擎**（`@maxoyed/ode-core/pagination`，纯函数零 DOM）：按「每面 22 行」模型
  逐行计算分页、页数；页码按规范编排（4 号宋体、单页居右空一字 / 双页居左空一字）
- **分页预览**（`renderPaginatedPreview`）：以真实 DOM 测量将内容流入 A4 页面，
  配合 `@media print` 一键打印 / 导出 PDF
- **编辑器内联实时分页**（`Pagination` 扩展 / `createOfficialDocumentEditor({ pagination: true })`）：
  可编辑区即多页所见即所得，自动插入页间留白与页码
- **docx 导入 / 导出**（`@maxoyed/ode-core/docx`，纯前端离线）：导出符合公文版式的 .docx
  （A4 版心、各要素字体字号、固定行距、页码奇偶对齐）；**命名样式无损往返**
  （以 `w:pStyle` 标记要素，精确还原、连同规格要素也能区分）；支持**表格（含合并单元格）、
  图片（媒体嵌入/抽取）、印章（浮动叠加）、版记分隔线**
- **框架适配**（`@maxoyed/ode-vue` / `@maxoyed/ode-react`）：开箱 `<OfficialEditor>` 组件，
  Vue 走 `v-model`、React 走 `value/onChange`，headless core 之上薄封装
- **合规校验**（`@maxoyed/ode-core/validate`，纯函数）：`validateDocument(doc)` 按 GB/T 9704
  检查要素完整性、顺序与格式（发文字号/成文日期/标题标点等），并按**文种**（请示须单一主送、
  报告不应夹带请示、纪要不应有印章…）施加专属规则，返回 error/warn 问题列表（含 `blockIndex` 可定位）
- **字体插槽**（`registerFont`）：开源字体兜底 + 用户授权字体运行时注入
- **可运行 Playground / Examples**：编辑+实时分页预览双栏；Vue/React 适配示例

## 字体与版权（重要）

仿宋_GB2312、楷体_GB2312、方正小标宋 等公文常用字体多为**商业字体**，
本库**不内置/不分发**任何商业字体，仅：

1. 在 CSS 中以 `local()` 优先引用用户系统已安装的公文字体；
2. 以可商用开源字体（思源宋体 / 思源黑体等）兜底；
3. 通过 `registerFont()` 允许使用方自行提供**已获授权**的字体文件，
   在离线环境精确还原版式。

## 快速开始

```bash
pnpm install
pnpm dev        # 启动 playground
pnpm build      # 构建 packages
```

最小用法：

```ts
import { createOfficialDocumentEditor } from "@maxoyed/ode-core";
import "@maxoyed/ode-core/styles.css";

const editor = createOfficialDocumentEditor({
  element: document.querySelector("#page")!, // 一个 .odoc-page 容器
});

// 把当前段落设为某个公文要素
editor.chain().focus().setOfficialRole("title").run();
```

仅取版式规范（不引入编辑器，可用于服务端校验/导出）：

```ts
import { Layout, ELEMENT_SPEC, toHalfPoint } from "@maxoyed/ode-core/spec";
```

分页（headless，纯函数，可用于页数计算/导出/服务端）：

```ts
import { paginate, countPages, blocksFromDoc } from "@maxoyed/ode-core/pagination";

const blocks = blocksFromDoc(editor.getJSON());
const pages = paginate(blocks); // 逐行分页结果（含跨页拆分）
console.log("共", countPages(blocks), "页");
```

分页预览 + 打印（浏览器）：

```ts
import { renderPaginatedPreview } from "@maxoyed/ode-core";
renderPaginatedPreview(editor.getJSON(), document.querySelector("#preview")!);
window.print(); // 配合 @media print，每页输出一张 A4
```

docx 导入 / 导出（纯前端离线）：

```ts
import { toDocxBlob, fromDocx } from "@maxoyed/ode-core/docx";

// 导出：浏览器直接下载
const blob = await toDocxBlob(editor.getJSON());

// 导入：读入 .docx 还原为编辑器内容
editor.commands.setContent(fromDocx(await file.arrayBuffer()));
```

Vue 3（`@maxoyed/ode-vue`）：

```vue
<script setup lang="ts">
import { ref } from "vue";
import { OfficialEditor } from "@maxoyed/ode-vue";
import "@maxoyed/ode-core/styles.css";
const doc = ref();
</script>

<template>
  <OfficialEditor v-model="doc" :pagination="true" />
</template>
```

React（`@maxoyed/ode-react`）：

```tsx
import { useState } from "react";
import { OfficialEditor } from "@maxoyed/ode-react";
import "@maxoyed/ode-core/styles.css";

export default function App() {
  const [doc, setDoc] = useState();
  return <OfficialEditor value={doc} onChange={setDoc} pagination />;
}
```

## 工程结构

```
packages/
  core/            @maxoyed/ode-core —— headless 公文核心
    src/spec/      GB/T 9704-2012 版式规范（纯数据）
    src/pagination/ 分页引擎 + 页码（headless，零 DOM）
    src/validate/  公文合规校验器（headless，纯函数）
    src/preview/   分页预览渲染器（浏览器）
    src/docx/      docx 导入/导出（OOXML 映射，纯前端）
    src/fonts/     字体插槽（registerFont）
    src/extensions/ Tiptap 公文要素扩展
    src/styles/    页面/版心样式 + 按 spec 生成的要素样式
    src/templates  公文模板（红头文件等）
  vue/             @maxoyed/ode-vue —— Vue 3 适配（<OfficialEditor v-model>）
  react/           @maxoyed/ode-react —— React 适配（<OfficialEditor value/onChange>）
playground/        Vite 联调示例（原生）
examples/          Vue / React 适配示例
docs/              VitePress 文档站
```

## 路线图

- [x] **精确分页（引擎 + 预览）**：headless 逐行分页引擎、A4 分页预览、打印/导出 PDF、页码编排
- [x] **docx 导入/导出**：纯前端 OOXML 生成与解析，公文版式映射、要素往返
- [x] **编辑器内联分页**：可编辑区实时多页所见即所得 + 段落按行跨页断行 + 白纸背景 + 页码
- [x] **框架适配层**：`@maxoyed/ode-vue`、`@maxoyed/ode-react` 薄封装（`<OfficialEditor>`）
- [x] **docx 保真增强（一）**：命名样式（`w:pStyle`）无损往返 + 表格往返
- [x] **docx 保真增强（二·图片）**：图片字节嵌入 `word/media` 并从 docx 抽取还原（往返保字节）
- [x] **docx 保真增强（三）**：版记分隔线（红/黑变体）、合并单元格（colspan/rowspan）、印章（浮动叠加）
- [x] **公文校验器**（`validateDocument`）：按 GB/T 9704 检查要素完整性/顺序/格式
- [x] 更多文种模板（请示/报告/批复/函/通报/纪要）
- [x] 外部 docx 兼容加固（字体别名 + 规则推断）+ 印章锚定
- [x] 校验器深化（分文种规则集 + 编辑器内点击高亮问题段落）
- [x] VitePress 文档站（首页 + 指南 + API 参考 + 在线演示）
- [x] 成文日期中文↔阿拉伯转换（`toArabicDate` / `toChineseDate`）
- [x] 合并单元格复杂场景（colspan+rowspan 组合、跨多行、单元格内嵌套表格）
- [ ] 待办：附件页结构化

## 发布的 npm 包

| 包 | 说明 |
| --- | --- |
| [`@maxoyed/ode-core`](./packages/core) | headless 核心（版式规范、编辑、分页、docx、字体插槽） |
| [`@maxoyed/ode-vue`](./packages/vue) | Vue 3 适配 `<OfficialEditor v-model>` |
| [`@maxoyed/ode-react`](./packages/react) | React 适配 `<OfficialEditor value/onChange>` |

三个包采用统一版本，由 [Changesets](https://github.com/changesets/changesets) 管理，
经 **npm Trusted Publishing（OIDC）** 从 GitHub Actions 免令牌发布。

### 发布流程

**日常发布**（OIDC，无需 `NPM_TOKEN`）：

1. `pnpm changeset` 记录变更与版本类型；
2. 合并到 `main` 后，Release 工作流自动开启「Version Packages」PR；
3. 合并该 PR，工作流即经 OIDC 自动 `changeset publish` 发布到 npm，并附带 provenance。

**首次发布（一次性引导）**：npm 要求包**已存在**才能配置 Trusted Publisher，故第一版需手动发：

```bash
pnpm install && pnpm -r --filter "./packages/*" run build
npm login
pnpm -r --filter "./packages/*" publish --access public --no-git-checks
```

随后在 npmjs.com 每个包的 **Settings → Trusted Publisher** 配置：
GitHub 仓库 `maxoyed/official-document-editor`、工作流文件 `release.yml`。此后即走上面的 OIDC 流程。

CI（`.github/workflows/ci.yml`）在每次 push / PR 上跑 typecheck · test · build。

## 许可

MIT
