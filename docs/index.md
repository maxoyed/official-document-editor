---
layout: home

hero:
  name: 公文编辑器
  text: GB/T 9704-2012 · 纯前端 · 离线
  tagline: headless 的中国党政机关公文编辑器。默认排版即符合《党政机关公文格式》，支持 docx 无损往返、精确分页、合规校验，可在 Vue / React / 原生中开箱使用。
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 在线演示
      link: /guide/demo
    - theme: alt
      text: GitHub
      link: https://github.com/maxoyed/official-document-editor

features:
  - icon: 📐
    title: 开箱即公文版式
    details: A4 版心 156×225mm、每面 22 行；红头、标题、各级标题、正文、署名、版记、页码按 GB/T 9704 自动排布。
  - icon: 📄
    title: 精确分页
    details: headless 逐行分页引擎 + 编辑器内联实时分页（超长段落按行跨页断行）+ 白纸背景与页码，一键打印 / 导出 PDF。
  - icon: 🔁
    title: docx 纯前端往返
    details: 命名样式无损还原；支持表格（含合并单元格）、图片、印章、版记分隔线。兼容真实 Word 公文的多种字体写法。
  - icon: ✅
    title: 合规校验
    details: 按 GB/T 9704 与文种（请示/报告/纪要…）检查要素完整性、顺序与格式，返回可定位的问题列表。
  - icon: 🧩
    title: 框架无关
    details: headless 核心 + 薄封装。Vue v-model、React value/onChange，亦可原生使用，全 TypeScript。
  - icon: 🔤
    title: 字体插槽
    details: 不分发任何商业字体；开源字体兜底 + registerFont 由使用方注入授权公文字体。
---
