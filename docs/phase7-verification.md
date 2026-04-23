# Phase 7 v1 Verification

> 日期：2026-04-23
> 公网入口：`https://homedata.lilei.dev`
> 项目仓基线：`main @ c1fb5b2`
> 前端发布仓基线：`homedata-web main @ 8e4857e`

## 结论

`Phase 7 v1` 通过。

当前项目仍不应描述为“长期稳定运营的正式生产系统”，但可以从 `Phase 6` 的“公网在线演示链接”升级为：

**具备最小运营治理能力的公网在线演示系统。**

这次升级的含义是：AI 状态可见、AI 故障可观测、AI kill switch 可验证、前端投影漂移可检测、Railway 冷启动/恢复链有探针和 runbook。它不包含样式重构、交互细抠、新业务功能或继续扩大 AI 页面覆盖。

## T70 AI 状态显式化

状态：通过。

已新增 `AiStatusBadge`，并接入 Web / Mobile 二级 AI 页。公网 `政策解读` 页实测发起问题后，页面显示：

```text
AI 回退模型
gemini-2.5-flash-lite
```

对应公网 API：

```json
{
  "status": "live",
  "model": "gemini-2.5-flash-lite",
  "used_fallback_model": true
}
```

这说明页面状态提示与真实返回一致。

## T71 AI 观测与 Kill Switch

状态：通过。

后端已增加结构化 AI 事件日志。Railway 日志中可检索到：

```text
ai_event={"event":"ai_fallback_model_used","status":"live","model":"gemini-2.5-flash-lite","used_fallback_model":true}
```

本轮短暂将 Railway 环境变量切到 `AI_ENABLED=false` 做公网验证。关闭时：

```text
GET /api/health -> ai=disabled
POST /api/ai/chat -> status=disabled / error="AI service disabled by environment flag."
页面状态 -> AI 已关闭
```

验证后已切回 `AI_ENABLED=true`。恢复后：

```text
GET /api/health -> ai=ready
POST /api/ai/chat -> status=live / model=gemini-2.5-flash-lite / used_fallback_model=true
页面状态 -> AI 回退模型
```

## T72 投影层治理

状态：通过。

项目仓新增 `scripts/check_homedata_web_stale.sh`，当前发布仓可被半自动检测是否落后于真相层。

实测：

```text
OK: homedata-web is synced to c1fb5b2f8f06690cf2c0edeebe5120b6061a8182
```

当前发布仓 `README.md` 仍声明“不要直接改发布仓”，`SYNC_SOURCE.json` 保留来源主仓、来源 SHA、同步时间和同步模式。当前仍未做全自动 PR/cron 同步，这不是本轮 blocker；v1 的完成标准是“可检测、可追溯、禁直改边界明确”。

## T73 Railway 运行态探针

状态：通过。

Railway restart 后首轮健康检查：

```text
http_code=200 time_total=1.963606
{"status":"ok","backend":"ready","database":"ok","ai":"ready","error":null}
```

运行态探针：

```text
home http_code=200 time_total=1.145995
health http_code=200 time_total=1.210751
dashboard http_code=200 time_total=1.334558
knowledge http_code=200 time_total=1.456396
```

均低于 `8s` 阈值。Railway Postgres 在 restart 后仍保留标准演示数据：

```text
people=471
houses=188
visits=672
conflicts=16
knowledge=5
notices=5
task_rules=3
```

预算侧当前记录：Railway account 已设置 `$10` email alert 与 `$20` hard limit。本轮未新增 keep-alive 或常驻 cron。

## T74 恢复链与 Known Gotchas

状态：通过。

`runbooks/phase6-deploy-runbook.md` 已补齐：

- `railway ssh -> python seed.py` 云端恢复章节
- 恢复后公网验收命令
- `scripts/phase7_runtime_probe.sh` 运行态探针
- Railway Postgres URL 驱动不匹配 gotcha
- Railway custom start command 端口展开 gotcha
- Vercel `/api` rewrite 排查口径

当前恢复链不依赖聊天上下文即可执行。

## 后续边界

`Phase 7 v1` 不吸收用户后续页面浏览笔记。用户在 Obsidian 中整理的一轮样式、交互和文案问题已沉淀到 AI-Shared：

```text
observations/2026-04-23-ui-adjustment-digest.md
```

后续建议拆成：

- `Phase 7 v2`：前端体验修整，优先处理无需架构讨论的文案、入口、轻交互问题
- `Phase 8`：产品表现力增强，承接房屋页重设计、真实 URL 路由化、数据/架构级调整

在这两轮冻结前，不建议把这些问题混回 `Phase 7 v1`。

## 验证命令

```bash
npm run typecheck
npm run build -- --outDir /tmp/lingang-phase7-v1-dist
python3 -m py_compile backend/app/services/ai/__init__.py backend/app/services/ai/observability.py backend/app/services/ai/llm_gateway.py
bash scripts/check_homedata_web_stale.sh /Users/rayli/Desktop/homedata-web
bash scripts/phase7_runtime_probe.sh https://homedata.lilei.dev
curl -sS https://homedata.lilei.dev/api/health
curl -sS -X POST https://homedata.lilei.dev/api/ai/chat -H 'Content-Type: application/json' -d '{"kind":"policy","agent_type":"assistant","message":"Phase 7 验证：请用一句话回复。"}'
```

补充浏览器级验证使用本机 Chrome + Playwright，对公网 `政策解读` 页发起问题，分别确认 `AI 已关闭` 与 `AI 回退模型` 两种状态能渲染。
