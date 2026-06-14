# 简介

**official-document-editor** 是一套纯前端、离线可用、headless 的中国党政机关公文编辑器，默认排版即符合 **GB/T 9704-2012《党政机关公文格式》**，基于 [Tiptap](https://tiptap.dev/)（ProseMirror）构建，与前端框架无关。

## 为什么做这个

政府 / 国企项目常有公文编辑需求，传统方案要么后端部署 OnlyOffice / Collabora（重、需联网、授权成本高），要么用 Word 模板手工排版（不可控、难嵌入业务系统）。本项目专注于**纯前端**这一空白：组件即库，落地到任意业务系统，内网离线可跑。

## 设计目标

- **与前端框架无关**：headless 核心，Vue / React / 原生均可在其上封装。
- **默认即合规版式**：开箱加载即符合 GB/T 9704-2012。
- **不依赖后端**：docx 导入导出、分页、打印全在浏览器完成。
- **不分发商业字体**：仿宋_GB2312、方正小标宋等为商业字体，本库以开源字体兜底，并提供字体插槽由使用方注入授权字体。

## 包一览

| 包 | 说明 |
| --- | --- |
| [`@maxoyed/ode-core`](https://www.npmjs.com/package/@maxoyed/ode-core) | headless 核心：版式规范、编辑、分页、docx、校验、字体插槽 |
| [`@maxoyed/ode-vue`](https://www.npmjs.com/package/@maxoyed/ode-vue) | Vue 3 适配 `<OfficialEditor v-model>` |
| [`@maxoyed/ode-react`](https://www.npmjs.com/package/@maxoyed/ode-react) | React 适配 `<OfficialEditor value/onChange>` |

下一步：[快速开始](./getting-started)
