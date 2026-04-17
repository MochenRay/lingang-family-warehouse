# Phase 4 Random Click Checklist

> 验证日期：2026-04-17
> 验证分支：`task/t44-random-click`
> 验证基线：`5a3000a`

## 结论

`T44` 已完成。

本轮使用真实浏览器自动化，而不是人工补写 checklist。关键路径随机点击已通过，且本地联调时暴露出的跨域错误已经在项目配置层修复，不再依赖前端 fallback 兜底。

## 本轮先修的阻断项

首次自动化运行暴露了三个问题：

1. `http://127.0.0.1:4173 -> http://localhost:8000/api` 存在真实 CORS 阻断。
2. 侧边栏跨模块脚本会重复点击已展开分组，导致误报。
3. 异常分析导出的验收条件过于脆弱，只盯 toast，没有验证真实下载。

本轮已完成修复：

- `backend/app/config.py`
- `docker-compose.yml`
- `.env.example`
- `scripts/t44_random_click_check.py`

修复结果：

- 本地验收端口 `4173` 已纳入 API CORS 白名单。
- `docker compose` 默认环境不再把 CORS 配置回退到旧的 `5173`-only。
- 随机点击脚本改为“确保分组展开”而不是盲点 toggle。
- 异常分析导出改为验证真实下载文件名，不再用 toast 作为唯一成功判据。

## 实际执行的命令

### 1. 后端与容器验证

```bash
docker compose up -d --build api
curl -sf http://localhost:8000/api/health
curl -si -X OPTIONS 'http://localhost:8000/api/stats/dashboard?range=month' \
  -H 'Origin: http://127.0.0.1:4173' \
  -H 'Access-Control-Request-Method: GET'
```

验证要点：

- `GET /api/health` 返回 `status=ok`
- CORS 预检返回 `200 OK`
- 响应头包含 `access-control-allow-origin: http://127.0.0.1:4173`

### 2. 浏览器随机点击验收

```bash
python3 /Users/rayli/.agents/skills/Web测试/scripts/with_server.py \
  --server 'npm run dev -- --host 127.0.0.1 --port 4173' \
  --port 4173 \
  -- bash -lc 'source /tmp/t44-playwright-venv/bin/activate && python /tmp/lingang-t44-random-click/scripts/t44_random_click_check.py'
```

### 3. 代码一致性

```bash
python3 -m py_compile backend/app/config.py scripts/t44_random_click_check.py
npm run typecheck
npm run build -- --outDir /tmp/lingang-t44-dist
git diff --check
docker compose ps
```

## 随机点击覆盖范围

本轮自动化覆盖了以下随机点击路径：

- Web 首页随机进入
- 侧边栏跨模块跳转：`人口管理 -> 房屋管理`
- Web 端统一搜索：从知识沉淀搜索后跳到真实页面
- 公告管理：随机点击首条公告预览
- 异常分析：随机进入并执行真实导出
- 移动端首页：从工作台进入人口台账，再返回治理总览

## 自动化结果

最终结果来自：

- [results.json](</tmp/lingang-t44-random-click/docs/artifacts/phase4-random-click/results.json>)

结果摘要：

| 步骤 | 结果 |
| --- | --- |
| `desktop-home` | passed |
| `desktop-sidebar-cross-nav` | passed |
| `desktop-search-jump` | passed |
| `desktop-search-target` | passed，命中后跳到 `人口管理` |
| `desktop-notice-preview` | passed |
| `desktop-analysis-export` | passed |
| `mobile-home-browse` | passed |

运行态错误摘要：

- `console_errors = []`
- `page_errors = []`

这一步的关键意义是：

- 当前结论不是“页面看起来能进”，而是“真实浏览器点击后没撞上阻断级错误”
- 之前已暴露的 CORS 阻断已被修掉，而不是被文档备注掩盖

## 证据归档

截图与结果 JSON 已镜像进仓库：

- [docs/artifacts/phase4-random-click](</tmp/lingang-t44-random-click/docs/artifacts/phase4-random-click>)

其中包括：

- `desktop-home.png`
- `desktop-sidebar-cross-nav.png`
- `desktop-search-jump.png`
- `desktop-search-target.png`
- `desktop-notice-preview.png`
- `desktop-analysis-export.png`
- `mobile-home-browse.png`
- `results.json`

同时保留了本轮第一次失败时的两张截图，便于追溯：

- `desktop-sidebar-cross-nav-failed.png`
- `desktop-analysis-export-failed.png`

## 当前边界

本轮结论只覆盖 `T44` 规定的关键自由浏览路径，不等于：

- 全站每一页都已做自动化覆盖
- 第三圈所有边缘页都已完全真化
- `Phase 4` 已完成

`T44` 通过的含义是：

- 当前可以进入 `T45`
- `T45` 可以基于真实随机点击证据来判断“是否已经能把链接直接发给面试官自由乱点”

## 进入 T45 的判断

当前可以进入 `T45`，理由是：

- 随机点击关键路径已经用真实浏览器自动化验证通过
- 运行期间未再出现 CORS 阻断或页面级异常
- 本轮没有把“没做”写成“已通过”，自动化证据与代码修复链路一致
