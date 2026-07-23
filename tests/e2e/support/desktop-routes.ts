export interface DesktopRouteProbe {
  id: string;
  path: string;
  readyTitle: string;
}

export const DESKTOP_ROUTES: DesktopRouteProbe[] = [
  { id: 'statistics-overview', path: '/', readyTitle: '综合统计驾驶舱' },
  { id: 'demographics-analysis', path: '/analysis/demographics', readyTitle: '人口特征分析' },
  { id: 'housing-statistics', path: '/analysis/housing', readyTitle: '房屋网格画像' },
  { id: 'migration-trends', path: '/analysis/migration-trends', readyTitle: '人口流动趋势' },
  { id: 'population-tags', path: '/analysis/tags', readyTitle: '标签分析画像' },
  { id: 'data-comparison', path: '/analysis/comparison', readyTitle: '数据对比分析' },
  { id: 'data-reports', path: '/analysis/reports', readyTitle: '报表中心' },
  { id: 'heatmap', path: '/analysis/warning-map', readyTitle: '预警热区' },
  { id: 'population', path: '/population', readyTitle: '人口管理' },
  { id: 'housing', path: '/housing', readyTitle: '房屋管理' },
  { id: 'relationship', path: '/relationship', readyTitle: '人房关系管理' },
  { id: 'batch-import', path: '/batch-import', readyTitle: '批量导入' },
  { id: 'tag-overview', path: '/tags', readyTitle: '标签管理' },
  { id: 'knowledge-accumulation', path: '/knowledge', readyTitle: '知识沉淀' },
  { id: 'policy-interpretation', path: '/ai/policy', readyTitle: '政策解读' },
  { id: 'document-writing', path: '/ai/document-writing', readyTitle: '公文写作' },
  { id: 'smart-query', path: '/ai/smart-query', readyTitle: '智能问数' },
  { id: 'behavior-supervision', path: '/grid/behavior', readyTitle: '行为督导中心' },
  { id: 'activity-management', path: '/grid/activities', readyTitle: '活动综合管理' },
  { id: 'conflict-management', path: '/grid/conflicts', readyTitle: '矛盾调解' },
  { id: 'notice-management', path: '/grid/notices', readyTitle: '公告管理' },
  { id: 'rule-config', path: '/grid/rules', readyTitle: '待办规则配置' },
  { id: 'anomaly-analysis', path: '/attribution/anomaly', readyTitle: '异常结果分析' },
  { id: 'time-series', path: '/attribution/time-series', readyTitle: '时序分析' },
  { id: 'factor-identification', path: '/attribution/factors', readyTitle: '影响因子识别' },
  { id: 'contribution-ranking', path: '/attribution/contribution', readyTitle: '贡献程度排名' },
  { id: 'user-management', path: '/settings/users', readyTitle: '用户管理' },
  { id: 'role-management', path: '/settings/roles', readyTitle: '角色管理' },
  { id: 'permission-management', path: '/settings/permissions', readyTitle: '权限管理' },
  { id: 'log-management', path: '/settings/logs', readyTitle: '日志管理' },
];
