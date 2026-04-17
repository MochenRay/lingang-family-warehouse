import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Trophy, Crown, Medal, Info, ChevronDown } from 'lucide-react';
import { MobileStatusBar } from './MobileStatusBar';
import { Card, CardContent } from '../ui/card';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { mobileContextRepository } from '../../services/repositories/mobileContextRepository';
import {
  PERFORMANCE_SCORE_WEIGHTS,
  type PerformanceScoreKey,
  type StatsPerformanceItem,
  statsRepository,
} from '../../services/repositories/statsRepository';

interface MobileStatsProps {
  onBack: () => void;
}

type ViewLevel = 'community' | 'street' | 'district';

const SCORE_LABELS: Record<PerformanceScoreKey, { label: string; short: string }> = {
  visitFreq: { label: '走访频次', short: '频次' },
  visitQuality: { label: '走访质量', short: '质量' },
  infoComplete: { label: '信息完善度', short: '完善' },
  taskCount: { label: '任务完成量', short: '任务' },
  taskSpeed: { label: '响应速度', short: '速度' },
};

const SCORE_KEYS = Object.keys(PERFORMANCE_SCORE_WEIGHTS) as PerformanceScoreKey[];

interface RankItem {
  name: string;
  workerCount: number;
  scores: Record<PerformanceScoreKey, number>;
  totalScore: number;
  rank: number;
  // 仅社区级有
  grid?: string;
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return parseFloat((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1));
}

function aggregate(workers: StatsPerformanceItem[], groupBy: (w: StatsPerformanceItem) => string): RankItem[] {
  const groups = new Map<string, StatsPerformanceItem[]>();
  workers.forEach(w => {
    const key = groupBy(w);
    const arr = groups.get(key) || [];
    arr.push(w);
    groups.set(key, arr);
  });

  const items: RankItem[] = Array.from(groups.entries()).map(([name, ws]) => ({
    name,
    workerCount: ws.length,
    scores: {
      visitFreq: avg(ws.map(w => w.scores.visitFreq)),
      visitQuality: avg(ws.map(w => w.scores.visitQuality)),
      infoComplete: avg(ws.map(w => w.scores.infoComplete)),
      taskCount: avg(ws.map(w => w.scores.taskCount)),
      taskSpeed: avg(ws.map(w => w.scores.taskSpeed)),
    },
    totalScore: avg(ws.map(w => w.totalScore)),
    rank: 0,
  }));

  items.sort((a, b) => b.totalScore - a.totalScore);
  items.forEach((item, idx) => item.rank = idx + 1);
  return items;
}

const scoreColor = (score: number) => {
  if (score >= 85) return 'text-green-600';
  if (score >= 70) return 'text-blue-600';
  if (score >= 55) return 'text-yellow-600';
  return 'text-red-500';
};

