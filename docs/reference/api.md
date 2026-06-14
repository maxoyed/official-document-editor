# API 参考

按子路径组织。完整类型见各包的 `.d.ts`。

## `@maxoyed/ode-core`

| 导出 | 说明 |
| --- | --- |
| `createOfficialDocumentEditor(options)` | 创建公文编辑器（Tiptap `Editor`） |
| `getOfficialExtensions(options)` | 取公文扩展集合（自定义封装用） |
| `renderPaginatedPreview(doc, mount, options?)` | 分页预览（浏览器），返回页数 |
| `registerFont(options)` | 注入授权字体到某字体角色 |
| `injectOfficialStyles()` | 注入要素样式（创建编辑器时自动调用） |
| `documentTemplates` / `*Template()` | 文种模板清单与各模板工厂 |

`createOfficialDocumentEditor` 选项：`element`、`content`、`pagination`、`editable`、`placeholder`、`injectStyles` 及 Tiptap `EditorOptions`。

## `@maxoyed/ode-core/spec`

`Layout`、`PAGE_A4_MM`、`TYPE_AREA_MM`、`MARGIN_MM`、`LINES_PER_PAGE`、`CHARS_PER_LINE`、`ELEMENT_SPEC`、`FONT_SIZE_PT`、`toPt`、`toHalfPoint`、`FONT_STACK`。

## `@maxoyed/ode-core/pagination`

`paginate(blocks, options?)`、`countPages(blocks)`、`estimateLines(block)`、`blocksFromDoc(doc)`、`computePageBreaks(rects, options)`、`formatPageNumber(n)`、`pageNumberAlign(n)`、`pageNumberStyle(n)`。

## `@maxoyed/ode-core/validate`

`validateDocument(doc, options?)`、`isValid(doc, options?)`、`inferDocType(doc)`。类型 `Issue`、`IssueLevel`、`IssueCode`、`OfficialDocType`、`ValidateOptions`。

## `@maxoyed/ode-core/date`

`toChineseDate(input)`、`toArabicDate(input)`、`parseDate(input)`（成文日期中文 ↔ 阿拉伯数字转换；`input` 可为字符串 / `Date` / `{ year, month, day }`）。

## `@maxoyed/ode-core/docx`

`toDocxBlob(doc)`、`toDocxBuffer(doc)`、`fromDocx(data)`、`styleIdFor(role)`、`readImageSize(bytes)`、`parseDataUrl(src)`、`toDataUrl(type, bytes)`、`roleFromDocxFont(name)`、`inferRole(props)`、`DOCX_FONT_NAME`。

## 命令

由 `getOfficialExtensions` 注入的编辑器命令：

| 命令 | 说明 |
| --- | --- |
| `setOfficialRole(role)` / `unsetOfficialRole()` | 设置 / 清除当前段落的公文要素角色 |
| `setHorizontalRuleVariant(variant)` | 插入分隔线（`reverse` 红头反线 / `record` 版记线） |
| `insertTable` / `setImage` | 表格 / 图片（来自 Tiptap 扩展） |

## 适配包

- `@maxoyed/ode-vue`：`OfficialEditor`、`useOfficialEditor`
- `@maxoyed/ode-react`：`OfficialEditor`、`useOfficialEditor`、类型 `OfficialEditorProps` / `OfficialEditorHandle`
