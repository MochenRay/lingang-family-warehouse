# Phase 4 Closeout Checklist

> 验证日期：2026-04-17
> 对应任务：`T46 Phase 4 残余页收口`
> 验证基线：`task/t46-phase4-closeout`

## 结论

`T45` 点名的 6 个残余页已完成最小可信收口，`Phase 4` 现在可以视为**通过**。

当前项目的对外交付口径可以更新为：

- 可以把链接作为在线作品链接发给面试官
- 可以承受常规自由浏览与随机点击
- 不再存在 `T45` 时那批“一两步就会撞上的明显演示态入口”

这不等于“产品化完成”，但已经满足 `Phase 4` 的目标：全站防穿帮。

## 本轮关闭的残余页

### 1. `BatchImport`

- 已去掉假导入进度、裸 `alert(...)` 和 `mockImportHistory`
- 模板下载改为真实文件下载
- 错误报告改为真实 CSV 下载
- 提交动作改为“导入受理/待校验”登记，不再伪装成即时入库

### 2. `QuickNote`

- 已去掉 `import { db }` 和页面内 `db.` 直连
- 已去掉 `mockPeople` 和 `setTimeout`
- 改为通过 `personRepository` 读取居民，并把标签真实回填到居民档案
- 佐证材料入口改为明确引导到走访记录页统一归档

### 3. `MobileScan`

- 不再只是空摄像头壳
- 新增“居民二维码样例 / 房屋二维码样例 / OCR 样例”落点
- 样例点击会跳回真实居民详情、房屋详情或采集页

### 4. `HouseCollect`

- 房屋采集已改为真实台账写入，提交走 `houseRepository.addHouse`
- 定位改为真实 `geolocation` 尝试，不再假提示成功
- 现场照片改为真实文件选择与本地预览
- 房屋编号改为建议编号生成，不再冒充真实扫码

### 5. `MobilePatrol`

- 已去掉 `setTimeout` 语音转写假动作和裸 `alert(...)`
- 现场照片改为真实文件选择与本地预览
- 提交动作改为真实写入 `conflictRepository.addConflict`
- 提交后直接回到问题处置链路，不再停留在假成功弹窗

### 6. `MobileActivityDetail`

- 现场记录上传改为真实文件选择与本地预览
- 已去掉“演示模式：仅支持模拟上传”

## 静态校验结果

对以下文件执行关键字回扫：

- `src/app/components/pages/BatchImport.tsx`
- `src/app/components/mobile/QuickNote.tsx`
- `src/app/components/mobile/MobileScan.tsx`
- `src/app/components/mobile/HouseCollect.tsx`
- `src/app/components/mobile/MobilePatrol.tsx`
- `src/app/components/mobile/MobileActivityDetail.tsx`
- `src/app/components/mobile/MobileApp.tsx`

回扫模式：

```bash
rg -n "mockImportHistory|模拟导入|演示模式|模拟上传|mockPeople|setTimeout|alert\\(|import \\{ db \\}|\\bdb\\.|开发中|敬请期待"
```

结果：**0 命中**

## 构建校验结果

本轮已通过：

```bash
npm run typecheck
npm run build -- --outDir /tmp/lingang-t46-dist
git diff --check
docker compose ps
```

结果：

- `typecheck` 通过
- `build` 通过
- `git diff --check` 通过
- `docker compose ps` 确认 `api` 与 `db` 正常运行

## 浏览器验收结果

本轮新增自动化脚本：

- `scripts/t46_closeout_acceptance.py`

使用本地临时 Python venv + Playwright 运行，结果已镜像到：

- `docs/artifacts/phase4-closeout/acceptance-results.json`
- `docs/artifacts/phase4-closeout/*.png`

通过路径：

- `desktop-batch-import`
- `mobile-scan-sample`
- `mobile-house-collect`

结果摘要：

- `console_errors = []`
- `page_errors = []`

## 关于隐藏辅助页的说明

`QuickNote`、`MobilePatrol`、`MobileActivityDetail` 当前不是移动首页的直达主入口。  
本轮对它们的验收以：

- 静态关键字清零
- `typecheck/build`
- 与真实 repository / API 链路的代码校核

为主，而不是把它们重新提升为随机点击主链。

这不会影响 `Phase 4` 通过，因为本轮的目标是关闭 `T45` 点名的露怯入口，而不是把所有低频页都升级成新的主舞台。

## 最终判断

一句话总结：

`T45` 的失败结论已经被本轮 closeout 收口，`Phase 4` 现在通过，可以进入 `Phase 5` 的拆解与上线讲述阶段。
