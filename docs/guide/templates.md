# 文种模板

内置常见法定文种模板，开箱即可加载或在其基础上修改。

```ts
import {
  documentTemplates,
  redHeadDocumentTemplate, // 通知（下行）
  requestTemplate,         // 请示（上行）
  reportTemplate,          // 报告（上行）
  replyTemplate,           // 批复（下行）
  letterTemplate,          // 函（平行）
  circularTemplate,        // 通报（下行）
  minutesTemplate,         // 会议纪要
} from "@maxoyed/ode-core";

editor.commands.setContent(requestTemplate());
```

## 模板清单

`documentTemplates` 便于在 UI 中列举选择：

```ts
documentTemplates.forEach((t) => {
  // { key, label, direction: "上行" | "下行" | "平行" | "—", build: () => JSONContent }
});
```

| 文种 | 行文方向 | 要点 |
| --- | --- | --- |
| 通知 | 下行 | 红头 + 各级标题 + 署名 |
| 请示 | 上行 | 含签发人，结尾「妥否，请批示」 |
| 报告 | 上行 | 含签发人，结尾「特此报告」 |
| 批复 | 下行 | 「…请示（…号）收悉，现批复如下」 |
| 函 | 平行 | 函头「○○○函」，结尾「特此函达」 |
| 通报 | 下行 | 结尾「特此通报」 |
| 会议纪要 | — | 会议概况 + 议定事项，无署名 / 印章 |
| 通知（带附件） | 下行 | 含附件说明 + 附件页（另起一页） |

## 附件页

`appendAttachment(doc, spec)` 为公文追加附件：在署名前插入「附件说明」，并在文末以**段前分页**另起一页排「附件标识（附件1）+ 附件标题 + 正文」。

```ts
import { appendAttachment, redHeadDocumentTemplate } from "@maxoyed/ode-core";

const doc = appendAttachment(redHeadDocumentTemplate(), {
  note: "附件：×××情况表",
  label: "附件1",
  title: "×××情况表",
  body: ["（附件内容，可插入表格或正文。）"],
});
```

「段前分页」由段落属性 `pageBreakBefore` 表达（命令 `setPageBreakBefore()`），分页 / 打印 / docx 均据此另起一页。

每个模板都能通过[合规校验](./validate)（无 error 级问题）。
