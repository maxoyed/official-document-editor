# React 适配

`@maxoyed/ode-react` 是 headless 核心之上的薄封装，提供开箱即用的 `<OfficialEditor>` 组件。

## 安装

```bash
pnpm add @maxoyed/ode-react @maxoyed/ode-core react
```

## 用法

```tsx
import { useState } from "react";
import { OfficialEditor } from "@maxoyed/ode-react";
import "@maxoyed/ode-core/styles.css";

export default function App() {
  const [doc, setDoc] = useState();
  return <OfficialEditor value={doc} onChange={setDoc} pagination />;
}
```

## Props

| Prop | 说明 |
| --- | --- |
| `value` / `defaultValue` | 受控 / 非受控内容（Tiptap JSON） |
| `onChange` | 内容变更回调 |
| `pagination` | 是否启用编辑器内联实时分页 |
| `editable` | 是否可编辑，默认 `true` |
| `onReady` | 编辑器就绪，回调拿到实例 |
| `className` | 附加在 `.odoc-canvas` 上 |

通过 `ref` 可取得 `editor` 实例：

```tsx
const ref = useRef<OfficialEditorHandle>(null);
// ref.current?.editor?.chain().focus().setOfficialRole("title").run();
```

## Hook 用法

```tsx
import { useOfficialEditor } from "@maxoyed/ode-react";
const { editor, containerRef } = useOfficialEditor({ pagination: true });
// <div className="odoc-canvas"><div className="odoc-page" ref={containerRef} /></div>
```
