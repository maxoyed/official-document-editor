---
"@maxoyed/ode-core": minor
---

附件页结构化：

- 新增 `attachmentLabel` 要素（附件标识「附件1」，黑体三号顶格）与段落属性 `pageBreakBefore`（段前分页，命令 `setPageBreakBefore`）。
- 段前分页贯通分页引擎、内联分页、分页预览、打印（`break-before:page`）与 docx 往返（`w:pageBreakBefore`）。
- 新增 `appendAttachment(doc, spec)` 与 `attachmentTemplate()`，并加入文种清单「通知（带附件）」。
