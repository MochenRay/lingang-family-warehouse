import { useState } from 'react';
import { 
  User,
  MapPin,
  BarChart3,
  Settings,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
  Award,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { MobileLayout } from './MobileLayout';
import { mobileContextRepository } from '../../services/repositories/mobileContextRepository';

interface MobileProfileProps {
  onRouteChange: (route: string) => void;
  onLogout?: () => void;
  onExitMobile?: () => void;
}

export function MobileProfile({ onRouteChange, onLogout, onExitMobile }: MobileProfileProps) {
  const [username] = useState(mobileContextRepository.getCurrentWorkerName() || '网格员张三');
  const [currentGrid, setCurrentGrid] = useState(() => {
    const saved = mobileContextRepository.getCurrentGridSelection();
    return { id: saved.id || 'g1', name: saved.name || '登州街道海梦苑社区第一网格' };
  });

  // 模拟切换网格身份（开发调试用）
  const switchGrid = (gridId: string) => {
    const grids: Record<string, { id: string; name: string }> = {
      'g1': { id: 'g1', name: '登州街道海梦苑社区第一网格' },
      'g2': { id: 'g2', name: '登州街道海梦苑社区第二网格' }
    };
    const newGrid = grids[gridId];
    if (newGrid) {
      setCurrentGrid(newGrid);
      mobileContextRepository.setCurrentGridSelection(newGrid);
    }
  };

  const stats = {
    monthCollected: 156,
    monthTasks: 48,
    monthReports: 23,
    completionRate: 96
  };

  const workCalendar = [
    { date: '12-15', collected: 8, tasks: 3 },
    { date: '12-16', collected: 6, tasks: 2 },
    { date: '12-17', collected: 10, tasks: 4 },
    { date: '12-18', collected: 7, tasks: 3 },
    { date: '12-19', collected: 9, tasks: 2 },
    { date: '12-20', collected: 5, tasks: 1 },
    { date: '今天', collected: 8, tasks: 5, isToday: true }
  ];

  const menuItems = [
    { icon: TrendingUp, label: '工作记录', path: 'update-history', color: 'text-[#413DD4]' },
    { icon: MapPin, label: '辖区概况', path: 'grid-overview', color: 'text-primary' },
    { icon: BarChart3, label: '绩效排名', path: 'stats', color: 'text-[var(--color-status-success)]' },
    { icon: Bell, label: '消息通知', path: 'notices', badge: '3', color: 'text-[var(--color-status-warning)]' },
    { icon: Settings, label: '系统设置', path: 'settings', color: 'text-muted-foreground' },
  ];

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      mobileContextRepository.clearCurrentWorkerName();
      if (onLogout) {
        onLogout();
      } else {
        onRouteChange('/mobile');
      }
    }
  };

  return (
    <MobileLayout currentRoute="profile" onRouteChange={onRouteChange} onExitMobile={onExitMobile}>
      <div className="bg-[var(--color-neutral-00)] min-h-full">
        {/* 个人信息卡片 */}
        <div className="bg-gradient-to-b from-[var(--color-neutral-01)] to-[var(--color-neutral-02)] px-5 pt-6 pb-24 border-b border-[var(--color-neutral-03)] shadow-sm z-10 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full border border-blue-500/30 flex items-center justify-center shadow-lg shadow-blue-900/20 bg-blue-500/10">
                <User className="w-7 h-7 text-blue-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <div className="text-[var(--color-neutral-11)] font-bold text-xl tracking-wide">{username}</div>
                  <div className="px-1.5 py-0.5 bg-[var(--color-neutral-03)] rounded text-xs text-[var(--color-neutral-08)] border border-[var(--color-neutral-04)]">网格员</div>
                </div>
                <div className="text-[var(--color-neutral-08)] text-sm flex items-center gap-1.5 mt-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {currentGrid.name}
                </div>
              </div>
            </div>
            <button className="p-2 hover:bg-[var(--color-neutral-03)] rounded-full transition-colors active:scale-95">
              <ChevronRight className="w-6 h-6 text-[var(--color-neutral-10)]" />
            </button>
          </div>

          {/* 本月统计卡片 */}
          <Card 
            className="absolute left-4 right-4 -bottom-12 bg-[var(--color-neutral-02)] shadow-xl shadow-black/20 border border-[var(--color-neutral-03)] rounded-2xl cursor-pointer active:scale-[0.98] transition-transform"
            onClick={() => onRouteChange('tasks?mode=month')}
          >
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 flex items-center justify-center">
                  <Award className="w-5 h-5 text-blue-500" />
                </div>
                <span className="font-bold text-[var(--color-neutral-11)] text-sm">本月工作概览</span>
                <div className="ml-auto flex items-center gap-1 px-2 py-0.5 bg-[var(--color-neutral-03)] rounded-full text-xs text-[var(--color-neutral-08)] cursor-pointer">
                  <span>{new Date().getMonth() + 1}月</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#2761CB] mb-1">{stats.monthCollected}</div>
                  <div className="text-xs text-[var(--color-neutral-06)] font-medium">采集数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#19B172] mb-1">{stats.monthTasks}</div>
                  <div className="text-xs text-[var(--color-neutral-06)] font-medium">完成任务</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#D6730D] mb-1">{stats.monthReports}</div>
                  <div className="text-xs text-[var(--color-neutral-06)] font-medium">问题上报</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#8B3BCC] mb-1">{stats.completionRate}%</div>
                  <div className="text-xs text-[var(--color-neutral-06)] font-medium">完成率</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="px-4 mt-20 space-y-5 pb-6">


          {/* 功能菜单 */}
          <Card className="bg-[var(--color-neutral-02)] border border-[var(--color-neutral-03)] shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    onClick={() => onRouteChange(item.path)}
                    className={`flex items-center gap-4 p-4 cursor-pointer hover:bg-[var(--color-neutral-03)] transition-colors ${
                      index !== menuItems.length - 1 ? 'border-b border-[var(--color-neutral-03)]' : ''
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-[var(--color-neutral-03)] flex items-center justify-center ${item.color} shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="flex-1 text-[var(--color-neutral-10)] font-medium text-sm">{item.label}</span>
                    {item.badge && (
                      <Badge variant="destructive" className="mr-1 h-5 px-1.5 min-w-[1.25rem] flex items-center justify-center">
                        {item.badge}
                      </Badge>
                    )}
                    <ChevronRight className="w-5 h-5 text-[var(--color-neutral-06)]" />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* 退出登录 */}
          <Button
            variant="outline"
            className="w-full h-12 text-red-500 border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] hover:bg-[var(--color-neutral-03)]"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-2" />
            退出登录
          </Button>

          {/* 版本信息 */}
          <div className="text-center text-xs text-[var(--color-neutral-06)] pb-4">
            <p>烟台家庭数仓移动采集端</p>
            <p className="mt-1">版本 v1.0.0</p>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
