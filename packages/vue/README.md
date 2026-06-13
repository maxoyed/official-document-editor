# @maxoyed/ode-vue

[公文编辑器](https://github.com/maxoyed/official-document-editor)的 **Vue 3 适配**——开箱即用的 `<OfficialEditor>` 组件，默认排版即符合 GB/T 9704-2012，纯前端离线。

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

Props：`v-model`（Tiptap JSON）、`pagination`（内联分页）、`editable`。事件：`update:modelValue`、`ready`。
也提供 `useOfficialEditor()` 组合式用法。

## 许可

[MIT](./LICENSE)
