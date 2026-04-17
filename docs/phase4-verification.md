# Phase 4 Verification

> 验证日期：2026-04-17
> 验证分支：`task/t45-phase4-verification`
> 验证基线：`913f229`

## 结论

`T45` 已完成，但 `Phase 4` 当前**不通过**，项目**暂不进入 `Phase 5`**。

这不是因为第一圈主链或第二圈接骨有问题，而是因为仍然存在几类“面试官自由浏览时一两步就可能撞上”的演示态页面。  
更准确的判断是：

- 第一圈主链：可信
- 第二圈接骨：可信
- 关键随机点击路径：可信
- 全站“任意自由乱点”口径：**当前仍不够稳**

## 对外可交付判断

### 现在能否把链接直接发给面试官自由乱点

**暂不建议把它包装成“全站可无边界自由乱点的完成版 Demo”。**

原因不是主舞台不成立，而是以下入口仍会暴露明显演示态：

- Web：`批量导入`
- 移动端：首页可直达的 `扫码核验`
- 移动端：继续深挖后可见的 `电子记事 / 房屋采集 / 巡查上报`
- 移动端：`活动详情` 的上传动作仍带“演示模式”提示

### 现在能否把链接作为面试作品链接发出去

**可以，但要用“演示版治理中台”口径，而不是“全站完成品”口径。**

如果面试官主要浏览：

- Web 首页
- 第一圈主链
- 第二圈页面
- 移动端工作台主链

当前体验已经足够可信。

如果对方刻意深挖所有侧边栏和移动端辅助页，当前仍会碰到残余演示态。

## 已完成事实

### 1. 第一圈与第二圈骨架继续成立

本轮沿用并确认以下已完成事实：

- `Phase 2` 已证明第一圈页面挂在统一 `repository / API` 主链上  
  证据： [phase2-verification.md](</Users/rayli/Desktop/临港家庭数仓 /docs/phase2-verification.md>)
- `Phase 3` 已证明第二圈页面不再依赖各自独立假源存活  
  证据： [phase3-verification.md](</Users/rayli/Desktop/临港家庭数仓 /docs/phase3-verification.md>)

### 2. Phase 4 前半程收口事实成立

本轮确认 `T40-T43` 的收口已经落地：

- `T40`：全站页面分层矩阵与高风险入口矩阵已冻结
- `T41`：死按钮、坏跳转和错误反馈已收口一批
- `T42`：高风险分析页已切到统一治理快照，不再各自维护随机样例和占位图
- `T43`：二级 AI 页不再直白输出“模拟回复”，历史 reference 腐烂和死 seed 已处理

对应共享层依据：

- [page-tier-matrix.md](/Users/rayli/AI-Shared/projects/LingangFamilyWarehouse/reference/page-tier-matrix.md)
- [phase4-risk-matrix.md](/Users/rayli/AI-Shared/projects/LingangFamilyWarehouse/reference/phase4-risk-matrix.md)

### 3. T44 随机点击关键路径已真实通过

本轮直接引用 `T44` 的真实浏览器自动化证据：

- [phase4-random-click-checklist.md](</Users/rayli/Desktop/临港家庭数仓 /docs/phase4-random-click-checklist.md>)

已通过的关键路径：

- `desktop-home`
- `desktop-sidebar-cross-nav`
- `desktop-search-jump`
- `desktop-search-target`
- `desktop-notice-preview`
- `desktop-analysis-export`
- `mobile-home-browse`

运行结果：

- `console_errors = []`
- `page_errors = []`

并且：

- 本地联调的 `4173 -> 8000` CORS 阻断已经修复
- `docker compose` 运行态当前正常  
  证据：

```bash
curl -sf http://localhost:8000/api/health
docker compose ps
```

## 当前未通过点

下面这些不是“文档里猜测的风险”，而是当前代码仍可被静态命中的残余演示态。

### A. Web 侧边栏仍有高概率露怯入口

