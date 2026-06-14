---
"@maxoyed/ode-core": minor
---

新增公文合规校验器 `@maxoyed/ode-core/validate`：

- `validateDocument(doc, options?)` 按 GB/T 9704 检查要素完整性（标题/正文必备，主送机关/署名/成文日期建议）、要素顺序（成文日期应在署名之后）与格式（发文字号、成文日期阿拉伯数字、标题不应以标点结尾），返回 `error`/`warn` 问题列表；`isValid(doc)` 便捷判断。
- Playground 新增「校验」按钮展示问题。
