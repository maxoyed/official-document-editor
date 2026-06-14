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

每个模板都能通过[合规校验](./validate)（无 error 级问题）。
