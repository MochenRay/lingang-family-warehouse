# homedata-web

这是 `Lingang Family Warehouse` 的前端发布仓投影层。

## 角色边界

- 这个仓库只给 `Vercel` 部署前端使用
- 真相层仍然是全栈仓库 `lingang-family-warehouse`
- 这里的内容应当由上游同步脚本生成，不要直接手工修改

## 同步来源

- 来源脚本：`lingang-family-warehouse/scripts/sync_homedata_web.sh`
- 推荐同步入口：`lingang-family-warehouse/scripts/sync_homedata_web_pr.sh`
- 来源标记：根目录 `SYNC_SOURCE.json`
- 漂移检查：`.github/workflows/projection-stale-check.yml`

## 禁止事项

- 不要直接在这个仓库里修页面逻辑
- 不要直接向 `main` 手工提交业务改动；同步应从真相层仓库生成
- 不要在这里新增 `.env`、密钥、后端代码或部署密钥
- 不要把这里当作第二份真相层

## 治理说明

- `main` 只应接收真相层仓库生成的同步提交或同步 PR
- `SYNC_SOURCE.json` 必须能追溯到 `lingang-family-warehouse` 的 source commit
- private repo 的跨仓 stale check 需要配置 `SOURCE_REPO_READ_TOKEN` secret；未配置时 workflow 只输出 warning，不会误报失败
- 当前 GitHub 账号/计划不支持 private repo branch protection 时，以本 README、同步 PR 脚本、`SYNC_SOURCE.json` 和 stale check workflow 作为兜底治理

## 发布用途

- `Vercel` 只消费这个仓库
- `/api/*` 通过 `vercel.json` rewrite 到 `Railway` 后端
