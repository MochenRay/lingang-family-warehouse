import { useEffect, useMemo, useState } from 'react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Archive, FileText, Clock, Loader2, CheckCircle, FileBarChart, CalendarDays, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { analysisRepository, type GovernanceAnalysisSnapshot } from '../../services/repositories/analysisRepository';
import { noticeRepository } from '../../services/repositories/noticeRepository';
import { knowledgeRepository } from '../../services/repositories/knowledgeRepository';
import { taskRuleRepository } from '../../services/repositories/taskRuleRepository';
import { downloadJson } from '../../services/export';
import { EmptyState } from '../patterns/states';
import { PANEL_CLASS } from '../patterns/surfaces';
import { PageHeader } from './PageHeader';
import { Skeleton } from '../ui/skeleton';

type ReportType = 'monthly' | 'special' | 'task' | 'knowledge';

interface ExportRecord {
  id: string;
  name: string;
  date: string;
  size: string;
  type: string;
  summary: string;
}

const INNER_PANEL_CLASS = 'rounded-lg border border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)]';
const MUTED_TEXT = 'text-[var(--color-neutral-08)]';

function estimateSize(payload: unknown): string {
  const bytes = new Blob([JSON.stringify(payload)]).size;
  if (bytes > 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))}KB`;
}

export function DataReports() {
  const [snapshot, setSnapshot] = useState<GovernanceAnalysisSnapshot | null>(null);
  const [noticeCount, setNoticeCount] = useState(0);
  const [knowledgeCount, setKnowledgeCount] = useState(0);
  const [ruleCount, setRuleCount] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReports, setGeneratedReports] = useState<ExportRecord[]>([]);
  const [config, setConfig] = useState<{ type: ReportType; time: string }>({
    type: 'monthly',
    time: '近六月',
  });

  const loadData = async () => {
    const [nextSnapshot, notices, knowledge, rules] = await Promise.all([
      analysisRepository.getGovernanceSnapshot(),
      noticeRepository.getNotices({ limit: 20 }),
      knowledgeRepository.getEntries({ limit: 20 }),
      taskRuleRepository.getRules(),
    ]);

    setSnapshot(nextSnapshot);
    setNoticeCount(notices.length);
    setKnowledgeCount(knowledge.length);
    setRuleCount(rules.length);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const quickExports = useMemo(() => {
    if (!snapshot) {
      return [];
    }

    return [
      {
        title: '治理总览快照',
        desc: `${snapshot.totals.people} 人 / ${snapshot.totals.houses} 房`,
        icon: FileText,
        accent: 'var(--color-brand-primary-hover)',
        action: () => {
          const payload = {
            generatedAt: snapshot.generatedAt,
            totals: snapshot.totals,
            topHotspots: snapshot.grids.slice(0, 5),
            anomalies: snapshot.anomalies.slice(0, 8),
          };
          downloadJson(`report-governance-overview-${new Date().toISOString().slice(0, 10)}.json`, payload);
          toast.success('治理总览快照已导出');
        },
      },
      {
        title: '重点对象清单',
        desc: `${snapshot.grids.reduce((sum, grid) => sum + grid.highRiskCount, 0)} 名高风险对象`,
        icon: Layers,
        accent: 'var(--color-status-warning)',
        action: () => {
          const payload = {
            generatedAt: snapshot.generatedAt,
            highRiskSummary: snapshot.grids.map((grid) => ({
              grid: grid.communityName,
              highRiskCount: grid.highRiskCount,
              elderlyCount: grid.elderlyCount,
              pendingTaskCount: grid.pendingTaskCount,
            })),
          };
          downloadJson(`report-high-risk-${new Date().toISOString().slice(0, 10)}.json`, payload);
          toast.success('重点对象清单已导出');
        },
      },
      {
        title: '公告与知识索引',
        desc: `${noticeCount} 条公告 / ${knowledgeCount} 条知识`,
        icon: FileBarChart,
        accent: 'var(--color-status-success)',
        action: async () => {
          const [notices, knowledge] = await Promise.all([
            noticeRepository.getNotices({ limit: 50 }),
            knowledgeRepository.getEntries({ limit: 50 }),
          ]);
          downloadJson(`report-content-index-${new Date().toISOString().slice(0, 10)}.json`, {
            generatedAt: new Date().toISOString(),
            notices,
            knowledge,
          });
          toast.success('公告与知识索引已导出');
        },
      },
      {
        title: '规则与待办快照',
        desc: `${ruleCount} 条规则 / ${snapshot.totals.pendingTasks} 条待办`,
        icon: CalendarDays,
        accent: 'var(--color-accent-purple)',
        action: async () => {
          const rules = await taskRuleRepository.getRules();
          downloadJson(`report-task-rules-${new Date().toISOString().slice(0, 10)}.json`, {
            generatedAt: new Date().toISOString(),
            rules,
            pendingTasks: snapshot.totals.pendingTasks,
            completedTasks: snapshot.totals.completedTasks,
          });
          toast.success('规则与待办快照已导出');
        },
      },
    ];
  }, [knowledgeCount, noticeCount, ruleCount, snapshot]);

  const handleGenerate = async () => {
    if (!snapshot) {
      return;
    }
    setIsGenerating(true);
    try {
      const payload = {
        generatedAt: new Date().toISOString(),
        reportType: config.type,
        timeRange: config.time,
        snapshot: {
          totals: snapshot.totals,
          topGrids: snapshot.grids.slice(0, 6),
          anomalies: snapshot.anomalies.slice(0, 8),
          migration: snapshot.migration,
        },
      };
      const filename = `report-${config.type}-${new Date().toISOString().slice(0, 10)}.json`;
      downloadJson(filename, payload);
      setGeneratedReports((current) => [
        {
          id: `${Date.now()}`,
          name: `${config.time}${config.type === 'monthly' ? '治理快照' : config.type === 'special' ? '专项分析' : config.type === 'task' ? '任务督导包' : '知识索引包'}`,
          date: new Date().toISOString().slice(0, 10),
          size: estimateSize(payload),
          type: 'JSON',
          summary: `${snapshot.totals.people} 人 / ${snapshot.totals.pendingTasks} 条待办 / ${snapshot.anomalies.length} 条异常`,
        },
        ...current,
      ].slice(0, 8));
      toast.success('报表包已生成并下载');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-5 page-enter">
      <PageHeader
        eyebrow="REPORT EXPORTS"
        title="报表中心"
        description="基于当前治理快照快速生成可留痕导出包，减少手工整理和重复汇总。"
      />

      <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(280px,0.92fr)_minmax(0,2.08fr)]">
        <Card data-testid="report-config-card" className={`h-full gap-0 lg:col-span-1 ${PANEL_CLASS}`}>
          <CardHeader className="border-b border-[var(--color-neutral-03)] px-5 pb-3 pt-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-[var(--color-neutral-11)]">
              <Archive className="h-5 w-5 text-[var(--color-brand-text)]" />
              生成导出包
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-5 pt-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-semibold text-[var(--color-neutral-10)]">
                <FileText className="h-4 w-4 text-[var(--color-brand-text)]" />
                报表类型
              </Label>
              <Select value={config.type} onValueChange={(value: ReportType) => setConfig((current) => ({ ...current, type: value }))}>
                <SelectTrigger className="border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">治理总览快照</SelectItem>
                  <SelectItem value="special">专项风险分析</SelectItem>
                  <SelectItem value="task">待办规则与督导</SelectItem>
                  <SelectItem value="knowledge">公告知识索引</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-semibold text-[var(--color-neutral-10)]">
                <CalendarDays className="h-4 w-4 text-[var(--color-brand-text)]" />
                统计范围
              </Label>
              <Select value={config.time} onValueChange={(value) => setConfig((current) => ({ ...current, time: value }))}>
                <SelectTrigger className="border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="近一月">近一月</SelectItem>
                  <SelectItem value="近三月">近三月</SelectItem>
                  <SelectItem value="近六月">近六月</SelectItem>
                  <SelectItem value="当前快照">当前快照</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className={`${INNER_PANEL_CLASS} grid gap-3 p-4 text-sm`}>
              <div>
                <div className={`text-xs ${MUTED_TEXT}`}>当前口径</div>
                <div className="mt-1 font-semibold text-[var(--color-neutral-11)]">
                  {snapshot ? `${snapshot.totals.people} 人 / ${snapshot.totals.houses} 房 / ${snapshot.anomalies.length} 条异常` : '加载中'}
                </div>
              </div>
              <div>
                <div className={`text-xs ${MUTED_TEXT}`}>内容索引</div>
                <div className="mt-1 font-semibold text-[var(--color-neutral-11)]">{noticeCount} 条公告 / {knowledgeCount} 条知识 / {ruleCount} 条规则</div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="px-5 pb-4 pt-3">
            <Button className="w-full" onClick={() => void handleGenerate()} disabled={isGenerating || !snapshot}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  导出中...
                </>
              ) : (
                <>
                  <FileBarChart className="mr-2 h-4 w-4" />
                  立即导出
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <div
          data-testid="report-results-column"
          className={generatedReports.length === 0
            ? 'self-stretch space-y-4 lg:flex lg:h-full lg:flex-col lg:gap-4 lg:space-y-0'
            : 'self-start space-y-4'}
        >
          <div data-testid="report-snapshot-grid" className="grid shrink-0 grid-cols-2 gap-3 xl:grid-cols-4">
            {!snapshot
              ? Array.from({ length: 4 }, (_, index) => (
                <div
                  key={index}
                  data-testid="report-snapshot-skeleton"
                  aria-hidden="true"
                  className={`${PANEL_CLASS} flex min-h-[126px] flex-col justify-between p-4`}
                >
                  <Skeleton className="h-5 w-5" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24 max-w-full" />
                    <Skeleton className="h-3 w-32 max-w-full" />
                  </div>
                </div>
              ))
              : quickExports.map((item) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => void item.action()}
                  className={`${PANEL_CLASS} group flex min-h-[126px] flex-col items-start justify-between p-4 text-left transition-colors hover:border-[var(--color-brand-primary-hover)]/55 hover:bg-[var(--color-neutral-03)]`}
                >
                  <div className="flex w-full items-center justify-between gap-3">
                    <item.icon className="h-5 w-5" style={{ color: item.accent }} />
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.accent }} />
                  </div>
                  <div>
                    <span className="block text-sm font-semibold text-[var(--color-neutral-11)]">{item.title}</span>
                    <span className={`mt-1 block text-xs ${MUTED_TEXT}`}>{item.desc}</span>
                  </div>
                </button>
              ))}
          </div>

          <Card
            data-testid="report-records-card"
            className={`${PANEL_CLASS} gap-0 ${generatedReports.length === 0 ? 'lg:min-h-0 lg:flex-1' : ''}`}
          >
            <CardHeader className="border-b border-[var(--color-neutral-03)] px-5 py-3">
              <CardTitle className="text-base font-semibold text-[var(--color-neutral-11)]">本次导出记录</CardTitle>
            </CardHeader>
            <CardContent className={`px-5 py-4 ${generatedReports.length === 0 ? 'lg:flex lg:min-h-0 lg:flex-1 lg:items-center lg:justify-center' : ''}`}>
              <div className={`w-full space-y-2 ${generatedReports.length === 0 ? 'lg:flex lg:min-h-0 lg:flex-1 lg:items-center lg:justify-center' : ''}`}>
                {generatedReports.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title="还没有生成新的导出包"
                    description="选择报表类型和统计范围后，点击“立即导出”生成文件。"
                    className="py-4 lg:min-h-[140px] lg:flex-none"
                  />
                ) : (
                  generatedReports.map((file) => (
                    <div
                      key={file.id}
                      data-testid="report-record-item"
                      className={`${INNER_PANEL_CLASS} group flex flex-col gap-3 p-4 transition-colors hover:border-[var(--color-brand-primary-hover)]/55 hover:bg-[var(--color-neutral-03)] sm:flex-row sm:items-center sm:justify-between`}
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--color-brand-primary-hover)]/35 bg-[var(--color-brand-primary)]/15 text-sm font-bold text-[var(--color-brand-text)]">
                          {file.type}
                        </div>
                        <div className="min-w-0">
                          <div className="mb-1 font-semibold text-[var(--color-neutral-11)]">{file.name}</div>
                          <div className={`flex flex-wrap items-center gap-3 text-xs ${MUTED_TEXT}`}>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {file.date}</span>
                            <span>•</span>
                            <span>{file.size}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-[var(--color-status-success-text)]">
                              <CheckCircle className="h-3 w-3" /> 已下载
                            </span>
                          </div>
                          <div className={`mt-1 text-xs ${MUTED_TEXT}`}>{file.summary}</div>
                        </div>
                      </div>
                      <Badge variant="outline" className="self-start sm:self-auto">本次生成</Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
