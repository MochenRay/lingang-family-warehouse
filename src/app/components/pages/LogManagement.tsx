import { useState } from 'react';
import { FileText, Search, Download, Filter, Calendar, User, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

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
    { type: 'view', label: '查看', count: 1, color: '#6b7280' }
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
      login: { label: '登录', className: 'bg-blue-100 text-blue-800' },
      create: { label: '新建', className: 'bg-green-100 text-green-800' },
      update: { label: '编辑', className: 'bg-yellow-100 text-yellow-800' },
      delete: { label: '删除', className: 'bg-red-100 text-red-800' },
      export: { label: '导出', className: 'bg-purple-100 text-purple-800' },
      view: { label: '查看', className: 'bg-gray-100 text-gray-800' }
    };
    const { label, className } = config[type] || { label: type, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={className}>{label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    return status === 'success' ? (
      <Badge className="bg-green-100 text-green-800">成功</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">失败</Badge>
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
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2">日志管理</h1>
          <p className="text-gray-500">系统操作日志的查询、检索与导出</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            导出日志
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              日志总数
            </CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">系统运行记录</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>今日日志</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.today}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              2026-01-20
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>成功操作</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.success}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              成功率 {((stats.success / stats.total) * 100).toFixed(0)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>失败操作</CardDescription>
            <CardTitle className="text-3xl text-red-600">{stats.failed}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              需要关注
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 操作类型分布 */}
        <Card>
          <CardHeader>
            <CardTitle>操作类型</CardTitle>
            <CardDescription>操作统计</CardDescription>
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
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <Badge variant="outline">{item.count}</Badge>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <p className="text-sm font-medium text-gray-700 mb-2">模块分布</p>
              <div className="space-y-2">
                {moduleDistribution.map((item) => (
                  <div key={item.module} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{item.module}</span>
                    <span className="font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 日志列表 */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>操作日志</CardTitle>
                <CardDescription>
                  共 {filteredLogs.length} 条记录
                  {(logType !== 'all' || searchQuery) && ` (已筛选)`}
                </CardDescription>
              </div>
              <div className="flex gap-3">
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-[120px]">
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
                  <SelectTrigger className="w-[120px]">
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
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    className="pl-9 w-[200px]"
                    placeholder="搜索日志..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {filteredLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getTypeBadge(log.type)}
                      <Badge variant="outline">{log.module}</Badge>
                      <span className="font-medium">{log.action}</span>
                      {getStatusBadge(log.status)}
                    </div>
                    <span className="text-sm text-gray-500">{log.time}</span>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{log.detail}</p>

                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-gray-500">操作人</p>
                        <p className="font-medium">{log.user}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-gray-500">IP地址</p>
                        <p className="font-medium font-mono">{log.ip}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4" />
                      <div>
                        <p className="text-gray-500">位置</p>
                        <p className="font-medium">{log.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4" />
                      <div>
                        <p className="text-gray-500">耗时</p>
                        <p className="font-medium">{log.duration}</p>
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
      <Card>
        <CardHeader>
          <CardTitle>日志保留策略</CardTitle>
          <CardDescription>系统日志的存储和清理规则</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">操作日志</p>
              <p className="text-2xl font-bold text-blue-600 mb-1">90天</p>
              <p className="text-sm text-gray-500">超���90天的日志将自动归档</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">登录日志</p>
              <p className="text-2xl font-bold text-green-600 mb-1">180天</p>
              <p className="text-sm text-gray-500">超过180天的日志将自动归档</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">系统日志</p>
              <p className="text-2xl font-bold text-purple-600 mb-1">365天</p>
              <p className="text-sm text-gray-500">超过1年的日志将自动归档</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <span className="font-medium">提示：</span>
              归档的日志将压缩存储，如需查询请联系系统管理员。建议定期导出重要日志进行备份。
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 数据更新时间 */}
      <div className="text-center text-sm text-gray-500">
        日志实时记录 | 最后刷新时间：2026-01-20 16:00:00
      </div>
    </div>
  );
}
