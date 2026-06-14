import { defineConfig } from "vitepress";

// GitHub Pages 子路径
const base = "/official-document-editor/";

export default defineConfig({
  lang: "zh-CN",
  title: "公文编辑器",
  description:
    "纯前端、离线、headless 的中国党政机关公文编辑器（GB/T 9704-2012），支持 docx 往返、精确分页、合规校验、Vue/React 适配。",
  base,
  lastUpdated: true,
  cleanUrls: true,
  head: [["meta", { name: "theme-color", content: "#c0392b" }]],
  themeConfig: {
    nav: [
      { text: "指南", link: "/guide/introduction" },
      { text: "API 参考", link: "/reference/api" },
      { text: "在线演示", link: "/guide/demo" },
      {
        text: "npm",
        items: [
          { text: "@maxoyed/ode-core", link: "https://www.npmjs.com/package/@maxoyed/ode-core" },
          { text: "@maxoyed/ode-vue", link: "https://www.npmjs.com/package/@maxoyed/ode-vue" },
          { text: "@maxoyed/ode-react", link: "https://www.npmjs.com/package/@maxoyed/ode-react" },
        ],
      },
    ],
    sidebar: {
      "/guide/": [
        {
          text: "入门",
          items: [
            { text: "简介", link: "/guide/introduction" },
            { text: "快速开始", link: "/guide/getting-started" },
            { text: "公文版式规范", link: "/guide/spec" },
            { text: "在线演示", link: "/guide/demo" },
          ],
        },
        {
          text: "功能",
          items: [
            { text: "分页与打印", link: "/guide/pagination" },
            { text: "docx 导入 / 导出", link: "/guide/docx" },
            { text: "合规校验", link: "/guide/validate" },
            { text: "文种模板", link: "/guide/templates" },
            { text: "字体与版权", link: "/guide/fonts" },
          ],
        },
        {
          text: "框架适配",
          items: [
            { text: "Vue 3", link: "/guide/vue" },
            { text: "React", link: "/guide/react" },
          ],
        },
      ],
      "/reference/": [
        { text: "API 参考", link: "/reference/api" },
      ],
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/maxoyed/official-document-editor" },
    ],
    search: { provider: "local" },
    footer: {
      message: "MIT Licensed · 不分发任何商业字体",
      copyright: "© 2026 maxoyed",
    },
    outline: { label: "本页目录", level: [2, 3] },
    docFooter: { prev: "上一页", next: "下一页" },
  },
});
