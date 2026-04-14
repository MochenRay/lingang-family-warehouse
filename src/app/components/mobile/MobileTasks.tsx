import { useState } from 'react';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ChevronRight,
  Filter,
  Search,
  Scan,
  QrCode,
  Camera
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { MobileLayout } from './MobileLayout';

interface MobileTasksProps {
  onRouteChange: (route: string) => void;
  initialViewMode?: 'today' | 'month' | 'all';
  onExitMobile?: () => void;
}

export function MobileTasks({ onRouteChange, initialViewMode = 'today', onExitMobile }: MobileTasksProps) {
  const [viewMode, setViewMode] = useState<'today' | 'month' | 'all'>(initialViewMode);
  const [searchQuery, setSearchQuery] = useState('');

  // 模拟日期
  const today = new Date();
  const dateStr = today.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });
  const todayStr = today.toISOString().split('T')[0];
  
  // 辅助时间生成
  const getRelativeDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const getMonthStart = () => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  };
  const monthStartStr = getMonthStart();

  const pendingTasks = [
    // 逾期任务
    { 
      id: 6, 
      title: '高区怡园街道消防通道占用隐患排查', 
      type: '安全巡查',
      assignedBy: '街道综治办',
      deadline: `${getRelativeDate(-1)} 17:00`,
      urgent: true,
      description: '接到群众举报，怡海园小区4号楼楼道存在堆放杂物现象，需立即核查清理。'
    },
    // 今日任务
    { 
      id: 1, 
      title: '核查环翠区竹岛街道海源社区3栋住户信息', 
      type: '核查任务',
      assignedBy: '区级管理员',
      deadline: `${todayStr} 18:00`,
      urgent: true,
      description: '需核实该楼栋所有住户的基本信息是否准确，特别是流动人口居住证办理情况。'
    },
    { 
      id: 5, 
      title: '更新环翠区竹岛街道独居老人走访记录', 
      type: '特殊人群',
      assignedBy: '社区书记',
      deadline: `${todayStr} 16:00`,
      urgent: false,
      description: '对辖区内建档的12位独居老人进行每周例行探访，更新健康状况表。'
    },
    // 明日及未来任务
    { 
      id: 2, 
      title: '补录文登区天福街道文山社区新增房屋数据', 
      type: '数据补录',
      assignedBy: '街道管理员',
      deadline: `${getRelativeDate(1)} 12:00`,
      urgent: false,
      description: '对新交付的文山花园二期进行房屋基础信息录入，共计3栋楼128户。'
    },
    { 
      id: 7, 
      title: '经区皇冠街道邻里纠纷调解回访', 
      type: '矛盾调解',
      assignedBy: '司法所',
      deadline: `${getRelativeDate(1)} 10:00`,
      urgent: false,
      description: '对上周调解的噪音扰民纠纷双方当事人进行电话回访，确认是否反弹。'
    },
    { 
      id: 8, 
      title: '荣成市崖头街道九小场所消防检查', 
      type: '安全巡查',
      assignedBy: '派出所',
      deadline: `${getRelativeDate(1)} 15:00`,
      urgent: true,
      description: '重点检查沿街餐饮店铺燃气报警器安装及灭火器配备情况。'
    },
    { 
      id: 3, 
      title: '核实临港区草庙子镇流动人口就业信息', 
      type: '信息更新',
      assignedBy: '区级管理员',
      deadline: `${getRelativeDate(7)} 17:00`,
      urgent: false,
      description: '季度常规任务：更新辖区内务工人员的就业单位和社保缴纳情况。'
    },
    { 
      id: 4, 
      title: '拍摄环翠区老旧小区外立面改造进度', 
      type: '拍照任务',
      assignedBy: '系统管理员',
      deadline: `${getRelativeDate(7)} 18:00`,
      urgent: false,
      description: '对光明街片区改造项目进行节点拍照留档，重点拍摄保温层施工情况。'
    }
  ];

  const completedTasks = [
    { 
      id: 101, 
      title: '核查环翠区竹岛街道海源社区1栋住户信息', 
      type: '核查任务',
      completedAt: `${getRelativeDate(-1)} 15:30`,
      status: '已通过',
      feedback: '数据准确，审核通过',
      onTime: true
    },
    { 
      id: 104, 
      title: '经区凤林街道流动人口专项摸排', 
      type: '信息更新',
      completedAt: `${getRelativeDate(-1)} 09:15`,
      status: '逾期完成',
      feedback: '任务虽已完成，但超出规定时限24小时，请注意时效。',
      onTime: false
    },
    { 
      id: 102, 
      title: '采集环翠区新建小区房屋信息', 
      type: '数据采集',
      completedAt: '2026-01-18 16:45',
      status: '已通过',
      feedback: '照片清晰，信息完整',
      onTime: true
    },
    { 
      id: 105, 
      title: '高区田和街道商铺信息采集', 
      type: '数据采集',
      completedAt: '2026-01-17 11:20',
      status: '驳回修改',
      feedback: '缺少营业执照照片，请补充后重新提交。',
      onTime: true
    },
    { 
      id: 103, 
      title: '上报环翠区违建情况', 
      type: '问题上报',
      completedAt: '2026-01-17 14:20',
      status: '已处理',
      feedback: '问题已移交执法局处理',
      onTime: true
    }
  ];

  // 简单的过滤逻辑
  const filterTasks = (tasks: typeof pendingTasks) => {
    if (viewMode === 'today') {
      // 演示：显示今日及逾期任务
      const todayDate = new Date().toISOString().split('T')[0];
      return tasks.filter(t => t.deadline.startsWith(todayDate) || new Date(t.deadline) < new Date());
    }
    if (viewMode === 'month') {
      // 显示本月任务
      const currentMonth = new Date().toISOString().slice(0, 7);
      return tasks.filter(t => t.deadline.startsWith(currentMonth));
    }
    // 全部任务模式下支持搜索
    if (searchQuery) {
      return tasks.filter(t => t.title.includes(searchQuery) || t.type.includes(searchQuery));
    }
    return tasks;
  };

  const displayPending = filterTasks(pendingTasks);
  // 对于已完成任务
  const displayCompleted = viewMode === 'today' 
    ? [] // 假设今天还没完成
    : (viewMode === 'month' 
       ? completedTasks.filter(t => t.completedAt.startsWith(new Date().toISOString().slice(0, 7)))
       : completedTasks);

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      '核查任务': 'bg-blue-500/20 text-blue-300',
      '数据补录': 'bg-green-500/20 text-green-300',
      '信息更新': 'bg-cyan-500/20 text-cyan-300',
      '拍照任务': 'bg-purple-500/20 text-purple-300',
      '特殊人群': 'bg-pink-500/20 text-pink-300',
      '数据采集': 'bg-teal-500/20 text-teal-300',
      '问题上报': 'bg-red-500/20 text-red-300',
      '安全巡查': 'bg-orange-500/20 text-orange-300',
      '矛盾调解': 'bg-indigo-500/20 text-indigo-300'
    };
    return colors[type] || 'bg-[var(--color-neutral-03)] text-[var(--color-neutral-08)]';
  };

  const getDeadlineStatus = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const hoursLeft = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursLeft < 0) return { text: '已超期', color: 'text-red-400' };
    if (hoursLeft < 2) return { text: `剩余${Math.floor(hoursLeft * 60)}分钟`, color: 'text-red-400' };
    if (hoursLeft < 24) return { text: `剩余${Math.floor(hoursLeft)}小时`, color: 'text-orange-400' };
    return { text: deadline.split(' ')[0], color: 'text-[var(--color-neutral-08)]' };
  };
  
  // 统计逾期数量
  const overdueCount = pendingTasks.filter(t => new Date(t.deadline) < new Date()).length;

  return (
    <MobileLayout currentRoute="tasks" onRouteChange={onRouteChange} onExitMobile={onExitMobile} title="工作清单">
      <div className="bg-[var(--color-neutral-01)] min-h-full flex flex-col">
        {/* 顶部 Header */}
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

        {/* 统计概览 - 固定在顶部，不受搜索栏影响 */}
        <div className="grid grid-cols-4 gap-2 p-3 bg-[var(--color-neutral-00)]">
          <div className="bg-[var(--color-neutral-02)] rounded-xl p-2.5 text-center border border-[var(--color-neutral-03)]">
            <div className="text-xl font-bold text-blue-400">{displayPending.length}</div>
            <div className="text-[10px] text-[var(--color-neutral-08)] mt-1 scale-90 origin-center whitespace-nowrap">{viewMode === 'today' ? '今日待办' : (viewMode === 'month' ? '本月待办' : '剩余待办')}</div>
          </div>
          <div className="bg-[var(--color-neutral-02)] rounded-xl p-2.5 text-center border border-[var(--color-neutral-03)]">
             {/* 逾期任务数 */}
            <div className="text-xl font-bold text-red-400">{overdueCount}</div>
            <div className="text-[10px] text-[var(--color-neutral-08)] mt-1 scale-90 origin-center whitespace-nowrap">逾期任务</div>
          </div>
          <div className="bg-[var(--color-neutral-02)] rounded-xl p-2.5 text-center border border-[var(--color-neutral-03)]">
            <div className="text-xl font-bold text-green-400">{viewMode === 'today' ? 0 : (viewMode === 'month' ? displayCompleted.length : completedTasks.length)}</div>
            <div className="text-[10px] text-[var(--color-neutral-08)] mt-1 scale-90 origin-center whitespace-nowrap">{viewMode === 'today' ? '今日已完' : '累计完成'}</div>
          </div>
          <div className="bg-[var(--color-neutral-02)] rounded-xl p-2.5 text-center border border-[var(--color-neutral-03)]">
            <div className="text-xl font-bold text-orange-400">
              {viewMode === 'today' ? '0%' : '96%'}
            </div>
            <div className="text-[10px] text-[var(--color-neutral-08)] mt-1 scale-90 origin-center whitespace-nowrap">完成率</div>
          </div>
        </div>


        {/* 搜索栏 - 移至统计数据下方 */}
        {viewMode === 'all' && (
          <div className="px-4 py-2 bg-[var(--color-neutral-01)] border-b border-[var(--color-neutral-03)] animate-in fade-in zoom-in-95 duration-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-neutral-06)]" />
              <Input
                type="text"
                placeholder="搜索历史任务..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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

        {/* 任务列表内容 */}
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
                  {/* 底部指示条 */}
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
                  {/* 底部指示条 */}
                  <div className="absolute bottom-0 left-1/2 h-[3px] w-12 -translate-x-1/2 rounded-t-full bg-blue-400 opacity-0 transition-all duration-300 group-data-[state=active]:opacity-100" />
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto bg-[var(--color-neutral-00)] p-4">
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
                        {/* 第一行：图标 + 标签 */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                            isOverdue ? 'bg-red-500/20 text-red-400' : (task.urgent ? 'bg-red-500/15 text-red-400' : 'bg-orange-500/15 text-orange-400')
                          }`}>
                            {isOverdue ? <AlertCircle className="w-4.5 h-4.5" /> : <Clock className="w-4.5 h-4.5" />}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="secondary" 
                              className={`rounded text-xs font-medium border-0 px-2 py-0.5 ${
                                getTypeColor(task.type)
                              }`}
                            >
                              {task.type}
                            </Badge>
                            {task.urgent && (
                              <Badge variant="destructive" className="rounded text-xs font-medium px-2 py-0.5 shadow-none">
                                紧急
                              </Badge>
                            )}
                            {isOverdue && (
                              <Badge variant="destructive" className="rounded text-xs font-medium px-2 py-0.5 shadow-none bg-red-600">
                                已逾期
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* 第二行：核心标题 */}
                        <div className="text-[16px] font-bold text-[var(--color-neutral-11)] leading-snug mb-2">
                          {task.title}
                        </div>

                        {/* 第三行：描述文本 */}
                        <div className="text-sm text-[var(--color-neutral-08)] leading-relaxed mb-4 line-clamp-2">
                          {task.description}
                        </div>

                        {/* 第四行：底部信息 */}
                        <div className="flex items-center justify-between pt-3 border-t border-[var(--color-neutral-03)]">
                          <div className="text-xs text-[var(--color-neutral-06)] font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-neutral-04)]"></span>
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
                      {/* 第一行：图标 + 标签 */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                          task.onTime ? 'bg-green-500/15 text-green-400' : 'bg-orange-500/15 text-orange-400'
                        }`}>
                          {task.onTime ? <CheckCircle className="w-4.5 h-4.5" /> : <AlertCircle className="w-4.5 h-4.5" />}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="secondary" 
                            className={`rounded text-xs font-medium border-0 px-2 py-0.5 ${getTypeColor(task.type)}`}
                          >
                            {task.type}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-2 py-0.5 rounded border-0 ${
                              task.status === '逾期完成'
                                ? 'bg-orange-500/20 text-orange-300'
                                : (task.status === '驳回修改' ? 'bg-red-500/20 text-red-300' : 'bg-green-500/15 text-green-300')
                            }`}
                          >
                            {task.status}
                          </Badge>
                        </div>
                      </div>

                      {/* 标题 */}
                      <div className="text-[15px] font-bold text-[var(--color-neutral-10)] mb-2 line-clamp-2">
                        {task.title}
                      </div>

                      {/* 反馈 */}
                      {task.feedback && (
                        <div className="bg-[var(--color-neutral-03)] rounded p-2 text-xs text-[var(--color-neutral-08)] mb-3">
                          <span className="font-medium text-[var(--color-neutral-10)]">反馈：</span>{task.feedback}
                        </div>
                      )}

                      {/* 底部信息 */}
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
            </div>
          </Tabs>
        </div>
      </div>
    </MobileLayout>
  );
}