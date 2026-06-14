# Vue 3 适配

`@maxoyed/ode-vue` 是 headless 核心之上的薄封装，提供开箱即用的 `<OfficialEditor>` 组件。

## 安装

```bash
pnpm add @maxoyed/ode-vue @maxoyed/ode-core vue
```

## 用法

```vue
<script setup lang="ts">
import { ref } from "vue";
import { OfficialEditor } from "@maxoyed/ode-vue";
import "@maxoyed/ode-core/styles.css";

const doc = ref();
</script>

<template>
  <OfficialEditor v-model="doc" :pagination="true" @ready="(e) => console.log(e)" />
</template>
```

## Props / 事件

| Prop | 说明 |
| --- | --- |
| `v-model` (`modelValue`) | 内容（Tiptap JSON） |
| `pagination` | 是否启用编辑器内联实时分页 |
| `editable` | 是否可编辑，默认 `true` |

| 事件 | 说明 |
| --- | --- |
| `update:modelValue` | 内容变更 |
| `ready` | 编辑器就绪，回调拿到实例 |

## 组合式用法

需要完全自定义模板时，用 `useOfficialEditor()`：

```ts
import { useOfficialEditor } from "@maxoyed/ode-vue";
const { editor, containerRef } = useOfficialEditor({ pagination: true });
// 模板中：<div class="odoc-canvas"><div class="odoc-page" ref="containerRef" /></div>
```
