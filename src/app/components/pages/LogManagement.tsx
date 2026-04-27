import { useState } from 'react';
import { FileText, Search, Download, Filter, Calendar, User, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const DARK_CARD_CLASS = 'rounded-lg border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)] shadow-none';
const DARK_PANEL_CLASS = 'rounded-lg border border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)]';
const DARK_INPUT_CLASS = 'border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)] placeholder:text-[var(--color-neutral-08)]';
const DARK_SELECT_TRIGGER_CLASS = 'border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)]';
const ACTION_BUTTON_CLASS = 'border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)] hover:bg-[var(--color-neutral-03)] hover:text-[var(--color-neutral-11)]';
const MUTED_TEXT_CLASS = 'text-[var(--color-neutral-08)]';
const INFO_BADGE_CLASS = 'border-[var(--color-neutral-04)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)]';

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
    { type: 'login', label: '登录/登出', count: 2, color: '#3b82f6' },
    { type: 'create', label: '新建', count: 2, color: '#10b981' },
    { type: 'update', label: '编辑', count: 3, color: '#f59e0b' },
    { type: 'delete', label: '删除', count: 1, color: '#ef4444' },
    { type: 'export', label: '导出', count: 1, color: '#8b5cf6' },
    { type: 'view', label: '查看', count: 1, color: '#6B7599' }
  ];

  // 模块分布
  const moduleDistribution = [
    { module: '数据管理', count: 4 },
    { module: '标签管理', count: 1 },
    { module: '统计分析', count: 1 },
    { module: '数据可视化', count: 1 },
    { module: '系统配置', count: 3 }
  ];

  const getTypeBadge = (type: string) => {
    const config: Record<string, { label: string; className: string }> = {
      login: { label: '登录', className: 'border border-[#4E86DF]/35 bg-[#4E86DF]/10 text-[#9EC3FF]' },
      create: { label: '新建', className: 'border border-[#19B172]/35 bg-[#19B172]/15 text-[#7DE2B7]' },
      update: { label: '编辑', className: 'border border-[#D6730D]/35 bg-[#D6730D]/15 text-[#F6C27A]' },
      delete: { label: '删除', className: 'border border-[#D52132]/35 bg-[#D52132]/15 text-[#FFB4B4]' },
      export: { label: '导出', className: 'border border-[#8B5CF6]/35 bg-[#8B5CF6]/15 text-[#C7B6FF]' },
      view: { label: '查看', className: 'border border-[var(--color-neutral-04)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)]' }
    };
    const { label, className } = config[type] || { label: type, className: INFO_BADGE_CLASS };
    return <Badge className={className}>{label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    return status === 'success' ? (
      <Badge className="border border-[#19B172]/35 bg-[#19B172]/15 text-[#7DE2B7]">成功</Badge>
    ) : (
      <Badge className="border border-[#D52132]/35 bg-[#D52132]/15 text-[#FFB4B4]">失败</Badge>
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

  return (
    <div className="space-y-5 text-[var(--color-neutral-10)] animate-in fade-in duration-500">
      {/* 页面标题 */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-neutral-11)]">日志管理</h1>
          <p className={`mt-1 text-sm ${MUTED_TEXT_CLASS}`}>系统操作日志的查询、检索与导出</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className={ACTION_BUTTON_CLASS}>
            <Download className="w-4 h-4 mr-2" />
            导出日志
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={DARK_CARD_CLASS}>
          <CardHeader className="pb-3">
            <CardDescription className={`flex items-center gap-2 ${MUTED_TEXT_CLASS}`}>
              <FileText className="w-4 h-4" />
              日志总数
            </CardDescription>
            <CardTitle className="text-3xl text-[var(--color-neutral-11)]">{stats.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-sm ${MUTED_TEXT_CLASS}`}>系统运行记录</p>
          </CardContent>
        </Card>

        <Card className={DARK_CARD_CLASS}>
          <CardHeader className="pb-3">
            <CardDescription className={MUTED_TEXT_CLASS}>今日日志</CardDescription>
            <CardTitle className="text-3xl text-[#4E86DF]">{stats.today}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-sm ${MUTED_TEXT_CLASS}`}>
              2026-01-20
            </p>
          </CardContent>
        </Card>

        <Card className={DARK_CARD_CLASS}>
          <CardHeader className="pb-3">
            <CardDescription className={MUTED_TEXT_CLASS}>成功操作</CardDescription>
            <CardTitle className="text-3xl text-[#19B172]">{stats.success}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-sm ${MUTED_TEXT_CLASS}`}>
              成功率 {((stats.success / stats.total) * 100).toFixed(0)}%
            </p>
          </CardContent>
        </Card>

        <Card className={DARK_CARD_CLASS}>
          <CardHeader className="pb-3">
            <CardDescription className={MUTED_TEXT_CLASS}>失败操作</CardDescription>
            <CardTitle className="text-3xl text-[#D52132]">{stats.failed}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-sm ${MUTED_TEXT_CLASS}`}>
              需要关注
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 操作类型分布 */}
        <Card className={DARK_CARD_CLASS}>
          <CardHeader>
            <CardTitle className="text-base text-[var(--color-neutral-11)]">操作类型</CardTitle>
            <CardDescription className={MUTED_TEXT_CLASS}>操作统计</CardDescription>
          </CardHeader>
          <CardContent>
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

            <div className="mt-6">
              <p className={`text-sm font-medium ${MUTED_TEXT_CLASS} mb-2`}>模块分布</p>
              <div className="space-y-2">
                {moduleDistribution.map((item) => (
                  <div key={item.module} className="flex items-center justify-between text-sm">
                    <span className={MUTED_TEXT_CLASS}>{item.module}</span>
                    <span className="font-medium text-[var(--color-neutral-11)]">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 日志列表 */}
        <Card className={`lg:col-span-3 ${DARK_CARD_CLASS} overflow-hidden`}>
          <CardHeader className="border-b border-[var(--color-neutral-03)]">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <CardTitle className="text-base text-[var(--color-neutral-11)]">操作日志</CardTitle>
                <CardDescription className={MUTED_TEXT_CLASS}>
                  共 {filteredLogs.length} 条记录
                  {(logType !== 'all' || searchQuery) && ` (已筛选)`}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className={`w-[120px] ${DARK_SELECT_TRIGGER_CLASS}`}>
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
                  <SelectTrigger className={`w-[120px] ${DARK_SELECT_TRIGGER_CLASS}`}>
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
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${MUTED_TEXT_CLASS}`} />
                  <Input
                    className={`w-[200px] pl-9 ${DARK_INPUT_CLASS}`}
                    placeholder="搜索日志..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[600px] divide-y divide-[var(--color-neutral-03)] overflow-y-auto">
              {filteredLogs.map((log) => (
                <div key={log.id} className="p-4 transition-colors hover:bg-[var(--color-neutral-03)]/70">
                  <div className="mb-2 flex flex-col gap-2 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      {getTypeBadge(log.type)}
                      <Badge variant="outline" className={INFO_BADGE_CLASS}>{log.module}</Badge>
                      <span className="font-medium text-[var(--color-neutral-11)]">{log.action}</span>
                      {getStatusBadge(log.status)}
                    </div>
                    <span className={`shrink-0 text-sm ${MUTED_TEXT_CLASS}`}>{log.time}</span>
                  </div>

                  <p className={`mb-3 text-sm ${MUTED_TEXT_CLASS}`}>{log.detail}</p>

                  <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
                    <div className="flex items-center gap-2">
                      <User className={`w-4 h-4 ${MUTED_TEXT_CLASS}`} />
                      <div>
                        <p className={MUTED_TEXT_CLASS}>操作人</p>
                        <p className="font-medium text-[var(--color-neutral-11)]">{log.user}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className={`w-4 h-4 ${MUTED_TEXT_CLASS}`} />
                      <div>
                        <p className={MUTED_TEXT_CLASS}>IP地址</p>
                        <p className="font-mono font-medium text-[var(--color-neutral-11)]">{log.ip}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4" />
                      <div>
                        <p className={MUTED_TEXT_CLASS}>位置</p>
                        <p className="font-medium text-[var(--color-neutral-11)]">{log.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4" />
                      <div>
                        <p className={MUTED_TEXT_CLASS}>耗时</p>
                        <p className="font-medium text-[var(--color-neutral-11)]">{log.duration}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 日志保留策略 */}
      <Card className={DARK_CARD_CLASS}>
        <CardHeader>
          <CardTitle className="text-base text-[var(--color-neutral-11)]">日志保留策略</CardTitle>
          <CardDescription className={MUTED_TEXT_CLASS}>系统日志的存储和清理规则</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`${DARK_PANEL_CLASS} p-4`}>
              <p className={`mb-2 text-sm font-medium ${MUTED_TEXT_CLASS}`}>操作日志</p>
              <p className="mb-1 text-2xl font-bold text-[#4E86DF]">90天</p>
              <p className={`text-sm ${MUTED_TEXT_CLASS}`}>超过90天的日志将自动归档</p>
            </div>
            <div className={`${DARK_PANEL_CLASS} p-4`}>
              <p className={`mb-2 text-sm font-medium ${MUTED_TEXT_CLASS}`}>登录日志</p>
              <p className="mb-1 text-2xl font-bold text-[#19B172]">180天</p>
              <p className={`text-sm ${MUTED_TEXT_CLASS}`}>超过180天的日志将自动归档</p>
            </div>
            <div className={`${DARK_PANEL_CLASS} p-4`}>
              <p className={`mb-2 text-sm font-medium ${MUTED_TEXT_CLASS}`}>系统日志</p>
              <p className="mb-1 text-2xl font-bold text-[#8B5CF6]">365天</p>
              <p className={`text-sm ${MUTED_TEXT_CLASS}`}>超过1年的日志将自动归档</p>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-[#D6730D]/35 bg-[#D6730D]/10 p-4">
            <p className="text-sm text-[#F6C27A]">
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
