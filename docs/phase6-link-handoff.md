# 临港家庭数仓 Phase 6 链接交付说明

> 日期：2026-04-22
> 对应任务：`T65`
> 当前状态：公网在线演示交付说明

## 1. 当前交付口径

当前项目的准确口径是：

- **公网在线演示链接**
- **可直接发给面试官自由浏览**
- **可恢复到标准演示基线**

当前还不是：

- 正式生产系统
- 长期稳定运营的商业站点

## 2. 当前正式入口

- Web：`https://homedata.lilei.dev`
- API 健康检查：`https://homedata.lilei.dev/api/health`

## 3. 发链接时建议附带的说明

### 简短版

> 这是我做的一个社区治理智能中台在线演示系统，建议先看首页驾驶舱，再点人口管理、房屋管理、矛盾调解，最后体验移动端工作台。无需登录，可直接浏览。

### 标准版

> 这是一个可公网访问的社区治理智能中台在线演示链接。建议先从首页驾驶舱建立全景认知，再进入人口管理、房屋管理和矛盾调解看核心链路，最后点击移动端工作台体验一线执行侧。当前是演示环境，不需要登录；如遇到数据被写脏，可以按 runbook 恢复到标准演示基线。

## 4. 推荐浏览顺序

自由浏览建议：

1. `综合统计驾驶舱`
2. `人口管理`
3. `房屋管理`
4. `矛盾调解`
5. `移动端工作台`

如果是你主动带看，建议顺序：

1. 驾驶舱开场
2. 人口管理看对象画像
3. 房屋 / 人房关系看空间治理
4. 矛盾调解看处置闭环
5. 移动端待办 -> 人员详情 -> 走访记录
6. 选看 `移动端政策解读` 或 `移动端公文写作`

## 5. 当前不需要提供的东西

- 账号密码
- 角色切换说明
- 权限申请流程

原因：

- 当前是公开演示环境，不是登录态业务系统

## 6. 当前真实可验证的事实

- 入口可访问：`https://homedata.lilei.dev`
- 健康检查返回：`status=ok / database=ok`
- 公网标准演示基线当前为：
  - `people=471`
  - `houses=188`
  - `visits=672`
  - `conflicts=16`
  - `knowledge=5`
  - `notices=5`
  - `task_rules=3`
- 已有 1-2 个二级 AI 页接到真实 Gemini

## 7. 如果环境被写脏，如何恢复

当前最短恢复路径：

```bash
railway ssh --project=742fe870-68f0-4753-a8c7-86c87bc91dbf --environment=f2c20f38-d8bd-4d0e-854d-118f4979f219 --service=e6094f88-d376-461c-952b-a486f52f4ee8 "cd /app && python seed.py"
```

恢复后建议至少检查：

```bash
curl 'https://homedata.lilei.dev/api/health'
curl 'https://homedata.lilei.dev/api/stats/dashboard'
curl 'https://homedata.lilei.dev/api/knowledge?limit=5'
curl 'https://homedata.lilei.dev/api/notices?limit=5'
curl 'https://homedata.lilei.dev/api/task-rules'
```

## 8. 当前不能对外承诺的事情

- 不能说“正式生产系统”
- 不能说“长期稳定公网 SaaS”
- 不能说“全站所有 AI 页都是真实大模型联动”

更准确的说法是：

- 这是一个可公网访问、可自由浏览、可恢复、可验证的在线演示系统

## 9. 发出链接前的最后检查

1. 首页能打开
2. `/api/health` 返回正常
3. 首页推荐浏览路径与移动端入口可见
4. 如需稳妥，先回读一遍七项公网口径

## 10. 关联文档

- `runbooks/phase6-deploy-runbook.md`
- `docs/phase6-demo-script.md`
- `docs/phase6-resume-evidence-map.md`
- `docs/phase6-acceptance-checklist.md`
- `docs/phase6-verification.md`
