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

type ReportType = 'monthly' | 'special' | 'task' | 'knowledge';

interface ExportRecord {
  id: string;
  name: string;
  date: string;
  size: string;
  type: string;
  summary: string;
}

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
        color: 'text-blue-600',
        bg: 'bg-blue-50',
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
        color: 'text-orange-600',
        bg: 'bg-orange-50',
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
        color: 'text-green-600',
        bg: 'bg-green-50',
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
        color: 'text-purple-600',
        bg: 'bg-purple-50',
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">报表中心</h2>
          <p className="text-muted-foreground">直接基于当前治理快照生成导出包，不再依赖手工样例或延时生成。</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 border-blue-100 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b pb-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              生成导出包
            </CardTitle>
            <CardDescription>根据真实治理快照生成一个新的导出文件。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                1. 选择报表类型
              </Label>
              <Select value={config.type} onValueChange={(value: ReportType) => setConfig((current) => ({ ...current, type: value }))}>
                <SelectTrigger>
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

            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-gray-500" />
                2. 统计范围
              </Label>
              <Select value={config.time} onValueChange={(value) => setConfig((current) => ({ ...current, time: value }))}>
                <SelectTrigger>
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

            <div className="rounded-md border bg-white p-4 text-sm text-muted-foreground space-y-2">
              <div>当前口径：{snapshot ? `${snapshot.totals.people} 人 / ${snapshot.totals.houses} 房 / ${snapshot.anomalies.length} 条异常` : '加载中'}</div>
              <div>内容索引：{noticeCount} 条公告 / {knowledgeCount} 条知识 / {ruleCount} 条规则</div>
            </div>
          </CardContent>
          <CardFooter className="pt-2">
            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => void handleGenerate()} disabled={isGenerating || !snapshot}>
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

        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {quickExports.map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={() => void item.action()}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all hover:scale-105 hover:shadow-md ${item.bg} border-transparent hover:border-gray-200`}
              >
                <item.icon className={`w-8 h-8 mb-2 ${item.color}`} />
                <span className="text-sm font-bold text-gray-800">{item.title}</span>
                <span className="text-xs text-gray-500 mt-1">{item.desc}</span>
              </button>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>本次导出记录</CardTitle>
              <CardDescription>只记录当前会话里真实生成过的导出包，不伪装成历史归档。</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {generatedReports.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                    还没有生成新的导出包。点击左侧“立即导出”或上方快捷入口，会在这里留下本次会话的真实记录。
                  </div>
                ) : (
                  generatedReports.map((file) => (
                    <div key={file.id} className="group flex items-center justify-between p-4 rounded-lg border border-transparent hover:border-gray-100 hover:bg-slate-50 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm bg-blue-50 text-blue-600">
                          {file.type}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 mb-1">{file.name}</div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {file.date}</span>
                            <span>•</span>
                            <span>{file.size}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-3 h-3" /> 已下载
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">{file.summary}</div>
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
