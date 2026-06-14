---
"@maxoyed/ode-core": minor
---

外部 docx 兼容加固与印章锚定：

- 导入要素推断改为「字体类 + 字号 + 对齐」规则，兼容真实 Word 公文的多种字体写法（仿宋/FangSong/STFangsong、宋体/SimSun/NSimSun、黑体/SimHei/微软雅黑、楷体/KaiTi、小标宋/华文中宋/STZhongsong 等）；右对齐按日期文本区分署名/成文日期。导出 `roleFromDocxFont`、`inferRole` 供复用。
- 印章导出为浮动图片时上移约 0.8 倍印章高度，叠压于成文日期之上。
