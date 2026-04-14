import { useState } from 'react';
import { Target, Download, BarChart3, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Legend
} from 'recharts';

export function FactorIdentification() {
  const [mounted, setMounted] = useState(false);
  const [targetVariable, setTargetVariable] = useState('population-growth');
  const [method, setMethod] = useState('correlation');

  // 影响因子列表（按重要性排序）
  const factors = [
    {
      id: 1,
      name: '就业岗位数量',
      category: '经济因素',
      importance: 0.92,
      correlation: 0.88,
      pValue: 0.001,
      direction: 'positive',
      description: '工作机会是吸引人口流入的最主要因素',
      impact: '就业岗位每增加100个，预计吸引人口增长约85人'
    },
    {
      id: 2,
      name: '平均工资水平',
      category: '经济因素',
      importance: 0.86,
      correlation: 0.82,
      pValue: 0.002,
      direction: 'positive',
      description: '收入水平直接影响人口吸引力',
      impact: '工资每提高1000元，人口流入增加约3.2%'
    },
    {
      id: 3,
      name: '教育资源质量',
      category: '公共服务',
      importance: 0.78,
      correlation: 0.75,
      pValue: 0.005,
      direction: 'positive',
      description: '优质教育资源吸引年轻家庭迁入',
      impact: '每增加1所优质学校，周边人口增长约5%'
    },
    {
      id: 4,
      name: '医疗资源配置',
      category: '公共服务',
      importance: 0.72,
      correlation: 0.68,
      pValue: 0.008,
      direction: 'positive',
      description: '医疗资源影响老年人口留存',
      impact: '医疗资源每提升10%，老年人口外流减少约8%'
    },
    {
      id: 5,
      name: '房价水平',
      category: '居住成本',
      importance: 0.68,
      correlation: -0.65,
      pValue: 0.012,
      direction: 'negative',
      description: '高房价对人口流入形成阻力',
      impact: '房价每上涨1000元/㎡，人口流入减少约4.5%'
    },
    {
      id: 6,
      name: '生活成本',
      category: '居住成本',
      importance: 0.62,
      correlation: -0.58,
      pValue: 0.018,
      direction: 'negative',
      description: '生活成本影响流动人口稳定性',
      impact: '生活成本每提高10%，流动人口流失约6%'
    },
    {
      id: 7,
      name: '交通便利度',
      category: '基础设施',
      importance: 0.58,
      correlation: 0.55,
      pValue: 0.025,
      direction: 'positive',
      description: '交通条件影响通勤便利性',
      impact: '交通便利度每提升10%，吸引人口增长约2.8%'
    },
    {
      id: 8,
      name: '环境质量',
      category: '生活质量',
      importance: 0.52,
      correlation: 0.48,
      pValue: 0.035,
      direction: 'positive',
      description: '环境质量影响居住满意度',
      impact: '环境质量改善10%，人口留存率提高约3%'
    }
  ];

  // 因子分类统计
  const categoryStats = [
    { category: '经济因素', count: 2, avgImportance: 0.89 },
    { category: '公共服务', count: 2, avgImportance: 0.75 },
    { category: '居住成本', count: 2, avgImportance: 0.65 },
    { category: '基础设施', count: 1, avgImportance: 0.58 },
    { category: '生活质量', count: 1, avgImportance: 0.52 }
  ];

  // Pie Chart Colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // 因子交互分析
  const interactions = [
    {
      factor1: '就业岗位数量',
      factor2: '平均工资水平',
      interaction: 0.85,
      effect: '协同增强',
      description: '就业机会与薪资水平共同作用时，人口吸引力显著增强'
    },
    {
      factor1: '教育资源质量',
      factor2: '房价水平',
      interaction: -0.52,
      effect: '相互抵消',
      description: '优质教育的吸引力会被高房价部分抵消'
    },
    {
      factor1: '医疗资源配置',
      factor2: '环境质量',
      interaction: 0.68,
      effect: '协同增强',
      description: '医疗与环境共同影响老年人口的居住选择'
    }
  ];

  // Generate Scatter Data for Interaction Heatmap Simulation
  // We map factors to indices 0-7
  const factorNames = factors.map(f => f.name);
  const scatterData = [];
  
  // Fill with some mock data plus the specific interactions
  for (let i = 0; i < factorNames.length; i++) {
    for (let j = 0; j < factorNames.length; j++) {
      if (i === j) continue; // Skip self-interaction or set to 1
      
      let val = Math.random() * 0.4 - 0.2; // random small noise
      
      // Inject known interactions
      const f1 = factorNames[i];
      const f2 = factorNames[j];
      const known = interactions.find(
        x => (x.factor1 === f1 && x.factor2 === f2) || (x.factor1 === f2 && x.factor2 === f1)
      );
      
      if (known) {
        val = known.interaction;
      }

      scatterData.push({
        x: i,
        y: j,
        z: Math.abs(val) * 100, // Size based on absolute strength
        val: val,
        name: `${f1} x ${f2}`
      });
    }
  }


  // 模型性能指标
  const modelMetrics = [
    { metric: 'R²', value: '0.876', description: '模型解释度' },
    { metric: 'RMSE', value: '12.4', description: '均方根误差' },
    { metric: 'MAE', value: '9.2', description: '平均绝对误差' },
    { metric: 'AIC', value: '438.5', description: '信息准则' }
  ];

  useState(() => {
    setMounted(true);
  }, []);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2">影响因子识别</h1>
          <p className="text-gray-500">识别影响人口分布与流动的关键因素</p>
        </div>
        <div className="flex gap-3">
          <Select value={targetVariable} onValueChange={setTargetVariable}>
            <SelectTrigger className="w-[180px]">
              <Target className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="population-growth">人口增长率</SelectItem>
              <SelectItem value="migration-in">迁入人口</SelectItem>
              <SelectItem value="migration-out">迁出人口</SelectItem>
              <SelectItem value="population-density">人口密度</SelectItem>
            </SelectContent>
          </Select>
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger className="w-[160px]">
              <BarChart3 className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="correlation">相关性分析</SelectItem>
              <SelectItem value="regression">回归分析</SelectItem>
              <SelectItem value="random-forest">随机森林</SelectItem>
              <SelectItem value="xgboost">XGBoost</SelectItem>
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
              <Zap className="w-4 h-4" />
              识别因子总数
            </CardDescription>
            <CardTitle className="text-3xl">8</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              显著因子（p&lt;0.05）
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>模型解释度</CardDescription>
            <CardTitle className="text-3xl text-blue-600">87.6%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              R² 系数
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>最强影响因子</CardDescription>
            <CardTitle className="text-2xl">就业岗位</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              重要性 92%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>预测准确度</CardDescription>
            <CardTitle className="text-3xl text-green-600">91.2%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              交叉验证结果
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 因子重要性排名 */}
      <Card>
        <CardHeader>
          <CardTitle>影响因子重要性排名</CardTitle>
          <CardDescription>基于{method === 'correlation' ? '相关性分析' : method === 'regression' ? '回归分析' : method === 'random-forest' ? '随机森林' : 'XGBoost'}方法识别的关键影响因子</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {factors.map((factor, index) => (
              <div key={factor.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{factor.name}</h3>
                        <Badge variant="outline">{factor.category}</Badge>
                        <Badge className={
                          factor.direction === 'positive' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }>
                          {factor.direction === 'positive' ? '正向影响' : '负向影响'}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">重要性</p>
                        <p className="text-lg font-semibold text-blue-600">
                          {(factor.importance * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>

                    {/* 重要性进度条 */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${factor.importance * 100}%` }}
                      />
                    </div>

                    <p className="text-sm text-gray-600 mb-2">{factor.description}</p>

                    <div className="grid grid-cols-3 gap-3 mb-2">
                      <div className="p-2 bg-white border border-gray-200 rounded">
                        <p className="text-xs text-gray-500">相关系数</p>
                        <p className="text-sm font-semibold">
                          {factor.correlation > 0 ? '+' : ''}{factor.correlation.toFixed(2)}
                        </p>
                      </div>
                      <div className="p-2 bg-white border border-gray-200 rounded">
                        <p className="text-xs text-gray-500">显著性</p>
                        <p className="text-sm font-semibold">p={factor.pValue.toFixed(3)}</p>
                      </div>
                      <div className="p-2 bg-white border border-gray-200 rounded">
                        <p className="text-xs text-gray-500">统计检验</p>
                        <p className="text-sm font-semibold text-green-600">显著</p>
                      </div>
                    </div>

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-600 font-medium mb-1">量化影响</p>
                      <p className="text-sm text-blue-900">{factor.impact}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 因子分类统计 */}
        <Card>
          <CardHeader>
            <CardTitle>因子分类统计</CardTitle>
            <CardDescription>按类别汇总影响因子</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-4">
              {categoryStats.map((stat) => (
                <div key={stat.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{stat.category}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">{stat.count} 个因子</span>
                      <span className="text-sm font-semibold text-blue-600">
                        {(stat.avgImportance * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${stat.avgImportance * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* 饼图 */}
            <div className="h-64 w-full" style={{ minHeight: '256px' }}>
               {mounted && (
               <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie
                    data={categoryStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="category"
                    label
                  >
                    {categoryStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
               </ResponsiveContainer>
               )}
            </div>
          </CardContent>
        </Card>

        {/* 模型性能指标 */}
        <Card>
          <CardHeader>
            <CardTitle>模型性能指标</CardTitle>
            <CardDescription>因子识别模型的统计指标</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {modelMetrics.map((metric) => (
                <div key={metric.metric} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-semibold">{metric.metric}</p>
                    <p className="text-sm text-gray-500">{metric.description}</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{metric.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-800 mb-2">模型评估</p>
              <p className="text-sm text-green-700">
                模型拟合效果优秀，R²达到0.876，说明识别的因子能够解释87.6%的人口变化，具有较强的解释力和预测能力。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 因子交互分析 */}
      <Card>
        <CardHeader>
          <CardTitle>因子交互效应分析</CardTitle>
          <CardDescription>分析多个因子共同作用时的交互影响</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            {interactions.map((interaction, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{interaction.factor1}</Badge>
                    <span className="text-gray-400">×</span>
                    <Badge variant="outline">{interaction.factor2}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={
                      interaction.effect === '协同增强' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-orange-100 text-orange-800'
                    }>
                      {interaction.effect}
                    </Badge>
                    <span className="text-sm font-semibold text-gray-600">
                      交互系数: {interaction.interaction.toFixed(2)}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{interaction.description}</p>
              </div>
            ))}
          </div>

          {/* 交互矩阵气泡图 (模拟热力图) */}
          <div className="h-96 w-full" style={{ minHeight: '384px' }}>
            {mounted && (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <ScatterChart
                margin={{ top: 20, right: 20, bottom: 20, left: 100 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name="因子1" 
                  domain={[0, factorNames.length - 1]}
                  ticks={factorNames.map((_, i) => i)}
                  tickFormatter={(i) => i < factorNames.length ? (i % 2 === 0 ? factorNames[i].substring(0, 4) : '') : ''} // Simplify labels
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name="因子2" 
                  domain={[0, factorNames.length - 1]}
                  ticks={factorNames.map((_, i) => i)}
                  tickFormatter={(i) => factorNames[i]}
                  width={100}
                />
                <ZAxis 
                  type="number" 
                  dataKey="z" 
                  range={[50, 400]} 
                  name="交互强度" 
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }} 
                  content={({ payload }) => {
                    if (payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-2 border rounded shadow-md">
                          <p className="font-semibold text-sm">{data.name}</p>
                          <p className="text-xs text-gray-600">交互值: {data.val.toFixed(2)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter name="交互强度" data={scatterData} fill="#8884d8" />
              </ScatterChart>
            </ResponsiveContainer>
            )}
            <p className="text-center text-xs text-gray-400 mt-2">注：气泡大小代表交互作用强度，X轴标签已简化</p>
          </div>
        </CardContent>
      </Card>

      {/* 数据更新时间 */}
      <div className="text-center text-sm text-gray-500">
        数据更新时间：2026-01-20 08:00:00 | 分析方法：{method === 'correlation' ? '皮尔逊相关分析' : method === 'regression' ? '多元线性回归' : method === 'random-forest' ? '随机森林特征重要性' : 'XGBoost特征重要性'}
      </div>
    </div>
  );
}