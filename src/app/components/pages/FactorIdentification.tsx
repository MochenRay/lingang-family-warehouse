import { useEffect, useMemo, useState } from 'react';
import { Download, Loader2, Target, Zap } from 'lucide-react';
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
  Legend,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { analysisRepository, type GovernanceAnalysisSnapshot } from '../../services/repositories/analysisRepository';
import { downloadJson } from '../../services/export';
import { toast } from 'sonner';
import { ChartCard } from '../statistics/ChartCard';
import { DARK_TOOLTIP_CURSOR, DarkChartTooltip } from '../statistics/DarkChartTooltip';
import { PageHeader } from './PageHeader';

type TargetVariable = 'pressure' | 'visitCoverage' | 'conflictFollowup' | 'rentalRisk';

interface FactorItem {
  id: string;
  name: string;
  category: string;
  importance: number;
  contribution: number;
  direction: 'positive' | 'negative';
  description: string;
  impact: string;
}

interface RawFactorItem {
  id: string;
  name: string;
  category: string;
  raw: number;
  direction: 'positive' | 'negative';
  description: string;
  impact: string;
}

const CATEGORY_COLORS = ['#4E86DF', '#19B172', '#D6730D', '#8B5CF6', '#D52132'];
const PANEL_CLASS = 'rounded-lg border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)] shadow-none';
const INNER_PANEL_CLASS = 'rounded-lg border border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)]';
const MUTED_TEXT = 'text-[var(--color-neutral-08)]';
const GRID_STROKE = '#3d4663';
const AXIS_TICK = { fill: '#6b7599', fontSize: 12 };

function buildFactors(snapshot: GovernanceAnalysisSnapshot, targetVariable: TargetVariable): FactorItem[] {
  const totals = snapshot.totals;
  const gridCount = Math.max(snapshot.grids.length, 1);
  const highRiskDensity = totals.people ? snapshot.grids.reduce((sum, grid) => sum + grid.highRiskCount, 0) / totals.people : 0;
  const activeConflictPerGrid = snapshot.grids.reduce((sum, grid) => sum + grid.activeConflictCount, 0) / gridCount;
  const overduePerGrid = snapshot.grids.reduce((sum, grid) => sum + grid.overdueTaskCount, 0) / gridCount;
  const pendingPerGrid = snapshot.grids.reduce((sum, grid) => sum + grid.pendingTaskCount, 0) / gridCount;
  const rentalRate = totals.houses ? snapshot.grids.reduce((sum, grid) => sum + grid.rentalCount, 0) / totals.houses : 0;
  const visitCoverage = snapshot.grids.reduce((sum, grid) => sum + grid.visitCoverage, 0) / gridCount;
  const infoCompleteness = snapshot.grids.reduce((sum, grid) => sum + grid.infoCompleteness, 0) / gridCount;
  const elderlyDensity = totals.people ? snapshot.grids.reduce((sum, grid) => sum + grid.elderlyCount, 0) / totals.people : 0;
  const floatingDensity = totals.people ? snapshot.grids.reduce((sum, grid) => sum + grid.floatingCount, 0) / totals.people : 0;

  const base: RawFactorItem[] = [
    {
      id: 'risk',
      name: '高风险对象密度',
      category: '重点对象',
      raw: highRiskDensity * 100,
      direction: targetVariable === 'visitCoverage' ? 'negative' : 'positive',
      description: '高风险对象越集中，治理压力与回访需求越高。',
      impact: `当前片区高风险对象占比 ${(highRiskDensity * 100).toFixed(1)}%。`,
    },
    {
      id: 'conflict',
      name: '调解中纠纷压力',
      category: '矛盾调处',
      raw: activeConflictPerGrid * 22,
      direction: 'positive',
      description: '未化解纠纷直接抬高网格的治理压力与回访复杂度。',
      impact: `当前平均每个网格 ${activeConflictPerGrid.toFixed(1)} 起调解中纠纷。`,
    },
    {
      id: 'overdue',
      name: '超期待办密度',
      category: '任务闭环',
      raw: overduePerGrid * 28,
      direction: 'positive',
      description: '超期待办越多，越容易在人物、待办和统计页之间暴露不一致。',
      impact: `当前平均每个网格 ${overduePerGrid.toFixed(1)} 条超期待办。`,
    },
    {
      id: 'pending',
      name: '待跟进任务压力',
      category: '任务闭环',
      raw: pendingPerGrid * 14,
      direction: 'positive',
      description: '待办压力会放大走访、矛盾调解和绩效督导之间的联动感知。',
      impact: `当前平均每个网格 ${pendingPerGrid.toFixed(1)} 条待跟进任务。`,
    },
    {
      id: 'rental',
      name: '出租房密度',
      category: '房屋治理',
      raw: rentalRate * 100,
      direction: 'positive',
      description: '出租房集中意味着更高的群租、流动人口与秩序整治压力。',
      impact: `当前片区出租房占比 ${(rentalRate * 100).toFixed(1)}%。`,
    },
    {
      id: 'visit',
      name: '走访覆盖率',
      category: '走访质量',
      raw: visitCoverage,
      direction: 'negative',
      description: '覆盖率越高，画像与待办越不容易打架，是典型的缓释因素。',
      impact: `当前平均走访覆盖率 ${visitCoverage.toFixed(1)}%。`,
    },
    {
      id: 'profile',
      name: '档案完整度',
      category: '信息质量',
      raw: infoCompleteness,
      direction: 'negative',
      description: '档案越完整，规则投影与统计解释越稳定。',
      impact: `当前平均档案完整度 ${infoCompleteness.toFixed(1)}%。`,
    },
    {
      id: 'elderly',
      name: '高龄关爱压力',
      category: '重点对象',
      raw: elderlyDensity * 100,
      direction: 'positive',
      description: '高龄对象集中会放大入户关怀和安全巡查的刚性需求。',
      impact: `当前高龄对象占比 ${(elderlyDensity * 100).toFixed(1)}%。`,
    },
    {
      id: 'floating',
      name: '流动人口密度',
      category: '房屋治理',
      raw: floatingDensity * 100,
      direction: targetVariable === 'rentalRisk' ? 'positive' : 'negative',
      description: '流动人口变化会牵动房屋、任务和走访节奏。',
      impact: `当前流动人口占比 ${(floatingDensity * 100).toFixed(1)}%。`,
    },
  ];

  const targetFilter = {
    pressure: ['risk', 'conflict', 'overdue', 'pending', 'visit', 'profile'],
    visitCoverage: ['visit', 'profile', 'risk', 'elderly', 'pending', 'floating'],
    conflictFollowup: ['conflict', 'overdue', 'pending', 'visit', 'profile', 'risk'],
    rentalRisk: ['rental', 'floating', 'risk', 'conflict', 'visit', 'profile'],
  }[targetVariable];

  const filtered = base.filter((item) => targetFilter.includes(item.id));
  const totalRaw = filtered.reduce((sum, item) => sum + Math.abs(item.raw), 0) || 1;
  return filtered
    .map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      importance: Number(Math.min(Math.abs(item.raw) / totalRaw * 100, 100).toFixed(1)),
      contribution: Number((Math.abs(item.raw) / totalRaw * 100).toFixed(1)),
      direction: item.direction,
      description: item.description,
      impact: item.impact,
    }))
    .sort((left, right) => right.contribution - left.contribution);
}

