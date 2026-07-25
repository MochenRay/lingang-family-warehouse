import { useState } from 'react';
import { FileText, Download, Filter, Calendar, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { StatCard } from '../patterns/StatCard';
import { StatusBadge, type StatusTone } from '../patterns/StatusBadge';
import { FilterBar, SearchInput } from '../patterns/FilterBar';
import { DataTableBody } from '../patterns/DataTableShell';
import { PANEL_CLASS } from '../patterns/surfaces';
import { PageHeader } from './PageHeader';

const DARK_PANEL_CLASS = 'rounded-lg border border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)]';
const DARK_SELECT_TRIGGER_CLASS = 'border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)]';
const ACTION_BUTTON_CLASS = 'border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)] hover:bg-[var(--color-neutral-03)] hover:text-[var(--color-neutral-11)]';
const MUTED_TEXT_CLASS = 'text-[var(--color-neutral-08)]';
const INFO_BADGE_CLASS = 'border-[var(--color-neutral-04)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)]';
const TABLE_HEAD_CLASS = 'text-xs uppercase whitespace-nowrap';

export function LogManagement() {
  const [logType, setLogType] = useState('all');
  const [timeRange, setTimeRange] = useState('today');
  const [searchQuery, setSearchQuery] = useState('');

  // 操作日志数据
  const logs = [
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

  // 统计数据
  const stats = {
    total: logs.length,
    today: logs.filter(l => l.time.startsWith('2026-01-20')).length,
    success: logs.filter(l => l.status === 'success').length,
    failed: logs.filter(l => l.status === 'failed').length
  };

  // 操作类型分布
  const typeDistribution = [
    { type: 'login', label: '登录/登出', count: 2, color: 'var(--color-brand-primary-hover)' },
    { type: 'create', label: '新建', count: 2, color: 'var(--color-status-success)' },
    { type: 'update', label: '编辑', count: 3, color: 'var(--color-status-warning)' },
    { type: 'delete', label: '删除', count: 1, color: 'var(--color-status-error)' },
    { type: 'export', label: '导出', count: 1, color: 'var(--color-accent-purple)' },
    { type: 'view', label: '查看', count: 1, color: 'var(--color-neutral-06)' }
  ];

  // 模块分布
  const moduleDistribution = [
    { module: '数据管理', count: 4 },
    { module: '标签管理', count: 1 },
    { module: '统计分析', count: 1 },
    { module: '数据可视化', count: 1 },
    { module: '系统配置', count: 3 }
  ];

  const TYPE_BADGE_CONFIG: Record<string, { label: string; tone: StatusTone }> = {
    login: { label: '登录', tone: 'info' },
    create: { label: '新建', tone: 'success' },
    update: { label: '编辑', tone: 'warning' },
    delete: { label: '删除', tone: 'error' },
    export: { label: '导出', tone: 'neutral' },
    view: { label: '查看', tone: 'neutral' }
  };

  const getTypeBadge = (type: string) => {
    const { label, tone } = TYPE_BADGE_CONFIG[type] || { label: type, tone: 'neutral' as StatusTone };
    return <StatusBadge tone={tone}>{label}</StatusBadge>;
  };

  const getStatusBadge = (status: string) => {
    return status === 'success' ? (
      <StatusBadge tone="success">成功</StatusBadge>
    ) : (
      <StatusBadge tone="error">失败</StatusBadge>
    );
  };

  const filteredLogs = logs.filter(log => {
    if (logType !== 'all' && log.type !== logType) return false;
    if (searchQuery && !(
      log.action.includes(searchQuery) ||
      log.user.includes(searchQuery) ||
      log.detail.includes(searchQuery)
    )) return false;
    return true;
  });

  const hasActiveFilters = logType !== 'all' || searchQuery !== '';
  const clearFilters = () => {
    setLogType('all');
    setTimeRange('today');
    setSearchQuery('');
  };

  return (
    <div className="space-y-5 text-[var(--color-neutral-10)] page-enter">
      <PageHeader
        eyebrow="AUDIT LOGS"
        title="日志管理"
        description="追踪关键操作、登录和数据变更，支撑问题回溯与责任定位。"
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge tone="info">演示数据</StatusBadge>
            <Button variant="outline" className={ACTION_BUTTON_CLASS}>
              <Download className="w-4 h-4 mr-2" />
              导出日志
            </Button>
          </div>
        }
      />

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="日志总数" value={stats.total} hint="系统运行记录" icon={FileText} tone="brand" />
        <StatCard label="今日日志" value={stats.today} hint="2026-01-20" tone="brand" />
        <StatCard
          label="成功操作"
          value={stats.success}
          hint={`成功率 ${((stats.success / stats.total) * 100).toFixed(0)}%`}
          tone="success"
        />
        <StatCard label="失败操作" value={stats.failed} hint="需要关注" tone="error" />
      </div>

      {/* 操作日志：通栏表格，筛选区与表格同卡 */}
      <Card className={`${PANEL_CLASS} overflow-hidden`}>
        <CardHeader className="border-b border-[var(--color-neutral-03)]">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <CardTitle className="text-base text-[var(--color-neutral-11)]">操作日志</CardTitle>
              <CardDescription className={MUTED_TEXT_CLASS}>
                共 {filteredLogs.length} 条记录
                {hasActiveFilters && '（已筛选）'}
              </CardDescription>
            </div>
            <FilterBar>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger aria-label="按时间范围筛选" className={`w-[120px] ${DARK_SELECT_TRIGGER_CLASS}`}>
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">今天</SelectItem>
                  <SelectItem value="week">近7天</SelectItem>
                  <SelectItem value="month">近30天</SelectItem>
                  <SelectItem value="all">全部</SelectItem>
                </SelectContent>
              </Select>
              <Select value={logType} onValueChange={setLogType}>
                <SelectTrigger aria-label="按类型筛选" className={`w-[148px] ${DARK_SELECT_TRIGGER_CLASS}`}>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="login">登录/登出</SelectItem>
                  <SelectItem value="create">新建</SelectItem>
                  <SelectItem value="update">编辑</SelectItem>
                  <SelectItem value="delete">删除</SelectItem>
                  <SelectItem value="export">导出</SelectItem>
                  <SelectItem value="view">查看</SelectItem>
                </SelectContent>
              </Select>
              <SearchInput
                className="w-[220px]"
                placeholder="搜索操作、操作人或详情..."
                value={searchQuery}
                onChange={setSearchQuery}
              />
              {hasActiveFilters ? (
                <Button variant="outline" className={ACTION_BUTTON_CLASS} onClick={clearFilters}>
                  <X className="w-4 h-4 mr-2" />
                  清除筛选
                </Button>
              ) : null}
            </FilterBar>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="min-w-[960px]">
            <TableHeader>
              <TableRow className="border-b border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] hover:bg-[var(--color-neutral-02)]">
                <TableHead className={`${TABLE_HEAD_CLASS} min-w-[150px]`}>时间</TableHead>
                <TableHead className={`${TABLE_HEAD_CLASS} min-w-[72px]`}>类型</TableHead>
                <TableHead className={`${TABLE_HEAD_CLASS} min-w-[96px]`}>模块</TableHead>
                <TableHead className={`${TABLE_HEAD_CLASS} min-w-[240px]`}>操作内容</TableHead>
                <TableHead className={`${TABLE_HEAD_CLASS} min-w-[104px]`}>操作人</TableHead>
                <TableHead className={`${TABLE_HEAD_CLASS} min-w-[132px]`}>来源</TableHead>
                <TableHead className={`${TABLE_HEAD_CLASS} text-center min-w-[80px]`}>状态</TableHead>
                <TableHead className={`${TABLE_HEAD_CLASS} text-right min-w-[80px]`}>耗时</TableHead>
              </TableRow>
            </TableHeader>
            <DataTableBody columnCount={8} empty={filteredLogs.length === 0} emptyText="没有符合条件的日志">
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap font-mono text-xs tabular-nums">{log.time}</TableCell>
                  <TableCell>{getTypeBadge(log.type)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={INFO_BADGE_CLASS}>{log.module}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[280px]">
                    <p className="font-medium text-[var(--color-neutral-11)]">{log.action}</p>
                    <p className={`truncate text-xs ${MUTED_TEXT_CLASS}`} title={log.detail}>{log.detail}</p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-[var(--color-neutral-11)]">{log.user}</p>
                    <p className={`text-xs ${MUTED_TEXT_CLASS}`}>{log.username}</p>
                  </TableCell>
                  <TableCell>
                    <p className="font-mono text-xs text-[var(--color-neutral-10)]">{log.ip}</p>
                    <p className={`text-xs ${MUTED_TEXT_CLASS}`}>{log.location}</p>
                  </TableCell>
                  <TableCell className="text-center">{getStatusBadge(log.status)}</TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums">{log.duration}</TableCell>
                </TableRow>
              ))}
            </DataTableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 日志分布：类型与模块同卡两列 */}
      <Card className={PANEL_CLASS}>
        <CardHeader>
          <CardTitle className="text-base text-[var(--color-neutral-11)]">日志分布</CardTitle>
          <CardDescription className={MUTED_TEXT_CLASS}>按操作类型与所属模块统计</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <p className={`mb-3 text-sm font-medium ${MUTED_TEXT_CLASS}`}>操作类型</p>
              <div className="space-y-3">
                {typeDistribution.map((item) => (
                  <div key={item.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-[var(--color-neutral-10)]">{item.label}</span>
                    </div>
                    <Badge variant="outline" className={INFO_BADGE_CLASS}>{item.count}</Badge>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className={`mb-3 text-sm font-medium ${MUTED_TEXT_CLASS}`}>模块分布</p>
              <div className="space-y-2">
                {moduleDistribution.map((item) => (
                  <div key={item.module} className="flex items-center justify-between text-sm">
                    <span className={MUTED_TEXT_CLASS}>{item.module}</span>
                    <span className="font-medium tabular-nums text-[var(--color-neutral-11)]">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 日志保留策略 */}
      <Card className={PANEL_CLASS}>
        <CardHeader>
          <CardTitle className="text-base text-[var(--color-neutral-11)]">日志保留策略</CardTitle>
          <CardDescription className={MUTED_TEXT_CLASS}>系统日志的存储和清理规则</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`${DARK_PANEL_CLASS} p-4`}>
              <p className={`mb-2 text-sm font-medium ${MUTED_TEXT_CLASS}`}>操作日志</p>
              <p className="mb-1 text-2xl font-bold text-[var(--color-brand-text)]">90天</p>
              <p className={`text-sm ${MUTED_TEXT_CLASS}`}>超过90天的日志将自动归档</p>
            </div>
            <div className={`${DARK_PANEL_CLASS} p-4`}>
              <p className={`mb-2 text-sm font-medium ${MUTED_TEXT_CLASS}`}>登录日志</p>
              <p className="mb-1 text-2xl font-bold text-[var(--color-status-success-text)]">180天</p>
              <p className={`text-sm ${MUTED_TEXT_CLASS}`}>超过180天的日志将自动归档</p>
            </div>
            <div className={`${DARK_PANEL_CLASS} p-4`}>
              <p className={`mb-2 text-sm font-medium ${MUTED_TEXT_CLASS}`}>系统日志</p>
              <p className="mb-1 text-2xl font-bold text-[var(--color-accent-purple)]">365天</p>
              <p className={`text-sm ${MUTED_TEXT_CLASS}`}>超过1年的日志将自动归档</p>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-[var(--color-status-warning)]/35 bg-[var(--color-status-warning)]/10 p-4">
            <p className="text-sm text-[var(--color-status-warning-text)]">
              <span className="font-medium">提示：</span>
              归档的日志将压缩存储，如需查询请联系系统管理员。建议定期导出重要日志进行备份。
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 数据更新时间 */}
      <div className={`text-center text-sm ${MUTED_TEXT_CLASS}`}>
        日志实时记录 | 最后刷新时间：2026-01-20 16:00:00
      </div>
    </div>
  );
}
