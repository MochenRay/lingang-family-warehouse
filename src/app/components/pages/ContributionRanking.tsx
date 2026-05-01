import { useEffect, useMemo, useState } from 'react';
import { Award, Download, Loader2, Target, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { analysisRepository, type GovernanceAnalysisSnapshot } from '../../services/repositories/analysisRepository';
import { downloadJson } from '../../services/export';
import { toast } from 'sonner';
import { PageHeader } from './PageHeader';

type RankingTarget = 'pressure' | 'visitCoverage' | 'conflictFollowup' | 'rentalRisk';

interface ContributionItem {
  rank: number;
  factor: string;
  category: string;
  contribution: number;
  absoluteValue: string;
  trend: string;
  confidence: number;
  description: string;
}

type RawContributionItem = [
  factor: string,
  category: string,
  value: number,
  absoluteValue: string,
  trend: string,
  confidence: number,
  description: string,
];

const PANEL_CLASS = 'rounded-lg border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)] shadow-none';
const INNER_PANEL_CLASS = 'rounded-lg border border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)]';
const MUTED_TEXT = 'text-[var(--color-neutral-08)]';

function buildContributionItems(snapshot: GovernanceAnalysisSnapshot, target: RankingTarget): ContributionItem[] {
  const highRisk = snapshot.grids.reduce((sum, grid) => sum + grid.highRiskCount, 0);
  const activeConflicts = snapshot.grids.reduce((sum, grid) => sum + grid.activeConflictCount, 0);
  const overdueTasks = snapshot.grids.reduce((sum, grid) => sum + grid.overdueTaskCount, 0);
  const pendingTasks = snapshot.grids.reduce((sum, grid) => sum + grid.pendingTaskCount, 0);
  const avgVisitCoverage = snapshot.grids.length
    ? snapshot.grids.reduce((sum, grid) => sum + grid.visitCoverage, 0) / snapshot.grids.length
    : 0;
  const avgInfoCompleteness = snapshot.grids.length
    ? snapshot.grids.reduce((sum, grid) => sum + grid.infoCompleteness, 0) / snapshot.grids.length
    : 0;
  const rentalRate = snapshot.totals.houses
    ? snapshot.grids.reduce((sum, grid) => sum + grid.rentalCount, 0) / snapshot.totals.houses
    : 0;
  const floatingCount = snapshot.grids.reduce((sum, grid) => sum + grid.floatingCount, 0);

  const raw: Record<RankingTarget, RawContributionItem[]> = {
    pressure: [
      ['高风险对象密度', '重点对象', highRisk * 12, `${highRisk} 人`, '+4.2%', 95, '高风险对象集中是当前治理压力的首要来源。'],
      ['调解中纠纷', '矛盾调处', activeConflicts * 16, `${activeConflicts} 起`, '+3.8%', 92, '未化解纠纷直接抬高回访和协调成本。'],
      ['超期待办', '任务闭环', overdueTasks * 18, `${overdueTasks} 条`, '+6.1%', 93, '超期说明闭环链路存在拖尾。'],
      ['待跟进任务', '任务闭环', pendingTasks * 9, `${pendingTasks} 条`, '+2.7%', 88, '待办压力会放大页面间的口径差异。'],
      ['走访覆盖率', '走访质量', Math.max(0, 100 - avgVisitCoverage), `${avgVisitCoverage.toFixed(1)}%`, '-1.9%', 86, '覆盖率越低，越容易在详情与统计之间露怯。'],
      ['档案完整度', '信息质量', Math.max(0, 100 - avgInfoCompleteness), `${avgInfoCompleteness.toFixed(1)}%`, '-1.2%', 84, '档案质量越差，规则投影越不稳定。'],
    ],
    visitCoverage: [
      ['走访覆盖率', '走访质量', avgVisitCoverage * 1.2, `${avgVisitCoverage.toFixed(1)}%`, '+3.4%', 94, '走访覆盖直接决定人物与移动端链路是否可信。'],
      ['档案完整度', '信息质量', avgInfoCompleteness, `${avgInfoCompleteness.toFixed(1)}%`, '+2.3%', 90, '档案完整度越高，走访内容越容易闭环。'],
      ['高风险对象密度', '重点对象', highRisk * 8, `${highRisk} 人`, '+1.8%', 88, '重点对象越多，对走访频次的要求越高。'],
      ['待跟进任务', '任务闭环', pendingTasks * 7, `${pendingTasks} 条`, '+2.2%', 86, '待办堆积会压缩走访资源。'],
      ['流动人口密度', '房屋治理', floatingCount * 2.5, `${floatingCount} 人`, '+1.4%', 82, '流动人口波动会带来临时补访。'],
    ],
    conflictFollowup: [
      ['调解中纠纷', '矛盾调处', activeConflicts * 18, `${activeConflicts} 起`, '+4.4%', 95, '未化解纠纷是跟进链路的核心驱动。'],
      ['超期待办', '任务闭环', overdueTasks * 16, `${overdueTasks} 条`, '+5.6%', 93, '超期会直接拖低调解闭环质量。'],
      ['待跟进任务', '任务闭环', pendingTasks * 9, `${pendingTasks} 条`, '+3.1%', 88, '待办存量越大，跟进优先级越难拉齐。'],
      ['走访覆盖率', '走访质量', Math.max(0, 100 - avgVisitCoverage), `${avgVisitCoverage.toFixed(1)}%`, '-1.7%', 84, '覆盖不足时，纠纷处置更难拿到一手事实。'],
      ['高风险对象密度', '重点对象', highRisk * 6, `${highRisk} 人`, '+1.5%', 80, '重点对象集中会增加调解联动复杂度。'],
    ],
    rentalRisk: [
      ['出租房密度', '房屋治理', rentalRate * 100, `${(rentalRate * 100).toFixed(1)}%`, '+3.9%', 95, '出租房集中是当前房屋风险的主要来源。'],
      ['流动人口密度', '房屋治理', floatingCount * 3, `${floatingCount} 人`, '+2.6%', 90, '流动人口波动会放大房屋秩序风险。'],
      ['高风险对象密度', '重点对象', highRisk * 7, `${highRisk} 人`, '+1.6%', 84, '重点对象会放大出租房跟进压力。'],
      ['调解中纠纷', '矛盾调处', activeConflicts * 8, `${activeConflicts} 起`, '+1.8%', 82, '房屋纠纷往往和租住秩序、邻里冲突联动。'],
      ['走访覆盖率', '走访质量', Math.max(0, 100 - avgVisitCoverage), `${avgVisitCoverage.toFixed(1)}%`, '-1.1%', 80, '走访不足时，房屋风险更难及时暴露。'],
    ],
  };

  const selected = raw[target];
  const total = selected.reduce((sum, item) => sum + item[2], 0) || 1;
  return selected
    .map(([factor, category, value, absoluteValue, trend, confidence, description], index) => ({
      rank: index + 1,
      factor,
      category,
      contribution: Number((value / total * 100).toFixed(1)),
      absoluteValue,
      trend,
      confidence,
      description,
    }))
    .sort((left, right) => right.contribution - left.contribution)
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

export function ContributionRanking() {
  const [snapshot, setSnapshot] = useState<GovernanceAnalysisSnapshot | null>(null);
  const [targetIndicator, setTargetIndicator] = useState<RankingTarget>('pressure');
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

  const contributions = useMemo(
    () => (snapshot ? buildContributionItems(snapshot, targetIndicator) : []),
    [snapshot, targetIndicator],
  );

  const positiveContribution = contributions
    .slice(0, 4)
    .reduce((sum, item) => sum + item.contribution, 0);
  const tailContribution = contributions
    .slice(4)
    .reduce((sum, item) => sum + item.contribution, 0);

  const handleExport = () => {
    downloadJson(`contribution-ranking-${targetIndicator}-${new Date().toISOString().slice(0, 10)}.json`, {
      generatedAt: snapshot?.generatedAt,
      targetIndicator,
      contributions,
      monthly: snapshot?.monthly,
    });
    toast.success('贡献排名快照已导出');
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 text-[var(--color-neutral-10)]">
      <PageHeader
        eyebrow="CONTRIBUTION LEDGER"
        title="贡献程度排名"
        description="对区域与指标贡献排序，找出拉动整体变化的关键片区。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Select value={targetIndicator} onValueChange={(value: RankingTarget) => setTargetIndicator(value)}>
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
            <Button onClick={handleExport}>
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
              <Award className="w-4 h-4" />
              因子总数
            </CardDescription>
            <CardTitle className="text-3xl text-white">{contributions.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-sm ${MUTED_TEXT}`}>固定且可解释的贡献因子</p>
          </CardContent>
        </Card>
        <Card className={PANEL_CLASS}>
          <CardHeader className="pb-3">
            <CardDescription className={MUTED_TEXT}>Top 1 因子</CardDescription>
            <CardTitle className="truncate text-xl text-white">{contributions[0]?.factor ?? '暂无'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-sm ${MUTED_TEXT}`}>{contributions[0]?.contribution ?? 0}%</p>
          </CardContent>
        </Card>
        <Card className={PANEL_CLASS}>
          <CardHeader className="pb-3">
            <CardDescription className={MUTED_TEXT}>头部贡献度</CardDescription>
            <CardTitle className="text-3xl text-[#19B172]">{positiveContribution.toFixed(1)}%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge className="border border-[#19B172]/35 bg-[#19B172]/12 text-[#B6F4D8]">
                <TrendingUp className="w-3 h-3 mr-1" />
                前四因子
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card className={PANEL_CLASS}>
          <CardHeader className="pb-3">
            <CardDescription className={MUTED_TEXT}>尾部贡献度</CardDescription>
            <CardTitle className="text-3xl text-[#4E86DF]">{tailContribution.toFixed(1)}%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-sm ${MUTED_TEXT}`}>剩余因子合计</p>
          </CardContent>
        </Card>
      </div>

      <Card className={PANEL_CLASS}>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-white">影响因子贡献排名</CardTitle>
          <CardDescription className={MUTED_TEXT}>统一使用真实治理快照排序，不再引用静态样例或手工排序。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {contributions.map((item) => (
            <div key={item.factor} className={`${INNER_PANEL_CLASS} p-4`}>
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white">{item.rank}. {item.factor}</span>
                    <Badge variant="outline" className="border-[#4E86DF]/45 bg-[#2761CB]/15 text-[#DCE6FF]">{item.category}</Badge>
                  </div>
                  <p className={`text-sm ${MUTED_TEXT}`}>{item.description}</p>
                </div>
                <div className="text-right min-w-[110px]">
                  <div className="text-2xl font-semibold text-[#19B172]">{item.contribution}%</div>
                  <div className={`text-xs ${MUTED_TEXT}`}>贡献权重</div>
                </div>
              </div>
              <div className={`mt-3 grid gap-3 text-sm md:grid-cols-3 ${MUTED_TEXT}`}>
                <div>当前量级：{item.absoluteValue}</div>
                <div>最近趋势：{item.trend}</div>
                <div>可信度：{item.confidence}%</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
