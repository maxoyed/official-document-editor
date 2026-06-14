---
"@maxoyed/ode-core": minor
---

校验器深化：分文种规则集。

- 新增 `inferDocType(doc)` 由标题推断文种；`validateDocument` 支持 `options.docType` 并按文种施加专属规则：请示须一文一事/单一主送、结尾用请示用语、上行文应有签发人；报告不应夹带请示事项；会议纪要不应加盖印章、且不因缺主送/署名报警。
- 问题项带 `blockIndex`，便于在编辑器中定位/高亮。Playground 显示识别文种，点击问题即滚动并闪烁高亮对应段落。
