# docx 导入 / 导出

`@maxoyed/ode-core/docx` 在浏览器内完成 docx 的生成与解析，**无需后端**。

## 导出

```ts
import { toDocxBlob } from "@maxoyed/ode-core/docx";

const blob = await toDocxBlob(editor.getJSON());
// 触发下载
const a = document.createElement("a");
a.href = URL.createObjectURL(blob);
a.download = "公文.docx";
a.click();
```

导出的 .docx 包含：A4 页面与版心边距、各要素字体（`eastAsia`）/字号/对齐/缩进、正文固定行距、页码奇偶分页，以及**命名样式**（`w:pStyle=odoc-*`）以便无损往返。

Node / 服务端可用 `toDocxBuffer`。

## 导入

```ts
import { fromDocx } from "@maxoyed/ode-core/docx";

editor.commands.setContent(fromDocx(await file.arrayBuffer()));
```

- **命名样式优先**：本库导出的 .docx 通过 `w:pStyle` 精确还原要素角色（连"署名/成文日期"等同规格要素也能区分）。
- **外部 docx 兼容**：无 odoc 样式时，按"字体类 + 字号 + 对齐"规则推断要素，兼容仿宋/FangSong/STFangsong、宋体/SimSun、黑体/SimHei/微软雅黑、楷体/KaiTi、小标宋/华文中宋等多种写法。

## 支持的内容

| 内容 | 导出 | 导入 |
| --- | --- | --- |
| 段落 / 公文要素 | ✓ 命名样式 | ✓ 样式优先，回退推断 |
| 表格（含合并单元格） | ✓ | ✓ gridSpan / vMerge 重建 |
| 图片 | ✓ 字节嵌入 `word/media` | ✓ 从媒体抽取还原 |
| 印章 | ✓ 浮动叠压成文日期 | ✓ 浮动锚定 → seal |
| 分隔线（红头反线 / 版记黑线） | ✓ | ✓ 按边框色区分 |

## 工具函数

```ts
import { readImageSize, roleFromDocxFont, inferRole } from "@maxoyed/ode-core/docx";
```
