import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Users,
  Trophy,
  RefreshCw,
  ChevronRight,
  FileText,
  Download,
  Info,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  PERFORMANCE_SCORE_WEIGHTS,
  type PerformanceScoreKey,
  type StatsPerformanceItem,
  type StatsQualityAlertItem,
  statsRepository,
} from '../../services/repositories/statsRepository';
import { PageHeader } from './PageHeader';
import { StatCard } from '../patterns/StatCard';
import { SearchInput } from '../patterns/FilterBar';
import { DIALOG_CLASS } from '../patterns/surfaces';

type ViewLevel = 'district' | 'street' | 'community' | 'grid';
type SortDirection = 'asc' | 'desc';
type PerformanceSortKey = PerformanceScoreKey | 'totalScore';

interface AggregatedItem {
  name: string;
  type: ViewLevel;
  workerCount: number;
  scores: {
    visitFreq: number;
    visitQuality: number;
    infoComplete: number;
    taskCount: number;
    taskSpeed: number;
  };
  totalScore: number;
  rank: number;
}

const VIEW_LABELS: Record<ViewLevel, string> = {
  district: '区县',
  street: '街道/镇',
  community: '社区',
  grid: '网格员',
};

const SCORE_LABELS: Record<PerformanceScoreKey, { label: string; short: string; desc: string }> = {
  visitFreq: { label: '走访频次', short: '频次', desc: '一定时间内的走访次数，标准化为0-100分' },
  visitQuality: { label: '走访质量', short: '质量', desc: '每次走访记录内容的平均质量评分' },
  infoComplete: { label: '信息完善度', short: '完善', desc: '辖区内居民信息的填写完整率' },
  taskCount: { label: '任务完成量', short: '任务', desc: '通过移动端完成待办任务的数量' },
  taskSpeed: { label: '响应速度', short: '速度', desc: '完成任务的平均耗时，越快得分越高' },
};

const DARK_CARD_CLASS =
  'rounded-[8px] border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)] shadow-none';
const DARK_INPUT_CLASS =
  'border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)] placeholder:text-[var(--color-neutral-08)]';
const DARK_BADGE_CLASS =
  'border border-[var(--color-neutral-03)] bg-[var(--color-neutral-03)] text-[var(--color-neutral-10)] hover:bg-[var(--color-neutral-03)]';

function avgScores(items: { scores: AggregatedItem['scores']; totalScore: number }[]): { scores: AggregatedItem['scores']; totalScore: number } {
  if (items.length === 0) return { scores: { visitFreq: 0, visitQuality: 0, infoComplete: 0, taskCount: 0, taskSpeed: 0 }, totalScore: 0 };
  const sum = { visitFreq: 0, visitQuality: 0, infoComplete: 0, taskCount: 0, taskSpeed: 0 };
  let totalSum = 0;
  for (const item of items) {
    sum.visitFreq += item.scores.visitFreq;
    sum.visitQuality += item.scores.visitQuality;
    sum.infoComplete += item.scores.infoComplete;
    sum.taskCount += item.scores.taskCount;
    sum.taskSpeed += item.scores.taskSpeed;
    totalSum += item.totalScore;
  }
  const n = items.length;
  return {
    scores: {
      visitFreq: parseFloat((sum.visitFreq / n).toFixed(1)),
      visitQuality: parseFloat((sum.visitQuality / n).toFixed(1)),
      infoComplete: parseFloat((sum.infoComplete / n).toFixed(1)),
      taskCount: parseFloat((sum.taskCount / n).toFixed(1)),
      taskSpeed: parseFloat((sum.taskSpeed / n).toFixed(1)),
    },
    totalScore: parseFloat((totalSum / n).toFixed(1)),
  };
}

