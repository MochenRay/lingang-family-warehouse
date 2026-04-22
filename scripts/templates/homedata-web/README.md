# homedata-web

这是 `Lingang Family Warehouse` 的前端发布仓投影层。

## 角色边界

- 这个仓库只给 `Vercel` 部署前端使用
- 真相层仍然是全栈仓库 `lingang-family-warehouse`
- 这里的内容应当由上游同步脚本生成，不要直接手工修改

## 同步来源

- 来源脚本：`lingang-family-warehouse/scripts/sync_homedata_web.sh`
- 来源标记：根目录 `SYNC_SOURCE.json`

## 禁止事项

- 不要直接在这个仓库里修页面逻辑
- 不要在这里新增 `.env`、密钥、后端代码或部署密钥
- 不要把这里当作第二份真相层

## 发布用途

- `Vercel` 只消费这个仓库
- `/api/*` 通过 `vercel.json` rewrite 到 `Railway` 后端