#### `BatchImport.tsx`

当前仍存在：

- `mockImportHistory`
- 模拟导入进度
- 多处裸 `alert(...)`

实测命中：

```bash
rg -n "mockImportHistory|模拟导入|alert\\(" \
  src/app/components/pages/BatchImport.tsx
```

这意味着：

- 面试官从 `数据管理 -> 批量导入` 进入后，仍然会明显感知“这是演示页”

### B. 移动端仍有可见演示态入口

#### `MobileHome -> scan`

移动端首页仍有明显的 `扫码核验` 快捷入口。  
虽然当前页面文案已不再直白写“模拟回复”，但 `MobileScan` 本质仍是摄像头壳与演示态识别场景，不是真实扫码链路。

这意味着：

- 面试官从移动端首页随手点 `扫码核验`，仍可能感知到“这是演示能力，不是真实工作链”

#### `QuickNote.tsx`

当前仍存在：

- `mockPeople`
- `setTimeout`
- 直接 `db.getPerson / db.updatePerson`
- “演示模式：仅支持模拟上传”

实测命中：

```bash
rg -n "mockPeople|setTimeout|db\\.|演示模式|模拟上传" \
  src/app/components/mobile/QuickNote.tsx
```

#### `HouseCollect.tsx`

当前仍存在：

- mock 图片
- mock 扫码
- mock 定位
- 多处裸 `alert(...)`

实测命中：

```bash
rg -n "setTimeout|alert\\(" \
  src/app/components/mobile/HouseCollect.tsx
```

#### `MobilePatrol.tsx`

当前仍存在：

- 随机图片
- `setTimeout`
- 多处裸 `alert(...)`

实测命中：

```bash
rg -n "setTimeout|alert\\(" \
  src/app/components/mobile/MobilePatrol.tsx
```

#### `MobileActivityDetail.tsx`

当前仍存在：

- `toast.info('演示模式：仅支持模拟上传')`

实测命中：

```bash
rg -n "演示模式|模拟上传" \
  src/app/components/mobile/MobileActivityDetail.tsx
```

## 已知但不阻塞当前结论的事项

以下内容当前不是 `Phase 4` 不通过的主因，但仍要诚实保留：

- `src/app/services/db.ts` 仍存在，作为 fallback 层继续服务部分未完全真化页面
- repository fallback 仍依赖 `localStorage`
- 一些设计规格、历史审计文档中仍会出现“mock / 占位 / 模拟”等字样，但它们不属于当前运行页面
- 主包体积仍偏大，`vite build` 继续有 chunk size warning

## 当前阶段判断

### 为什么还不能宣布 Phase 4 完成

因为 `Phase 4` 的目标不是“关键路径能跑”，而是：

- 第三圈与边缘页在自由浏览下不再频繁露出原型态破绽

当前这条还没有完全满足。  
尤其是：

- `BatchImport`
- `MobileScan`
- `QuickNote`
- `HouseCollect`
- `MobilePatrol`
- `MobileActivityDetail`

这些页里，有的入口并不深，仍会被真实随机点击撞到。

### 当前最准确的项目状态

当前项目已经达到：

- 可作为面试主链演示项目使用
- 可让面试官浏览首页、第一圈、第二圈和移动端主链

但尚未达到：

- 可作为“整站任意深挖都不露怯”的完成版在线 Demo

## 下一步建议

当前不应进入 `Phase 5`。

更合理的下一步是：

1. 留在 `Phase 4`
2. 追加一轮残余页收口
3. 重点清掉：
   - `BatchImport`
   - `MobileScan`
   - `QuickNote`
   - `HouseCollect`
   - `MobilePatrol`
   - `MobileActivityDetail`
4. 之后重新跑一次随机点击验收，再决定是否进入 `Phase 5`

## 最终判断

一句话总结：

**现在已经是一个“主链可信、可用于面试演示”的在线作品，但还不是一个“全站任意自由乱点都稳”的完成版 Demo。**
