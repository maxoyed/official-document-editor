# 合规校验

`@maxoyed/ode-core/validate` 以纯函数对一篇公文做结构与格式校验，并按**文种**施加专属规则。

```ts
import { validateDocument, isValid, inferDocType } from "@maxoyed/ode-core/validate";

const issues = validateDocument(editor.getJSON());
// issues: { level: "error" | "warn", code, message, blockIndex? }[]
isValid(editor.getJSON()); // 无 error 即 true
```

`Issue.blockIndex` 指向 `doc.content` 中的段落下标，便于在编辑器中**定位 / 高亮**对应段落。

## 通用规则

- 文档为空 → `EMPTY_DOCUMENT`（error）
- 缺标题 / 正文 → error；缺主送机关 / 署名 / 成文日期 → warn
- 标题以标点结尾、发文字号格式不规范、成文日期非阿拉伯数字、成文日期排在署名之前 → warn

## 分文种规则

`docType` 由标题推断（也可经 `options.docType` 指定）：

| 文种 | 专属规则 |
| --- | --- |
| 请示 | 一文一事、原则上单一主送；结尾宜用「妥否，请批示」类用语；上行文应有签发人 |
| 报告 | 不应夹带请示事项 / 请求批复 |
| 会议纪要 | 不应加盖印章；不因缺主送 / 署名报警 |

```ts
inferDocType(doc);             // "request" | "report" | "minutes" | ...
validateDocument(doc, { docType: "request" });
```

## 自定义必备 / 建议要素

```ts
validateDocument(doc, {
  required: ["title", "body"],
  recommended: ["mainRecipient", "signature", "dateline"],
});
```
