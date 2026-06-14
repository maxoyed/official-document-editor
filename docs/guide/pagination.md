# 分页与打印

## headless 分页引擎

`@maxoyed/ode-core/pagination` 按"每面 22 行"模型逐行计算分页，纯函数、零 DOM，可用于页数计算、导出、服务端校验。

```ts
import { paginate, countPages, blocksFromDoc } from "@maxoyed/ode-core/pagination";

const blocks = blocksFromDoc(editor.getJSON());
const pages = paginate(blocks); // 逐行分页结果（含超长段落跨页拆分）
countPages(blocks);             // 总页数
```

## 编辑器内联实时分页

把可编辑区本身渲染成多页所见即所得（A4 白纸 + 灰色页间空隙 + 页码），超长段落按行跨页断行。开箱启用：

```ts
createOfficialDocumentEditor({ element, pagination: true });
```

或单独挂 `Pagination` 扩展。页码按规范编排：4 号宋体，单页居右空一字、双页居左空一字。

## 分页预览

`renderPaginatedPreview` 以真实 DOM 测量把内容流入 A4 页面，适合做打印 / 导出 PDF 前的预览：

```ts
import { renderPaginatedPreview } from "@maxoyed/ode-core";
renderPaginatedPreview(editor.getJSON(), document.querySelector("#preview")!);
```

## 打印 / 导出 PDF

样式表内置 `@media print`（`@page { size: A4 }`，每页一张 A4）。直接调用浏览器打印即可导出 PDF：

```ts
window.print();
```
