/**
 * 日志管理演示台账数据（R56）。
 *
 * 数据独立成模块，便于浏览器测试用跨日期夹具替换本模块，
 * 验证时间范围过滤的真实接线；页面口径与硬编码时期完全一致。
 */

export interface OperationLog {
  id: number;
  type: string;
  module: string;
  action: string;
  user: string;
  username: string;
  ip: string;
  location: string;
  detail: string;
  status: string;
  time: string;
  duration: string;
}

export const OPERATION_LOGS: OperationLog[] = [
  {
    id: 1,
    type: 'create',
    module: '数据管理',
    action: '新建人口信息',
    user: '张三',
    username: 'zhangsan',
    ip: '192.168.1.100',
    location: 'A区管理办',
    detail: '新建人口信息：李明（身份证：370XXXXXXXXX）',
    status: 'success',
    time: '2026-01-20 15:45:23',
    duration: '0.52s'
  },
  {
    id: 2,
    type: 'update',
    module: '标签管理',
    action: '编辑标签',
    user: '李四',
    username: 'lisi',
    ip: '192.168.1.105',
    location: 'A区管理办',
    detail: '修改标签"高龄老人"的规则条件',
    status: 'success',
    time: '2026-01-20 15:30:15',
    duration: '0.38s'
  },
  {
    id: 3,
    type: 'delete',
    module: '数据管理',
    action: '删除房屋信息',
    user: '王五',
    username: 'wangwu',
    ip: '192.168.1.108',
    location: '统计分析科',
    detail: '删除房屋信息：A区中心街道阳光小区1号楼',
    status: 'success',
    time: '2026-01-20 15:15:42',
    duration: '0.45s'
  },
  {
    id: 4,
    type: 'export',
    module: '统计分析',
    action: '导出报表',
    user: '赵六',
    username: 'zhaoliu',
    ip: '192.168.1.112',
    location: 'B区管理办',
    detail: '导出"2026年1月人口统计报表"',
    status: 'success',
    time: '2026-01-20 14:50:18',
    duration: '2.15s'
  },
  {
    id: 5,
    type: 'login',
    module: '系统配置',
    action: '用户登录',
    user: '孙七',
    username: 'sunqi',
    ip: '192.168.1.120',
    location: '外部审计',
    detail: '用户登录系统',
    status: 'success',
    time: '2026-01-20 14:30:05',
    duration: '0.12s'
  },
  {
    id: 6,
    type: 'update',
    module: '系统配置',
    action: '修改用户信息',
    user: '张三',
    username: 'zhangsan',
    ip: '192.168.1.100',
    location: 'A区管理办',
    detail: '修改用户"李四"的角色为"区域管理员"',
    status: 'success',
    time: '2026-01-20 14:15:30',
    duration: '0.28s'
  },
  {
    id: 7,
    type: 'create',
    module: '数据管理',
    action: '批量导入数据',
    user: '王五',
    username: 'wangwu',
    ip: '192.168.1.108',
    location: '统计分析科',
    detail: '批量导入人口数据，共计500条记录',
    status: 'success',
    time: '2026-01-20 13:45:00',
    duration: '15.82s'
  },
  {
    id: 8,
    type: 'view',
    module: '数据可视化',
    action: '查看仪表盘',
    user: '赵六',
    username: 'zhaoliu',
    ip: '192.168.1.112',
    location: 'B区管理办',
    detail: '访问辖区总览仪表盘',
    status: 'success',
    time: '2026-01-20 13:20:45',
    duration: '0.65s'
  },
  {
    id: 9,
    type: 'update',
    module: '数据管理',
    action: '编辑人口信息',
    user: '李四',
    username: 'lisi',
    ip: '192.168.1.105',
    location: 'A区管理办',
    detail: '更新人口信息：张伟（更新联系电话）',
    status: 'failed',
    time: '2026-01-20 12:55:12',
    duration: '0.15s'
  },
  {
    id: 10,
    type: 'login',
    module: '系统配置',
    action: '用户登出',
    user: '孙七',
    username: 'sunqi',
    ip: '192.168.1.120',
    location: '外部审计',
    detail: '用户登出系统',
    status: 'success',
    time: '2026-01-20 12:00:00',
    duration: '0.08s'
  }
];
