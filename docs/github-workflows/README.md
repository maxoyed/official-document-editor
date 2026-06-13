# GitHub 工作流（待启用）

由于自动化推送的凭证缺少 `workflow` scope，无法直接写入 `.github/workflows/`，
故将工作流文件暂存于此。仓库管理员启用方式（任选其一）：

```bash
mkdir -p .github/workflows
git mv docs/github-workflows/ci.yml .github/workflows/ci.yml
git mv docs/github-workflows/release.yml .github/workflows/release.yml
git commit -m "ci: 启用 CI 与 Release 工作流" && git push
```

或在 GitHub 网页端「Add file → Create new file」，按相同内容创建
`.github/workflows/ci.yml` 与 `.github/workflows/release.yml`。

## 文件说明

- **ci.yml** —— 每次 push / PR 跑 `typecheck · test · build`。
- **release.yml** —— 基于 [Changesets](https://github.com/changesets/changesets)：
  合并 `main` 后自动开「Version Packages」PR；合并该 PR 即发布到 npm。
  需在仓库 **Settings → Secrets and variables → Actions** 配置 `NPM_TOKEN`。
