# Phase 7 Runtime Probes

> 最近确认时间：2026-04-23 19:25 CST
> 公网入口：`https://homedata.lilei.dev`

## Railway Restart

- Project：`HomeData`
- Service：`lingang-family-warehouse`
- Restart deployment id：`fbfd3a44-928a-4f2e-b4c0-e9ef1fa69896`
- Restart 后 `railway service status --json` 返回：`status=SUCCESS / stopped=false`

## Restart 后健康检查

```text
04:22:08 http_code=200 time_total=1.963606
{"status":"ok","backend":"ready","database":"ok","ai":"ready","error":null}
```

## Runtime Probe

命令：

```bash
bash scripts/phase7_runtime_probe.sh https://homedata.lilei.dev
```

结果：

```text
Phase 7 runtime probe
timestamp=2026-04-23 19:22:10 CST
base_url=https://homedata.lilei.dev
home path=/ bytes=446 http_code=200 time_total=1.145995 time_starttransfer=1.145683
health path=/api/health bytes=75 http_code=200 time_total=1.210751 time_starttransfer=1.210530
dashboard path=/api/stats/dashboard bytes=1684 http_code=200 time_total=1.334558 time_starttransfer=1.334333
knowledge path=/api/knowledge?limit=5 bytes=3895 http_code=200 time_total=1.456396 time_starttransfer=1.456035
```

## Restart 后数据口径

```text
people=471
houses=188
visits=672
conflicts=16
knowledge=5
notices=5
task_rules=3
```

## AI 公网探针

`POST /api/ai/chat` 当前仍返回 live 内容，但实际命中 fallback 模型：

```json
{
  "status": "live",
  "model": "gemini-2.5-flash-lite",
  "used_fallback_model": true
}
```

## 预算侧记录

- Railway account 已设置 `$10` email alert
- Railway account 已设置 `$20` hard limit
- 本轮未新增常驻服务或 keep-alive cron
- 当前脚本为手动探针，不会自动产生持续请求量

## 判断

- Restart 后首轮健康检查在 `2s` 内返回，低于 `8s` 阈值
- Railway Postgres 数据在服务 restart 后仍保持标准演示口径
- 当前无需立即引入 warm-up / keep-alive
