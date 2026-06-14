# 公文版式规范

`@maxoyed/ode-core/spec` 以**纯数据、零依赖**的形式提供 GB/T 9704-2012 的版式规范，可单独用于排版计算、docx 导出或服务端校验。

## 页面与版心

| 项 | 值 |
| --- | --- |
| 纸张 | A4，210mm × 297mm |
| 版心 | 156mm × 225mm |
| 天头（上白边） | 37mm |
| 订口（左白边） | 28mm |
| 切口（右白边） | 26mm |
| 地脚（下白边） | 35mm |
| 每面行数 | 22 行 |
| 每行字数 | 28 字（3 号仿宋） |

```ts
import { Layout } from "@maxoyed/ode-core/spec";
Layout.typeArea; // { width: 156, height: 225 }
Layout.margin;   // { top: 37, left: 28, right: 26, bottom: 35 }
```

## 字号（号制 ↔ 磅值）

公文沿用"号"制字号。`toPt` / `toHalfPoint` 在号制、磅值（pt）、半磅（OOXML）间换算。

```ts
import { toPt, toHalfPoint, FONT_SIZE_PT } from "@maxoyed/ode-core/spec";
toPt("三号");       // 16
toHalfPoint("三号"); // 32（docx 以半磅计）
```

常用：初号 42、小初 36、一号 26、二号 22、三号 16、四号 14、小四 12。

## 公文要素规格

`ELEMENT_SPEC` 给出每个要素的字体角色、字号、对齐、缩进等，是渲染与 docx 导出共享的"事实来源"。

| 要素 `officialRole` | 字体 | 字号 | 对齐 |
| --- | --- | --- | --- |
| `issuer` 发文机关标志 | 小标宋（红） | 初号 | 居中 |
| `docNumber` 发文字号 | 仿宋 | 三号 | 居中 |
| `title` 标题 | 小标宋 | 二号 | 居中 |
| `mainRecipient` 主送机关 | 仿宋 | 三号 | 左 |
| `body` 正文 | 仿宋 | 三号 | 两端，首行缩进 2 字 |
| `headingLevel1` 一级标题 | 黑体 | 三号 | 缩进 2 字 |
| `headingLevel2` 二级标题 | 楷体 | 三号 | 缩进 2 字 |
| `signature` 署名 / `dateline` 成文日期 | 仿宋 | 三号 | 右 |
| `ccOrgan` / `printOrgan` 版记 | 仿宋 | 四号 | 左 |

```ts
import { ELEMENT_SPEC } from "@maxoyed/ode-core/spec";
ELEMENT_SPEC.body; // { font: "fangsong", size: "三号", align: "justify", indent: 2 }
```
