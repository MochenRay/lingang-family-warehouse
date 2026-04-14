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
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2">时序分析</h1>
          <p className="text-gray-500">识别人口数据的周期性规律与变化趋势</p>
        </div>
        <div className="flex gap-3">
          <Select value={indicator} onValueChange={setIndicator}>
            <SelectTrigger className="w-[160px]">
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
            <SelectTrigger className="w-[120px]">
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
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              整体趋势
            </CardDescription>
            <CardTitle className="text-3xl">稳步增长</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800">
                +2.2%/年
              </Badge>
              <span className="text-xs text-gray-500">增长率</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>周期性强度</CardDescription>
            <CardTitle className="text-3xl">中等</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              振幅 ±3.2% | 周期 12个月
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>预测准确度</CardDescription>
            <CardTitle className="text-3xl">92.5%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              基于ARIMA模型预测
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>数据完整度</CardDescription>
            <CardTitle className="text-3xl">98.8%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              360个时间点
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 时序分解 */}
      <Card>
        <CardHeader>
          <CardTitle>时序分解分析</CardTitle>
          <CardDescription>将时间序列分解为趋势、周期和残差三个组成部分</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="original">
            <TabsList className="mb-4">
              <TabsTrigger value="original">原始序列</TabsTrigger>
              <TabsTrigger value="trend">趋势分量</TabsTrigger>
              <TabsTrigger value="seasonal">周期分量</TabsTrigger>
              <TabsTrigger value="residual">残差分量</TabsTrigger>
            </TabsList>

            <TabsContent value="original">
              <div className="h-72 w-full mb-4" style={{ minHeight: '288px' }}>
                {mounted && (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} aspect={undefined}>
                  <LineChart data={populationTimeSeries}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="time" />
                    <YAxis domain={['auto', 'auto']} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" name="人口总数" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
                )}
              </div>
              <div className="grid grid-cols-6 gap-2">
                {populationTimeSeries.slice(-6).map((item) => (
                  <div key={item.time} className="text-center p-2 border rounded">
                    <p className="text-xs text-gray-500 mb-1">{item.time}</p>
                    <p className="font-semibold">{item.value}</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="trend">
              <div className="h-72 w-full mb-4" style={{ minHeight: '288px' }}>
                {mounted && (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} aspect={undefined}>
                  <LineChart data={populationTimeSeries}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="time" />
                    <YAxis domain={['auto', 'auto']} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="trend" name="趋势分量" stroke="#ea580c" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
                )}
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-800 mb-2">趋势解读</p>
                <p className="text-sm text-blue-700">
                  数据显示人口总数呈现稳定的上升趋势，平均每月增长约0.15%，年增长率约2.2%，符合区域经济发展规律。
                </p>
              </div>
            </TabsContent>

            <TabsContent value="seasonal">
              <div className="h-72 w-full mb-4" style={{ minHeight: '288px' }}>
                {mounted && (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} aspect={undefined}>
                  <BarChart data={populationTimeSeries}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="seasonality" name="周期分量" fill="#16a34a" />
                  </BarChart>
                </ResponsiveContainer>
                )}
              </div>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800 mb-2">周期性特征</p>
                <p className="text-sm text-green-700">
                  明显的年度周期性特征：春节、毕业季、开学季均有显著人口波动，周期长度约12个月，振幅±3.2%。
                </p>
              </div>
            </TabsContent>

            <TabsContent value="residual">
              <div className="h-72 w-full mb-4" style={{ minHeight: '288px' }}>
                {mounted && (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} aspect={undefined}>
                  <BarChart data={populationTimeSeries}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="residual" name="残差分量" fill="#ca8a04" />
                  </BarChart>
                </ResponsiveContainer>
                )}
              </div>
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-800 mb-2">残差分析</p>
                <p className="text-sm text-yellow-700">
                  残差部分较小且呈随机分布，说明模型拟合效果良好，没有明显的系统性偏差。
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 周期性规律 */}
        <Card>
          <CardHeader>
            <CardTitle>周期性规律识别</CardTitle>
            <CardDescription>识别出的主要周期性模式</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {seasonalPatterns.map((pattern, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge>{pattern.period}</Badge>
                      <span className="font-medium">{pattern.pattern}</span>
                    </div>
                    <Badge variant="outline" className={
                      pattern.impact.startsWith('+') ? 'text-green-600' : 'text-red-600'
                    }>
                      {pattern.impact}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{pattern.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 趋势特征 */}
        <Card>
          <CardHeader>
            <CardTitle>趋势特征分析</CardTitle>
            <CardDescription>时间序列的趋势特征描述</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trendFeatures.map((feature, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{feature.feature}</span>
                    <Badge variant="outline">{feature.rate}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-blue-600">{feature.value}</span>
                    <span className="text-sm text-gray-500">{feature.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 周期性分析指标 */}
        <Card>
          <CardHeader>
            <CardTitle>周期性分析指标</CardTitle>
            <CardDescription>周期性特征的定量分析</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-4">
              {cyclicalMetrics.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b last:border-0">
                  <span className="text-sm font-medium">{item.metric}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{item.value}</span>
                    <Badge variant="outline" className="text-xs">
                      置信度 {item.confidence}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* 周期性可视化 */}
            <div className="h-64 w-full" style={{ minHeight: '256px' }}>
              {mounted && (
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} aspect={undefined}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis />
                  <Radar
                    name="周期分析"
                    dataKey="A"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 自相关分析 */}
        <Card>
          <CardHeader>
            <CardTitle>自相关分析</CardTitle>
            <CardDescription>时间序列的自相关性检验</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {autocorrelation.map((item) => (
                <div key={item.lag} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">滞后 {item.label}</span>
                    <span className="text-sm font-semibold text-blue-600">
                      {item.value.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${item.value * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-800 mb-1">分析结论</p>
              <p className="text-sm text-blue-700">
                数据具有较强的自相关性，短期记忆效应明显，适合使用ARIMA等时间序列模型进行预测。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 预测模型 */}
      <Card>
        <CardHeader>
          <CardTitle>时序预测模型</CardTitle>
          <CardDescription>基于历史数据的未来趋势预测（未来6个月）</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full mb-4" style={{ minHeight: '320px' }}>
            {mounted && (
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} aspect={undefined}>
              <ComposedChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" />
                <YAxis domain={['dataMin - 50', 'auto']} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="range" name="95%置信区间" stroke="#8884d8" fill="#8884d8" fillOpacity={0.2} />
                <Line type="monotone" dataKey="value" name="预测值" stroke="#ff7300" strokeWidth={2} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">预测模型</p>
              <p className="text-lg font-semibold">ARIMA(2,1,2)</p>
            </div>
            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">模型准确度</p>
              <p className="text-lg font-semibold text-green-600">92.5%</p>
            </div>
            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">预测区间</p>
              <p className="text-lg font-semibold">95% 置信水平</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 数据更新时间 */}
      <div className="text-center text-sm text-gray-500">
        数据更新时间：2026-01-20 08:00:00 | 分析模型：STL分解 + ARIMA预测
      </div>
    </div>
  );
}
