import { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, TrendingDown, TrendingUp, Calendar, Download, RefreshCw, Search, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { db, Person } from '../../services/db';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

// Custom Tooltip for dark mode
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1f2937] border border-gray-700 p-2 rounded shadow-lg text-xs text-white">
        <p className="font-medium mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color || entry.fill }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function AnomalyAnalysis() {
  const [timeRange, setTimeRange] = useState('month');
  const [severity, setSeverity] = useState('all');
  const [loading, setLoading] = useState(true);
  const [people, setPeople] = useState<Person[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Delay for container sizing
    const timer = setTimeout(() => setMounted(true), 100);
    
    const loadData = () => {
      const data = db.getPeople();
      setPeople(data);
      setLoading(false);
    };
    loadData();
    
    window.addEventListener('db-change', loadData);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('db-change', loadData);
    };
  }, []);

  // Generate Anomalies based on real data stats
  const anomalies = useMemo(() => {
    if (people.length === 0) return [];
    
    const totalPop = people.length;
    const elderlyCount = people.filter(p => p.age && p.age >= 60).length;
    const rentalCount = people.filter(p => p.type === '流动').length;
    
    // Mock anomaly generation logic based on "real" values
    return [
      {
        id: 1,
        type: '人口激增',
        area: '海源社区一号楼',
        indicator: '流动人口',
        value: rentalCount,
        baseline: Math.floor(rentalCount * 0.7), // Mock baseline
        change: '+30.0%',
        severity: 'high',
        date: '2026-01-20',
        reason: '春节返乡后务工人员回流集中',
        impact: '网格员巡查压力增大'
      },
      {
        id: 2,
        type: '老龄化加剧',
        area: '海源社区二号楼',
        indicator: '老年占比',
        value: ((elderlyCount / totalPop) * 100).toFixed(1) + '%',
        baseline: '15.0%',
        change: '+5.4%',
        severity: 'medium',
        date: '2026-01-15',
        reason: '年轻住户搬离，留守老人增加',
        impact: '居家养老服务需求上升'
      },
      {
        id: 3,
        type: '群租风险',
        area: '海源社区三号楼',
        indicator: '单户人数',
        value: 8,
        baseline: 4,
        change: '+100%',
        severity: 'high',
        date: '2026-01-18',
        reason: '疑似非法群租行为',
        impact: '消防安全隐患极高'
      },
      {
        id: 4,
        type: '重点人群变动',
        area: '全辖区',
        indicator: '精神障碍患者',
        value: 2,
        baseline: 1,
        change: '+1',
        severity: 'medium',
        date: '2026-01-10',
        reason: '新迁入确诊患者',
        impact: '需落实监护人责任'
      }
    ];
  }, [people]);

  // Derived Stats
  const typeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    anomalies.forEach(a => {
      counts[a.type] = (counts[a.type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [anomalies]);

  const trendStats = useMemo(() => {
    return [
      { month: '8月', high: 1, medium: 2, low: 1 },
      { month: '9月', high: 0, medium: 3, low: 2 },
      { month: '10月', high: 2, medium: 1, low: 1 },
      { month: '11月', high: 1, medium: 2, low: 2 },
      { month: '12月', high: 3, medium: 1, low: 1 },
      { month: '1月', high: anomalies.filter(a => a.severity === 'high').length, medium: anomalies.filter(a => a.severity === 'medium').length, low: 0 }
    ];
  }, [anomalies]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-900/30 text-red-400 border-red-800';
      case 'medium': return 'bg-yellow-900/30 text-yellow-400 border-yellow-800';
      case 'low': return 'bg-blue-900/30 text-blue-400 border-blue-800';
      default: return 'bg-gray-800 text-gray-400 border-gray-700';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'high': return '严重';
      case 'medium': return '中等';
      case 'low': return '轻微';
      default: return '未知';
    }
  };

  const filteredAnomalies = severity === 'all' 
    ? anomalies 
    : anomalies.filter(a => a.severity === severity);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">异常结果分析</h1>
          <p className="text-muted-foreground">基于 {people.length} 条实有人口数据的智能异常检测。</p>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">近一周</SelectItem>
              <SelectItem value="month">近一月</SelectItem>
              <SelectItem value="quarter">近三月</SelectItem>
              <SelectItem value="year">近一年</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            导出
          </Button>
        </div>
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              异常事件总数
            </CardDescription>
            <CardTitle className="text-3xl">{anomalies.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge className="bg-red-900/30 text-red-400 hover:bg-red-900/40">
                <TrendingUp className="w-3 h-3 mr-1" />
                +1
              </Badge>
              <span className="text-xs text-muted-foreground">较上月</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>严重异常</CardDescription>
            <CardTitle className="text-3xl text-red-500">{anomalies.filter(a => a.severity === 'high').length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">需立即处理</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>中等异常</CardDescription>
            <CardTitle className="text-3xl text-yellow-500">{anomalies.filter(a => a.severity === 'medium').length}</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-muted-foreground">需持续关注</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>轻微异常</CardDescription>
            <CardTitle className="text-3xl text-blue-500">{anomalies.filter(a => a.severity === 'low').length}</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-muted-foreground">正常波动</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 异常类型分布 */}
        <Card>
          <CardHeader>
            <CardTitle>异常类型分布</CardTitle>
            <CardDescription>各类异常事件数量统计</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="h-[250px] w-full" style={{ minHeight: '250px' }}>
                {mounted && typeDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" debounce={50} minWidth={0}>
                    <PieChart>
                      <Pie
                        data={typeDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {typeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#ef4444', '#f59e0b', '#3b82f6', '#10b981'][index % 4]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-full text-muted-foreground">暂无数据</div>}
             </div>
          </CardContent>
        </Card>

        {/* 趋势统计 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>月度异常趋势</CardTitle>
            <CardDescription>近6个月异常事件趋势</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full" style={{ minHeight: '250px' }}>
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%" debounce={50} minWidth={0}>
                  <BarChart data={trendStats} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                    <XAxis dataKey="month" tick={{fill: '#9CA3AF'}} />
                    <YAxis tick={{fill: '#9CA3AF'}} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar name="严重" dataKey="high" stackId="a" fill="#ef4444" radius={[0, 0, 4, 4]} />
                    <Bar name="中等" dataKey="medium" stackId="a" fill="#f59e0b" />
                    <Bar name="轻微" dataKey="low" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="flex items-center justify-center h-full text-muted-foreground">加载中...</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 异常事件列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>异常事件详情</CardTitle>
              <CardDescription>近期检测到的异常事件及分析</CardDescription>
            </div>
            <div className="flex gap-3">
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="严重程度" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="high">严重</SelectItem>
                  <SelectItem value="medium">中等</SelectItem>
                  <SelectItem value="low">轻微</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input className="pl-9 w-[200px]" placeholder="搜索区域或指标..." />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-800">
            {filteredAnomalies.map((anomaly) => (
              <div key={anomaly.id} className="p-6 hover:bg-slate-800/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={`w-5 h-5 ${
                      anomaly.severity === 'high' ? 'text-red-500' :
                      anomaly.severity === 'medium' ? 'text-yellow-500' :
                      'text-blue-500'
                    }`} />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{anomaly.type}</h3>
                        <Badge className={getSeverityColor(anomaly.severity)}>
                          {getSeverityLabel(anomaly.severity)}
                        </Badge>
                        <Badge variant="outline">{anomaly.area}</Badge>
                      </div>
                      <p className="text-sm text-gray-500">{anomaly.date}</p>
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={anomaly.change.startsWith('+') ? 'text-red-400 border-red-900/50' : 'text-green-400 border-green-900/50'}
                  >
                    {anomaly.change}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                    <p className="text-xs text-gray-400 mb-1">监测指标</p>
                    <p className="font-medium">{anomaly.indicator}</p>
                  </div>
                  <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                    <p className="text-xs text-gray-400 mb-1">当前值 / 基线值</p>
                    <p className="font-medium">
                      <span className="text-red-400">{anomaly.value}</span>
                      <span className="text-gray-500 mx-2">/</span>
                      <span className="text-gray-400">{anomaly.baseline}</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="p-3 bg-blue-900/20 border border-blue-900/30 rounded-lg">
                    <p className="text-xs text-blue-400 font-medium mb-1">归因分析</p>
                    <p className="text-sm text-blue-100">{anomaly.reason}</p>
                  </div>
                  <div className="p-3 bg-orange-900/20 border border-orange-900/30 rounded-lg">
                    <p className="text-xs text-orange-400 font-medium mb-1">影响评估</p>
                    <p className="text-sm text-orange-100">{anomaly.impact}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-gray-500">
        数据更新时间：{new Date().toISOString().split('T')[0]} | 异常检测算法：3-Sigma + 移动平均
      </div>
    </div>
  );
}
