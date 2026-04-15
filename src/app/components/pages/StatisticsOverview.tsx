import { useState, useEffect } from 'react';
import { Users, Home, TrendingUp, Activity, Database, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import {
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { statsRepository } from '../../services/repositories/statsRepository';

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

export function StatisticsOverview() {
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
  const [loading, setLoading] = useState(true);

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
    { label: "总人口数", value: totalPopulation, unit: "人", trend: "+2.3%", icon: Users, color: "text-blue-400", bg: "bg-[var(--color-neutral-02)]", iconBg: "bg-[var(--color-neutral-03)]" },
    { label: "房屋总数", value: totalHouses, unit: "套", trend: "+1.5%", icon: Home, color: "text-indigo-400", bg: "bg-[var(--color-neutral-02)]", iconBg: "bg-[var(--color-neutral-03)]" },
    { label: "网格覆盖率", value: gridCoverage, unit: "%", trend: "+0.5%", icon: Activity, color: "text-green-400", bg: "bg-[var(--color-neutral-02)]", iconBg: "bg-[var(--color-neutral-03)]" },
    { label: "数据完整度", value: dataCompleteness, unit: "%", trend: "优", icon: Database, color: "text-orange-400", bg: "bg-[var(--color-neutral-02)]", iconBg: "bg-[var(--color-neutral-03)]" },
  ];

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 顶部标题与操作 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">综合统计驾驶舱</h1>
          <p className="text-muted-foreground">辖区人口、房屋及风险态势的一站式数据概览。</p>
        </div>
        <div className="flex gap-2">
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
           <Button variant="outline">导出报表</Button>
        </div>
      </div>

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
                <div className="flex items-center gap-1 mt-2 text-xs text-green-400 font-medium">
                   <TrendingUp className="w-3 h-3" />
                   {metric.trend} <span className="text-[var(--color-neutral-06)] font-normal">较上期</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${metric.iconBg}`}>
                <metric.icon className={`w-5 h-5 ${metric.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
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
               <Button variant="ghost" size="sm" className="text-xs" asChild>
                  <a href="/population-tags">查看全部 &rarr;</a>
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
               <div className="p-4 border border-[var(--color-neutral-03)] rounded-lg bg-[var(--color-neutral-02)] hover:bg-[var(--color-neutral-03)] cursor-pointer transition-colors group" onClick={() => window.location.href = '/demographics-analysis'}>
                 <div className="flex items-center gap-2 mb-2">
                   <Users className="w-5 h-5 text-blue-400" />
                   <span className="font-semibold text-[var(--color-neutral-11)]">特征分析</span>
                 </div>
                 <p className="text-xs text-[var(--color-neutral-08)]">学历、职业、户籍地等详细画像分析。</p>
                 <ArrowRight className="w-4 h-4 text-blue-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
               </div>

               <div className="p-4 border border-[var(--color-neutral-03)] rounded-lg bg-[var(--color-neutral-02)] hover:bg-[var(--color-neutral-03)] cursor-pointer transition-colors group" onClick={() => window.location.href = '/population-tags'}>
                 <div className="flex items-center gap-2 mb-2">
                   <Activity className="w-5 h-5 text-indigo-400" />
                   <span className="font-semibold text-[var(--color-neutral-11)]">标签画像</span>
                 </div>
                 <p className="text-xs text-[var(--color-neutral-08)]">142类标签交叉分析与人群圈选。</p>
                 <ArrowRight className="w-4 h-4 text-indigo-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
               </div>

               <div className="p-4 border border-[var(--color-neutral-03)] rounded-lg bg-[var(--color-neutral-02)] hover:bg-[var(--color-neutral-03)] cursor-pointer transition-colors group" onClick={() => window.location.href = '/heatmap'}>
                 <div className="flex items-center gap-2 mb-2">
                   <Home className="w-5 h-5 text-green-400" />
                   <span className="font-semibold text-[var(--color-neutral-11)]">空间可视化</span>
                 </div>
                 <p className="text-xs text-[var(--color-neutral-08)]">基于地图的网格热力图与房屋落点。</p>
                 <ArrowRight className="w-4 h-4 text-green-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
               </div>

               <div className="p-4 border border-[var(--color-neutral-03)] rounded-lg bg-[var(--color-neutral-02)] hover:bg-[var(--color-neutral-03)] cursor-pointer transition-colors group" onClick={() => window.location.href = '/data-reports'}>
                 <div className="flex items-center gap-2 mb-2">
                   <Database className="w-5 h-5 text-orange-400" />
                   <span className="font-semibold text-[var(--color-neutral-11)]">报表中心</span>
                 </div>
                 <p className="text-xs text-[var(--color-neutral-08)]">生成月报、专报及历史数据导出。</p>
                 <ArrowRight className="w-4 h-4 text-orange-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
               </div>
             </div>
           </CardContent>
         </Card>
      </div>
    </div>
  );
}
