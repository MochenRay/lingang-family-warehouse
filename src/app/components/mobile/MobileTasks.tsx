import { useEffect, useMemo, useState } from 'react';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { MobileLayout } from './MobileLayout';
import { taskRepository, type MobileTaskFeed, type MobileTaskItem } from '../../services/repositories/taskRepository';

interface MobileTasksProps {
  onRouteChange: (route: string) => void;
  initialViewMode?: 'today' | 'month' | 'all';
  onExitMobile?: () => void;
}

function parseDate(value?: string): Date | null {
  if (!value) {
    return null;
  }
  const normalized = value.replace(/\//g, '-');
  const timestamp = Date.parse(normalized);
  return Number.isNaN(timestamp) ? null : new Date(timestamp);
}

function isSameMonth(value: string | undefined, base: Date): boolean {
  const parsed = parseDate(value);
  if (!parsed) {
    return false;
  }
  return parsed.getFullYear() === base.getFullYear() && parsed.getMonth() === base.getMonth();
}

function getTypeColor(type: string) {
  const colors: Record<string, string> = {
    重点走访: 'bg-[#4E86DF]/15 text-[#4E86DF]',
    走访反馈: 'bg-[#19B172]/15 text-[#19B172]',
    矛盾调解: 'bg-[#FF9F1C]/15 text-[#FF9F1C]',
  };
  return colors[type] || 'bg-[var(--color-neutral-03)] text-[var(--color-neutral-08)]';
}

function getDeadlineStatus(deadline: string | undefined) {
  const parsed = parseDate(deadline);
  if (!parsed) {
    return { text: '待安排', color: 'text-[var(--color-neutral-08)]' };
  }

  const now = new Date();
  const hoursLeft = (parsed.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursLeft < 0) {
    return { text: '已超期', color: 'text-red-400' };
  }
  if (hoursLeft < 2) {
    return { text: `剩余${Math.max(Math.floor(hoursLeft * 60), 1)}分钟`, color: 'text-red-400' };
  }
  if (hoursLeft < 24) {
    return { text: `剩余${Math.floor(hoursLeft)}小时`, color: 'text-orange-400' };
  }
  return { text: deadline?.split(' ')[0] ?? '待安排', color: 'text-[var(--color-neutral-08)]' };
}

function filterPendingTasks(tasks: MobileTaskItem[], viewMode: 'today' | 'month' | 'all', searchQuery: string) {
  const now = new Date();
  let result = tasks;

  if (viewMode === 'today') {
    result = tasks.filter((task) => {
      const deadline = parseDate(task.deadline);
      return !deadline || deadline <= now || deadline.toDateString() === now.toDateString();
    });
  } else if (viewMode === 'month') {
    result = tasks.filter((task) => isSameMonth(task.deadline, now));
  }

  if (searchQuery.trim()) {
    const keyword = searchQuery.trim();
    result = result.filter((task) =>
      [task.title, task.type, task.description, task.statusLabel].some((value) => value.includes(keyword)),
    );
  }

  return result;
}

function filterCompletedTasks(tasks: MobileTaskItem[], viewMode: 'today' | 'month' | 'all', searchQuery: string) {
  const now = new Date();
  let result = tasks;

  if (viewMode === 'today') {
    result = tasks.filter((task) => parseDate(task.completedAt)?.toDateString() === now.toDateString());
  } else if (viewMode === 'month') {
    result = tasks.filter((task) => isSameMonth(task.completedAt, now));
  }

  if (searchQuery.trim()) {
    const keyword = searchQuery.trim();
    result = result.filter((task) =>
      [task.title, task.type, task.description, task.feedback ?? '', task.statusLabel].some((value) => value.includes(keyword)),
    );
  }

  return result;
}

export function MobileTasks({ onRouteChange, initialViewMode = 'today', onExitMobile }: MobileTasksProps) {
  const [viewMode, setViewMode] = useState<'today' | 'month' | 'all'>(initialViewMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [feed, setFeed] = useState<MobileTaskFeed | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const nextFeed = await taskRepository.getTaskFeed();
        if (!active) {
          return;
        }
        setFeed(nextFeed);
      } catch (error) {
        console.error('Failed to load mobile task feed', error);
        if (active) {
          setFeed({ pending: [], completed: [], summary: { pending: 0, overdue: 0, completed: 0, completionRate: 0 } });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();
    const handleRefresh = () => {
      void load();
    };
    window.addEventListener('db-change', handleRefresh);
    return () => {
      active = false;
      window.removeEventListener('db-change', handleRefresh);
    };
  }, []);

  const displayPending = useMemo(
    () => filterPendingTasks(feed?.pending ?? [], viewMode, searchQuery),
    [feed?.pending, searchQuery, viewMode],
  );
  const displayCompleted = useMemo(
    () => filterCompletedTasks(feed?.completed ?? [], viewMode, searchQuery),
    [feed?.completed, searchQuery, viewMode],
  );

  const summary = useMemo(() => {
    const total = displayPending.length + displayCompleted.length;
    return {
      pending: displayPending.length,
      overdue: displayPending.filter((task) => getDeadlineStatus(task.deadline).text === '已超期').length,
      completed: displayCompleted.length,
      completionRate: total > 0 ? Math.round((displayCompleted.length / total) * 100) : 100,
    };
  }, [displayCompleted, displayPending]);

  return (
    <MobileLayout currentRoute="tasks" onRouteChange={onRouteChange} onExitMobile={onExitMobile} title="工作清单">
      <div className="bg-[var(--color-neutral-01)] min-h-full flex flex-col">
        <div className="px-4 py-3 border-b border-[var(--color-neutral-03)] flex items-center justify-between sticky top-0 bg-[var(--color-neutral-01)] z-10">
          <div className="flex items-center gap-1 bg-[var(--color-neutral-03)] p-1 rounded-lg w-full">
            <button
              onClick={() => setViewMode('today')}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all text-center ${
                viewMode === 'today' ? 'bg-[var(--color-neutral-02)] text-blue-400 shadow-sm' : 'text-[var(--color-neutral-08)] hover:text-[var(--color-neutral-10)]'
              }`}
            >
              今日待办
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all text-center ${
                viewMode === 'month' ? 'bg-[var(--color-neutral-02)] text-blue-400 shadow-sm' : 'text-[var(--color-neutral-08)] hover:text-[var(--color-neutral-10)]'
              }`}
            >
              本月工作
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all text-center ${
                viewMode === 'all' ? 'bg-[var(--color-neutral-02)] text-blue-400 shadow-sm' : 'text-[var(--color-neutral-08)] hover:text-[var(--color-neutral-10)]'
              }`}
            >
              全部清单
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 p-3 bg-[var(--color-neutral-00)]">
          <div className="bg-[var(--color-neutral-02)] rounded-xl p-2.5 text-center border border-[var(--color-neutral-03)]">
            <div className="text-xl font-bold text-blue-400">{summary.pending}</div>
            <div className="text-[10px] text-[var(--color-neutral-08)] mt-1 scale-90 origin-center whitespace-nowrap">
              {viewMode === 'today' ? '今日待办' : (viewMode === 'month' ? '本月待办' : '剩余待办')}
            </div>
          </div>
          <div className="bg-[var(--color-neutral-02)] rounded-xl p-2.5 text-center border border-[var(--color-neutral-03)]">
            <div className="text-xl font-bold text-red-400">{summary.overdue}</div>
            <div className="text-[10px] text-[var(--color-neutral-08)] mt-1 scale-90 origin-center whitespace-nowrap">逾期任务</div>
          </div>
          <div className="bg-[var(--color-neutral-02)] rounded-xl p-2.5 text-center border border-[var(--color-neutral-03)]">
            <div className="text-xl font-bold text-green-400">{summary.completed}</div>
            <div className="text-[10px] text-[var(--color-neutral-08)] mt-1 scale-90 origin-center whitespace-nowrap">
              {viewMode === 'today' ? '今日已完' : '累计完成'}
            </div>
          </div>
          <div className="bg-[var(--color-neutral-02)] rounded-xl p-2.5 text-center border border-[var(--color-neutral-03)]">
            <div className="text-xl font-bold text-orange-400">{summary.completionRate}%</div>
            <div className="text-[10px] text-[var(--color-neutral-08)] mt-1 scale-90 origin-center whitespace-nowrap">完成率</div>
          </div>
        </div>

        {viewMode === 'all' && (
          <div className="px-4 py-2 bg-[var(--color-neutral-01)] border-b border-[var(--color-neutral-03)] animate-in fade-in zoom-in-95 duration-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-neutral-06)]" />
              <Input
                type="text"
                placeholder="搜索任务或来源对象..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-9 pr-9 h-9 text-sm bg-[var(--color-neutral-02)] border-[var(--color-neutral-03)] text-[var(--color-neutral-10)] placeholder:text-[var(--color-neutral-06)] focus-visible:bg-[var(--color-neutral-02)] focus-visible:border-blue-500 focus-visible:ring-0 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-neutral-08)] p-1"
                >
                  <span className="sr-only">清除</span>
                  ×
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden flex flex-col bg-[var(--color-neutral-00)]">
          <Tabs defaultValue="pending" className="w-full flex flex-col h-full">
            <div className="bg-[var(--color-neutral-01)] sticky top-0 z-10">
              <TabsList className="w-full flex h-12 bg-transparent p-0 border-b border-[var(--color-neutral-03)]">
                <TabsTrigger
                  value="pending"
                  className="group relative flex-1 rounded-none border-none bg-transparent px-0 data-[state=active]:shadow-none"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-[15px] font-medium text-[var(--color-neutral-08)] transition-colors group-data-[state=active]:text-blue-400">
                      待处理
                    </span>
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--color-neutral-03)] px-1.5 text-xs text-[var(--color-neutral-08)] transition-colors group-data-[state=active]:bg-blue-500/20 group-data-[state=active]:text-blue-400">
                      {displayPending.length}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-1/2 h-[3px] w-12 -translate-x-1/2 rounded-t-full bg-blue-400 opacity-0 transition-all duration-300 group-data-[state=active]:opacity-100" />
                </TabsTrigger>

                <TabsTrigger
                  value="completed"
                  className="group relative flex-1 rounded-none border-none bg-transparent px-0 data-[state=active]:shadow-none"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-[15px] font-medium text-[var(--color-neutral-08)] transition-colors group-data-[state=active]:text-blue-400">
                      已完成
                    </span>
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--color-neutral-03)] px-1.5 text-xs text-[var(--color-neutral-08)] transition-colors group-data-[state=active]:bg-blue-500/20 group-data-[state=active]:text-blue-400">
                      {displayCompleted.length}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-1/2 h-[3px] w-12 -translate-x-1/2 rounded-t-full bg-blue-400 opacity-0 transition-all duration-300 group-data-[state=active]:opacity-100" />
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto bg-[var(--color-neutral-00)] p-4">
              {loading ? (
                <div className="flex h-full items-center justify-center text-[var(--color-neutral-08)]">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  正在同步任务工作台...
                </div>
              ) : (
                <>
                  <TabsContent value="pending" className="mt-0 space-y-3">
                    {displayPending.map((task) => {
                      const deadlineStatus = getDeadlineStatus(task.deadline);
                      const isOverdue = deadlineStatus.text === '已超期';
                      return (
                        <Card
                          key={task.id}
                          className={`cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99] border border-[var(--color-neutral-03)] shadow-none overflow-hidden bg-[var(--color-neutral-02)] ${
                            isOverdue ? 'border-l-2 border-l-red-500' : ''
                          }`}
                          onClick={() => onRouteChange(`/mobile/tasks/${task.id}`)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                                isOverdue ? 'bg-red-500/20 text-red-400' : (task.urgent ? 'bg-red-500/15 text-red-400' : 'bg-orange-500/15 text-orange-400')
                              }`}>
                                {isOverdue ? <AlertCircle className="w-4.5 h-4.5" /> : <Clock className="w-4.5 h-4.5" />}
                              </div>

                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className={`rounded text-xs font-medium border-0 px-2 py-0.5 ${getTypeColor(task.type)}`}>
                                  {task.type}
                                </Badge>
                                {task.urgent && (
                                  <Badge variant="destructive" className="rounded text-xs font-medium px-2 py-0.5 shadow-none">
                                    紧急
                                  </Badge>
                                )}
                                <Badge variant="outline" className="rounded text-xs font-medium px-2 py-0.5 border-0 bg-[var(--color-neutral-03)] text-[var(--color-neutral-08)]">
                                  {task.statusLabel}
                                </Badge>
                              </div>
                            </div>

                            <div className="text-[16px] font-bold text-[var(--color-neutral-11)] leading-snug mb-2">
                              {task.title}
                            </div>

                            <div className="text-sm text-[var(--color-neutral-08)] leading-relaxed mb-4 line-clamp-2">
                              {task.description}
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-[var(--color-neutral-03)]">
                              <div className="text-xs text-[var(--color-neutral-06)] font-medium flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-neutral-04)]" />
                                下发：{task.assignedBy}
                              </div>
                              <div className={`text-xs font-bold flex items-center gap-1.5 ${deadlineStatus.color}`}>
                                {deadlineStatus.text}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}

                    {displayPending.length === 0 && (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-[var(--color-neutral-02)] rounded-full flex items-center justify-center mx-auto mb-3">
                          <CheckCircle className="w-8 h-8 text-[var(--color-neutral-04)]" />
                        </div>
                        <p className="text-[var(--color-neutral-08)] text-sm">暂无待办任务</p>
                        {viewMode === 'today' && <p className="text-[var(--color-neutral-06)] text-xs mt-1">今天的工作已全部完成</p>}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="completed" className="mt-0 space-y-3">
                    {displayCompleted.map((task) => (
                      <Card
                        key={task.id}
                        className="cursor-pointer hover:shadow-md transition-shadow border border-[var(--color-neutral-03)] shadow-none opacity-90 bg-[var(--color-neutral-02)]"
                        onClick={() => onRouteChange(`/mobile/tasks/${task.id}`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                              task.onTime ? 'bg-green-500/15 text-green-400' : 'bg-orange-500/15 text-orange-400'
                            }`}>
                              {task.onTime ? <CheckCircle className="w-4.5 h-4.5" /> : <AlertCircle className="w-4.5 h-4.5" />}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className={`rounded text-xs font-medium border-0 px-2 py-0.5 ${getTypeColor(task.type)}`}>
                                {task.type}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-2 py-0.5 rounded border-0 ${
                                  task.onTime ? 'bg-green-500/15 text-green-300' : 'bg-orange-500/20 text-orange-300'
                                }`}
                              >
                                {task.statusLabel}
                              </Badge>
                            </div>
                          </div>

                          <div className="text-[15px] font-bold text-[var(--color-neutral-10)] mb-2 line-clamp-2">
                            {task.title}
                          </div>

                          {task.feedback && (
                            <div className="bg-[var(--color-neutral-03)] rounded p-2 text-xs text-[var(--color-neutral-08)] mb-3">
                              <span className="font-medium text-[var(--color-neutral-10)]">反馈：</span>{task.feedback}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-[var(--color-neutral-03)]">
                            <div className="text-xs text-[var(--color-neutral-06)]">
                              完成时间：{task.completedAt}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {displayCompleted.length === 0 && (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-[var(--color-neutral-02)] rounded-full flex items-center justify-center mx-auto mb-3">
                          <AlertCircle className="w-8 h-8 text-[var(--color-neutral-04)]" />
                        </div>
                        <p className="text-[var(--color-neutral-08)] text-sm">
                          {viewMode === 'today' ? '今日暂无已完成任务' : '暂无历史记录'}
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </>
              )}
            </div>
          </Tabs>
        </div>
      </div>
    </MobileLayout>
  );
}
