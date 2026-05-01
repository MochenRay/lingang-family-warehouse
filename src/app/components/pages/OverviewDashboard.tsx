import { useState } from 'react';
import { Home, Users, TrendingUp, Calendar, AlertTriangle, Target, RefreshCw, Maximize2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { PageHeader } from './PageHeader';

export function OverviewDashboard() {
  const [area, setArea] = useState('all');
  const [timeRange, setTimeRange] = useState('realtime');

  // 核心指标数据
  const coreMetrics = {
    totalPopulation: 5234,
    populationGrowth: '+2.2%',
    agingRate: 14.3,
    agingTrend: '+0.8%',
    residentRatio: 76.5,
    residentTrend: '+1.2%',
    floatingRatio: 23.5,
    floatingTrend: '+3.5%'
  };

  // 仪表盘数据
  const gaugeData = [
    { 
      name: '人口增长率', 
      value: 2.2, 
      max: 5, 
      unit: '%', 
      status: 'good',
      threshold: { warning: 3, danger: 4 }
    },
    { 
      name: '老龄化率', 
      value: 14.3, 
      max: 30, 
      unit: '%', 
      status: 'warning',
      threshold: { warning: 14, danger: 20 }
    },
    { 
      name: '人口密度', 
      value: 952, 
      max: 2000, 
      unit: '人/km²', 
      status: 'normal',
      threshold: { warning: 1500, danger: 1800 }
    },
    { 
      name: '出生率', 
      value: 8.5, 
      max: 15, 
      unit: '‰', 
      status: 'good',
      threshold: { warning: 6, danger: 5 }
    }
  ];

  // 区域对比数据
  const areaComparison = [
    { area: 'A区', population: 1580, growth: '+3.2%', aging: 12.5, density: 1250 },
    { area: 'B区', population: 1320, growth: '+2.8%', aging: 15.8, density: 980 },
    { area: 'C区', population: 1210, growth: '+1.5%', aging: 13.2, density: 850 },
    { area: 'D区', population: 1124, growth: '+1.8%', aging: 16.5, density: 720 }
  ];

  // 预警信息
  const warnings = [
    { 
      level: 'high', 
      area: 'B区', 
      type: '老龄化率预警', 
      value: '15.8%',
      message: '老龄化率超过预警阈值，建议加强养老服务配置'
    },
    { 
      level: 'medium', 
      area: 'A区', 
      type: '人口密度预警', 
      value: '1250人/km²',
      message: '人口密度较高，需关注基础设施承载能力'
    },
    { 
      level: 'low', 
      area: 'C区', 
      type: '人口外流提示', 
      value: '+1.5%',
      message: '人口增长放缓，建议分析原因并采取措施'
    }
  ];

  // 实时数据流
  const realtimeData = [
    { time: '08:00', population: 5230, event: '正常' },
    { time: '10:00', population: 5232, event: '迁入+2' },
    { time: '12:00', population: 5233, event: '正常' },
    { time: '14:00', population: 5234, event: '迁入+1' },
    { time: '16:00', population: 5234, event: '正常' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'danger':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  const getWarningColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-red-50 border-red-200';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200';
      case 'low':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="OVERVIEW ANALYTICS"
        title="辖区总览"
        description="汇总辖区人口态势、风险预警和趋势变化，帮助先看全局再下钻异常片区。"
        actions={
          <div className="flex flex-wrap gap-3">
            <Select value={area} onValueChange={setArea}>
              <SelectTrigger className="w-[140px]">
                <Home className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全辖区</SelectItem>
                <SelectItem value="A">A区</SelectItem>
                <SelectItem value="B">B区</SelectItem>
                <SelectItem value="C">C区</SelectItem>
                <SelectItem value="D">D区</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realtime">实时数据</SelectItem>
                <SelectItem value="today">今日</SelectItem>
                <SelectItem value="week">本周</SelectItem>
                <SelectItem value="month">本月</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              刷新
            </Button>
            <Button variant="outline">
              <Maximize2 className="w-4 h-4 mr-2" />
              全屏
            </Button>
          </div>
        }
      />

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              总人口
            </CardDescription>
            <CardTitle className="text-3xl">{coreMetrics.totalPopulation.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800">
                <TrendingUp className="w-3 h-3 mr-1" />
                {coreMetrics.populationGrowth}
              </Badge>
              <span className="text-xs text-gray-500">较去年</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              老龄化率
            </CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{coreMetrics.agingRate}%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge className="bg-yellow-100 text-yellow-800">
                <TrendingUp className="w-3 h-3 mr-1" />
                {coreMetrics.agingTrend}
              </Badge>
              <span className="text-xs text-gray-500">较去年</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardDescription>常住人口占比</CardDescription>
            <CardTitle className="text-3xl text-green-600">{coreMetrics.residentRatio}%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800">
                {coreMetrics.residentTrend}
              </Badge>
              <span className="text-xs text-gray-500">较去年</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardDescription>流动人口占比</CardDescription>
            <CardTitle className="text-3xl text-purple-600">{coreMetrics.floatingRatio}%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-100 text-purple-800">
                <TrendingUp className="w-3 h-3 mr-1" />
                {coreMetrics.floatingTrend}
              </Badge>
              <span className="text-xs text-gray-500">较去年</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 仪表盘区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>核心指标仪表盘</CardTitle>
            <CardDescription>关键指标的可视化监控面板</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              {gaugeData.map((gauge) => (
                <div key={gauge.name} className="text-center">
                  <div className="relative w-32 h-32 mx-auto mb-3">
                    {/* 仪表盘背景 */}
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="8"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        fill="none"
                        stroke={
                          gauge.status === 'good' ? '#10b981' :
                          gauge.status === 'warning' ? '#f59e0b' :
                          gauge.status === 'danger' ? '#ef4444' :
                          '#3b82f6'
                        }
                        strokeWidth="8"
                        strokeDasharray={`${(gauge.value / gauge.max) * 351.86} 351.86`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className={`text-2xl font-bold ${getStatusColor(gauge.status)}`}>
                        {gauge.value}
                      </p>
                      <p className="text-xs text-gray-500">{gauge.unit}</p>
                    </div>
                  </div>
                  <p className="font-medium text-sm">{gauge.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {((gauge.value / gauge.max) * 100).toFixed(0)}%
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 预警信息 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>预警信息</CardTitle>
                <CardDescription>实时监测预警提示</CardDescription>
              </div>
              <Badge variant="outline" className="text-red-600">
                {warnings.length} 条预警
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {warnings.map((warning, index) => (
                <div key={index} className={`p-4 border rounded-lg ${getWarningColor(warning.level)}`}>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${
                      warning.level === 'high' ? 'text-red-600' :
                      warning.level === 'medium' ? 'text-yellow-600' :
                      'text-blue-600'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm">{warning.type}</span>
                        <Badge variant="outline">{warning.area}</Badge>
                      </div>
                      <p className="text-sm font-medium mb-1">当前值: {warning.value}</p>
                      <p className="text-xs text-gray-600">{warning.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 区域对比 */}
      <Card>
        <CardHeader>
          <CardTitle>区域对比分析</CardTitle>
          <CardDescription>各区域核心指标横向对比</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">区域</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">人口数</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">增长率</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">老龄化率</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">密度</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {areaComparison.map((item) => (
                  <tr key={item.area} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{item.area}</td>
                    <td className="px-6 py-4 text-right">{item.population.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <Badge variant="outline" className="text-green-600">{item.growth}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={item.aging > 14 ? 'text-yellow-600 font-semibold' : ''}>
                        {item.aging}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">{item.density} 人/km²</td>
                    <td className="px-6 py-4 text-center">
                      <Badge className={
                        item.aging > 15 ? 'bg-yellow-100 text-yellow-800' :
                        item.density > 1000 ? 'bg-orange-100 text-orange-800' :
                        'bg-green-100 text-green-800'
                      }>
                        {item.aging > 15 ? '关注' : item.density > 1000 ? '预警' : '正常'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 实时数据流 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>实时数据流</CardTitle>
              <CardDescription>人口变化实时监测</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-500">实时更新中</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {realtimeData.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{item.time}</Badge>
                  <span className="font-semibold">{item.population.toLocaleString()} 人</span>
                </div>
                <Badge className={
                  item.event.includes('迁入') ? 'bg-green-100 text-green-800' :
                  item.event.includes('迁出') ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }>
                  {item.event}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 数据更新时间 */}
      <div className="text-center text-sm text-gray-500">
        数据实时更新 | 最后刷新时间：2026-01-20 16:00:00
      </div>
    </div>
  );
}
