import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Users,
  Trophy,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  FileText,
  Download,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
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

type ViewLevel = 'district' | 'street' | 'community' | 'grid';

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
const DARK_DIALOG_CLASS =
  'border border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)] shadow-2xl';
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
  const [activeTab, setActiveTab] = useState('performance');
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  const [briefingType, setBriefingType] = useState('weekly');
  const [showFormula, setShowFormula] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

    // 排序
    items.sort((a, b) => b.totalScore - a.totalScore);
    items.forEach((item, idx) => item.rank = idx + 1);
    return items;
  }, [viewLevel, selectedDistrict, selectedStreet, selectedCommunity, searchQuery, allWorkers]);

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

  // 得分颜色
  const scoreColor = (score: number) => {
    if (score >= 85) return 'text-[#19B172]';
    if (score >= 70) return 'text-[#4E86DF]';
    if (score >= 55) return 'text-[#D6730D]';
    return 'text-[#D52132]';
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
            <DialogContent className={`max-w-2xl ${DARK_DIALOG_CLASS}`} aria-describedby="briefing-desc">
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
                <Button className="gap-2 bg-[#4E86DF] text-white hover:bg-[#3f75c8]">
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
              <div className="rounded-lg border border-[#4E86DF]/30 bg-[#4E86DF]/15 p-3">
                <RefreshCw className="w-6 h-6 text-[#4E86DF]" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-[var(--color-neutral-11)]">治理数据主链已联通</h3>
                <div className="flex items-center gap-2 text-sm text-[var(--color-neutral-08)] mt-1">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#19B172]"></span>
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
        <Card className={DARK_CARD_CLASS}>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-[#4E86DF]/15 p-3 text-[#4E86DF]">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm text-[var(--color-neutral-08)]">活跃网格员</div>
              <div className="text-2xl font-bold text-[var(--color-neutral-11)]">{overviewStats.workerCount}</div>
            </div>
          </CardContent>
        </Card>
        <Card className={DARK_CARD_CLASS}>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-[#19B172]/15 p-3 text-[#19B172]">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm text-[var(--color-neutral-08)]">平均综合得分</div>
              <div className="text-2xl font-bold text-[var(--color-neutral-11)]">{overviewStats.avgScore}</div>
            </div>
          </CardContent>
        </Card>
        <Card className={DARK_CARD_CLASS}>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-[#4E86DF]/15 p-3 text-[#4E86DF]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm text-[var(--color-neutral-08)]">最优社区</div>
              <div className="text-2xl font-bold text-[var(--color-neutral-11)]">{overviewStats.bestCommunity}</div>
            </div>
          </CardContent>
        </Card>
        <Card className={DARK_CARD_CLASS}>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-[#D6730D]/15 p-3 text-[#D6730D]">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm text-[var(--color-neutral-08)]">待改进网格员</div>
              <div className="text-2xl font-bold text-[var(--color-neutral-11)]">{overviewStats.needImproveCount}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)]">
          <TabsTrigger value="performance" className="gap-2">
            <Trophy className="w-4 h-4" />
            绩效排名
          </TabsTrigger>
          <TabsTrigger value="quality" className="gap-2">
            <AlertCircle className="w-4 h-4" />
            数据质量监控
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          {/* 评分公式说明 */}
          <Card className={DARK_CARD_CLASS}>
            <button
              className="flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-[var(--color-neutral-03)]"
              onClick={() => setShowFormula(!showFormula)}
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-[#4E86DF]" />
                <span className="font-semibold text-[var(--color-neutral-11)]">评分规则说明</span>
                <Badge variant="secondary" className={DARK_BADGE_CLASS}>
                  综合得分 = 走访频次×25% + 走访质量×25% + 信息完善度×20% + 任务完成量×15% + 响应速度×15%
                </Badge>
              </div>
              <ChevronDown className={`w-4 h-4 text-[var(--color-neutral-08)] transition-transform ${showFormula ? 'rotate-180' : ''}`} />
            </button>
            {showFormula && (
              <CardContent className="pt-0 pb-4 px-6">
                <div className="border-t border-[var(--color-neutral-03)] pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {(Object.entries(SCORE_LABELS) as [PerformanceScoreKey, typeof SCORE_LABELS[PerformanceScoreKey]][]).map(([key, meta]) => (
                      <div key={key} className="p-3 rounded-lg bg-[var(--color-neutral-02)] border border-[var(--color-neutral-03)]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm text-[var(--color-neutral-11)]">{meta.label}</span>
                          <Badge variant="outline" className={DARK_BADGE_CLASS}>{(PERFORMANCE_SCORE_WEIGHTS[key] * 100)}%</Badge>
                        </div>
                        <p className="text-xs text-[var(--color-neutral-08)]">{meta.desc}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-lg border border-[#4E86DF]/25 bg-[#4E86DF]/10 p-3 text-xs text-[#4E86DF]">
                    <strong>聚合规则：</strong>上级单位得分 = 下辖单位得分的算术平均。区县视角排名街道/镇，街道视角排名社区，社区视角排名网格员。不越级考核。
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* 排名列表 */}
          <Card className={DARK_CARD_CLASS}>
            <CardHeader className="pb-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <Tabs value={viewLevel} onValueChange={(v) => handleLevelChange(v as ViewLevel)} className="w-auto">
                  <TabsList className="bg-transparent h-auto p-0 gap-3 justify-start">
                    {(['district', 'street', 'community', 'grid'] as ViewLevel[]).map(level => (
                      <TabsTrigger
                        key={level}
                        value={level}
                        className="rounded border border-transparent px-4 py-1.5 font-bold text-[var(--color-neutral-08)] transition-all hover:text-[var(--color-neutral-11)] data-[state=active]:border-2 data-[state=active]:border-[#4E86DF] data-[state=active]:bg-transparent data-[state=active]:text-[#4E86DF] data-[state=active]:shadow-none"
                      >
                        {VIEW_LABELS[level]}排名
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>

                <div className="flex gap-2 w-full md:w-auto">
                  <Input
                    placeholder={`搜索${VIEW_LABELS[viewLevel]}...`}
                    className={`w-full md:w-64 ${DARK_INPUT_CLASS}`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {(selectedDistrict || selectedStreet || selectedCommunity) && (
                <div className="mt-2 flex items-center gap-2 text-xs text-[var(--color-neutral-08)]">
                  <span>当前筛选:</span>
                  {selectedDistrict && <Badge variant="secondary" className={DARK_BADGE_CLASS}>{selectedDistrict}</Badge>}
                  {selectedStreet && <Badge variant="secondary" className={DARK_BADGE_CLASS}>{selectedStreet}</Badge>}
                  {selectedCommunity && <Badge variant="secondary" className={DARK_BADGE_CLASS}>{selectedCommunity}</Badge>}
                  <Button variant="ghost" size="sm" className="h-5 px-2 text-xs text-[#4E86DF] hover:bg-[var(--color-neutral-03)] hover:text-[#4E86DF]" onClick={() => {
                    setSelectedDistrict(null); setSelectedStreet(null); setSelectedCommunity(null);
                  }}>
                    清除筛选
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {/* 表头 */}
              <div className="hidden md:grid grid-cols-[56px_1fr_repeat(6,80px)] gap-2 px-4 py-2 text-xs text-[var(--color-neutral-08)] font-medium border-b border-[var(--color-neutral-03)] mb-2">
                <div className="text-center">排名</div>
                <div>{VIEW_LABELS[viewLevel]}</div>
                {Object.values(SCORE_LABELS).map(meta => (
                  <div key={meta.short} className="text-center">{meta.short}</div>
                ))}
                <div className="text-center font-bold">综合</div>
              </div>

              <div className="space-y-2">
                {statsData.length === 0 && (
                  <div className="py-10 text-center text-[var(--color-neutral-08)]">暂无数据</div>
                )}
                {statsData.map((item) => (
                  <div
                    key={item.name}
                    className={`grid grid-cols-1 md:grid-cols-[56px_1fr_repeat(6,80px)] gap-2 items-center p-4 rounded-lg border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] hover:bg-[var(--color-neutral-03)] transition-colors group ${viewLevel !== 'grid' ? 'cursor-pointer' : ''}`}
                    onClick={() => viewLevel !== 'grid' && handleItemClick(item)}
                  >
                    {/* 排名 */}
                    <div className="flex justify-center">
                      <div className={`w-9 h-9 flex items-center justify-center rounded-full font-bold text-sm ${
                        item.rank === 1 ? 'bg-[#D6730D]/20 text-[#D6730D] border border-[#D6730D]/35' :
                        item.rank === 2 ? 'bg-[var(--color-neutral-03)] text-[var(--color-neutral-10)] border border-[var(--color-neutral-08)]/30' :
                        item.rank === 3 ? 'bg-[#4E86DF]/15 text-[#4E86DF] border border-[#4E86DF]/30' :
                        'bg-[var(--color-neutral-03)] text-[var(--color-neutral-08)] border border-[var(--color-neutral-04)]'
                      }`}>
                        {item.rank}
                      </div>
                    </div>

                    {/* 名称 */}
                    <div>
                      <div className="font-bold text-[var(--color-neutral-11)] transition-colors group-hover:text-[#4E86DF]">
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
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {qualityAlerts.map((alert) => (
              <Card key={alert.id} className={`${DARK_CARD_CLASS} border-l-4 border-l-[#D52132]`}>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-[#D52132]" />
                      <span className="font-bold text-[var(--color-neutral-11)]">{alert.type}</span>
                    </div>
                    <Badge variant="destructive">{alert.count} 条待修正</Badge>
                  </div>
                  <p className="mb-4 text-[var(--color-neutral-08)]">{alert.desc}</p>
                  <div className="flex items-center justify-between mt-4 text-sm">
                    <span className="rounded border border-[var(--color-neutral-03)] bg-[var(--color-neutral-03)] px-2 py-1 text-[var(--color-neutral-08)]">高发区域: {alert.area}</span>
                    <Button variant="link" className="h-auto p-0 text-[#4E86DF]">查看详情 &gt;</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
