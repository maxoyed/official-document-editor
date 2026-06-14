# @maxoyed/ode-core

## 0.5.0

### Minor Changes

- 2c19d5a: 附件页结构化：

  - 新增 `attachmentLabel` 要素（附件标识「附件 1」，黑体三号顶格）与段落属性 `pageBreakBefore`（段前分页，命令 `setPageBreakBefore`）。
  - 段前分页贯通分页引擎、内联分页、分页预览、打印（`break-before:page`）与 docx 往返（`w:pageBreakBefore`）。
  - 新增 `appendAttachment(doc, spec)` 与 `attachmentTemplate()`，并加入文种清单「通知（带附件）」。

## 0.4.1

### Patch Changes

- 393647a: docx 表格合并单元格复杂场景加固：单元格内容支持**嵌套表格**（导出/导入按序保留段落与子表格）；纵向合并延续格找不到起源时回退为普通格，避免丢内容/错位。colspan+rowspan 组合、跨多行合并经测试往返正确。

## 0.4.0

### Minor Changes

- e75333b: 新增成文日期中文 ↔ 阿拉伯数字转换 `@maxoyed/ode-core/date`：`toChineseDate`、`toArabicDate`、`parseDate`（兼容字符串 / `Date` / `{year,month,day}`）。Playground 增加「日期 → 阿拉伯」一键规范化按钮。

## 0.3.0

### Minor Changes

- 36b96c1: 外部 docx 兼容加固与印章锚定：

  - 导入要素推断改为「字体类 + 字号 + 对齐」规则，兼容真实 Word 公文的多种字体写法（仿宋/FangSong/STFangsong、宋体/SimSun/NSimSun、黑体/SimHei/微软雅黑、楷体/KaiTi、小标宋/华文中宋/STZhongsong 等）；右对齐按日期文本区分署名/成文日期。导出 `roleFromDocxFont`、`inferRole` 供复用。
  - 印章导出为浮动图片时上移约 0.8 倍印章高度，叠压于成文日期之上。

- 347d800: 校验器深化：分文种规则集。

  - 新增 `inferDocType(doc)` 由标题推断文种；`validateDocument` 支持 `options.docType` 并按文种施加专属规则：请示须一文一事/单一主送、结尾用请示用语、上行文应有签发人；报告不应夹带请示事项；会议纪要不应加盖印章、且不因缺主送/署名报警。
  - 问题项带 `blockIndex`，便于在编辑器中定位/高亮。Playground 显示识别文种，点击问题即滚动并闪烁高亮对应段落。

## 0.2.0

### Minor Changes

- 1076fa2: 新增常见法定文种模板：请示、报告、批复、函、通报、会议纪要（连同既有「通知」），并导出 `documentTemplates` 清单（含 key/label/行文方向）便于在 UI 中列举选择。请示/报告含签发人（上行文），会议纪要无署名/印章。Playground 增加「文种」下拉切换。
- 35a393e: 新增公文合规校验器 `@maxoyed/ode-core/validate`：

  - `validateDocument(doc, options?)` 按 GB/T 9704 检查要素完整性（标题/正文必备，主送机关/署名/成文日期建议）、要素顺序（成文日期应在署名之后）与格式（发文字号、成文日期阿拉伯数字、标题不应以标点结尾），返回 `error`/`warn` 问题列表；`isValid(doc)` 便捷判断。
  - Playground 新增「校验」按钮展示问题。

## 0.1.0

### Minor Changes

- bdab4d5: 首个发布版本：headless 公文编辑器（GB/T 9704-2012）。

  - 公文版式编辑、字体角色与字体插槽（`registerFont`）
  - 精确分页：headless 引擎 + 编辑器内联实时分页（行级跨页断行）+ 打印 / 导出 PDF
  - docx 纯前端往返：命名样式无损 · 表格（含合并单元格）· 图片 · 印章 · 版记线
  - Vue 3 / React 适配组件 `<OfficialEditor>`
