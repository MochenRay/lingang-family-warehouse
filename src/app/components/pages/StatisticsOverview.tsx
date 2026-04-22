import { useState, useEffect } from 'react';
import { Users, Home, Activity, Database, ArrowRight, AlertTriangle, Loader2, Sparkles, Smartphone, MapPinned, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import {
  PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { statsRepository, type DashboardStatsResponse } from '../../services/repositories/statsRepository';
import { toast } from 'sonner';

// Custom Tooltip for dark mode
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1f2937] border border-gray-700 p-2 rounded shadow-lg text-xs text-white">
        <p className="font-medium mb-1">{label}</p>
        <p style={{ color: payload[0]?.color || payload[0]?.fill || '#3b82f6' }}>
          数值: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

interface StatisticsOverviewProps {
  onRouteChange?: (route: string) => void;
}

export function StatisticsOverview({ onRouteChange }: StatisticsOverviewProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedRange, setSelectedRange] = useState<'week' | 'month' | 'quarter'>('month');
  const [totalPopulation, setTotalPopulation] = useState(0);
  const [totalHouses, setTotalHouses] = useState(0);
  const [genderData, setGenderData] = useState<{name: string, value: number, color: string}[]>([]);
  const [ageData, setAgeData] = useState<{name: string, value: number, fill: string}[]>([]);
  const [riskTagsSummary, setRiskTagsSummary] = useState<{name: string, count: number, level: string, delta: string}[]>([]);
  const [trendData, setTrendData] = useState<{month: string, value: number}[]>([]);
  const [dataCompleteness, setDataCompleteness] = useState(0);
  const [gridCoverage, setGridCoverage] = useState(0);
  const [gridItems, setGridItems] = useState<DashboardStatsResponse['grids']>([]);
  const [conflictStats, setConflictStats] = useState<DashboardStatsResponse['conflictStats'] | null>(null);
  const [visitCount, setVisitCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const handleExportReport = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      range: selectedRange,
      summary: {
        totalPopulation,
        totalHouses,
        dataCompleteness,
        gridCoverage,
        visitCount,
        conflictStats,
      },
      grids: gridItems,
      riskTagsSummary,
      trendData,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lingang-dashboard-${selectedRange}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success('驾驶舱快照已导出');
  };

  useEffect(() => {
    // Force a small delay to ensure container size is calculated
    const timer = setTimeout(() => {
      setMounted(true);
    }, 100);

    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const dashboard = await statsRepository.getDashboard(selectedRange);
        if (!active) {
          return;
        }

        setTotalPopulation(dashboard.totalPopulation);
        setTotalHouses(dashboard.totalHouses);
        setTrendData(dashboard.trendData);
        setGenderData(dashboard.genderData);
        setAgeData(dashboard.ageData);
        setRiskTagsSummary(dashboard.riskTagsSummary);
        setDataCompleteness(dashboard.housingStats.completionRate);
        setGridCoverage(dashboard.metadata.totalGrids > 0 ? 100 : 0);
        setGridItems(dashboard.grids);
        setConflictStats(dashboard.conflictStats);
        setVisitCount(dashboard.metadata.totalVisits);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();
    const handleDbChange = () => {
      void load();
    };

    window.addEventListener('db-change', handleDbChange);
    return () => {
      active = false;
      clearTimeout(timer);
      window.removeEventListener('db-change', handleDbChange);
    };
  }, [selectedRange]);

  const coreMetrics = [
    { label: "总人口数", value: totalPopulation, unit: "人", note: "当前在册人口", icon: Users, color: "text-blue-400", bg: "bg-[var(--color-neutral-02)]", iconBg: "bg-[var(--color-neutral-03)]" },
    { label: "房屋总数", value: totalHouses, unit: "套", note: "当前台账房屋", icon: Home, color: "text-indigo-400", bg: "bg-[var(--color-neutral-02)]", iconBg: "bg-[var(--color-neutral-03)]" },
    { label: "网格覆盖率", value: gridCoverage, unit: "%", note: `已纳入 ${gridCoverage > 0 ? '统一网格骨架' : '待补充'}`, icon: Activity, color: "text-green-400", bg: "bg-[var(--color-neutral-02)]", iconBg: "bg-[var(--color-neutral-03)]" },
    { label: "数据完整度", value: dataCompleteness, unit: "%", note: "房屋基础字段完成度", icon: Database, color: "text-orange-400", bg: "bg-[var(--color-neutral-02)]", iconBg: "bg-[var(--color-neutral-03)]" },
  ];

  const dashboardPressure = [...riskTagsSummary].sort((left, right) => right.count - left.count);
  const highestPressureTag = dashboardPressure[0];
  const secondaryPressureTag = dashboardPressure[1];
  const busiestGrid = [...gridItems].sort(
    (left, right) => (right.conflictCount + right.visitCount) - (left.conflictCount + left.visitCount),
  )[0];
  const aiSummary = [
    highestPressureTag
      ? `当前 ${highestPressureTag.count} 名${highestPressureTag.name}对象需要优先关注。`
      : '当前暂无重点标签异常波动。',
    secondaryPressureTag
      ? `${secondaryPressureTag.name} 紧随其后，建议与人口画像页联动筛查。`
      : '风险标签分布相对平稳，可继续观察。',
    `现有 ${totalPopulation} 名人口、${totalHouses} 套房屋、累计 ${visitCount} 次走访已纳入统一台账，移动端可直接承接一线核查。`,
  ];

  const routeCards = [
    {
      title: '特征分析',
      description: '学历、职业、户籍地等详细画像分析。',
      icon: Users,
      iconColor: 'text-blue-400',
      arrowColor: 'text-blue-400',
      route: 'demographics-analysis',
    },
    {
      title: '标签画像',
      description: '重点标签分层与高关注人群筛查。',
      icon: Activity,
      iconColor: 'text-indigo-400',
      arrowColor: 'text-indigo-400',
      route: 'population-tags',
    },
    {
      title: '空间可视化',
      description: '查看网格热力分布与风险落点。',
      icon: MapPinned,
      iconColor: 'text-green-400',
      arrowColor: 'text-green-400',
      route: 'heatmap',
    },
    {
      title: '报表中心',
      description: '导出月报、专报与阶段性分析。',
      icon: Database,
      iconColor: 'text-orange-400',
      arrowColor: 'text-orange-400',
      route: 'data-reports',
    },
  ];

  const recommendedJourney = [
    {
      step: '01',
      title: '先看驾驶舱',
      detail: '先建立辖区全景、风险压力和执行重点的第一印象。',
      action: '留在当前页',
      route: 'statistics-overview',
    },
    {
      step: '02',
      title: '再看人口与房屋',
      detail: '从画像、标签、人房关系切入，理解对象和空间怎么被治理。',
      action: '进入人口管理',
      route: 'population',
    },
    {
      step: '03',
      title: '再看矛盾处置',
      detail: '这里最容易体现 AI 如何参与判断、推进和回访闭环。',
      action: '进入矛盾调解',
      route: 'conflict-management',
    },
    {
      step: '04',
      title: '最后体验移动端',
      detail: '把管理端看到的重点对象和待办，落到一线执行工作台。',
      action: '打开移动端',
      route: 'mobile',
    },
  ];

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 顶部标题与操作 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">综合统计驾驶舱</h1>
          <p className="text-muted-foreground">网格治理智能中台的主入口。当前为公网在线演示环境，无需登录，建议先从这里建立全景，再进入人口、房屋、矛盾和移动端主链。</p>
        </div>
        <div className="flex gap-2">
           <Button onClick={() => onRouteChange?.('mobile')}>体验移动端主链</Button>
           <Select value={selectedRange} onValueChange={(value) => setSelectedRange(value as 'week' | 'month' | 'quarter')}>
             <SelectTrigger className="w-[120px]">
               <SelectValue placeholder="时间范围" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="week">本周</SelectItem>
               <SelectItem value="month">本月</SelectItem>
               <SelectItem value="quarter">本季度</SelectItem>
             </SelectContent>
           </Select>
           <Button variant="outline" onClick={handleExportReport}>导出驾驶舱快照</Button>
        </div>
      </div>

      <Card className="overflow-hidden border border-[rgba(78,134,223,0.22)] bg-[linear-gradient(135deg,rgba(39,97,203,0.08),rgba(78,134,223,0.02))]">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 xl:grid-cols-[1.15fr,1fr]">
            <div className="border-b border-[rgba(78,134,223,0.14)] px-6 py-6 xl:border-b-0 xl:border-r">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#2761CB]">
                <Sparkles className="w-4 h-4" />
                推荐浏览路径
              </div>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--color-neutral-11)]">
                第一次打开，建议按这条线看完整个 Demo
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-neutral-08)]">
                这不是一个靠单页炫技的作品，而是一套“驾驶舱判断 → 对象台账 → 处置闭环 → 移动端执行”的治理工作流。先看主链，再去点第二圈和示例页，理解成本最低。
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button onClick={() => onRouteChange?.('population')}>
                  从人口管理开始
                </Button>
                <Button variant="outline" onClick={() => onRouteChange?.('mobile')}>
                  直接体验移动端
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2">
              {recommendedJourney.map((item, index) => (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => onRouteChange?.(item.route)}
                  className={`group flex flex-col items-start gap-3 px-5 py-5 text-left transition-colors hover:bg-[rgba(255,255,255,0.52)] ${
                    index % 2 === 0 ? 'md:border-r border-[rgba(78,134,223,0.12)]' : ''
                  } ${index < 2 ? 'border-b border-[rgba(78,134,223,0.12)]' : ''}`}
                >
                  <div className="inline-flex items-center rounded-full border border-[rgba(39,97,203,0.18)] bg-white/70 px-2.5 py-1 text-xs font-semibold text-[#2761CB]">
                    {item.step}
                  </div>
                  <div>
                    <div className="text-base font-semibold text-[var(--color-neutral-11)]">{item.title}</div>
                    <div className="mt-1 text-sm leading-6 text-[var(--color-neutral-08)]">{item.detail}</div>
                  </div>
                  <div className="inline-flex items-center gap-1 text-sm font-medium text-[#2761CB]">
                    {item.action}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 1. 核心指标卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {coreMetrics.map((metric, i) => (
          <Card key={i} className="border border-[var(--color-neutral-03)]">
            <CardContent className={`p-6 flex items-center justify-between ${metric.bg}`}>
              <div>
                <p className="text-sm font-medium text-[var(--color-neutral-08)]">{metric.label}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-bold text-[var(--color-neutral-11)]">{metric.value.toLocaleString()}</span>
                  <span className="text-xs text-[var(--color-neutral-08)]">{metric.unit}</span>
                </div>
                <div className="mt-2 text-xs text-[var(--color-neutral-07)] font-medium">
                  {metric.note}
                </div>
              </div>
              <div className={`p-3 rounded-lg ${metric.iconBg}`}>
                <metric.icon className={`w-5 h-5 ${metric.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 border border-[var(--color-neutral-03)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#4E86DF]" />
              AI 治理摘要
            </CardTitle>
            <CardDescription>基于当前统一台账自动生成的重点提示与执行建议。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {aiSummary.map((item, index) => (
              <div key={index} className="rounded-lg border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] px-4 py-3 text-sm text-[var(--color-neutral-10)]">
                {item}
              </div>
            ))}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="outline" onClick={() => onRouteChange?.('population-tags')}>
                查看重点标签
              </Button>
              <Button variant="outline" onClick={() => onRouteChange?.('conflict-management')}>
                查看矛盾调解
              </Button>
              <Button onClick={() => onRouteChange?.('mobile')}>
                去移动端执行
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[var(--color-neutral-03)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-orange-400" />
              当期治理焦点
            </CardTitle>
            <CardDescription>优先关注风险、人群与移动端执行入口。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] p-4">
              <div className="text-xs text-[var(--color-neutral-08)] mb-1">重点标签</div>
              <div className="text-lg font-semibold text-[var(--color-neutral-11)]">
                {highestPressureTag ? `${highestPressureTag.name} ${highestPressureTag.count} 人` : '暂无异常波动'}
              </div>
            </div>
            <div className="rounded-lg border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] p-4">
              <div className="text-xs text-[var(--color-neutral-08)] mb-1">矛盾压力</div>
              <div className="text-lg font-semibold text-[var(--color-neutral-11)]">
                当前待化解 {conflictStats?.active ?? 0} 起矛盾
              </div>
              <div className="text-xs text-[var(--color-neutral-08)] mt-1">
                建议联动矛盾调解与移动端任务清单处理。
              </div>
            </div>
            <div className="rounded-lg border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] p-4">
              <div className="text-xs text-[var(--color-neutral-08)] mb-1">重点网格</div>
              <div className="text-lg font-semibold text-[var(--color-neutral-11)]">
                {busiestGrid ? busiestGrid.name : '暂无重点网格'}
              </div>
              <div className="text-xs text-[var(--color-neutral-08)] mt-1">
                {busiestGrid
                  ? `走访 ${busiestGrid.visitCount} 次，矛盾 ${busiestGrid.conflictCount} 起。`
                  : '等待网格统计汇总。'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onRouteChange?.('mobile')}
              className="w-full rounded-lg border border-[rgba(78,134,223,0.25)] bg-[rgba(78,134,223,0.08)] px-4 py-3 text-left transition-colors hover:bg-[rgba(78,134,223,0.12)]"
            >
              <div className="flex items-center gap-2 text-[var(--color-neutral-11)] font-semibold">
                <Smartphone className="w-4 h-4 text-[#4E86DF]" />
                移动端工作台
              </div>
              <div className="mt-1 text-xs text-[var(--color-neutral-08)]">
                从驾驶舱直接进入移动端执行链路。
              </div>
            </button>
          </CardContent>
        </Card>
      </div>

      {/* 2. 主图表区域：人口结构与趋势 */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        
        {/* 左侧：人口增长趋势 (占据 4/7) */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>人口总量变化趋势</CardTitle>
            <CardDescription>近半年辖区常住人口变动情况</CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[300px] w-full" style={{ minHeight: '300px' }}>
            {mounted ? (
            <ResponsiveContainer width="100%" height="100%" debounce={50} minWidth={0}>
              <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPop" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF'}} />
                <YAxis axisLine={false} tickLine={false} domain={['dataMin - 5', 'auto']} tick={{fill: '#9CA3AF'}} />
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#374151" />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPop)" />
              </AreaChart>
            </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-full text-gray-500">加载中...</div>}
            </div>
          </CardContent>
        </Card>

        {/* 右侧：人口结构 (性别/年龄) (占据 3/7) */}
        <Card className="lg:col-span-3">
          <CardHeader>
             <CardTitle>人口结构分布</CardTitle>
             <CardDescription>性别与年龄段构成分析</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="flex flex-col">
                {/* 性别分布 - 环形图 */}
                <div className="h-[180px] relative">
                     {mounted && totalPopulation > 0 ? (
                     <ResponsiveContainer width="100%" height="100%" debounce={50} minWidth={0}>
                        <PieChart>
                          <Pie
                            data={genderData}
                            innerRadius={45}
                            outerRadius={65}
                            paddingAngle={5}
                            dataKey="value"
                            cy="50%"
                          >
                            {genderData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                     </ResponsiveContainer>
                     ) : <div className="flex items-center justify-center h-full text-gray-500">暂无数据</div>}
                     
                     {/* Center Label */}
                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                       <div className="text-center">
                         <div className="text-2xl font-bold">{totalPopulation}</div>
                         <div className="text-xs text-gray-400">总人数</div>
                       </div>
                     </div>
                </div>

                {/* Legend */}
                <div className="flex justify-center gap-6 text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-gray-300">男性 {genderData[0]?.value || 0}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                        <span className="text-gray-300">女性 {genderData[1]?.value || 0}</span>
                      </div>
                   </div>

                {/* 年龄分布 - 简单的条形图 */}
                <div className="space-y-3 px-2">
                   {ageData.map((item, idx) => (
                     <div key={idx} className="space-y-1">
                       <div className="flex justify-between text-xs text-gray-400">
                         <span>{item.name}</span>
                         <span>{item.value}人 ({totalPopulation > 0 ? ((item.value / totalPopulation) * 100).toFixed(0) : 0}%)</span>
                       </div>
                       <div className="h-1.5 w-full bg-gray-700/30 rounded-full overflow-hidden">
                         <div 
                           className="h-full rounded-full transition-all duration-500" 
                           style={{ width: `${totalPopulation > 0 ? (item.value / totalPopulation) * 100 : 0}%`, backgroundColor: item.fill }}
                         ></div>
                       </div>
                     </div>
                   ))}
                </div>
             </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. 重点风险概览 & 快速入口 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* 标签风险概览 - 列表式 */}
         <Card>
           <CardHeader className="pb-2">
             <div className="flex items-center justify-between">
               <CardTitle className="text-base font-medium flex items-center gap-2">
                 <AlertTriangle className="w-4 h-4 text-orange-500" />
                 重点关注人群动态
               </CardTitle>
               <Button variant="ghost" size="sm" className="text-xs" onClick={() => onRouteChange?.('population-tags')}>
                  查看全部 &rarr;
               </Button>
             </div>
           </CardHeader>
           <CardContent>
             <div className="space-y-1">
               {riskTagsSummary.map((tag, i) => (
                 <div key={i} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0 hover:bg-slate-800/50 px-2 rounded transition-colors">
                   <div className="flex items-center gap-3">
                     <Badge variant={tag.level === '高' ? 'destructive' : (tag.level === '中' ? 'default' : 'secondary')} className="w-12 justify-center text-xs">
                       {tag.level}风险
                     </Badge>
                     <span className="font-medium text-sm text-gray-300">{tag.name}</span>
                   </div>
                   <div className="flex items-center gap-4">
                     <span className="font-bold">{tag.count} 人</span>
                     <span className={`text-xs w-8 text-right ${tag.delta.startsWith('+') ? 'text-red-500' : 'text-green-500'}`}>
                       {tag.delta === '0' ? '-' : tag.delta}
                     </span>
                   </div>
                 </div>
               ))}
               {riskTagsSummary.length === 0 && <div className="text-center text-gray-500 py-4">暂无风险标签数据</div>}
             </div>
           </CardContent>
         </Card>

         {/* 快捷统计入口 - 引导式 */}
         <Card>
           <CardHeader>
             <CardTitle className="text-base font-medium">深度分析入口</CardTitle>
             <CardDescription>进入专项模块查看更详细的数据维度</CardDescription>
           </CardHeader>
           <CardContent>
             <div className="grid grid-cols-2 gap-4">
               {routeCards.map((card) => (
                 <div
                   key={card.route}
                   className="p-4 border border-[var(--color-neutral-03)] rounded-lg bg-[var(--color-neutral-02)] hover:bg-[var(--color-neutral-03)] cursor-pointer transition-colors group"
                   onClick={() => onRouteChange?.(card.route)}
                 >
                   <div className="flex items-center gap-2 mb-2">
                     <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                     <span className="font-semibold text-[var(--color-neutral-11)]">{card.title}</span>
                   </div>
                   <p className="text-xs text-[var(--color-neutral-08)]">{card.description}</p>
                   <ArrowRight className={`w-4 h-4 mt-2 opacity-0 group-hover:opacity-100 transition-opacity ${card.arrowColor}`} />
                 </div>
               ))}
             </div>
           </CardContent>
         </Card>
      </div>
    </div>
  );
}
