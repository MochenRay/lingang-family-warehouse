import { useState } from 'react';
import {
  Home as HomeIcon,
  Camera,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  TrendingUp,
  Bell,
  FileText,
  ChevronRight,
  Scan,
  QrCode,
  ShieldAlert,
  Flag,
  BookOpen,
  PenTool,
  PieChart
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { MobileLayout } from './MobileLayout';

interface MobileHomeProps {
  onRouteChange: (route: string) => void;
  onExitMobile?: () => void;
}

export function MobileHome({ onRouteChange, onExitMobile }: MobileHomeProps) {
  const [username] = useState(localStorage.getItem('mobile_user') || '网格员');
  const currentGridName = JSON.parse(localStorage.getItem('current_grid') || '{"name":"竹岛街道海源社区第一网格"}').name;

  // Mock数据
  const todayStats = {
    pending: 5,
    completed: 12,
    collected: 8,
    reported: 3
  };

  const quickActions = [
    {
      icon: HomeIcon,
      label: '房屋采集',
      color: 'bg-primary',
      path: 'collect-house',
      desc: '录入房屋信息'
    },
    {
      icon: Users,
      label: '人口采集',
      color: 'bg-[var(--color-status-success)]',
      path: 'collect-person',
      desc: '录入人口信息'
    },
    {
      icon: FileText,
      label: '电子记事',
      color: 'bg-[#413DD4]',
      path: 'quick-note',
      desc: 'AI智能记录'
    },
    {
      icon: AlertCircle,
      label: '问题上报',
      color: 'bg-[var(--color-status-warning)]',
      path: 'patrol',
      desc: '上报现场问题'
    },
    {
      icon: ShieldAlert,
      label: '矛盾调解',
      color: 'bg-[#FF9F1C]',
      path: 'conflict',
      desc: '纠纷化解'
    },
    {
      icon: Flag,
      label: '活动组织',
      color: 'bg-[#2EC4B6]',
      path: 'activity',
      desc: '社区活动'
    },
    {
      icon: BookOpen,
      label: '政策解读',
      color: 'bg-[#4E86DF]',
      path: 'policy-interpretation',
      desc: '政策智能检索'
    },
    {
      icon: PenTool,
      label: '公文写作',
      color: 'bg-[#19B172]',
      path: 'official-writing',
      desc: '辅助文档生成'
    },
    {
      icon: PieChart,
      label: '智能问数',
      color: 'bg-[#8B3BCC]',
      path: 'smart-query',
      desc: '自然语言查询'
    }
  ];

  const recentTasks = [
    { 
      id: 1, 
      title: '核查环翠区竹岛街道XX小区3栋住户信息', 
      type: '核查任务', 
      status: 'pending',
      deadline: '今天 18:00',
      urgent: true
    },
    { 
      id: 2, 
      title: '补录文登区天福街道新增房屋数据', 
      type: '数据补录', 
      status: 'pending',
      deadline: '明天 12:00',
      urgent: false
    },
    { 
      id: 3, 
      title: '更新临港区草庙子镇流动人口信息', 
      type: '信息更新', 
      status: 'completed',
      deadline: '昨天 17:00',
      urgent: false
    }
  ];

  const notices = [
    { id: 1, title: '关于开展人口信息核查工作的通知', time: '2小时前' },
    { id: 2, title: '系统维护通知：12月21日凌晨1:00-3:00', time: '5小时前' },
    { id: 3, title: '关于新增“扫码识房”功能的操作指南', time: '昨天' }
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
                <div className="text-[var(--color-neutral-11)] font-bold text-lg tracking-wide">李明辉</div>
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
                <span className="text-base font-bold text-[var(--color-neutral-11)]">今日工作</span>
              </div>
              <div className="flex items-center gap-1 text-[var(--color-neutral-08)] bg-[var(--color-neutral-01)] px-2.5 py-1 rounded-lg">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">1月6日</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center p-2 rounded-xl bg-[var(--color-neutral-01)] border border-[var(--color-neutral-03)]">
                <div className="text-2xl font-bold text-[var(--color-status-warning)] mb-0.5">{todayStats.pending}</div>
                <div className="text-xs text-[var(--color-neutral-08)] font-medium">待办</div>
              </div>
              <div className="text-center p-2 rounded-xl bg-[var(--color-neutral-01)] border border-[var(--color-neutral-03)]">
                <div className="text-2xl font-bold text-[var(--color-status-success)] mb-0.5">{todayStats.completed}</div>
                <div className="text-xs text-[var(--color-neutral-08)] font-medium">完成</div>
              </div>
              <div className="text-center p-2 rounded-xl bg-[var(--color-neutral-01)] border border-[var(--color-neutral-03)]">
                <div className="text-2xl font-bold text-[#2761CB] mb-0.5">{todayStats.collected}</div>
                <div className="text-xs text-[var(--color-neutral-08)] font-medium">采集</div>
              </div>
              <div className="text-center p-2 rounded-xl bg-[var(--color-neutral-01)] border border-[var(--color-neutral-03)]">
                <div className="text-2xl font-bold text-[#8B3BCC] mb-0.5">{todayStats.reported}</div>
                <div className="text-xs text-[var(--color-neutral-08)] font-medium">上报</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="px-4 pt-4 pb-2">
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

        {/* 通知公告 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-sm font-bold text-[var(--color-neutral-11)]">通知公告</h3>
            <button 
              onClick={() => onRouteChange('notices')}
              className="text-xs text-[#2761CB] flex items-center font-medium active:opacity-70"
            >
              查看更多
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
          <Card className="border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] shadow-sm overflow-hidden">
            <CardContent className="p-0 [&:last-child]:pb-0">
              {notices.map((notice, index) => (
                <div 
                  key={notice.id}
                  onClick={() => onRouteChange('notice-detail')}
                  className={`p-3.5 flex items-center gap-3 cursor-pointer active:bg-[var(--color-neutral-03)] transition-colors ${
                    index !== notices.length - 1 ? 'border-b border-[var(--color-neutral-03)]' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-[rgba(78,134,223,0.15)] border border-[rgba(78,134,223,0.3)] flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4 text-[#4E86DF]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[var(--color-neutral-11)] truncate">{notice.title}</div>
                    <div className="text-xs text-[var(--color-neutral-08)] mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {notice.time}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--color-neutral-08)] flex-shrink-0" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </MobileLayout>
  );
}