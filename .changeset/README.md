# Changesets

本目录由 [Changesets](https://github.com/changesets/changesets) 管理版本与变更日志。

发布流程：

1. 改动后运行 `pnpm changeset`，选择受影响的包与语义化版本（patch/minor/major），并填写变更说明。
2. 合并到 `main` 后，Release 工作流会自动开启「Version Packages」PR（汇总版本与 CHANGELOG）。
3. 合并该 PR，工作流即经 **npm Trusted Publishing（OIDC）** 自动 `changeset publish` 发布到 npm，**无需 `NPM_TOKEN`**。

首次发布需先手动发一版（npm 要求包已存在才能配置 Trusted Publisher），详见根 `README.md` 的「发布流程」。

`@odoc/core`、`@odoc/vue`、`@odoc/react` 采用统一版本（fixed）。`playground`、`examples` 不发布。
