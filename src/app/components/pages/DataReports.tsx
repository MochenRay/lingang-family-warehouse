import { useEffect, useMemo, useState } from 'react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { FileText, Clock, Loader2, CheckCircle, FileBarChart, CalendarDays, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { analysisRepository, type GovernanceAnalysisSnapshot } from '../../services/repositories/analysisRepository';
import { noticeRepository } from '../../services/repositories/noticeRepository';
import { knowledgeRepository } from '../../services/repositories/knowledgeRepository';
import { taskRuleRepository } from '../../services/repositories/taskRuleRepository';
import { downloadJson } from '../../services/export';
import { PageHeader } from './PageHeader';

type ReportType = 'monthly' | 'special' | 'task' | 'knowledge';

interface ExportRecord {
  id: string;
  name: string;
  date: string;
  size: string;
  type: string;
  summary: string;
}

const PANEL_CLASS = 'rounded-lg border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)] shadow-none';
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
        accent: '#4E86DF',
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
        accent: '#D6730D',
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
        accent: '#19B172',
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
        accent: '#8B5CF6',
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
    <div className="space-y-5 animate-in fade-in duration-500">
      <PageHeader
        eyebrow="REPORT EXPORTS"
        title="报表中心"
        description="基于当前治理快照快速生成可留痕导出包，减少手工整理和重复汇总。"
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(280px,0.92fr)_minmax(0,2.08fr)]">
        <Card className={`lg:col-span-1 ${PANEL_CLASS}`}>
          <CardHeader className="border-b border-[var(--color-neutral-03)] px-5 pb-4 pt-5">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-white">
              <FileText className="h-5 w-5 text-[#4E86DF]" />
              生成导出包
            </CardTitle>
            <CardDescription className={MUTED_TEXT}>根据真实治理快照生成一个新的导出文件。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-5 pt-5">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-semibold text-[var(--color-neutral-10)]">
                <FileText className="h-4 w-4 text-[#4E86DF]" />
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
                <CalendarDays className="h-4 w-4 text-[#4E86DF]" />
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
                <div className="mt-1 font-semibold text-white">
                  {snapshot ? `${snapshot.totals.people} 人 / ${snapshot.totals.houses} 房 / ${snapshot.anomalies.length} 条异常` : '加载中'}
                </div>
              </div>
              <div>
                <div className={`text-xs ${MUTED_TEXT}`}>内容索引</div>
                <div className="mt-1 font-semibold text-white">{noticeCount} 条公告 / {knowledgeCount} 条知识 / {ruleCount} 条规则</div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="px-5 pb-5 pt-2">
            <Button className="w-full bg-[#2761CB] hover:bg-[#4E86DF]" onClick={() => void handleGenerate()} disabled={isGenerating || !snapshot}>
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

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {quickExports.map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={() => void item.action()}
                className={`${PANEL_CLASS} group flex min-h-[126px] flex-col items-start justify-between p-4 text-left transition-colors hover:border-[#4E86DF]/55 hover:bg-[var(--color-neutral-03)]`}
              >
                <div className="flex w-full items-center justify-between gap-3">
                  <item.icon className="h-5 w-5" style={{ color: item.accent }} />
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.accent }} />
                </div>
                <div>
                  <span className="block text-sm font-semibold text-white">{item.title}</span>
                  <span className={`mt-1 block text-xs ${MUTED_TEXT}`}>{item.desc}</span>
                </div>
              </button>
            ))}
          </div>

          <Card className={PANEL_CLASS}>
            <CardHeader className="px-5 pb-3 pt-5">
              <CardTitle className="text-base font-semibold text-white">本次导出记录</CardTitle>
              <CardDescription className={MUTED_TEXT}>只记录当前会话里真实生成过的导出包，不伪装成历史归档。</CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="space-y-2">
                {generatedReports.length === 0 ? (
                  <div className={`rounded-lg border border-dashed border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] p-6 text-sm ${MUTED_TEXT}`}>
                    还没有生成新的导出包。点击左侧“立即导出”或上方快捷入口，会在这里留下本次会话的真实记录。
                  </div>
                ) : (
                  generatedReports.map((file) => (
                    <div key={file.id} className={`${INNER_PANEL_CLASS} group flex items-center justify-between gap-4 p-4 transition-colors hover:border-[#4E86DF]/55 hover:bg-[var(--color-neutral-03)]`}>
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#4E86DF]/35 bg-[#2761CB]/15 text-sm font-bold text-[#DCE6FF]">
                          {file.type}
                        </div>
                        <div>
                          <div className="mb-1 font-semibold text-white">{file.name}</div>
                          <div className={`flex flex-wrap items-center gap-3 text-xs ${MUTED_TEXT}`}>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {file.date}</span>
                            <span>•</span>
                            <span>{file.size}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-[#19B172]">
                              <CheckCircle className="h-3 w-3" /> 已下载
                            </span>
                          </div>
                          <div className={`mt-1 text-xs ${MUTED_TEXT}`}>{file.summary}</div>
                        </div>
                      </div>
                      <Badge variant="outline">本次生成</Badge>
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
