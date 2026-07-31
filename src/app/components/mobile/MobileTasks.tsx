import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
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
    重点走访: 'bg-[var(--color-brand-primary-hover)]/15 text-[var(--color-brand-text)]',
    走访反馈: 'bg-[var(--color-status-success)]/15 text-[var(--color-status-success-text)]',
    矛盾调解: 'bg-[var(--color-status-warning)]/15 text-[var(--color-status-warning-text)]',
  };
  return colors[type] || 'bg-[var(--color-neutral-03)] text-[var(--color-neutral-10)]';
}

function getDeadlineStatus(deadline: string | undefined) {
  const parsed = parseDate(deadline);
  if (!parsed) {
    return { text: '待安排', color: 'text-[var(--color-neutral-08)]' };
  }

  const now = new Date();
  const hoursLeft = (parsed.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursLeft < 0) {
    return { text: '已超期', color: 'text-[var(--color-status-error-text)]' };
  }
  if (hoursLeft < 2) {
    return { text: `剩余${Math.max(Math.floor(hoursLeft * 60), 1)}分钟`, color: 'text-[var(--color-status-error-text)]' };
  }
  if (hoursLeft < 24) {
    return { text: `剩余${Math.floor(hoursLeft)}小时`, color: 'text-[var(--color-status-warning-text)]' };
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const nextFeed = await taskRepository.getTaskFeed();
        if (!active) {
          return;
        }
        setFeed(nextFeed);
      } catch (error) {
        console.error('Failed to load mobile task feed', error);
        if (active) {
          setFeed(null);
          setLoadError(error instanceof Error ? error.message : '任务列表加载失败');
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
  }, [reloadToken]);

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

  // 任务卡键盘与焦点：div 卡补齐 button 语义，Enter/Space 与点击同路径，focus-visible 环可见
  const taskCardFocusClass =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-neutral-00)]';
  const activateTask = (taskId: string) => {
    onRouteChange(`/mobile/tasks/${taskId}`);
  };
  const handleTaskCardKeyDown = (event: KeyboardEvent<HTMLDivElement>, taskId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activateTask(taskId);
    }
  };

  // 五层卡片结构共享样式：③ 辅助区（关爱背景 / 反馈）明确但不抢眼，④ 分隔线，⑤ 来源行
  const taskCardContextClass =
    'rounded-[4px] border border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] px-2.5 py-2 text-xs leading-relaxed text-[var(--color-neutral-09)] mb-3';
  const taskCardFooterClass =
    'flex items-center justify-between gap-2 pt-3 border-t border-[var(--color-neutral-03)]';
  const taskCardSourceClass =
    'text-xs text-[var(--color-neutral-08)] font-medium flex items-center gap-1 min-w-0';

  return (
    <MobileLayout currentRoute="tasks" onRouteChange={onRouteChange} onExitMobile={onExitMobile} title="工作清单">
      <div className="bg-[var(--color-neutral-01)] min-h-full flex flex-col">
        <div data-testid="tasks-viewmode-bar" className="px-4 py-3 border-b border-[var(--color-neutral-03)] flex items-center justify-between sticky top-0 bg-[var(--color-neutral-01)] z-20">
          <div className="flex items-center gap-1 bg-[var(--color-neutral-03)] p-1 rounded-lg w-full" role="group" aria-label="任务时间范围">
            <button
              type="button"
              aria-pressed={viewMode === 'today'}
              onClick={() => setViewMode('today')}
              className={`flex-1 min-h-[44px] px-3 py-1.5 text-xs font-medium rounded-md transition-all text-center ${
                viewMode === 'today' ? 'bg-[var(--color-neutral-02)] text-[var(--color-brand-text)] shadow-sm' : 'text-[var(--color-neutral-10)]'
              }`}
            >
              今日待办
            </button>
            <button
              type="button"
              aria-pressed={viewMode === 'month'}
              onClick={() => setViewMode('month')}
              className={`flex-1 min-h-[44px] px-3 py-1.5 text-xs font-medium rounded-md transition-all text-center ${
                viewMode === 'month' ? 'bg-[var(--color-neutral-02)] text-[var(--color-brand-text)] shadow-sm' : 'text-[var(--color-neutral-10)]'
              }`}
            >
              本月工作
            </button>
            <button
              type="button"
              aria-pressed={viewMode === 'all'}
              onClick={() => setViewMode('all')}
              className={`flex-1 min-h-[44px] px-3 py-1.5 text-xs font-medium rounded-md transition-all text-center ${
                viewMode === 'all' ? 'bg-[var(--color-neutral-02)] text-[var(--color-brand-text)] shadow-sm' : 'text-[var(--color-neutral-10)]'
              }`}
            >
              全部清单
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 p-3 bg-[var(--color-neutral-00)]">
          <div className="bg-[var(--color-neutral-02)] rounded-[4px] p-2.5 text-center border border-[var(--color-neutral-03)]">
            <div className="text-xl font-bold text-[var(--color-brand-text)]">{summary.pending}</div>
            <div className="text-[10px] text-[var(--color-neutral-08)] mt-1 scale-90 origin-center whitespace-nowrap">
              {viewMode === 'today' ? '今日待办' : (viewMode === 'month' ? '本月待办' : '剩余待办')}
            </div>
          </div>
          <div className="bg-[var(--color-neutral-02)] rounded-[4px] p-2.5 text-center border border-[var(--color-neutral-03)]">
            <div className="text-xl font-bold text-[var(--color-status-error-text)]">{summary.overdue}</div>
            <div className="text-[10px] text-[var(--color-neutral-08)] mt-1 scale-90 origin-center whitespace-nowrap">逾期任务</div>
          </div>
          <div className="bg-[var(--color-neutral-02)] rounded-[4px] p-2.5 text-center border border-[var(--color-neutral-03)]">
            <div className="text-xl font-bold text-[var(--color-status-success-text)]">{summary.completed}</div>
            <div className="text-[10px] text-[var(--color-neutral-08)] mt-1 scale-90 origin-center whitespace-nowrap">
              {viewMode === 'today' ? '今日已完' : '累计完成'}
            </div>
          </div>
          <div className="bg-[var(--color-neutral-02)] rounded-[4px] p-2.5 text-center border border-[var(--color-neutral-03)]">
            <div className="text-xl font-bold text-[var(--color-status-warning-text)]">{summary.completionRate}%</div>
            <div className="text-[10px] text-[var(--color-neutral-08)] mt-1 scale-90 origin-center whitespace-nowrap">完成率</div>
          </div>
        </div>

        {viewMode === 'all' && (
          <div className="px-4 py-2 bg-[var(--color-neutral-01)] border-b border-[var(--color-neutral-03)] animate-in fade-in zoom-in-95 duration-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-neutral-06)]" />
              <Input
                type="text"
                id="tasks-search"
                aria-label="搜索任务或来源对象"
                placeholder="搜索任务或来源对象..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-9 pr-12 min-h-[44px] text-sm bg-[var(--color-neutral-02)] border-[var(--color-neutral-03)] text-[var(--color-neutral-10)] placeholder:text-[var(--color-neutral-08)] focus-visible:bg-[var(--color-neutral-02)] focus-visible:border-[var(--color-brand-primary)] focus-visible:ring-0 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--color-neutral-08)]"
                >
                  <span className="sr-only">清除</span>
                  ×
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col bg-[var(--color-neutral-00)]">
          <Tabs defaultValue="pending" className="w-full flex flex-col h-full">
            {/* 吸顶偏移 = 上方 viewMode 条渲染高度：py-3(24) + p-1(8) + 按钮 min-h-[44px](44) + 边框(1) = 77px */}
            <div data-testid="tasks-tabs-sticky" className="bg-[var(--color-neutral-01)] sticky top-[77px] z-20">
              <TabsList className="w-full flex h-12 bg-transparent p-0 border-b border-[var(--color-neutral-03)]">
                <TabsTrigger
                  value="pending"
                  className="group relative flex-1 min-h-[44px] rounded-none border-none bg-transparent px-0 data-[state=active]:shadow-none"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-[15px] font-medium text-[var(--color-neutral-10)] transition-colors hover:text-[var(--color-neutral-11)] group-data-[state=active]:text-[var(--color-brand-text)]">
                      待处理
                    </span>
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--color-neutral-03)] px-1.5 text-xs text-[var(--color-neutral-10)] transition-colors group-data-[state=active]:bg-[var(--color-brand-primary)]/20 group-data-[state=active]:text-[var(--color-brand-text)]">
                      {displayPending.length}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-1/2 h-[3px] w-12 -translate-x-1/2 rounded-t-full bg-[var(--color-brand-primary-hover)] opacity-0 transition-all duration-300 group-data-[state=active]:opacity-100" />
                </TabsTrigger>

                <TabsTrigger
                  value="completed"
                  className="group relative flex-1 min-h-[44px] rounded-none border-none bg-transparent px-0 data-[state=active]:shadow-none"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-[15px] font-medium text-[var(--color-neutral-10)] transition-colors hover:text-[var(--color-neutral-11)] group-data-[state=active]:text-[var(--color-brand-text)]">
                      已完成
                    </span>
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--color-neutral-03)] px-1.5 text-xs text-[var(--color-neutral-10)] transition-colors group-data-[state=active]:bg-[var(--color-brand-primary)]/20 group-data-[state=active]:text-[var(--color-brand-text)]">
                      {displayCompleted.length}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-1/2 h-[3px] w-12 -translate-x-1/2 rounded-t-full bg-[var(--color-brand-primary-hover)] opacity-0 transition-all duration-300 group-data-[state=active]:opacity-100" />
                </TabsTrigger>
              </TabsList>
            </div>

            {/* 唯一主滚动容器是 MobileLayout 内容区；此处不再另起 overflow 滚动 */}
            <div className="flex-1 bg-[var(--color-neutral-00)] p-4">
              {loading ? (
                <div className="flex h-full items-center justify-center text-[var(--color-neutral-08)]">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  正在同步任务工作台...
                </div>
              ) : loadError ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                  <AlertCircle className="w-8 h-8 text-[var(--color-status-error-text)]" />
                  <p className="text-sm font-medium text-[var(--color-neutral-10)]">任务列表加载失败</p>
                  <p className="text-xs text-[var(--color-neutral-08)] break-all">{loadError}</p>
                  <Button
                    variant="outline"
                    className="min-h-[44px] px-6"
                    onClick={() => setReloadToken((token) => token + 1)}
                  >
                    重试
                  </Button>
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
                          data-testid="task-card-pending"
                          role="button"
                          tabIndex={0}
                          className={`cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99] border border-[var(--color-neutral-03)] shadow-none overflow-hidden bg-[var(--color-neutral-02)] ${taskCardFocusClass} ${
                            isOverdue ? 'border-l-2 border-l-[var(--color-status-error)]' : ''
                          }`}
                          onClick={() => activateTask(task.id)}
                          onKeyDown={(event) => handleTaskCardKeyDown(event, task.id)}
                        >
                          <CardContent className="p-4">
                            {/* ① 类型 / 紧急度 / 状态：紧凑且可换行，390px 下不横向溢出 */}
                            <div data-task-region="badges" className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-3">
                              <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                                isOverdue ? 'bg-[var(--color-status-error)]/20 text-[var(--color-status-error-text)]' : (task.urgent ? 'bg-[var(--color-status-error)]/15 text-[var(--color-status-error-text)]' : 'bg-[var(--color-status-warning)]/15 text-[var(--color-status-warning-text)]')
                              }`}>
                                {isOverdue ? <AlertCircle className="w-4.5 h-4.5" /> : <Clock className="w-4.5 h-4.5" />}
                              </div>

                              <div className="flex flex-wrap items-center gap-2 min-w-0">
                                <Badge variant="secondary" className={`rounded text-xs font-medium border-0 px-2 py-0.5 ${getTypeColor(task.type)}`}>
                                  {task.type}
                                </Badge>
                                {task.urgent && (
                                  <Badge variant="destructive" className="rounded text-xs font-medium px-2 py-0.5 shadow-none">
                                    紧急
                                  </Badge>
                                )}
                                <Badge variant="outline" className="rounded text-xs font-medium px-2 py-0.5 border-0 bg-[var(--color-neutral-03)] text-[var(--color-neutral-10)]">
                                  {task.statusLabel}
                                </Badge>
                              </div>
                            </div>

                            {/* ② 人员姓名 + 动作（主视觉，不截断） */}
                            <div data-task-region="subject" className="text-[16px] font-bold text-[var(--color-neutral-11)] leading-snug mb-2">
                              {task.title}
                            </div>

                            {/* ③ 关爱标签与距上次走访天数等背景：辅助区，完整可读 */}
                            <div data-task-region="context" className={taskCardContextClass}>
                              {task.description}
                            </div>

                            {/* ④ 分隔线 + ⑤ 下发来源 / 逾期状态 */}
                            <div data-task-region="footer" className={taskCardFooterClass}>
                              <div className={taskCardSourceClass}>
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-neutral-04)] shrink-0" />
                                <span className="truncate">下发：{task.assignedBy}</span>
                              </div>
                              <div className={`text-xs font-bold flex items-center gap-1.5 shrink-0 ${deadlineStatus.color}`}>
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
                        {viewMode === 'today' && <p className="text-[var(--color-neutral-08)] text-xs mt-1">今天的工作已全部完成</p>}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="completed" className="mt-0 space-y-3">
                    {displayCompleted.map((task) => (
                      <Card
                        key={task.id}
                        data-testid="task-card-completed"
                        role="button"
                        tabIndex={0}
                        className={`cursor-pointer hover:shadow-md transition-shadow border border-[var(--color-neutral-03)] shadow-none opacity-90 bg-[var(--color-neutral-02)] ${taskCardFocusClass}`}
                        onClick={() => activateTask(task.id)}
                        onKeyDown={(event) => handleTaskCardKeyDown(event, task.id)}
                      >
                        <CardContent className="p-4">
                          {/* ① 类型 / 状态：紧凑且可换行 */}
                          <div data-task-region="badges" className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-3">
                            <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                              task.onTime ? 'bg-[var(--color-status-success)]/15 text-[var(--color-status-success-text)]' : 'bg-[var(--color-status-warning)]/15 text-[var(--color-status-warning-text)]'
                            }`}>
                              {task.onTime ? <CheckCircle className="w-4.5 h-4.5" /> : <AlertCircle className="w-4.5 h-4.5" />}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 min-w-0">
                              <Badge variant="secondary" className={`rounded text-xs font-medium border-0 px-2 py-0.5 ${getTypeColor(task.type)}`}>
                                {task.type}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={`text-xs px-2 py-0.5 rounded border-0 ${
                                  task.onTime ? 'bg-[var(--color-status-success)]/15 text-[var(--color-status-success-text)]' : 'bg-[var(--color-status-warning)]/20 text-[var(--color-status-warning-text)]'
                                }`}
                              >
                                {task.statusLabel}
                              </Badge>
                            </div>
                          </div>

                          {/* ② 人员姓名 + 动作（主视觉，不截断） */}
                          <div data-task-region="subject" className="text-[16px] font-bold text-[var(--color-neutral-11)] leading-snug mb-2">
                            {task.title}
                          </div>

                          {/* ③ 走访 / 调解反馈背景：辅助区，完整可读 */}
                          {task.feedback && (
                            <div data-task-region="context" className={taskCardContextClass}>
                              <span className="font-medium text-[var(--color-neutral-10)]">反馈：</span>{task.feedback}
                            </div>
                          )}

                          {/* ④ 分隔线 + ⑤ 下发来源 / 完成时间 */}
                          <div data-task-region="footer" className={taskCardFooterClass}>
                            <div className={taskCardSourceClass}>
                              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-neutral-04)] shrink-0" />
                              <span className="truncate">下发：{task.assignedBy}</span>
                            </div>
                            <div className="text-xs font-medium text-[var(--color-neutral-08)] shrink-0">
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
