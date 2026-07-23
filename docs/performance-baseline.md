# 30 路由性能基线

## 目的

本门禁用于发现前端页面在相同本地种子数据与浏览器 profile 下的相对回归，不等同公网 SLO，也不替代真实公网监控。

覆盖 `ROUTE_DEFINITIONS` 中除 `mobile` 外全部 30 条桌面路由。路由清单由 `tests/e2e/support/desktop-routes.ts` 统一提供，Vitest 会与 production route table 交叉核对，防止漏测。

## Canonical profile

- production `vite build` + `vite preview`
- Chromium，1440×900，`reducedMotion=reduce`
- fresh seeded SQLite
- 固定时钟：`2026-07-15T04:00:00.000Z`
- service worker blocked、HTTP cache disabled、字体加载完成、网络静默 200 ms
- 网络：download 5 Mbps / upload 3 Mbps / latency 80 ms
- CPU slowdown：4×
- 每路由 1 次 warm-up 丢弃，继以 3 个冷 browser context 量测并取中位数

每次记录：

- `readyMs`：exact pathname、`main [data-page-title]`、网络静默、无 skeleton/busy、字体 ready 后的用时
- `apiRequestCount`：GET `/api/**` 响应数
- `apiResponseBytes`：Playwright 读取的 decoded response body bytes
- 三次 raw samples 与逐 API path/status/bytes
- runner / OS / arch / Node / Chromium、source revision、dirty 状态与 seed source fingerprint

`schemaVersion` 与上述 canonical profile 任一漂移均直接失败；每路由三次样本的 API path 合同须一致。页面出现可见 `ErrorState` / `LoadingState`、request failure、pageerror 或非 2xx API 时，不得记作 ready。

## Budget

- `apiRequestCount`、`apiResponseBytes`：当前值超过 baseline 20% 即失败。
- `readyMs`：同时超过 baseline 20% 且绝对增加超过 250 ms 才失败，以收敛 runner 抖动。
- 缺失/新增 route 或 canonical path 漂移直接失败。
- baseline 中稳定出现的 `method + API path` 多重集若消失、增加或次数改变，直接失败，避免错误壳因请求更少而假绿。
- `readyMs` 仅在 baseline 与 current 的 runner / OS / arch、Node major、Chromium、Playwright 与 seed fingerprint 全部相同才比较；本地环境不相容时，summary 明示跳过 ready 预算。canonical CI 遇 cohort 漂移则直接阻断，要求重产基线。

## 命令

校验当前代码：

```bash
PYTHON_BIN=backend/.venv/bin/python npm run test:e2e:perf
```

生成候选：

```bash
PYTHON_BIN=backend/.venv/bin/python npm run test:e2e:perf:update
```

更新模式只写 `test-results/performance/baseline-candidate.json`，不得自动覆盖仓内 `tests/performance/performance-baseline.json`。应先审查 route manifest、raw samples、请求明细及异常原因，再显式替换基线并用普通校验模式复跑。

GitHub Actions 的 `Performance baseline candidate` 手动 workflow 可按需重产 canonical Ubuntu candidate artifact。普通 CI 若发现仓内基线尚非 clean `github-actions/linux/x64`，会进入一次性 bootstrap 模式：生成并上传 Ubuntu candidate 后主动失败，杜绝 provisional 基线随绿色 PR 合并；仓内基线换成该 artifact 后，后续 CI 才以 `PERF_REQUIRE_CANONICAL_BASELINE=1` 强制预算。current、candidate、summary 与 Playwright 证据皆始终上传。

## 首轮 Ubuntu bootstrap

当前入仓候选由本机 macOS 生成，provenance 明标 `local/darwin`，仅作 provisional 基线：本地同环境会执行 ready 预算；Ubuntu CI 在首次 canonical 候选入仓前进入 bootstrap，不拿不同宿主 CPU 的时间硬比而制造假红。候选生成本身仍强制三十路由成功、无错误态、无失败请求、profile 固定且单路由三次 API call 合同一致。

分支首轮 CI 即会上传 `baseline-candidate.json`；亦可在 workflow 已进入默认分支后手动运行 `Performance baseline candidate`。下载并审查 artifact；确认 run URL/ID、source revision、30 路由、profile、seed fingerprint、raw samples 与 API 明细无异常后，以该 Ubuntu candidate 原样替换仓内基线，再普通复跑。此后 CI 的 `readyMs +20% 且 +250ms` 门禁方为 canonical；不得把本机候选改名冒充 Ubuntu 证据。

## 当前已知边界

人口特征页已改由 `/api/stats/demographics` 返回全量人口聚合，不再下载 `offset=500/1000/1500` 三页人员明细。页面仍调用既有 `tagRepository`，其标签快照基于前 500 条 people/houses/visits/conflicts；该历史边界已如实计入 baseline，不在本轮暗改标签规则真相层。
