import { useState } from 'react';
import { MapPin, AlertTriangle, TrendingUp, Download, Filter, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export function WarningMap() {
  const [warningType, setWarningType] = useState('all');
  const [severity, setSeverity] = useState('all');

  // 预警点位数据
  const warningPoints = [
    {
      id: 1,
      area: 'A区-中心街道',
      type: '人口密度预警',
      level: 'high',
      value: '1850人/km²',
      threshold: '1500人/km²',
      description: '人口密度严重超标，基础设施承载压力大',
      lat: 37.5138,
      lng: 122.1201,
      impact: '影响范围约0.5km²，涉及约900人'
    },
    {
      id: 2,
      area: 'B区-东部街道',
      type: '老龄化率预警',
      level: 'medium',
      value: '18.5%',
      threshold: '14%',
      description: '老龄化率超过中度老龄化标准',
      lat: 37.5098,
      lng: 122.1315,
      impact: '需增加养老服务设施'
    },
    {
      id: 3,
      area: 'A区-南部街道',
      type: '人口流失预警',
      level: 'medium',
      value: '-5.2%',
      threshold: '-3%',
      description: '人口持续外流，需分析原因',
      lat: 37.5058,
      lng: 122.1188,
      impact: '近6个月流失约200人'
    },
    {
      id: 4,
      area: 'C区-西部街道',
      type: '出生率异常',
      level: 'low',
      value: '5.2‰',
      threshold: '7‰',
      description: '出生率低于正常水平',
      lat: 37.5118,
      lng: 122.1088,
      impact: '学龄前教育资源利用不足'
    },
    {
      id: 5,
      area: 'D区-中心街道',
      type: '流动人口激增',
      level: 'high',
      value: '+85%',
      threshold: '+50%',
      description: '流动人口短期内大幅增加',
      lat: 37.5178,
      lng: 122.1258,
      impact: '公共服务压力骤增'
    }
  ];

  // 预警统计
  const warningStats = {
    total: 5,
    high: 2,
    medium: 2,
    low: 1,
    resolved: 8,
    pending: 5
  };

  // 预警类型分布
  const typeDistribution = [
    { type: '人口密度预警', count: 2, color: '#ef4444' },
    { type: '老龄化率预警', count: 1, color: '#f59e0b' },
    { type: '人口流失预警', count: 1, color: '#3b82f6' },
    { type: '流动人口预警', count: 1, color: '#8b5cf6' }
  ];

  // 区域预警频次
  const areaWarnings = [
    { area: 'A区', count: 2, resolved: 3, pending: 2 },
    { area: 'B区', count: 1, resolved: 2, pending: 1 },
    { area: 'C区', count: 1, resolved: 2, pending: 1 },
    { area: 'D区', count: 1, resolved: 1, pending: 1 }
  ];

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'high':
        return '严重';
      case 'medium':
        return '中等';
      case 'low':
        return '轻微';
      default:
        return '未知';
    }
  };

  const filteredWarnings = warningPoints.filter(w => {
    if (warningType !== 'all' && !w.type.includes(warningType)) return false;
    if (severity !== 'all' && w.level !== severity) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2">预警地图</h1>
          <p className="text-gray-500">在地图上展示人口密集或异常区域的预警信息</p>
        </div>
        <div className="flex gap-3">
          <Select value={warningType} onValueChange={setWarningType}>
            <SelectTrigger className="w-[160px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem value="密度">人口密度</SelectItem>
              <SelectItem value="老龄化">老龄化</SelectItem>
              <SelectItem value="流失">人口流失</SelectItem>
              <SelectItem value="流动">流动人口</SelectItem>
            </SelectContent>
          </Select>
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部等级</SelectItem>
              <SelectItem value="high">严重</SelectItem>
              <SelectItem value="medium">中等</SelectItem>
              <SelectItem value="low">轻微</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            导出
          </Button>
        </div>
      </div>

      {/* 预警统计 */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              预警总数
            </CardDescription>
            <CardTitle className="text-3xl">{warningStats.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">待处理 {warningStats.pending}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>严重预警</CardDescription>
            <CardTitle className="text-3xl text-red-600">{warningStats.high}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">需立即处理</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>中等预警</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{warningStats.medium}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">需关注</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>轻微预警</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{warningStats.low}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">持续监测</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>已处理</CardDescription>
            <CardTitle className="text-3xl text-green-600">{warningStats.resolved}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">本月</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>处理率</CardDescription>
            <CardTitle className="text-3xl">
              {((warningStats.resolved / (warningStats.resolved + warningStats.pending)) * 100).toFixed(0)}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800">
                <TrendingUp className="w-3 h-3 mr-1" />
                +8%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 地图区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>预警地图</CardTitle>
                <CardDescription>预警点位空间分布可视化</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-gray-500">{filteredWarnings.length} 个预警点</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* 地图占位符 */}
            <div className="relative h-[500px] bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 mb-2">预警地图可视化区域</p>
                <p className="text-sm text-gray-400 mb-4">可集成 Mapbox、百度地图或高德地图 SDK</p>
                
                {/* 模拟预警点 */}
                <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
                  {filteredWarnings.slice(0, 4).map((warning) => (
                    <div
                      key={warning.id}
                      className={`p-3 rounded-lg border-2 ${
                        warning.level === 'high' ? 'border-red-500 bg-red-50' :
                        warning.level === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                        'border-blue-500 bg-blue-50'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                          warning.level === 'high' ? 'text-red-600' :
                          warning.level === 'medium' ? 'text-yellow-600' :
                          'text-blue-600'
                        }`} />
                        <div className="text-left">
                          <p className="text-xs font-medium mb-1">{warning.area}</p>
                          <p className="text-xs text-gray-600">{warning.type}</p>
                          <p className="text-xs font-semibold mt-1">{warning.value}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 图例 */}
            <div className="mt-4 flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500" />
                <span className="text-sm">严重预警</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-yellow-500" />
                <span className="text-sm">中等预警</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-500" />
                <span className="text-sm">轻微预警</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 侧边栏 */}
        <div className="space-y-6">
          {/* 预警类型分布 */}
          <Card>
            <CardHeader>
              <CardTitle>预警类型分布</CardTitle>
              <CardDescription>各类预警数量统计</CardDescription>
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
                      <span className="text-sm">{item.type}</span>
                    </div>
                    <Badge variant="outline">{item.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 区域预警频次 */}
          <Card>
            <CardHeader>
              <CardTitle>区域预警频次</CardTitle>
              <CardDescription>各区域预警统计</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {areaWarnings.map((item) => (
                  <div key={item.area} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{item.area}</span>
                      <Badge variant="outline">{item.count} 个</Badge>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <Badge className="bg-green-100 text-green-800">
                        已处理 {item.resolved}
                      </Badge>
                      <Badge className="bg-orange-100 text-orange-800">
                        待处理 {item.pending}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 预警详情列表 */}
      <Card>
        <CardHeader>
          <CardTitle>预警详情列表</CardTitle>
          <CardDescription>所有预警点位的详细信息（筛选后 {filteredWarnings.length} 条）</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {filteredWarnings.map((warning) => (
              <div key={warning.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    warning.level === 'high' ? 'bg-red-100' :
                    warning.level === 'medium' ? 'bg-yellow-100' :
                    'bg-blue-100'
                  }`}>
                    <AlertTriangle className={`w-6 h-6 ${
                      warning.level === 'high' ? 'text-red-600' :
                      warning.level === 'medium' ? 'text-yellow-600' :
                      'text-blue-600'
                    }`} />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{warning.type}</h3>
                        <Badge className={getLevelColor(warning.level)}>
                          {getLevelLabel(warning.level)}
                        </Badge>
                        <Badge variant="outline">
                          <MapPin className="w-3 h-3 mr-1" />
                          {warning.area}
                        </Badge>
                      </div>
                      <Button size="sm" variant="outline">
                        查看详情
                      </Button>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">{warning.description}</p>

                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="p-2 bg-white border border-gray-200 rounded">
                        <p className="text-xs text-gray-500">当前值</p>
                        <p className="text-sm font-semibold text-red-600">{warning.value}</p>
                      </div>
                      <div className="p-2 bg-white border border-gray-200 rounded">
                        <p className="text-xs text-gray-500">预警阈值</p>
                        <p className="text-sm font-semibold">{warning.threshold}</p>
                      </div>
                      <div className="p-2 bg-white border border-gray-200 rounded">
                        <p className="text-xs text-gray-500">坐标</p>
                        <p className="text-sm font-mono">{warning.lat}, {warning.lng}</p>
                      </div>
                    </div>

                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-xs text-orange-600 font-medium mb-1">影响范围</p>
                      <p className="text-sm text-orange-900">{warning.impact}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 数据更新时间 */}
      <div className="text-center text-sm text-gray-500">
        数据实时更新 | 预警规则每日08:00更新
      </div>
    </div>
  );
}