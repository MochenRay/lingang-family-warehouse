# Phase 8 Verification

> 日期：2026-04-24
> 公网入口：`https://homedata.lilei.dev`
> 项目仓实现基线（T81-T84）：`main @ e4933e6`
> 前端发布仓基线：`homedata-web main @ bc23d65`

## 结论

`Phase 8` 通过。

当前项目仍不是“长期稳定运营的正式生产系统”，但可以从 Phase 7 的“具备最小运营治理能力的公网在线演示系统”升级为：

**具备可分享 URL、核心台账重设计和受控演示数据口径的公网在线演示系统。**

本轮升级只覆盖产品表现力和演示可信度：浏览器路径可分享、核心房屋台账可浏览、地名与演示数据口径收口、发布投影可追踪。它不包含真实政务生产能力、正式账号权限、真实业务数据接入、长期运行 SLO 或更大范围 AI 能力扩张。

## T81 真实 URL 路由化

状态：通过。

已将顶层页面从纯内存态切换收口为统一路由表：

- `src/app/navigation/routes.ts` 维护 route id 到 browser path 的映射。
- `src/app/App.tsx` 接入 `history.pushState`、`popstate` 和未知路径 fallback。
- `/mobile` 保持特殊入口；`/api/*` 未进入前端路由表，仍由部署 rewrite 指向后端。

本地与公网验证覆盖：

- `/population`、`/housing`、`/mobile` 可直接打开。
- 刷新后停留在当前页面。
- 浏览器前进 / 后退可恢复正确页面。
- 未知路径回到默认首页。
- `/api/health` 仍返回后端健康状态。

## T82 房屋管理 Finder 式重设计

状态：通过。

房屋管理页已从单表列表升级为 Finder 式台账浏览：

- `src/app/components/pages/HousingManagement.tsx` 负责页面状态、筛选和详情加载。
- `src/app/components/housing/FinderColumn.tsx` 提供社区、楼栋、单元、楼层、房屋五级列。
- `src/app/components/housing/HouseDetailPanel.tsx` 展示房屋详情、现居住户和居住历史。
- `src/app/components/housing/finderModel.ts` 负责从房屋、网格和搜索词派生稳定浏览模型。

公网 `/housing` 验证显示房屋总数为 `188`，且可从区域层级进入房屋详情，读取房屋基础字段、现居住户、标签和历史记录。T82 没有引入新后端 schema，也没有改变演示数据计数。

## T83 地名与演示数据口径收口

状态：通过。

运行态展示口径已从旧的威海 / 临港占位信息收口到烟台 / 蓬莱演示口径：

- 后端 demo seed、默认统计名、通知部门和知识库来源已更新。
- 前端 fallback seed、移动端默认网格、批量导入示例和区域配置已更新。
- `README.md` 展示标题已更新为烟台蓬莱口径。
- `docs/phase8-location-inventory.md` 记录事实来源、映射表和不改范围。

历史验证文档、早期 artifact、runbook 和旧 PRD 保持原貌，不做全仓历史改写。`docs/phase8-location-inventory.md` 是 Phase 8 中允许保留旧词命中的口径说明文件。

云端 seed 已在 Railway 运行态重新执行，标准演示数据计数保持：

```text
grids=2
houses=188
housing_histories=89
people=471
visits=672
conflicts=16
knowledge_records=5
notices=5
task_rules=3
```

公网 `/api/stats/dashboard` 返回的网格名为：

```text
登州街道海梦苑社区第一网格
登州街道海梦苑社区第二网格
```

公网 `/api/notices`、`/api/knowledge`、`/api/task-rules` 验证到的展示来源包含：

```text
蓬莱区社会治理现代化指挥中心
平安烟台公众号
房屋治理资料
治理研判输出
矛盾调处知识库
走访知识库
```

## T84 公网发布与投影治理

状态：通过。

T84 修复了发布投影脚本在 git worktree 下的两个真实问题：

- `scripts/sync_homedata_web_pr.sh` 使用 `git rev-parse --is-inside-work-tree` 识别目标仓，不再假设 `.git` 一定是目录。
- `scripts/sync_homedata_web.sh` 排除 `.git` 本身而非 `.git/`，保留 worktree 的 `.git` pointer file。

发布层完成：

- 项目仓 `main @ e4933e6`
- `homedata-web main @ bc23d65`
- `homedata-web/SYNC_SOURCE.json` 指向 `e4933e689c505bf1fa1697c17e843bcee9195015`
- `scripts/check_homedata_web_remote_stale.sh` 返回 OK
- Vercel production deployment 成功
- `https://homedata.lilei.dev` 返回 HTTP 200

公网 smoke 覆盖：

- `/`
- `/population`
- `/housing`
- `/mobile`
- `/grid/notices`
- `/analysis/housing`
- `/unknown-phase8-check`

这些页面均返回 `家庭数仓 Demo`，`/population`、`/housing`、`/mobile` 可直接分享访问，浏览器前进 / 后退有效。

## T85 收口验证

本文件是 Phase 8 的正式关闭文档。合入本文件后，项目仓 `main` 会产生新的 source SHA；因此 T85 收口流程必须继续刷新 `homedata-web/SYNC_SOURCE.json`，并再次运行远端 stale check，避免发布仓 marker 落后于 source repo 真相层。

本轮最终验收命令：

```bash
npm run typecheck
npm run build -- --outDir /tmp/lingang-phase8-verification-dist
git diff --check
bash scripts/check_homedata_web_remote_stale.sh
curl -sS https://homedata.lilei.dev/api/health
curl -sS https://homedata.lilei.dev/api/stats/dashboard
```

公网 Playwright smoke 额外覆盖：

- 直接打开 Phase 8 核心路径。
- 刷新 `/population`、`/housing`、`/mobile` 后仍停留原路径。
- 从 `/population` 导航到 `/housing` 后执行浏览器 back / forward。
- 页面可见文案不再出现旧运行态地名：`威海`、`临港`、`环翠`、`文登`、`竹岛`、`海源社区`、`海源一品`、`海源二期`、`海源物业`。
- 核心页面可见新口径：`烟台`、`蓬莱`、`海梦苑`。

当前输出摘要：

```text
public-playwright-smoke-ok
public-reload-smoke-ok
```

## 不包含范围

Phase 8 明确不包含：

- 正式生产系统声明。
- 登录、账号、角色、权限和审计闭环。
- 真实政府系统接入。
- 真实居民、房屋或治理业务数据接入。
- 长期稳定运行 SLO。
- 全量设计系统重构。
- 后端正式行政区划库迁移。
- 历史文档和历史 artifact 全局改写。
- 更大范围 AI 能力扩张。
- 移动端所有二级页独立分享 URL。
- 完整前端路由框架迁移。
- 官方行政区划数据库或真实地址库接入。

## 后续边界

下一阶段如果继续推进，应从新的产品或运营目标重新冻结，不要把 Phase 8 的收口边界继续膨胀。可选方向包括：

- 正式账号权限与演示数据隔离。
- 更完整的住房台账编辑工作流。
- 行政区划与演示区域配置表化。
- 公网发布链路自动化与 branch protection 替代方案。
