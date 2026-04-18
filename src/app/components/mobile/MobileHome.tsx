import { useEffect, useState } from 'react';
import {
  Users,
  AlertCircle,
  Loader2,
  MapPin,
  FileText,
  ChevronRight,
  Scan,
  ShieldAlert,
  Building2,
  ClipboardList,
  Sparkles
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { MobileLayout } from './MobileLayout';
import { statsRepository, type DashboardStatsResponse } from '../../services/repositories/statsRepository';
import { taskRepository } from '../../services/repositories/taskRepository';
import { mobileContextRepository } from '../../services/repositories/mobileContextRepository';

interface MobileHomeProps {
  onRouteChange: (route: string) => void;
  onExitMobile?: () => void;
}

export function MobileHome({ onRouteChange, onExitMobile }: MobileHomeProps) {
  const [dashboard, setDashboard] = useState<DashboardStatsResponse | null>(null);
  const [taskSummary, setTaskSummary] = useState<{ pending: number; overdue: number; completed: number; completionRate: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const username = mobileContextRepository.getCurrentWorkerName();
  const currentGridSelection = mobileContextRepository.getCurrentGridSelection();
  const fallbackGridId = currentGridSelection.id;
  const fallbackGridName = currentGridSelection.name || '竹岛街道海源社区第一网格';

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const [response, nextTaskSummary] = await Promise.all([
          statsRepository.getDashboard('month'),
          taskRepository.getTaskSummary(),
        ]);
        if (!active) {
          return;
        }
        setDashboard(response);
        setTaskSummary(nextTaskSummary);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    const handleDbChange = () => {
      void load();
    };

    window.addEventListener('db-change', handleDbChange);
    return () => {
      active = false;
      window.removeEventListener('db-change', handleDbChange);
    };
  }, []);

  const currentGridName =
    (fallbackGridId ? dashboard?.grids.find((item) => item.id === fallbackGridId)?.name : undefined) ??
    dashboard?.grids.find((item) => item.peopleCount > 0)?.name ??
    fallbackGridName;

  const workSummary = {
    pending: taskSummary?.pending ?? 0,
    completed: taskSummary?.completed ?? 0,
    visited: dashboard?.metadata.totalVisits ?? 0,
    highRisk: dashboard?.mobilePeopleStats.highRisk ?? 0,
  };

  const syncLabel = dashboard?.metadata.generatedAt
    ? `最近同步 ${dashboard.metadata.generatedAt.slice(5, 16)}`
    : '正在同步最新台账';
  const busiestGrid = dashboard
    ? [...dashboard.grids].sort(
        (left, right) => (right.conflictCount + right.visitCount) - (left.conflictCount + left.visitCount),
      )[0]
    : null;

  const quickActions = [
    {
      icon: ClipboardList,
      label: '待办清单',
      color: 'bg-[#2761CB]',
      path: 'tasks?mode=today',
      desc: '查看当前待跟进事项'
    },
    {
      icon: Users,
      label: '人口台账',
      color: 'bg-[var(--color-status-success)]',
      path: 'people',
      desc: '进入人员与画像视图'
    },
    {
      icon: Building2,
      label: '房屋台账',
      color: 'bg-[#4E86DF]',
      path: 'housing',
      desc: '查看房屋与居住关系'
    },
    {
      icon: FileText,
      label: '走访记录',
      color: 'bg-[#413DD4]',
      path: 'people',
      desc: '从重点对象进入走访'
    },
    {
      icon: ShieldAlert,
      label: '矛盾调解',
      color: 'bg-[#FF9F1C]',
      path: 'conflict',
      desc: '纠纷化解'
    },
    {
      icon: Scan,
      label: '扫码核验',
      color: 'bg-[#2EC4B6]',
      path: 'scan',
      desc: '快捷进入现场核验'
    }
  ];

  const focusItems = [
    dashboard?.riskTagsSummary[0]
      ? {
          id: 'risk-primary',
          title: `${dashboard.riskTagsSummary[0].name}需优先跟进`,
          detail: `当前 ${dashboard.riskTagsSummary[0].count} 人，建议先进入人口台账筛查。`,
          route: 'people',
        }
      : null,
    dashboard?.conflictStats
      ? {
          id: 'conflict-active',
          title: `当前待化解矛盾 ${dashboard.conflictStats.active} 起`,
          detail: `已化解 ${dashboard.conflictStats.resolved} 起，可从矛盾调解链路继续跟进。`,
          route: 'conflict',
        }
      : null,
    busiestGrid
      ? {
          id: 'grid-focus',
          title: `${busiestGrid.name}是当前重点网格`,
          detail: `人口 ${busiestGrid.peopleCount} 人，房屋 ${busiestGrid.houseCount} 套。`,
          route: 'people',
        }
      : null,
  ].filter(Boolean) as { id: string; title: string; detail: string; route: string }[];

  const aiSummary = dashboard
    ? [
        `本月已累计纳入 ${dashboard.totalPopulation} 名人口、${dashboard.totalHouses} 套房屋，移动端与驾驶舱口径一致。`,
        `高风险对象 ${dashboard.mobilePeopleStats.highRisk} 人，当前待跟进任务 ${taskSummary?.pending ?? 0} 项，建议优先查看待办清单。`,
      ]
    : [];

  const guidedJourney = [
    {
      title: '先看待办清单',
      detail: '最快理解一线人员今天要处理什么。',
      route: 'tasks?mode=today',
    },
    {
      title: '再点人口台账',
      detail: '从人物详情、画像、走访入口进入主链。',
      route: 'people',
    },
    {
      title: '最后用扫码/房屋入口看现场',
      detail: '体验从对象到现场核验的移动端链路。',
      route: 'scan',
    },
  ];

  return (
    <MobileLayout currentRoute="home" onRouteChange={onRouteChange} onExitMobile={onExitMobile}>
      {/* 顶部渐变背景区域 */}
      <div className="relative bg-gradient-to-br from-[var(--color-neutral-00)] via-[var(--color-neutral-01)] to-[var(--color-neutral-02)] px-4 pt-2 pb-6 border-b border-[var(--color-neutral-03)]">
        {/* 装饰性背景元素 */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#2761CB] opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#4E86DF] opacity-5 rounded-full blur-3xl"></div>
        
        {/* 用户信息卡片 */}
        <div className="relative z-10 flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* 用户头像 */}
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-[#2761CB] to-[#4E86DF] rounded-full flex items-center justify-center shadow-lg">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[var(--color-status-success)] border-2 border-[var(--color-neutral-00)] rounded-full"></div>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <div className="text-[var(--color-neutral-11)] font-bold text-lg tracking-wide">{username}</div>
                <div className="px-2 py-0.5 bg-[rgba(78,134,223,0.15)] rounded text-xs text-[#4E86DF] border border-[rgba(78,134,223,0.3)] font-medium">
                  网格员
                </div>
              </div>
              <div className="text-[var(--color-neutral-08)] text-xs flex items-center gap-1.5 mt-1">
                <MapPin className="w-3 h-3" />
                <span className="line-clamp-1">{currentGridName}</span>
              </div>
            </div>
          </div>
          
          {/* 扫码按钮 */}
          <button 
            onClick={() => onRouteChange('scan')}
            className="p-2.5 bg-[var(--color-neutral-02)] hover:bg-[var(--color-neutral-03)] border border-[var(--color-neutral-03)] rounded-xl transition-all active:scale-95 shadow-sm"
          >
            <Scan className="w-5 h-5 text-[var(--color-neutral-10)]" />
          </button>
        </div>

        {/* 今日工作统计卡片 */}
        <Card 
          className="relative bg-gradient-to-br from-[var(--color-neutral-02)] to-[var(--color-neutral-03)] border-[var(--color-neutral-03)] shadow-xl rounded-2xl cursor-pointer active:scale-[0.98] transition-transform overflow-hidden"
          onClick={() => onRouteChange('tasks?mode=today')}
        >
          {/* 装饰性渐变 */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#2761CB] to-transparent opacity-10 rounded-full blur-2xl"></div>
          
          <CardContent className="relative z-10 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-5 bg-gradient-to-b from-[#2761CB] to-[#4E86DF] rounded-full"></div>
                <span className="text-base font-bold text-[var(--color-neutral-11)]">治理总览</span>
              </div>
              <div className="flex items-center gap-1 text-[var(--color-neutral-08)] bg-[var(--color-neutral-01)] px-2.5 py-1 rounded-lg">
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertCircle className="w-3.5 h-3.5" />}
                <span className="text-xs font-medium">{syncLabel}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center p-2 rounded-xl bg-[var(--color-neutral-01)] border border-[var(--color-neutral-03)]">
                <div className="text-2xl font-bold text-[var(--color-status-warning)] mb-0.5">{workSummary.pending}</div>
                <div className="text-xs text-[var(--color-neutral-08)] font-medium">待跟进</div>
              </div>
              <div className="text-center p-2 rounded-xl bg-[var(--color-neutral-01)] border border-[var(--color-neutral-03)]">
                <div className="text-2xl font-bold text-[var(--color-status-success)] mb-0.5">{workSummary.completed}</div>
                <div className="text-xs text-[var(--color-neutral-08)] font-medium">已完成</div>
              </div>
              <div className="text-center p-2 rounded-xl bg-[var(--color-neutral-01)] border border-[var(--color-neutral-03)]">
                <div className="text-2xl font-bold text-[#2761CB] mb-0.5">{workSummary.visited}</div>
                <div className="text-xs text-[var(--color-neutral-08)] font-medium">走访</div>
              </div>
              <div className="text-center p-2 rounded-xl bg-[var(--color-neutral-01)] border border-[var(--color-neutral-03)]">
                <div className="text-2xl font-bold text-[#8B3BCC] mb-0.5">{workSummary.highRisk}</div>
                <div className="text-xs text-[var(--color-neutral-08)] font-medium">高风险</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="px-4 pt-4 pb-2">
        <div className="mb-6">
          <Card className="border-[rgba(78,134,223,0.2)] bg-[linear-gradient(135deg,rgba(39,97,203,0.08),rgba(78,134,223,0.02))] shadow-sm overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#4E86DF]">
                <Sparkles className="w-4 h-4" />
                首次体验建议
              </div>
              <div className="mt-2 text-sm leading-6 text-[var(--color-neutral-10)]">
                如果你是第一次打开移动端，建议先从待办清单进入，再看人口台账，最后体验扫码核验或房屋台账，这样最容易理解一线执行链路。
              </div>
              <div className="mt-4 space-y-2">
                {guidedJourney.map((item, index) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => onRouteChange(item.route)}
                    className="flex w-full items-start gap-3 rounded-xl border border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] px-3 py-3 text-left active:bg-[var(--color-neutral-02)]"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[rgba(39,97,203,0.12)] text-xs font-semibold text-[#2761CB]">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[var(--color-neutral-11)]">{item.title}</div>
                      <div className="mt-0.5 text-xs text-[var(--color-neutral-08)]">{item.detail}</div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 快捷功能 */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-[var(--color-neutral-11)] mb-3">快捷功能</h3>
          <div className="grid grid-cols-3 gap-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <div
                  key={index}
                  className="bg-[var(--color-neutral-02)] border border-[var(--color-neutral-03)] rounded-2xl p-3 h-24 flex flex-col items-center justify-center shadow-sm cursor-pointer active:scale-95 transition-transform"
                  onClick={() => onRouteChange(action.path)}
                >
                  <div className={`w-11 h-11 ${action.color} rounded-xl flex items-center justify-center shrink-0 shadow-lg mb-2`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="font-semibold text-xs text-[var(--color-neutral-10)] text-center">{action.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 治理焦点 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-sm font-bold text-[var(--color-neutral-11)]">治理焦点</h3>
            <button 
              onClick={() => onRouteChange('tasks?mode=today')}
              className="text-xs text-[#2761CB] flex items-center font-medium active:opacity-70"
            >
              去处理
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
          <Card className="border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] shadow-sm overflow-hidden">
            <CardContent className="p-0 [&:last-child]:pb-0">
              {focusItems.map((item, index) => (
                <div 
                  key={item.id}
                  onClick={() => onRouteChange(item.route)}
                  className={`p-3.5 flex items-center gap-3 cursor-pointer active:bg-[var(--color-neutral-03)] transition-colors ${
                    index !== focusItems.length - 1 ? 'border-b border-[var(--color-neutral-03)]' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-[rgba(78,134,223,0.15)] border border-[rgba(78,134,223,0.3)] flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-4 h-4 text-[#4E86DF]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[var(--color-neutral-11)] truncate">{item.title}</div>
                    <div className="text-xs text-[var(--color-neutral-08)] mt-0.5">{item.detail}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--color-neutral-08)] flex-shrink-0" />
                </div>
              ))}
              {focusItems.length === 0 && (
                <div className="p-4 text-sm text-[var(--color-neutral-08)]">正在加载统一台账焦点...</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 px-1">
            <Sparkles className="w-4 h-4 text-[#4E86DF]" />
            <h3 className="text-sm font-bold text-[var(--color-neutral-11)]">AI 提示</h3>
          </div>
          <Card className="border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] shadow-sm overflow-hidden">
            <CardContent className="p-4 space-y-3">
              {aiSummary.map((item, index) => (
                <div key={index} className="rounded-xl border border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] px-3 py-2 text-sm text-[var(--color-neutral-10)]">
                  {item}
                </div>
              ))}
              {aiSummary.length === 0 && (
                <div className="text-sm text-[var(--color-neutral-08)]">正在生成驾驶舱同步摘要...</div>
              )}
              <button
                type="button"
                onClick={() => onRouteChange('tasks?mode=today')}
                className="w-full rounded-xl bg-[#2761CB] px-4 py-3 text-sm font-semibold text-white shadow-sm active:scale-[0.99]"
              >
                查看待办清单
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </MobileLayout>
  );
}
