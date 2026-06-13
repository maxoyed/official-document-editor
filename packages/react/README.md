# @odoc/react

[公文编辑器](https://github.com/maxoyed/official-document-editor)的 **React 适配**——开箱即用的 `<OfficialEditor>` 组件，默认排版即符合 GB/T 9704-2012，纯前端离线。

## 安装

```bash
pnpm add @odoc/react @odoc/core react
```

## 用法

```tsx
import { useState } from "react";
import { OfficialEditor } from "@odoc/react";
import "@odoc/core/styles.css";

export default function App() {
  const [doc, setDoc] = useState();
  return <OfficialEditor value={doc} onChange={setDoc} pagination />;
}
```

Props：`value`/`defaultValue`（Tiptap JSON）、`onChange`、`pagination`、`editable`、`onReady`、`className`。
通过 `ref` 可拿到 `editor` 实例；也提供 `useOfficialEditor()` hook。

## 许可

[MIT](./LICENSE)
