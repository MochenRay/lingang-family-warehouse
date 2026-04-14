import React, { useState, useEffect } from 'react';
import { ChartCard } from '../statistics/ChartCard';
import { Button } from "../ui/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Filter, ArrowRight, TrendingUp, TrendingDown, Loader2, ArrowLeftRight } from "lucide-react";

// Mock data generator for richer demonstration
const generateMockAnalysisData = (mode: string, indicator: string, scope: string) => {
  // 丰富的社区数据
  const communities = [
    { name: '海源社区', basePop: 4280, variance: 0.15 },
    { name: '翠竹社区', basePop: 3950, variance: 0.12 },
    { name: '金海湾社区', basePop: 3720, variance: 0.18 },
    { name: '竹岛花园社区', basePop: 3580, variance: 0.10 },
    { name: '望海社区', basePop: 3420, variance: 0.14 },
    { name: '蓝天家园社区', basePop: 3180, variance: 0.16 },
    { name: '阳光海岸社区', basePop: 2960, variance: 0.11 },
    { name: '锦绣华庭社区', basePop: 2840, variance: 0.13 },
    { name: '碧海云天社区', basePop: 2650, variance: 0.09 },
    { name: '和平里社区', basePop: 2480, variance: 0.17 },
    { name: '环翠园社区', basePop: 2320, variance: 0.15 },
    { name: '幸福家园社区', basePop: 2150, variance: 0.12 },
  ];

  // 根据指标类型调整基数
  const indicatorMultiplier: Record<string, number> = {
    'pop': 1.0,      // 常住人口
    'flow': 0.15,    // 流动人口 (约15%)
    'risk': 0.05,    // 重点人员 (约5%)
    'event': 0.3,    // 网格事件 (约30%)
  };

  const multiplier = indicatorMultiplier[indicator] || 1.0;

  // 根据对比模式调整变化幅度
  const modeVariance: Record<string, number> = {
    'huanbi': 0.08,  // 环比变化较小
    'tongbi': 0.15,  // 同比变化较大
    'custom': 0.12,  // 自定义中等
  };

  const variance = modeVariance[mode] || 0.1;

  let filteredCommunities = communities;
  
  // 根据聚焦区域筛选
  if (scope === 'top5') {
    filteredCommunities = communities.slice(0, 5);
  } else if (scope === 'warning') {
    // 重点关注区域：选择变化率较大的
    filteredCommunities = communities.filter(c => c.variance > 0.13);
  }

  const items = filteredCommunities.map((community) => {
    const baseValue = Math.floor(community.basePop * multiplier);
    
    // 模拟上期/去年数据
    const randomVariance = (Math.random() - 0.5) * 2 * variance;
    const prevValue = Math.floor(baseValue * (1 - randomVariance));
    
    const diff = baseValue - prevValue;
    const diffRate = prevValue === 0 ? 0 : (diff / prevValue) * 100;
    
    return {
      name: community.name,
      valueA: baseValue,
      valueB: prevValue,
      diff,
      diffRate
    };
  });

  // 按本期数值降序排列
  return items.sort((a, b) => b.valueA - a.valueA);
};

export function DataComparison() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [compareMode, setCompareMode] = useState('huanbi');
  const [indicator, setIndicator] = useState('pop');
  const [scope, setScope] = useState('top5');
  
  // 初始化加载默认数据
  useEffect(() => {
    setMounted(true);
    handleAnalyze();
  }, []);

  const handleAnalyze = () => {
    setLoading(true);
    // Simulate calc delay
    setTimeout(() => {
      setData(generateMockAnalysisData(compareMode, indicator, scope));
      setLoading(false);
    }, 500);
  };

  const chartData = data.map(item => ({
    name: item.name,
    "本期数值": item.valueA,
    "对比数值": item.valueB
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">多维数据对比</h2>
        <p className="text-muted-foreground">通过同比、环比及区域横向对比，发现数据异常与趋势。</p>
      </div>

      {/* 1. 筛选控制栏 */}
      <Card className="border-indigo-100 shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-indigo-700 font-semibold">
                <ArrowLeftRight className="w-4 h-4" /> 对比模式
              </Label>
              <Select value={compareMode} onValueChange={setCompareMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="huanbi">环比分析 (本月 vs 上月)</SelectItem>
                  <SelectItem value="tongbi">同比分析 (今年 vs 去年)</SelectItem>
                  <SelectItem value="custom">自定义时间段对比</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>分析指标</Label>
              <Select value={indicator} onValueChange={setIndicator}>
                <SelectTrigger>
                  <SelectValue placeholder="选择指标" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pop">常住人口总数</SelectItem>
                  <SelectItem value="flow">流动人口数量</SelectItem>
                  <SelectItem value="risk">重点人员预警数</SelectItem>
                  <SelectItem value="event">网格事件上报量</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>聚焦区域</Label>
              <Select value={scope} onValueChange={setScope}>
                <SelectTrigger>
                  <SelectValue placeholder="范围" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top5">人口 Top 5 社区</SelectItem>
                  <SelectItem value="all">全辖区所有社区</SelectItem>
                  <SelectItem value="warning">重点关注区域</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white w-full" 
              onClick={handleAnalyze} 
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Filter className="w-4 h-4 mr-2" />}
              {loading ? '分析中...' : '执行对比分析'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 2. 可视化图表对比 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="趋势直方图" description="Top 区域数值直观对比" className="lg:col-span-3">
          <div className="h-[300px] w-full" style={{ minHeight: '300px' }}>
            {mounted && (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend />
                <Bar dataKey="本期数值" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="对比数值" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
        </ChartCard>
      </div>

      {/* 3. 详细数据表格 */}
      <Card>
        <CardHeader>
          <CardTitle>详细数据明细</CardTitle>
          <CardDescription>各区域具体数值及变化率排名</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-[var(--color-neutral-02)] hover:bg-[var(--color-neutral-02)] border-b border-[var(--color-neutral-03)]">
                <TableHead className="w-[80px] text-[var(--color-neutral-10)]">排名</TableHead>
                <TableHead className="text-[var(--color-neutral-10)]">区域名称</TableHead>
                <TableHead className="text-right text-[var(--color-neutral-10)]">本期数值</TableHead>
                <TableHead className="text-right text-[var(--color-neutral-08)]">对比数值</TableHead>
                <TableHead className="text-right text-[var(--color-neutral-10)]">差值 (Diff)</TableHead>
                <TableHead className="text-right text-[var(--color-neutral-10)]">变化率</TableHead>
                <TableHead className="text-center text-[var(--color-neutral-10)]">趋势判定</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                 <TableRow>
                   <TableCell colSpan={7} className="h-24 text-center text-gray-500">
                     <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                     正在计算差异...
                   </TableCell>
                 </TableRow>
              ) : (
                data.map((row, index) => (
                  <TableRow key={index} className="group">
                    <TableCell className="font-medium text-gray-500">{index + 1}</TableCell>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-right font-bold text-base">{row.valueA.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-gray-400">{row.valueB.toLocaleString()}</TableCell>
                    <TableCell className={`text-right font-mono ${row.diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {row.diff > 0 ? '+' : ''}{row.diff}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className={`${row.diffRate > 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        {Math.abs(row.diffRate).toFixed(2)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                       {row.diffRate > 0 ? (
                         <div className="flex items-center justify-center text-green-600 gap-1 text-xs">
                           <TrendingUp className="w-4 h-4" /> 增长
                         </div>
                       ) : (
                         <div className="flex items-center justify-center text-red-600 gap-1 text-xs">
                           <TrendingDown className="w-4 h-4" /> 下降
                         </div>
                       )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}