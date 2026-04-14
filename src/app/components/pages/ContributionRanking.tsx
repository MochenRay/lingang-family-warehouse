import { useState } from 'react';
import { Award, TrendingUp, Download, BarChart3, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export function ContributionRanking() {
  const [targetIndicator, setTargetIndicator] = useState('population-growth');
  const [timeRange, setTimeRange] = useState('year');

  // 贡献度排名数据
  const contributions = [
    {
      rank: 1,
      factor: '就业岗位数量',
      category: '经济因素',
      contribution: 35.2,
      absoluteValue: '+182人',
      trend: '+5.2%',
      confidence: 95,
      description: '新增就业岗位是人口增长的首要驱动因素'
    },
    {
      rank: 2,
      factor: '平均工资水平',
      category: '经济因素',
      contribution: 28.5,
      absoluteValue: '+147人',
      trend: '+3.8%',
      confidence: 92,
      description: '薪资水平提升显著增强了区域吸引力'
    },
    {
      rank: 3,
      factor: '教育资源质量',
      category: '公共服务',
      contribution: 18.3,
      absoluteValue: '+95人',
      trend: '+2.5%',
      confidence: 88,
      description: '教育资源改善吸引年轻家庭迁入'
    },
    {
      rank: 4,
      factor: '医疗资源配置',
      category: '公共服务',
      contribution: 12.8,
      absoluteValue: '+66人',
      trend: '+1.8%',
      confidence: 85,
      description: '医疗条件提升增强老年人口留存'
    },
    {
      rank: 5,
      factor: '房价水平',
      category: '居住成本',
      contribution: -8.5,
      absoluteValue: '-44人',
      trend: '-1.2%',
      confidence: 90,
      description: '房价上涨对人口流入产生负面影响'
    },
    {
      rank: 6,
      factor: '生活成本',
      category: '居住成本',
      contribution: -6.2,
      absoluteValue: '-32人',
      trend: '-0.9%',
      confidence: 82,
      description: '生活成本上升导致部分流动人口外流'
    },
    {
      rank: 7,
      factor: '交通便利度',
      category: '基础设施',
      contribution: 10.5,
      absoluteValue: '+54人',
      trend: '+1.5%',
      confidence: 86,
      description: '交通改善提升了区域可达性'
    },
    {
      rank: 8,
      factor: '环境质量',
      category: '生活质量',
      contribution: 9.4,
      absoluteValue: '+49人',
      trend: '+1.3%',
      confidence: 80,
      description: '环境治理成效提高居住满意度'
    }
  ];

  // 分类贡献度汇总
  const categoryContributions = [
    { category: '经济因素', contribution: 63.7, count: 2, color: '#3b82f6' },
    { category: '公共服务', contribution: 31.1, count: 2, color: '#10b981' },
    { category: '基础设施', contribution: 10.5, count: 1, color: '#8b5cf6' },
    { category: '生活质量', contribution: 9.4, count: 1, color: '#f59e0b' },
    { category: '居住成本', contribution: -14.7, count: 2, color: '#ef4444' }
  ];

  // 时间序列贡献度变化
  const timeSeriesData = [
    { period: 'Q1', economic: 58.2, service: 28.5, infrastructure: 8.2, quality: 5.1 },
    { period: 'Q2', economic: 61.5, service: 29.8, infrastructure: 9.5, quality: 7.2 },
    { period: 'Q3', economic: 62.8, service: 30.5, infrastructure: 10.2, quality: 8.5 },
    { period: 'Q4', economic: 63.7, service: 31.1, infrastructure: 10.5, quality: 9.4 }
  ];

  // 综合影响力评分
  const impactScores = [
    { dimension: '直接影响力', score: 92, maxScore: 100 },
    { dimension: '持续影响力', score: 85, maxScore: 100 },
    { dimension: '可控性', score: 78, maxScore: 100 },
    { dimension: '政策敏感度', score: 88, maxScore: 100 }
  ];

  const totalContribution = contributions.reduce((sum, item) => sum + item.contribution, 0);
  const positiveContribution = contributions.filter(c => c.contribution > 0).reduce((sum, item) => sum + item.contribution, 0);
  const negativeContribution = contributions.filter(c => c.contribution < 0).reduce((sum, item) => sum + item.contribution, 0);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2">贡献程度排名</h1>
          <p className="text-gray-500">对各影响因子的贡献程度进行排名展示</p>
        </div>
        <div className="flex gap-3">
          <Select value={targetIndicator} onValueChange={setTargetIndicator}>
            <SelectTrigger className="w-[160px]">
              <Target className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="population-growth">人口增长</SelectItem>
              <SelectItem value="migration-balance">迁移净额</SelectItem>
              <SelectItem value="density-change">密度变化</SelectItem>
              <SelectItem value="age-structure">年龄结构</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">本月</SelectItem>
              <SelectItem value="quarter">本季度</SelectItem>
              <SelectItem value="year">本年度</SelectItem>
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
              <Award className="w-4 h-4" />
              因子总数
            </CardDescription>
            <CardTitle className="text-3xl">8</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              正向 6个 | 负向 2个
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>正向贡献总和</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {positiveContribution.toFixed(1)}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800">
                <TrendingUp className="w-3 h-3 mr-1" />
                促进增长
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>负向贡献总和</CardDescription>
            <CardTitle className="text-3xl text-red-600">
              {negativeContribution.toFixed(1)}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge className="bg-red-100 text-red-800">
                抑制增长
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>净贡献度</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {totalContribution.toFixed(1)}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              综合影响效果
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 贡献度排名列表 */}
      <Card>
        <CardHeader>
          <CardTitle>影响因子贡献度排名</CardTitle>
          <CardDescription>按贡献程度从高到低排列（包含负向影响因子）</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {contributions.map((item) => (
              <div key={item.rank} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  {/* 排名徽章 */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                    item.rank === 1 ? 'bg-yellow-500' :
                    item.rank === 2 ? 'bg-gray-400' :
                    item.rank === 3 ? 'bg-orange-600' :
                    'bg-blue-500'
                  }`}>
                    {item.rank}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{item.factor}</h3>
                        <Badge variant="outline">{item.category}</Badge>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <Badge className={
                            item.contribution > 0 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }>
                            {item.contribution > 0 ? '+' : ''}{item.contribution}%
                          </Badge>
                          <Badge variant="outline">
                            置信度 {item.confidence}%
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* 贡献度进度条 */}
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-gray-500">贡献度</span>
                        <span className="text-sm font-semibold">
                          {Math.abs(item.contribution).toFixed(1)}%
                        </span>
                      </div>
                      <div className="relative w-full bg-gray-200 rounded-full h-3">
                        {item.contribution > 0 ? (
                          <div
                            className="bg-green-500 h-3 rounded-full transition-all"
                            style={{ width: `${(Math.abs(item.contribution) / positiveContribution) * 100}%` }}
                          />
                        ) : (
                          <div
                            className="bg-red-500 h-3 rounded-full transition-all"
                            style={{ width: `${(Math.abs(item.contribution) / Math.abs(negativeContribution)) * 100}%` }}
                          />
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">{item.description}</p>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-2 bg-white border border-gray-200 rounded">
                        <p className="text-xs text-gray-500">绝对贡献值</p>
                        <p className="text-sm font-semibold">{item.absoluteValue}</p>
                      </div>
                      <div className="p-2 bg-white border border-gray-200 rounded">
                        <p className="text-xs text-gray-500">变化趋势</p>
                        <p className={`text-sm font-semibold ${
                          item.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {item.trend}
                        </p>
                      </div>
                      <div className="p-2 bg-white border border-gray-200 rounded">
                        <p className="text-xs text-gray-500">影响方向</p>
                        <p className="text-sm font-semibold">
                          {item.contribution > 0 ? '正向' : '负向'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 分类贡献度汇总 */}
        <Card>
          <CardHeader>
            <CardTitle>分类贡献度汇总</CardTitle>
            <CardDescription>按因子类别汇总贡献度</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryContributions
                .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
                .map((item) => (
                  <div key={item.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm font-medium">{item.category}</span>
                        <Badge variant="outline" className="text-xs">
                          {item.count} 个因子
                        </Badge>
                      </div>
                      <span className={`text-sm font-semibold ${
                        item.contribution > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {item.contribution > 0 ? '+' : ''}{item.contribution.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ 
                          width: `${(Math.abs(item.contribution) / positiveContribution) * 100}%`,
                          backgroundColor: item.color
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>

            {/* 饼图占位 */}
            <div className="mt-6 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-400">分类贡献度饼图</p>
            </div>
          </CardContent>
        </Card>

        {/* 综合影响力评分 */}
        <Card>
          <CardHeader>
            <CardTitle>综合影响力评分</CardTitle>
            <CardDescription>多维度评估因子影响力</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {impactScores.map((item) => (
                <div key={item.dimension} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.dimension}</span>
                    <span className="text-sm font-semibold text-blue-600">
                      {item.score}/{item.maxScore}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${(item.score / item.maxScore) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-800 mb-2">综合评价</p>
              <p className="text-sm text-blue-700">
                识别的影响因子具有较强的直接影响力和持续影响力，且对政策调控较为敏感，是制定人口调控政策的重要依据。
              </p>
            </div>

            {/* 雷达图占位 */}
            <div className="mt-6 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-400 text-sm">影响力雷达图</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 时间序列变化 */}
      <Card>
        <CardHeader>
          <CardTitle>贡献度时间序列变化</CardTitle>
          <CardDescription>各类因子贡献度的季度变化趋势</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
            <p className="text-gray-400">贡献度堆积面积图 - 展示各类因子贡献度随时间的变化</p>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {timeSeriesData.map((item) => (
              <div key={item.period} className="p-3 border rounded-lg">
                <p className="text-sm font-medium text-center mb-2">{item.period}</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">经济</span>
                    <span className="font-semibold">{item.economic}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">服务</span>
                    <span className="font-semibold">{item.service}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">设施</span>
                    <span className="font-semibold">{item.infrastructure}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">质量</span>
                    <span className="font-semibold">{item.quality}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 数据更新时间 */}
      <div className="text-center text-sm text-gray-500">
        数据更新时间：2026-01-20 08:00:00 | 分析方法：Shapley值分解 + 方差分解
      </div>
    </div>
  );
}