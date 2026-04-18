# Phase 5 Acceptance Checklist

> 验证日期：2026-04-18
> 对应任务：`T54`
> 验证口径：**预上线环境验收**
> 当前环境：单机 `Docker Compose` Demo 环境

## 1. 结论

`T54` 当前结论是：**预上线环境验收通过，可以进入 `T55`。**

本轮完成的是：

- 单机 `Docker Compose` 预上线环境验收
- 自由浏览入口验收
- 定向演示主链验收
- 演示后恢复 / 重置验收

本轮没有完成的是：

- 公网域名或真实外链验收

因此当前最准确的说法是：

> 项目已经完成“可重复部署的预上线包”验收，但还没有“公网已发布”这一步。

## 2. 验收范围

本轮只验三类事情：

1. 自由浏览入口
2. 定向演示主链
3. 演示后恢复 / 重置

这轮**不**把“本机可跑”包装成“公网已稳定上线”。

## 3. 当前环境说明

- 当前验收的不是公网链接
- 当前验收的是本机预上线环境：
  - Web：`http://127.0.0.1:4173`
  - API：`http://127.0.0.1:4173/api/health`

## 4. 部署与健康检查

本轮实际执行：

```bash
bash scripts/demo_up.sh
bash scripts/demo_reset.sh
bash scripts/demo_health_check.sh
docker compose ps
curl -fsS http://127.0.0.1:4173/api/health
```

结果：

- `demo_up.sh` 成功完成前端构建并启动 `db / api / web`
- `demo_reset.sh` 成功重写演示数据
- `demo_health_check.sh` 通过
- `docker compose ps` 显示三容器均为 `healthy`
- `/api/health` 返回：

```json
{"status":"ok","backend":"ready","database":"ok","ai":"placeholder","error":null}
```

## 5. 自由浏览入口验收

验收口径：

- 从默认入口 `http://127.0.0.1:4173` 打开系统
- 不依赖外部说明，抽查“第一次打开能不能知道先看哪里”

实际检查：

- 首页能看到“推荐浏览路径”
- 首页能看到移动端主链 CTA
- 从首页可直接进入 `人口管理`
- 侧边栏底部能看到“先看驾驶舱，再进人口管理、房屋管理和矛盾调解，最后切到移动端工作台体验一线执行链路”

自动化证据：

- `docs/artifacts/phase5-acceptance/acceptance-results.json`
- `docs/artifacts/phase5-acceptance/free-browse-entry.png`

结果：

- 通过
- `console_errors = []`
- `page_errors = []`

## 6. 定向演示主链验收

验收口径：

- 按 `phase5-demo-script.md` 的主线走一遍
- 验证“驾驶舱 -> 人口管理 -> 房屋管理 -> 矛盾调解 -> 移动端 -> 今日待办”这条路径能顺滑复现

实际检查：

1. 从驾驶舱进入 `人口管理`
2. 从侧边栏进入 `房屋管理`
3. 从侧边栏进入 `矛盾调解`
4. 通过侧边栏按钮切到 `移动端工作台`
5. 在移动端首页看到“首次体验建议”
6. 点击“先看待办清单”，进入 `今日待办`

自动化证据：

- `docs/artifacts/phase5-acceptance/acceptance-results.json`
- `docs/artifacts/phase5-acceptance/directed-demo-mainline.png`

结果：

- 通过
- `console_errors = []`
- `page_errors = []`

## 7. 恢复 / 重置验收

验收口径：

- 先往系统里写入一条临时脏数据
- 再执行 `demo_reset.sh`
- 确认系统回到标准演示基线

实际步骤：

1. 调用 `POST /api/notices` 新建临时公告
2. 确认公告总数从 `5 -> 6`
3. 执行：

```bash
bash scripts/demo_reset.sh
```

4. 再次检查：
   - `GET /api/notices`
   - `GET /api/knowledge`
   - `GET /api/task-rules`

结果：

- `notices`: 恢复到 `5`
- `knowledge`: 为 `5`
- `task_rules`: 为 `3`

证据文件：

- `docs/artifacts/phase5-acceptance/t54-reset-before.json`
- `docs/artifacts/phase5-acceptance/t54-reset-after.json`
- `docs/artifacts/phase5-acceptance/t54-reset-command.log`

## 8. Blocker 判断

当前未发现阻塞进入 `T55` 的 blocker。

本轮需要明确保留的边界只有一条：

- 当前完成的是**预上线环境验收**
- 不是公网域名、不是外部主机、不是正式线上环境验收

## 9. 最终判断

当前可以进入 `T55`。

进入 `T55` 时应明确写清：

- 现在可以把它当成“可重复部署、可投递、可演示”的预上线作品包
- 但不能写成“公网已发布并稳定运营”