export function BehaviorSupervision() {
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  const [briefingType, setBriefingType] = useState('weekly');
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortState, setSortState] = useState<{ key: PerformanceSortKey; direction: SortDirection }>({
    key: 'totalScore',
    direction: 'desc',
  });

  // Navigation
  const [viewLevel, setViewLevel] = useState<ViewLevel>('district');
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedStreet, setSelectedStreet] = useState<string | null>(null);
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [allWorkers, setAllWorkers] = useState<StatsPerformanceItem[]>([]);
  const [qualityAlerts, setQualityAlerts] = useState<StatsQualityAlertItem[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string>('');
  const [totals, setTotals] = useState({ people: 0, houses: 0, visits: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const performance = await statsRepository.getPerformanceStats();
        if (!active) {
          return;
        }
        setAllWorkers(performance.workers);
        setQualityAlerts(performance.qualityAlerts);
        setGeneratedAt(performance.metadata.generatedAt);
        setTotals({
          people: performance.metadata.totalPeople,
          houses: performance.metadata.totalHouses,
          visits: performance.metadata.totalVisits,
        });
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  // 按层级聚合
  const statsData = useMemo(() => {
    let items: AggregatedItem[] = [];

    if (viewLevel === 'district') {
      const groups = new Map<string, typeof allWorkers>();
      allWorkers.forEach(w => {
        const arr = groups.get(w.districtName) || [];
        arr.push(w);
        groups.set(w.districtName, arr);
      });
      items = Array.from(groups.entries()).map(([name, workers]) => {
        const agg = avgScores(workers);
        return { name, type: 'district' as ViewLevel, workerCount: workers.length, ...agg, rank: 0 };
      });
    } else if (viewLevel === 'street') {
      const filtered = selectedDistrict ? allWorkers.filter(w => w.districtName === selectedDistrict) : allWorkers;
      const groups = new Map<string, typeof allWorkers>();
      filtered.forEach(w => {
        const arr = groups.get(w.streetName) || [];
        arr.push(w);
        groups.set(w.streetName, arr);
      });
      items = Array.from(groups.entries()).map(([name, workers]) => {
        const agg = avgScores(workers);
        return { name, type: 'street' as ViewLevel, workerCount: workers.length, ...agg, rank: 0 };
      });
    } else if (viewLevel === 'community') {
      const filtered = allWorkers.filter(w =>
        (!selectedDistrict || w.districtName === selectedDistrict) &&
        (!selectedStreet || w.streetName === selectedStreet)
      );
      const groups = new Map<string, typeof allWorkers>();
      filtered.forEach(w => {
        const arr = groups.get(w.communityName) || [];
        arr.push(w);
        groups.set(w.communityName, arr);
      });
      items = Array.from(groups.entries()).map(([name, workers]) => {
        const agg = avgScores(workers);
        return { name, type: 'community' as ViewLevel, workerCount: workers.length, ...agg, rank: 0 };
      });
    } else {
      // grid level — individual workers
      const filtered = allWorkers.filter(w =>
        (!selectedDistrict || w.districtName === selectedDistrict) &&
        (!selectedStreet || w.streetName === selectedStreet) &&
        (!selectedCommunity || w.communityName === selectedCommunity)
      );
      items = filtered.map(w => ({
        name: w.name,
        type: 'grid' as ViewLevel,
        workerCount: 1,
        scores: { ...w.scores },
        totalScore: w.totalScore,
        rank: 0,
      }));
    }

    // 搜索过滤
    if (searchQuery.trim()) {
      items = items.filter(i => i.name.includes(searchQuery.trim()));
    }

    const rankedByTotal = [...items].sort((a, b) => b.totalScore - a.totalScore || a.name.localeCompare(b.name, 'zh-CN'));
    const rankByName = new Map(rankedByTotal.map((item, index) => [item.name, index + 1]));
    items.forEach((item) => {
      item.rank = rankByName.get(item.name) ?? 0;
    });
    items.sort((left, right) => {
      const leftValue = sortState.key === 'totalScore' ? left.totalScore : left.scores[sortState.key];
      const rightValue = sortState.key === 'totalScore' ? right.totalScore : right.scores[sortState.key];
      const delta = sortState.direction === 'desc' ? rightValue - leftValue : leftValue - rightValue;
      return delta || left.rank - right.rank || left.name.localeCompare(right.name, 'zh-CN');
    });
    return items;
  }, [viewLevel, selectedDistrict, selectedStreet, selectedCommunity, searchQuery, allWorkers, sortState]);

  // 概览数据
  const overviewStats = useMemo(() => {
    if (allWorkers.length === 0) {
      return {
        workerCount: 0,
        avgScore: '0.0',
        bestCommunity: '暂无',
        needImproveCount: 0,
      };
    }

    const avgTotal = allWorkers.reduce((s, w) => s + w.totalScore, 0) / allWorkers.length;
    const commGroups = new Map<string, number[]>();
    allWorkers.forEach(w => {
      const arr = commGroups.get(w.communityName) || [];
      arr.push(w.totalScore);
      commGroups.set(w.communityName, arr);
    });
    let bestComm = '';
    let bestCommScore = 0;
    commGroups.forEach((scores, name) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avg > bestCommScore) { bestCommScore = avg; bestComm = name; }
    });
    const needImprove = allWorkers.filter(w => w.totalScore < 70).length;
    return {
      workerCount: allWorkers.length,
      avgScore: avgTotal.toFixed(1),
      bestCommunity: bestComm,
      needImproveCount: needImprove,
    };
  }, [allWorkers]);

  const topWorker = allWorkers[0];

  const handleItemClick = (item: AggregatedItem) => {
    if (viewLevel === 'district') {
      setSelectedDistrict(item.name);
      setViewLevel('street');
    } else if (viewLevel === 'street') {
      setSelectedStreet(item.name);
      setViewLevel('community');
    } else if (viewLevel === 'community') {
      setSelectedCommunity(item.name);
      setViewLevel('grid');
    }
  };

  const handleLevelChange = (level: ViewLevel) => {
    setViewLevel(level);
    if (level === 'district') {
      setSelectedDistrict(null); setSelectedStreet(null); setSelectedCommunity(null);
    } else if (level === 'street') {
      setSelectedStreet(null); setSelectedCommunity(null);
    } else if (level === 'community') {
      setSelectedCommunity(null);
    }
  };

  const handleSort = (key: PerformanceSortKey) => {
    setSortState((current) => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  // 得分颜色
  const scoreColor = (score: number) => {
    if (score >= 85) return 'text-[var(--color-status-success-text)]';
    if (score >= 70) return 'text-[var(--color-brand-text)]';
    if (score >= 55) return 'text-[var(--color-status-warning-text)]';
    return 'text-[var(--color-status-error-text)]';
  };

  return (
    <div className="space-y-4 text-[var(--color-neutral-10)]">
      <PageHeader
        eyebrow="BEHAVIOR SUPERVISION"
        title="行为督导中心"
        description="汇总网格员走访、待办和闭环质量，识别需要督办的执行短板。"
        actions={
          <Dialog open={isBriefingOpen} onOpenChange={setIsBriefingOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)] hover:bg-[var(--color-neutral-03)] hover:text-[var(--color-neutral-11)]">
                <FileText className="w-4 h-4" />
                生成简报
              </Button>
            </DialogTrigger>
            <DialogContent className={`max-w-2xl ${DIALOG_CLASS}`} aria-describedby="briefing-desc">
              <DialogHeader>
                <DialogTitle>自动生成绩效简报</DialogTitle>
                <DialogDescription id="briefing-desc" className="text-[var(--color-neutral-08)]">基于当前数据自动生成工作汇报，支持导出PDF或发送邮件。</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>简报类型</Label>
                    <Select value={briefingType} onValueChange={setBriefingType}>
                      <SelectTrigger className={DARK_INPUT_CLASS}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">日报</SelectItem>
                        <SelectItem value="weekly">周报</SelectItem>
                        <SelectItem value="monthly">月报</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>数据范围</Label>
                    <Select defaultValue="all">
                      <SelectTrigger className={DARK_INPUT_CLASS}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全辖区</SelectItem>
                        <SelectItem value="district">按区县</SelectItem>
                        <SelectItem value="street">按街道</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>简报预览</Label>
                  <div className="min-h-[200px] rounded-md border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] p-4 text-sm leading-relaxed text-[var(--color-neutral-10)]">
                    <p className="font-bold mb-2 text-center text-lg">{briefingType === 'daily' ? '每日' : briefingType === 'weekly' ? '每周' : '每月'}工作绩效简报</p>
                    <p className="mb-2 text-center text-xs text-[var(--color-neutral-08)]">生成时间: {generatedAt || '数据加载中'}</p>
                    <div className="space-y-2">
                      <p><strong>一、总体情况</strong></p>
                      <p>本{briefingType === 'daily' ? '日' : briefingType === 'weekly' ? '周' : '月'}辖区累计沉淀 {totals.visits} 条走访记录，覆盖 {totals.people} 名居民、{totals.houses} 套房屋，当前平均综合得分为 {overviewStats.avgScore}。</p>
                      <p><strong>二、亮点分析</strong></p>
                      <p>{topWorker ? `${topWorker.name}（${topWorker.gridName}）当前位居首位，综合得分 ${topWorker.totalScore}；${overviewStats.bestCommunity} 在同层级对比中保持领先。` : '当前尚无可用于生成亮点分析的数据。'}</p>
                      <p><strong>三、问题预警</strong></p>
                      <p>{qualityAlerts[0] ? `当前最突出的预警为“${qualityAlerts[0].type}”，共 ${qualityAlerts[0].count} 条，集中在 ${qualityAlerts[0].area}，建议优先处理。` : '当前未发现显著异常预警。'}</p>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className="border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)] hover:bg-[var(--color-neutral-03)]" onClick={() => setIsBriefingOpen(false)}>取消</Button>
                <Button className="gap-2">
                  <Download className="w-4 h-4" /> 导出 PDF
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {loading && (
        <Card className={`${DARK_CARD_CLASS} border-dashed`}>
          <CardContent className="p-4 text-sm text-[var(--color-neutral-08)]">正在刷新真实督导口径...</CardContent>
        </Card>
      )}

      {/* 数据主链状态 */}
      <Card className={DARK_CARD_CLASS}>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg border border-[var(--color-brand-primary-hover)]/30 bg-[var(--color-brand-primary-hover)]/15 p-3">
                <RefreshCw className="w-6 h-6 text-[var(--color-brand-text)]" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-[var(--color-neutral-11)]">治理数据主链已联通</h3>
                <div className="flex items-center gap-2 text-sm text-[var(--color-neutral-08)] mt-1">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-status-success)]"></span>
                    连接状态: 正常
                  </span>
                  <span className="w-px h-3 bg-[var(--color-neutral-03)]"></span>
                  <span>统计口径: 真实走访 / 待办 / 档案完整度</span>
                  <span className="w-px h-3 bg-[var(--color-neutral-03)]"></span>
                  <span>最近刷新: {generatedAt || '加载中'}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-8">
              <div className="text-center">
                <div className="mb-1 text-sm text-[var(--color-neutral-08)]">居民档案</div>
                <div className="text-xl font-bold text-[var(--color-neutral-11)]">{totals.people}</div>
              </div>
              <div className="text-center">
                <div className="mb-1 text-sm text-[var(--color-neutral-08)]">房屋档案</div>
                <div className="text-xl font-bold text-[var(--color-neutral-11)]">{totals.houses}</div>
              </div>
              <div className="text-center">
                <div className="mb-1 text-sm text-[var(--color-neutral-08)]">走访记录</div>
                <div className="text-xl font-bold text-[var(--color-neutral-11)]">{totals.visits}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="活跃网格员" value={overviewStats.workerCount} icon={Users} tone="brand" />
        <StatCard label="平均综合得分" value={overviewStats.avgScore} icon={Trophy} tone="success" />
        <StatCard label="最优社区" value={overviewStats.bestCommunity} icon={CheckCircle2} tone="brand" />
        <StatCard label="待改进网格员" value={overviewStats.needImproveCount} icon={AlertCircle} tone="warning" />
      </div>

      <Card className={`${DARK_CARD_CLASS} gap-0`}>
        <CardHeader className="border-b border-[var(--color-neutral-03)] px-5 py-3">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-[var(--color-neutral-11)]">
              <Trophy className="h-4 w-4 text-[var(--color-brand-text)]" />
              绩效排名
            </CardTitle>
            <button
              type="button"
              onClick={() => setIsRulesOpen(true)}
              className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-sm font-medium text-[var(--color-brand-text)] transition-colors hover:bg-[var(--color-brand-primary)]/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-primary-hover)]"
            >
              <span>评分规则说明</span>
              <Info className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
            <div className="mb-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <Tabs value={viewLevel} onValueChange={(v) => handleLevelChange(v as ViewLevel)} className="w-auto">
                  <TabsList className="bg-transparent h-auto p-0 gap-3 justify-start">
                    {(['district', 'street', 'community', 'grid'] as ViewLevel[]).map(level => (
                      <TabsTrigger
                        key={level}
                        value={level}
                        className="rounded border border-transparent px-4 py-1.5 font-bold text-[var(--color-neutral-08)] transition-all hover:text-[var(--color-neutral-11)] data-[state=active]:bg-[var(--color-brand-primary)]/20 data-[state=active]:text-[var(--color-brand-primary-hover)] data-[state=active]:shadow-none"
                      >
                        {VIEW_LABELS[level]}排名
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>

                <div className="flex gap-2 w-full md:w-auto">
                  <SearchInput
                    className="w-full md:w-64"
                    placeholder={`搜索${VIEW_LABELS[viewLevel]}...`}
                    value={searchQuery}
                    onChange={setSearchQuery}
                  />
                </div>
              </div>

              {(selectedDistrict || selectedStreet || selectedCommunity) && (
                <div className="mt-2 flex items-center gap-2 text-xs text-[var(--color-neutral-08)]">
                  <span>当前筛选:</span>
                  {selectedDistrict && <Badge variant="secondary" className={DARK_BADGE_CLASS}>{selectedDistrict}</Badge>}
                  {selectedStreet && <Badge variant="secondary" className={DARK_BADGE_CLASS}>{selectedStreet}</Badge>}
                  {selectedCommunity && <Badge variant="secondary" className={DARK_BADGE_CLASS}>{selectedCommunity}</Badge>}
                  <Button variant="ghost" size="sm" className="h-5 px-2 text-xs text-[var(--color-brand-text)] hover:bg-[var(--color-neutral-03)] hover:text-[var(--color-brand-primary-hover)]" onClick={() => {
                    setSelectedDistrict(null); setSelectedStreet(null); setSelectedCommunity(null);
                  }}>
                    清除筛选
                  </Button>
                </div>
              )}
            </div>

              {/* 表头 */}
              <div className="mb-2 hidden grid-cols-[72px_1fr_repeat(6,80px)] gap-2 border-b border-[var(--color-neutral-03)] px-4 py-2 text-xs font-medium text-[var(--color-neutral-08)] md:grid">
                <div className="text-center">综合排名</div>
                <div>{VIEW_LABELS[viewLevel]}</div>
                {(Object.entries(SCORE_LABELS) as [PerformanceScoreKey, typeof SCORE_LABELS[PerformanceScoreKey]][]).map(([key, meta]) => {
                  const active = sortState.key === key;
                  const SortIcon = !active ? ArrowUpDown : sortState.direction === 'asc' ? ArrowUp : ArrowDown;
                  return (
                    <div key={key}>
                      <button
                        type="button"
                        data-testid={`performance-sort-${key}`}
                        data-sort-direction={active ? sortState.direction : 'none'}
                        aria-pressed={active}
                        aria-label={`按${meta.label}${active && sortState.direction === 'desc' ? '升序' : '降序'}排列`}
                        onClick={() => handleSort(key)}
                        className={`inline-flex w-full items-center justify-center gap-1 rounded px-1 py-1 transition-colors hover:bg-[var(--color-brand-primary)]/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-brand-primary-hover)] ${active ? 'text-[var(--color-brand-text)]' : ''}`}
                      >
                        <span>{meta.short}</span>
                        <SortIcon className={`h-3.5 w-3.5 ${active ? '' : 'opacity-55'}`} aria-hidden="true" />
                      </button>
                    </div>
                  );
                })}
                {(() => {
                  const active = sortState.key === 'totalScore';
                  const SortIcon = !active ? ArrowUpDown : sortState.direction === 'asc' ? ArrowUp : ArrowDown;
                  return (
                    <div>
                      <button
                        type="button"
                        data-testid="performance-sort-totalScore"
                        data-sort-direction={active ? sortState.direction : 'none'}
                        aria-pressed={active}
                        aria-label={`按综合得分${active && sortState.direction === 'desc' ? '升序' : '降序'}排列`}
                        onClick={() => handleSort('totalScore')}
                        className={`inline-flex w-full items-center justify-center gap-1 rounded px-1 py-1 font-bold transition-colors hover:bg-[var(--color-brand-primary)]/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-brand-primary-hover)] ${active ? 'text-[var(--color-brand-text)]' : ''}`}
                      >
                        <span>综合</span>
                        <SortIcon className={`h-3.5 w-3.5 ${active ? '' : 'opacity-55'}`} aria-hidden="true" />
                      </button>
                    </div>
                  );
                })()}
              </div>

              <div className="space-y-2">
                {statsData.length === 0 && (
                  <div className="py-10 text-center text-[var(--color-neutral-08)]">暂无数据</div>
                )}
                {statsData.map((item) => (
                  <div
                    key={item.name}
                    data-testid="performance-ranking-row"
                    data-total-score={item.totalScore}
                    data-visit-freq={item.scores.visitFreq}
                    data-visit-quality={item.scores.visitQuality}
                    data-info-complete={item.scores.infoComplete}
                    data-task-count={item.scores.taskCount}
                    data-task-speed={item.scores.taskSpeed}
                    className={`group grid grid-cols-1 items-center gap-2 rounded-lg border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] p-4 transition-colors hover:bg-[var(--color-neutral-03)] md:grid-cols-[72px_1fr_repeat(6,80px)] ${viewLevel !== 'grid' ? 'cursor-pointer' : ''}`}
                    onClick={() => viewLevel !== 'grid' && handleItemClick(item)}
                  >
                    {/* 排名 */}
                    <div className="flex justify-center">
                      <div className={`w-9 h-9 flex items-center justify-center rounded-full font-bold text-sm ${
                        item.rank === 1 ? 'bg-[var(--color-status-warning)]/20 text-[var(--color-status-warning-text)] border border-[var(--color-status-warning)]/35' :
                        item.rank === 2 ? 'bg-[var(--color-neutral-03)] text-[var(--color-neutral-10)] border border-[var(--color-neutral-08)]/30' :
                        item.rank === 3 ? 'bg-[var(--color-brand-primary-hover)]/15 text-[var(--color-brand-text)] border border-[var(--color-brand-primary-hover)]/30' :
                        'bg-[var(--color-neutral-03)] text-[var(--color-neutral-10)] border border-[var(--color-neutral-04)]'
                      }`}>
                        {item.rank}
                      </div>
                    </div>

                    {/* 名称 */}
                    <div>
                      <div className="font-bold text-[var(--color-neutral-11)] transition-colors group-hover:text-[var(--color-brand-primary-hover)]">
                        {item.name}
                      </div>
                      <div className="text-xs text-[var(--color-neutral-08)]">
                        {viewLevel === 'grid' ? '网格员' : `${item.workerCount} 名网格员`}
                      </div>
                    </div>

                    {/* 五维得分 */}
                    {(Object.keys(PERFORMANCE_SCORE_WEIGHTS) as PerformanceScoreKey[]).map(key => (
                      <div key={key} className="text-center">
                        <span className={`font-semibold text-sm ${scoreColor(item.scores[key])}`}>
                          {item.scores[key]}
                        </span>
                        <div className="md:hidden text-xs text-[var(--color-neutral-08)]">{SCORE_LABELS[key].short}</div>
                      </div>
                    ))}

                    {/* 综合得分 */}
                    <div className="text-center">
                      <span className={`font-bold text-lg ${scoreColor(item.totalScore)}`}>
                        {item.totalScore}
                      </span>
                      <div className="md:hidden text-xs text-[var(--color-neutral-08)]">综合</div>
                    </div>

                    {viewLevel !== 'grid' && (
                      <ChevronRight className="w-4 h-4 text-[var(--color-neutral-06)] opacity-0 group-hover:opacity-100 transition-opacity hidden md:block absolute right-4" />
                    )}
                  </div>
                ))}
              </div>
        </CardContent>
      </Card>

      <Dialog open={isRulesOpen} onOpenChange={setIsRulesOpen}>
        <DialogContent className={`max-w-4xl ${DIALOG_CLASS}`}>
          <DialogHeader>
            <DialogTitle>评分规则说明</DialogTitle>
            <DialogDescription className="text-[var(--color-neutral-08)]">
              综合得分 = 走访频次×25% + 走访质量×25% + 信息完善度×20% + 任务完成量×15% + 响应速度×15%
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            {(Object.entries(SCORE_LABELS) as [PerformanceScoreKey, typeof SCORE_LABELS[PerformanceScoreKey]][]).map(([key, meta]) => (
              <div key={key} className="rounded-lg border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-[var(--color-neutral-11)]">{meta.label}</span>
                  <Badge variant="outline" className={DARK_BADGE_CLASS}>{PERFORMANCE_SCORE_WEIGHTS[key] * 100}%</Badge>
                </div>
                <p className="text-xs leading-5 text-[var(--color-neutral-08)]">{meta.desc}</p>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-[var(--color-brand-primary-hover)]/25 bg-[var(--color-brand-primary-hover)]/10 p-3 text-xs leading-5 text-[var(--color-brand-text)]">
            <strong>聚合规则：</strong>上级单位得分 = 下辖单位得分的算术平均。区县视角排名街道/镇，街道视角排名社区，社区视角排名网格员。不越级考核。
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