export function FactorIdentification() {
  const [snapshot, setSnapshot] = useState<GovernanceAnalysisSnapshot | null>(null);
  const [targetVariable, setTargetVariable] = useState<TargetVariable>('pressure');
  const [loading, setLoading] = useState(true);

  const loadSnapshot = async () => {
    setLoading(true);
    try {
      const next = await analysisRepository.getGovernanceSnapshot();
      setSnapshot(next);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSnapshot();
  }, []);

  const factors = useMemo(() => (snapshot ? buildFactors(snapshot, targetVariable) : []), [snapshot, targetVariable]);

  const categoryStats = useMemo(() => {
    const bucket = new Map<string, { category: string; contribution: number; count: number }>();
    for (const factor of factors) {
      const current = bucket.get(factor.category) ?? { category: factor.category, contribution: 0, count: 0 };
      current.contribution += factor.contribution;
      current.count += 1;
      bucket.set(factor.category, current);
    }
    return Array.from(bucket.values()).map((item) => ({
      ...item,
      contribution: Number(item.contribution.toFixed(1)),
    }));
  }, [factors]);

  const scatterData = useMemo(() => {
    if (!snapshot) {
      return [];
    }
    return snapshot.grids.map((grid) => ({
      x: Number(grid.visitCoverage.toFixed(1)),
      y: Number(grid.heatScore.toFixed(1)),
      z: Math.max(grid.peopleCount, 20),
      name: grid.communityName,
    }));
  }, [snapshot]);

  const handleExport = () => {
    downloadJson(`factor-identification-${targetVariable}-${new Date().toISOString().slice(0, 10)}.json`, {
      generatedAt: snapshot?.generatedAt,
      targetVariable,
      factors,
      categoryStats,
      grids: snapshot?.grids,
    });
    toast.success('因子识别快照已导出');
  };

  if (loading) {
    return (
      <div className="space-y-5 text-[var(--color-neutral-10)]">
        <PageHeader
          eyebrow="FACTOR EXPLAINABILITY"
          title="影响因子识别"
          description="对异常结果拆解关键因素，辅助判断下一步干预抓手。"
        />
        <div className="flex justify-center p-8">
          <Loader2 className="animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 text-[var(--color-neutral-10)]">
      <PageHeader
        eyebrow="FACTOR EXPLAINABILITY"
        title="影响因子识别"
        description="对异常结果拆解关键因素，辅助判断下一步干预抓手。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Select value={targetVariable} onValueChange={(value: TargetVariable) => setTargetVariable(value)}>
              <SelectTrigger className="w-[180px] border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)]">
                <Target className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pressure">网格治理压力</SelectItem>
                <SelectItem value="visitCoverage">走访覆盖质量</SelectItem>
                <SelectItem value="conflictFollowup">纠纷跟进压力</SelectItem>
                <SelectItem value="rentalRisk">出租房风险</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExport}>
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
              <Zap className="w-4 h-4" />
              识别因子总数
            </CardDescription>
            <CardTitle className="text-3xl text-white">{factors.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-sm ${MUTED_TEXT}`}>本轮保留可解释的固定因子</p>
          </CardContent>
        </Card>
        <Card className={PANEL_CLASS}>
          <CardHeader className="pb-3">
            <CardDescription className={MUTED_TEXT}>最高贡献因子</CardDescription>
            <CardTitle className="truncate text-xl text-white">{factors[0]?.name ?? '暂无'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-sm ${MUTED_TEXT}`}>{factors[0]?.contribution ?? 0}%</p>
          </CardContent>
        </Card>
        <Card className={PANEL_CLASS}>
          <CardHeader className="pb-3">
            <CardDescription className={MUTED_TEXT}>平均因子权重</CardDescription>
            <CardTitle className="text-3xl text-[#19B172]">
              {factors.length ? (factors.reduce((sum, item) => sum + item.contribution, 0) / factors.length).toFixed(1) : '0'}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-sm ${MUTED_TEXT}`}>各因子贡献均值</p>
          </CardContent>
        </Card>
        <Card className={PANEL_CLASS}>
          <CardHeader className="pb-3">
            <CardDescription className={MUTED_TEXT}>热区样本</CardDescription>
            <CardTitle className="truncate text-2xl text-white">{snapshot?.grids[0]?.communityName ?? '暂无'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-sm ${MUTED_TEXT}`}>热度 {snapshot?.grids[0]?.heatScore ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Card className={`xl:col-span-3 ${PANEL_CLASS}`}>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-white">关键因子排名</CardTitle>
            <CardDescription className={MUTED_TEXT}>只展示当前目标下真正参与解释的固定因子。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {factors.map((factor, index) => (
              <div key={factor.id} className={`${INNER_PANEL_CLASS} space-y-3 p-4`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white">{index + 1}. {factor.name}</span>
                      <Badge variant="outline" className="border-[#4E86DF]/45 bg-[#2761CB]/15 text-[#DCE6FF]">{factor.category}</Badge>
                    </div>
                    <p className={`text-sm ${MUTED_TEXT}`}>{factor.description}</p>
                  </div>
                  <div className="text-right min-w-[92px]">
                    <div className="text-2xl font-semibold text-[#19B172]">{factor.contribution}%</div>
                    <div className={`text-xs ${MUTED_TEXT}`}>贡献权重</div>
                  </div>
                </div>
                <div className={`text-sm ${MUTED_TEXT}`}>{factor.impact}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="xl:col-span-2 space-y-6">
          <ChartCard title="分类贡献结构" description="按固定分类聚合当前目标的因子贡献。">
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryStats} dataKey="contribution" nameKey="category" outerRadius={82} label>
                    {categoryStats.map((item, index) => (
                      <Cell key={item.category} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<DarkChartTooltip />} cursor={DARK_TOOLTIP_CURSOR} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="网格热度散点" description="X 轴为走访覆盖率，Y 轴为热度，气泡大小代表人口规模。">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="x" name="走访覆盖率" unit="%" axisLine={false} tickLine={false} tick={AXIS_TICK} />
                  <YAxis type="number" dataKey="y" name="热度" axisLine={false} tickLine={false} tick={AXIS_TICK} />
                  <ZAxis type="number" dataKey="z" range={[80, 420]} />
                  <Tooltip content={<DarkChartTooltip />} cursor={DARK_TOOLTIP_CURSOR} />
                  <Legend wrapperStyle={{ color: '#AFC0E8' }} />
                  <Scatter name="网格样本" data={scatterData} fill="#4E86DF" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
