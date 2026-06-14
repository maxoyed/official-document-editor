# 字体与版权

## 版权说明

仿宋_GB2312、楷体_GB2312、方正小标宋 等公文常用字体多为**商业字体**。本库**不内置、不分发**任何商业字体，仅：

1. 在 CSS 中以 `local()` 优先引用用户系统已安装的公文字体；
2. 以可商用开源字体（思源宋体 / 思源黑体等）兜底；
3. 通过 `registerFont()` 允许使用方自行提供**已获授权**的字体文件，在离线环境精确还原。

## 字体角色

各公文要素映射到 5 个字体角色，对应 CSS 变量：

| 角色 | 用途 | CSS 变量 |
| --- | --- | --- |
| `xiaobiaosong` 小标宋 | 发文机关标志、标题 | `--odoc-font-xiaobiaosong` |
| `fangsong` 仿宋 | 正文及多数要素 | `--odoc-font-fangsong` |
| `heiti` 黑体 | 一级标题、密级 | `--odoc-font-heiti` |
| `kaiti` 楷体 | 二级标题、签发人 | `--odoc-font-kaiti` |
| `songti` 宋体 | 页码 | `--odoc-font-songti` |

要整体替换某角色字体，覆盖对应 CSS 变量即可：

```css
:root {
  --odoc-font-fangsong: "FangSong_GB2312", serif;
}
```

## 注入授权字体

`registerFont` 在运行时注入字体文件并设为该角色最高优先级（适合内网 / 离线精确还原）：

```ts
import { registerFont } from "@maxoyed/ode-core";

registerFont({
  role: "fangsong",
  family: "FangSong_GB2312",
  source: "/fonts/fangsong.woff2", // URL / ArrayBuffer / Blob
  format: "woff2",
});
```

字体文件由使用方提供并保证授权合规，本库不分发。
