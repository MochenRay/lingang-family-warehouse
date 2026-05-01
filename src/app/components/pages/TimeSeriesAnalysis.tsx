import { useEffect, useState } from 'react';
import { Calendar, TrendingUp, Download, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Area,
  ComposedChart,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { ChartCard } from '../statistics/ChartCard';
import { DARK_TOOLTIP_CURSOR, DarkChartTooltip } from '../statistics/DarkChartTooltip';
import { PageHeader } from './PageHeader';

const PANEL_CLASS = 'rounded-lg border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)] shadow-none';
const INNER_PANEL_CLASS = 'rounded-lg border border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)]';
const MUTED_TEXT = 'text-[var(--color-neutral-08)]';
const GRID_STROKE = '#3d4663';
const AXIS_TICK = { fill: '#6b7599', fontSize: 12 };
const TAB_TRIGGER_CLASS = 'data-[state=active]:bg-[#2761CB] data-[state=active]:text-white text-[var(--color-neutral-08)]';

export function TimeSeriesAnalysis() {
  const [mounted, setMounted] = useState(false);
  const [indicator, setIndicator] = useState('population');
  const [granularity, setGranularity] = useState('month');

  useEffect(() => {
    setMounted(true);
  }, []);

  // 时序数据 - 人口总数
  const populationTimeSeries = [
    { time: '2025-01', value: 5120, trend: 5120, seasonality: 0, residual: 0 },
    { time: '2025-02', value: 5135, trend: 5130, seasonality: -10, residual: 15 },
    { time: '2025-03', value: 5158, trend: 5140, seasonality: 12, residual: 6 },
    { time: '2025-04', value: 5165, trend: 5150, seasonality: -5, residual: 20 },
    { time: '2025-05', value: 5182, trend: 5160, seasonality: 8, residual: 14 },
    { time: '2025-06', value: 5195, trend: 5170, seasonality: 5, residual: 20 },
    { time: '2025-07', value: 5208, trend: 5180, seasonality: -2, residual: 30 },
    { time: '2025-08', value: 5215, trend: 5190, seasonality: 3, residual: 22 },
    { time: '2025-09', value: 5220, trend: 5200, seasonality: -8, residual: 28 },
    { time: '2025-10', value: 5228, trend: 5210, seasonality: 2, residual: 16 },
    { time: '2025-11', value: 5232, trend: 5220, seasonality: -3, residual: 15 },
    { time: '2025-12', value: 5234, trend: 5230, seasonality: 5, residual: -1 }
  ];

  // 预测数据 (未来6个月)
  const forecastData = [
    ...populationTimeSeries.map(d => ({ ...d, type: 'history' })),
    { time: '2025-01', value: 5245, type: 'forecast', range: [5230, 5260] },
    { time: '2025-02', value: 5258, type: 'forecast', range: [5240, 5275] },
    { time: '2025-03', value: 5270, type: 'forecast', range: [5250, 5290] },
    { time: '2025-04', value: 5285, type: 'forecast', range: [5260, 5310] },
    { time: '2025-05', value: 5300, type: 'forecast', range: [5270, 5330] },
    { time: '2025-06', value: 5315, type: 'forecast', range: [5280, 5350] },
  ];

  // 周期性规律
  const seasonalPatterns = [
    { pattern: '春节返乡高峰', period: '1-2月', description: '外出务工人员返乡，人口短期回流', impact: '+2.5%' },
    { pattern: '毕业季流动', period: '6-7月', description: '应届毕业生外出就业，年轻人口外流', impact: '-1.8%' },
    { pattern: '开学季增长', period: '8-9月', description: '外来学生入学，学龄人口增加', impact: '+1.2%' },
    { pattern: '年末稳定期', period: '11-12月', description: '人口流动趋缓，整体保持稳定', impact: '+0.3%' }
  ];

  // 趋势特征
  const trendFeatures = [
    { feature: '长期趋势', value: '稳步增长', rate: '+2.2%/年', description: '近年来保持温和增长态势' },
    { feature: '短期波动', value: '低波动', rate: '±0.5%', description: '月度波动幅度较小，人口基本稳定' },
    { feature: '增长速率', value: '放缓', rate: '0.15%/月', description: '增长速度逐步放缓，接近平稳期' },
    { feature: '预测趋势', value: '持续增长', rate: '+1.8%/年', description: '未来一年预计继续保持增长' }
  ];

  // 周期性分析指标
  const cyclicalMetrics = [
    { metric: '周期长度', value: '12个月', confidence: '95%' },
    { metric: '振幅大小', value: '±3.2%', confidence: '88%' },
    { metric: '相位偏移', value: '2个月', confidence: '92%' },
    { metric: '周期性强度', value: '中等', confidence: '85%' }
  ];

  // 雷达图数据
  const radarData = [
    { subject: '周期长度', A: 95, fullMark: 100 },
    { subject: '振幅大小', A: 88, fullMark: 100 },
    { subject: '相位偏移', A: 92, fullMark: 100 },
    { subject: '周期强度', A: 85, fullMark: 100 },
    { subject: '预测精度', A: 90, fullMark: 100 },
    { subject: '数据质量', A: 98, fullMark: 100 },
  ];

  // 自相关分析
  const autocorrelation = [
    { lag: 1, value: 0.92, label: '1个月' },
    { lag: 3, value: 0.78, label: '3个月' },
    { lag: 6, value: 0.65, label: '6个月' },
    { lag: 12, value: 0.45, label: '12个月' }
  ];

  return (
    <div className="space-y-5 text-[var(--color-neutral-10)]">
      <PageHeader
        eyebrow="TIME SERIES WORKBENCH"
        title="时序分析"
        description="观察人口、走访和风险指标的时间变化，识别持续恶化或改善趋势。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Select value={indicator} onValueChange={setIndicator}>
              <SelectTrigger className="w-[160px] border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)]">
                <Activity className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="population">总人口</SelectItem>
                <SelectItem value="floating">流动人口</SelectItem>
                <SelectItem value="elderly">老年人口</SelectItem>
                <SelectItem value="birth">出生人口</SelectItem>
              </SelectContent>
            </Select>
            <Select value={granularity} onValueChange={setGranularity}>
              <SelectTrigger className="w-[120px] border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">日度</SelectItem>
                <SelectItem value="week">周度</SelectItem>
                <SelectItem value="month">月度</SelectItem>
                <SelectItem value="quarter">季度</SelectItem>
              </SelectContent>
            </Select>
            <Button>
              <Download className="w-4 h-4 mr-2" />
              导出
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Card className={PANEL_CLASS}>
          <CardHeader className="pb-3">
            <CardDescription className={`flex items-center gap-2 ${MUTED_TEXT}`}>
              <TrendingUp className="w-4 h-4" />
              整体趋势
            </CardDescription>
            <CardTitle className="text-3xl text-white">稳步增长</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge className="border border-[#19B172]/35 bg-[#19B172]/12 text-[#B6F4D8]">
                +2.2%/年
              </Badge>
              <span className={`text-xs ${MUTED_TEXT}`}>增长率</span>
            </div>
          </CardContent>
        </Card>

        <Card className={PANEL_CLASS}>
          <CardHeader className="pb-3">
            <CardDescription className={MUTED_TEXT}>周期性强度</CardDescription>
            <CardTitle className="text-3xl text-white">中等</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-sm ${MUTED_TEXT}`}>
              振幅 ±3.2% | 周期 12个月
            </p>
          </CardContent>
        </Card>

        <Card className={PANEL_CLASS}>
          <CardHeader className="pb-3">
            <CardDescription className={MUTED_TEXT}>预测准确度</CardDescription>
            <CardTitle className="text-3xl text-[#19B172]">92.5%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-sm ${MUTED_TEXT}`}>
              基于ARIMA模型预测
            </p>
          </CardContent>
        </Card>

        <Card className={PANEL_CLASS}>
          <CardHeader className="pb-3">
            <CardDescription className={MUTED_TEXT}>数据完整度</CardDescription>
            <CardTitle className="text-3xl text-[#4E86DF]">98.8%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-sm ${MUTED_TEXT}`}>
              360个时间点
            </p>
          </CardContent>
        </Card>
      </div>

      <ChartCard title="时序分解分析" description="将时间序列分解为趋势、周期和残差三个组成部分">
        <Tabs defaultValue="original">
          <TabsList className="mb-4 flex h-auto flex-wrap justify-start gap-2 bg-[var(--color-neutral-01)] p-1">
            <TabsTrigger className={TAB_TRIGGER_CLASS} value="original">原始序列</TabsTrigger>
            <TabsTrigger className={TAB_TRIGGER_CLASS} value="trend">趋势分量</TabsTrigger>
            <TabsTrigger className={TAB_TRIGGER_CLASS} value="seasonal">周期分量</TabsTrigger>
            <TabsTrigger className={TAB_TRIGGER_CLASS} value="residual">残差分量</TabsTrigger>
          </TabsList>

          <TabsContent value="original">
            <div className="mb-4 h-72 w-full" style={{ minHeight: '288px' }}>
              {mounted && (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} aspect={undefined}>
                  <LineChart data={populationTimeSeries} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={AXIS_TICK} />
                    <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={AXIS_TICK} />
                    <Tooltip content={<DarkChartTooltip />} cursor={DARK_TOOLTIP_CURSOR} />
                    <Legend wrapperStyle={{ color: '#AFC0E8' }} />
                    <Line type="monotone" dataKey="value" name="人口总数" stroke="#4E86DF" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
              {populationTimeSeries.slice(-6).map((item) => (
                <div key={item.time} className={`${INNER_PANEL_CLASS} p-2 text-center`}>
                  <p className={`mb-1 text-xs ${MUTED_TEXT}`}>{item.time}</p>
                  <p className="font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="trend">
            <div className="mb-4 h-72 w-full" style={{ minHeight: '288px' }}>
              {mounted && (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} aspect={undefined}>
                  <LineChart data={populationTimeSeries} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={AXIS_TICK} />
                    <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={AXIS_TICK} />
                    <Tooltip content={<DarkChartTooltip />} cursor={DARK_TOOLTIP_CURSOR} />
                    <Legend wrapperStyle={{ color: '#AFC0E8' }} />
                    <Line type="monotone" dataKey="trend" name="趋势分量" stroke="#D6730D" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="rounded-lg border border-[#4E86DF]/35 bg-[#2761CB]/10 p-4">
              <p className="mb-2 text-sm font-medium text-[#DCE6FF]">趋势解读</p>
              <p className="text-sm leading-6 text-[#AFC0E8]">
                数据显示人口总数呈现稳定的上升趋势，平均每月增长约0.15%，年增长率约2.2%，符合区域经济发展规律。
              </p>
            </div>
          </TabsContent>

          <TabsContent value="seasonal">
            <div className="mb-4 h-72 w-full" style={{ minHeight: '288px' }}>
              {mounted && (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} aspect={undefined}>
                  <BarChart data={populationTimeSeries} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={AXIS_TICK} />
                    <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} />
                    <Tooltip content={<DarkChartTooltip />} cursor={DARK_TOOLTIP_CURSOR} />
                    <Legend wrapperStyle={{ color: '#AFC0E8' }} />
                    <Bar dataKey="seasonality" name="周期分量" fill="#19B172" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="rounded-lg border border-[#19B172]/35 bg-[#19B172]/10 p-4">
              <p className="mb-2 text-sm font-medium text-[#B6F4D8]">周期性特征</p>
              <p className="text-sm leading-6 text-[#AFC0E8]">
                明显的年度周期性特征：春节、毕业季、开学季均有显著人口波动，周期长度约12个月，振幅±3.2%。
              </p>
            </div>
          </TabsContent>

          <TabsContent value="residual">
            <div className="mb-4 h-72 w-full" style={{ minHeight: '288px' }}>
              {mounted && (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} aspect={undefined}>
                  <BarChart data={populationTimeSeries} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={AXIS_TICK} />
                    <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} />
                    <Tooltip content={<DarkChartTooltip />} cursor={DARK_TOOLTIP_CURSOR} />
                    <Legend wrapperStyle={{ color: '#AFC0E8' }} />
                    <Bar dataKey="residual" name="残差分量" fill="#D6730D" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="rounded-lg border border-[#D6730D]/35 bg-[#D6730D]/10 p-4">
              <p className="mb-2 text-sm font-medium text-[#FFD8A8]">残差分析</p>
              <p className="text-sm leading-6 text-[#AFC0E8]">
                残差部分较小且呈随机分布，说明模型拟合效果良好，没有明显的系统性偏差。
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </ChartCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className={PANEL_CLASS}>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-white">周期性规律识别</CardTitle>
            <CardDescription className={MUTED_TEXT}>识别出的主要周期性模式</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {seasonalPatterns.map((pattern, index) => (
                <div key={index} className={`${INNER_PANEL_CLASS} p-4`}>
                  <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="border border-[#4E86DF]/35 bg-[#2761CB]/15 text-[#DCE6FF]">{pattern.period}</Badge>
                      <span className="font-medium text-white">{pattern.pattern}</span>
                    </div>
                    <Badge variant="outline" className={pattern.impact.startsWith('+') ? 'border-[#19B172]/45 bg-[#19B172]/10 text-[#B6F4D8]' : 'border-[#D52132]/45 bg-[#D52132]/10 text-[#FFB4BE]'}>
                      {pattern.impact}
                    </Badge>
                  </div>
                  <p className={`text-sm ${MUTED_TEXT}`}>{pattern.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className={PANEL_CLASS}>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-white">趋势特征分析</CardTitle>
            <CardDescription className={MUTED_TEXT}>时间序列的趋势特征描述</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trendFeatures.map((feature, index) => (
                <div key={index} className={`${INNER_PANEL_CLASS} p-4`}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="font-medium text-white">{feature.feature}</span>
                    <Badge variant="outline" className="border-[#4E86DF]/45 bg-[#2761CB]/15 text-[#DCE6FF]">{feature.rate}</Badge>
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-lg font-semibold text-[#4E86DF]">{feature.value}</span>
                    <span className={`text-sm ${MUTED_TEXT}`}>{feature.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className={PANEL_CLASS}>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-white">周期性分析指标</CardTitle>
            <CardDescription className={MUTED_TEXT}>周期性特征的定量分析</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 space-y-3">
              {cyclicalMetrics.map((item, index) => (
                <div key={index} className="flex items-center justify-between gap-3 border-b border-[var(--color-neutral-03)] py-3 last:border-0">
                  <span className="text-sm font-medium text-white">{item.metric}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-[#DCE6FF]">{item.value}</span>
                    <Badge variant="outline" className="border-[#4E86DF]/45 bg-[#2761CB]/15 text-xs text-[#DCE6FF]">
                      置信度 {item.confidence}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            <div className="h-64 w-full" style={{ minHeight: '256px' }}>
              {mounted && (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} aspect={undefined}>
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke={GRID_STROKE} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#AFC0E8', fontSize: 12 }} />
                    <PolarRadiusAxis tick={{ fill: '#6b7599', fontSize: 11 }} axisLine={false} />
                    <Radar
                      name="周期分析"
                      dataKey="A"
                      stroke="#8B5CF6"
                      fill="#8B5CF6"
                      fillOpacity={0.42}
                    />
                    <Tooltip content={<DarkChartTooltip />} cursor={DARK_TOOLTIP_CURSOR} />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className={PANEL_CLASS}>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-white">自相关分析</CardTitle>
            <CardDescription className={MUTED_TEXT}>时间序列的自相关性检验</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {autocorrelation.map((item) => (
                <div key={item.lag} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">滞后 {item.label}</span>
                    <span className="text-sm font-semibold text-[#4E86DF]">
                      {item.value.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[var(--color-neutral-03)]">
                    <div
                      className="h-2 rounded-full bg-[#4E86DF]"
                      style={{ width: `${item.value * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-lg border border-[#4E86DF]/35 bg-[#2761CB]/10 p-4">
              <p className="mb-1 text-sm font-medium text-[#DCE6FF]">分析结论</p>
              <p className="text-sm leading-6 text-[#AFC0E8]">
                数据具有较强的自相关性，短期记忆效应明显，适合使用ARIMA等时间序列模型进行预测。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <ChartCard title="时序预测模型" description="基于历史数据的未来趋势预测（未来6个月）">
        <div className="mb-4 h-80 w-full" style={{ minHeight: '320px' }}>
          {mounted && (
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} aspect={undefined}>
              <ComposedChart data={forecastData} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={AXIS_TICK} />
                <YAxis domain={['dataMin - 50', 'auto']} axisLine={false} tickLine={false} tick={AXIS_TICK} />
                <Tooltip content={<DarkChartTooltip />} cursor={DARK_TOOLTIP_CURSOR} />
                <Legend wrapperStyle={{ color: '#AFC0E8' }} />
                <Area type="monotone" dataKey="range" name="95%置信区间" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.2} />
                <Line type="monotone" dataKey="value" name="预测值" stroke="#D6730D" strokeWidth={2} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className={`${INNER_PANEL_CLASS} p-4`}>
            <p className={`mb-2 text-sm ${MUTED_TEXT}`}>预测模型</p>
            <p className="text-lg font-semibold text-white">ARIMA(2,1,2)</p>
          </div>
          <div className={`${INNER_PANEL_CLASS} p-4`}>
            <p className={`mb-2 text-sm ${MUTED_TEXT}`}>模型准确度</p>
            <p className="text-lg font-semibold text-[#19B172]">92.5%</p>
          </div>
          <div className={`${INNER_PANEL_CLASS} p-4`}>
            <p className={`mb-2 text-sm ${MUTED_TEXT}`}>预测区间</p>
            <p className="text-lg font-semibold text-white">95% 置信水平</p>
          </div>
        </div>
      </ChartCard>

      <div className={`text-center text-sm ${MUTED_TEXT}`}>
        数据更新时间：2026-01-20 08:00:00 | 分析模型：STL分解 + ARIMA预测
      </div>
    </div>
  );
}