export function MobileStats({ onBack }: MobileStatsProps) {
  const [activeTab, setActiveTab] = useState<ViewLevel>('community');
  const [showFormula, setShowFormula] = useState(false);
  const [allWorkers, setAllWorkers] = useState<StatsPerformanceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const response = await statsRepository.getPerformanceStats();
        if (active) {
          setAllWorkers(response.workers);
        }
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

  const currentGridId = useMemo(() => mobileContextRepository.getCurrentGridSelection().id, []);

  const currentUser = useMemo(
    () => allWorkers.find((worker) => worker.gridId === currentGridId) ?? allWorkers[0],
    [allWorkers, currentGridId],
  );

  const rankings = useMemo(() => {
    if (!currentUser) {
      return [];
    }

    if (activeTab === 'community') {
      // 网格员个人排名（社区视角）
      const items: RankItem[] = allWorkers
        .filter(w => w.communityName === currentUser.communityName)
        .map(w => ({
          name: w.name,
          workerCount: 1,
          scores: { ...w.scores },
          totalScore: w.totalScore,
          rank: 0,
          grid: `${w.streetName}${w.communityName}`,
        }));
      items.sort((a, b) => b.totalScore - a.totalScore);
      items.forEach((item, idx) => item.rank = idx + 1);
      return items;
    } else if (activeTab === 'street') {
      // 社区排名（街道视角）
      const streetWorkers = allWorkers.filter(w => w.streetName === currentUser.streetName);
      return aggregate(streetWorkers, w => w.communityName);
    } else {
      // 街道排名（区县视角）
      const districtWorkers = allWorkers.filter(w => w.districtName === currentUser.districtName);
      return aggregate(districtWorkers, w => w.streetName);
    }
  }, [activeTab, allWorkers, currentUser]);

  // 当前用户的排名（根据 Tab 切换语境）
  const myRank = useMemo(() => {
    if (!currentUser) {
      return {
        rank: 0,
        total: 0,
        percentile: 0,
        scope: '暂无数据',
        scopeLabel: '暂无排名',
      };
    }

    if (activeTab === 'community') {
      // 社区 Tab：我在社区内网格员中的个人排名
      const peers = allWorkers.filter(w => w.communityName === currentUser.communityName);
      peers.sort((a, b) => b.totalScore - a.totalScore);
      const idx = peers.findIndex(w => w.id === currentUser.id);
      return {
        rank: idx + 1, total: peers.length,
        percentile: Math.round(((peers.length - idx) / peers.length) * 100),
        scope: currentUser.communityName,
        scopeLabel: '社区内个人排名',
      };
    } else if (activeTab === 'street') {
      // 街道 Tab：我所在社区在街道内的排名
      const streetWorkers = allWorkers.filter(w => w.streetName === currentUser.streetName);
      const commGroups = new Map<string, number[]>();
      streetWorkers.forEach(w => {
        const arr = commGroups.get(w.communityName) || [];
        arr.push(w.totalScore);
        commGroups.set(w.communityName, arr);
      });
      const commScores = Array.from(commGroups.entries()).map(([name, scores]) => ({
        name, avg: scores.reduce((a, b) => a + b, 0) / scores.length,
      }));
      commScores.sort((a, b) => b.avg - a.avg);
      const idx = commScores.findIndex(c => c.name === currentUser.communityName);
      return {
        rank: idx + 1, total: commScores.length,
        percentile: Math.round(((commScores.length - idx) / commScores.length) * 100),
        scope: currentUser.streetName,
        scopeLabel: '街道内社区排名',
      };
    } else {
      // 区县 Tab：我所在街道在区县内的排名
      const districtWorkers = allWorkers.filter(w => w.districtName === currentUser.districtName);
      const streetGroups = new Map<string, number[]>();
      districtWorkers.forEach(w => {
        const arr = streetGroups.get(w.streetName) || [];
        arr.push(w.totalScore);
        streetGroups.set(w.streetName, arr);
      });
      const streetScores = Array.from(streetGroups.entries()).map(([name, scores]) => ({
        name, avg: scores.reduce((a, b) => a + b, 0) / scores.length,
      }));
      streetScores.sort((a, b) => b.avg - a.avg);
      const idx = streetScores.findIndex(s => s.name === currentUser.streetName);
      return {
        rank: idx + 1, total: streetScores.length,
        percentile: Math.round(((streetScores.length - idx) / streetScores.length) * 100),
        scope: currentUser.districtName,
        scopeLabel: '区县内街道排名',
      };
    }
  }, [activeTab, allWorkers, currentUser]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-[#FFD700] fill-[#FFD700]" />;
      case 2: return <Medal className="w-5 h-5 text-[#C0C0C0] fill-[#E8E8E8]" />;
      case 3: return <Medal className="w-5 h-5 text-[#CD7F32] fill-[#F4A460]" />;
      default: return <span className="text-muted-foreground font-bold w-5 text-center">{rank}</span>;
    }
  };

  return (
    <div className="h-full bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-20">
        <MobileStatusBar variant="light" />
        <div className="px-4 h-[44px] flex items-center justify-between">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center -ml-2 hover:bg-[var(--color-neutral-03)] rounded-full active:scale-95 transition-all"
          >
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </button>
          <h1 className="text-base font-bold text-foreground">绩效排名</h1>
          <div className="w-10" />
        </div>

        <Tabs value={activeTab} className="w-full" onValueChange={(v) => setActiveTab(v as ViewLevel)}>
          <TabsList className="w-full justify-between bg-card px-6 h-10 border-b border-border rounded-none">
            <TabsTrigger
              value="community"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-0 pb-2 bg-transparent shadow-none"
            >
              社区排名
            </TabsTrigger>
            <TabsTrigger
              value="street"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-0 pb-2 bg-transparent shadow-none"
            >
              街道排名
            </TabsTrigger>
            <TabsTrigger
              value="district"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-0 pb-2 bg-transparent shadow-none"
            >
              区县排名
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
        {loading && (
          <div className="mb-4 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            正在刷新真实绩效口径...
          </div>
        )}

        {/* 个人成绩卡 */}
        <div className="mb-4 relative overflow-hidden rounded-2xl bg-card border border-border shadow-sm">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Trophy className="w-32 h-32 transform rotate-12 translate-x-8 -translate-y-8" />
          </div>

          <div className="p-5 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 border-2 border-border">
                  <AvatarFallback className="bg-[var(--color-neutral-03)] text-foreground">{currentUser?.name.slice(-1) ?? '--'}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-muted-foreground text-xs mb-1">{myRank.scope} · {myRank.scopeLabel}</div>
                  <div className="text-2xl font-bold flex items-baseline gap-1.5 text-foreground">
                    NO.{myRank.rank}
                    <span className="text-xs font-normal text-muted-foreground bg-[var(--color-neutral-03)] px-2 py-0.5 rounded-full">
                      {myRank.rank}/{myRank.total}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 五维得分 */}
            <div className="grid grid-cols-3 gap-2 mb-2">
              {SCORE_KEYS.map(key => (
                <div key={key} className="bg-[var(--color-neutral-02)] rounded-lg p-2 text-center">
                  <div className="text-muted-foreground text-[10px] mb-0.5">{SCORE_LABELS[key].short}</div>
                  <div className={`font-bold text-base ${scoreColor(currentUser?.scores[key] ?? 0)}`}>
                    {currentUser?.scores[key] ?? '--'}
                  </div>
                </div>
              ))}
              <div className="bg-[var(--color-neutral-02)] rounded-lg p-2 text-center">
                <div className="text-muted-foreground text-[10px] mb-0.5">综合</div>
                <div className={`font-bold text-base ${scoreColor(currentUser?.totalScore ?? 0)}`}>
                  {currentUser?.totalScore ?? '--'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 评分公式（可折叠） */}
        <button
          className="w-full flex items-center justify-between px-3 py-2.5 mb-4 rounded-lg bg-blue-600 text-white text-xs"
          onClick={() => setShowFormula(!showFormula)}
        >
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>综合得分 = 频次×25% + 质量×25% + 完善×20% + 任务×15% + 速度×15%</span>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 shrink-0 ml-1 transition-transform ${showFormula ? 'rotate-180' : ''}`} />
        </button>
        {showFormula && (
          <div className="mb-4 px-3 py-3 rounded-lg bg-card border border-border text-xs text-muted-foreground space-y-1.5">
            {SCORE_KEYS.map(key => (
              <div key={key} className="flex justify-between">
                <span className="text-foreground">{SCORE_LABELS[key].label}</span>
                <span>权重 {(PERFORMANCE_SCORE_WEIGHTS[key] * 100)}%</span>
              </div>
            ))}
            <div className="pt-1.5 border-t border-border text-muted-foreground">
              社区排名 = 网格员个人得分；街道排名 = 社区均分；区县排名 = 街道均分
            </div>
          </div>
        )}

        {/* 排名列表 */}
        <div className="space-y-3 pb-6">
          {!currentUser && !loading && (
            <Card className="border-none shadow-sm overflow-hidden">
              <CardContent className="p-4 text-sm text-muted-foreground">当前暂无可用绩效数据。</CardContent>
            </Card>
          )}
          {rankings.map((item) => (
            <Card key={item.name} className="border-none shadow-sm overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex flex-col items-center justify-center min-w-[32px]">
                    {getRankIcon(item.rank)}
                  </div>

                  {activeTab === 'community' && (
                    <Avatar className="w-9 h-9 border border-border">
                      <AvatarFallback className="bg-[var(--color-neutral-03)] text-primary text-xs">
                        {item.name.slice(-2)}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground truncate mr-2 text-base">{item.name}</span>
                      <span className={`text-lg font-bold font-mono ${scoreColor(item.totalScore)}`}>
                        {item.totalScore}
                      </span>
                    </div>
                    {item.grid && (
                      <div className="text-xs text-muted-foreground truncate">{item.grid}</div>
                    )}
                    {activeTab !== 'community' && (
                      <div className="text-xs text-muted-foreground">{item.workerCount} 名网格员</div>
                    )}
                  </div>
                </div>

                {/* 五维分项 */}
                <div className="grid grid-cols-5 gap-1 bg-[var(--color-neutral-02)] p-2 rounded-lg">
                  {SCORE_KEYS.map(key => (
                    <div key={key} className="text-center">
                      <div className="text-[10px] text-muted-foreground">{SCORE_LABELS[key].short}</div>
                      <div className={`text-xs font-semibold ${scoreColor(item.scores[key])}`}>
                        {item.scores[key]}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
