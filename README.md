# official-document-editor（公文编辑器）

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

- **GB/T 9704-2012 版式规范**（`@odoc/core/spec`，纯数据零依赖）
  - A4 版心 156×225mm，天头 37mm / 订口 28mm / 切口 26mm / 地脚 35mm
  - 每面 22 行 × 每行 28 字、号制字号 ↔ 磅值换算
  - 各公文要素（份号、密级、发文机关标志、发文字号、标题、主送机关、
    正文与各级标题、署名、成文日期、版记、页码…）的字体/字号/对齐/缩进规格
- **公文版式渲染 + 编辑**：开箱默认红头文件版式，可按要素角色排版
- **精确分页引擎**（`@odoc/core/pagination`，纯函数零 DOM）：按「每面 22 行」模型
  逐行计算分页、页数；页码按规范编排（4 号宋体、单页居右空一字 / 双页居左空一字）
- **分页预览**（`renderPaginatedPreview`）：以真实 DOM 测量将内容流入 A4 页面，
  配合 `@media print` 一键打印 / 导出 PDF
- **docx 导入 / 导出**（`@odoc/core/docx`，纯前端离线）：导出符合公文版式的 .docx
  （A4 版心、各要素字体字号、固定行距、页码奇偶对齐）；导入按字体/字号/对齐反推要素
- **字体插槽**（`registerFont`）：开源字体兜底 + 用户授权字体运行时注入
- **可运行 Playground**：编辑 + 实时分页预览双栏联调

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
import { createOfficialDocumentEditor } from "@odoc/core";
import "@odoc/core/styles.css";

const editor = createOfficialDocumentEditor({
  element: document.querySelector("#page")!, // 一个 .odoc-page 容器
});

// 把当前段落设为某个公文要素
editor.chain().focus().setOfficialRole("title").run();
```

仅取版式规范（不引入编辑器，可用于服务端校验/导出）：

```ts
import { Layout, ELEMENT_SPEC, toHalfPoint } from "@odoc/core/spec";
```

分页（headless，纯函数，可用于页数计算/导出/服务端）：

```ts
import { paginate, countPages, blocksFromDoc } from "@odoc/core/pagination";

const blocks = blocksFromDoc(editor.getJSON());
const pages = paginate(blocks); // 逐行分页结果（含跨页拆分）
console.log("共", countPages(blocks), "页");
```

分页预览 + 打印（浏览器）：

```ts
import { renderPaginatedPreview } from "@odoc/core";
renderPaginatedPreview(editor.getJSON(), document.querySelector("#preview")!);
window.print(); // 配合 @media print，每页输出一张 A4
```

docx 导入 / 导出（纯前端离线）：

```ts
import { toDocxBlob, fromDocx } from "@odoc/core/docx";

// 导出：浏览器直接下载
const blob = await toDocxBlob(editor.getJSON());

// 导入：读入 .docx 还原为编辑器内容
editor.commands.setContent(fromDocx(await file.arrayBuffer()));
```

## 工程结构

```
packages/
  core/            @odoc/core —— headless 公文核心
    src/spec/      GB/T 9704-2012 版式规范（纯数据）
    src/pagination/ 分页引擎 + 页码（headless，零 DOM）
    src/preview/   分页预览渲染器（浏览器）
    src/docx/      docx 导入/导出（OOXML 映射，纯前端）
    src/fonts/     字体插槽（registerFont）
    src/extensions/ Tiptap 公文要素扩展
    src/styles/    页面/版心样式 + 按 spec 生成的要素样式
    src/templates  公文模板（红头文件等）
playground/        Vite 联调示例
```

## 路线图

- [x] **精确分页（引擎 + 预览）**：headless 逐行分页引擎、A4 分页预览、打印/导出 PDF、页码编排
- [x] **docx 导入/导出**：纯前端 OOXML 生成与解析，公文版式映射、要素往返
- [ ] **编辑器内联分页**：在可编辑区内实时所见即所得分页（含超长段落跨页断行）
- [ ] **docx 保真增强**：表格、图片、印章、版记分隔线、自定义样式名无损往返
- [ ] **框架适配层**：`@odoc/vue`、`@odoc/react` 薄封装
- [ ] 印章、附件页、版记分隔线等要素的完整支持
- [ ] 公文校验器（按 GB/T 9704 检查版式合规）

## 许可

MIT
