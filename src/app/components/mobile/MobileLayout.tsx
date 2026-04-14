import { ReactNode } from 'react';
import { Home, LayoutDashboard, Building2, Users, UserCircle, MoreHorizontal, CircleDot, ChevronLeft } from 'lucide-react';
import { MobileStatusBar } from './MobileStatusBar';

interface MobileLayoutProps {
  children: ReactNode;
  currentRoute?: string;
  onRouteChange?: (route: string) => void;
  onExitMobile?: () => void;
  title?: string;
}

export function MobileLayout({ children, currentRoute = 'home', onRouteChange, onExitMobile, title = '家庭数仓' }: MobileLayoutProps) {
  const navItems = [
    { path: 'home', icon: LayoutDashboard, label: '工作台' },
    { path: 'housing', icon: Building2, label: '房屋' },
    { path: 'people', icon: Users, label: '人口' },
    { path: 'profile', icon: UserCircle, label: '我的' }
  ];

  const isActive = (path: string) => currentRoute === path;

  return (
    <div className="h-full flex flex-col bg-[var(--color-neutral-00)] relative overflow-hidden">
      {/* 顶部状态栏区域 */}
      <div className="bg-gradient-to-b from-[var(--color-neutral-01)] to-[var(--color-neutral-02)] border-b border-[var(--color-neutral-03)] shrink-0">
        {/* 系统信息栏 */}
        <MobileStatusBar variant="dark" />
        {/* 应用标题栏 */}
        <div className="h-11 flex items-center justify-center relative">
          {currentRoute !== 'home' && (
            <button 
              onClick={() => onRouteChange && onRouteChange('home')}
              className="absolute left-0 top-0 bottom-0 px-4 flex items-center justify-center text-[var(--color-neutral-10)] active:opacity-70"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          
          <div className="text-[var(--color-neutral-11)] text-base font-semibold tracking-wide">{title}</div>
          
          {/* 微信小程序胶囊按钮模拟 */}
          <div 
            onClick={onExitMobile}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center bg-[var(--color-neutral-03)] border border-[var(--color-neutral-04)] rounded-full h-[30px] px-3 cursor-pointer active:opacity-70 transition-opacity"
          >
            <MoreHorizontal className="w-5 h-5 text-[var(--color-neutral-10)]" />
            <div className="w-[1px] h-3.5 bg-[var(--color-neutral-04)] mx-3"></div>
            <CircleDot className="w-4 h-4 text-[var(--color-neutral-10)]" />
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto pb-16 scrollbar-hide">
        {children}
      </div>

      {/* 底部导航栏 */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-[var(--color-neutral-02)] border-t border-[var(--color-neutral-03)] flex items-center justify-around shadow-lg z-50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.path}
              onClick={() => onRouteChange && onRouteChange(item.path)}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                active ? 'text-[#2761CB]' : 'text-[var(--color-neutral-08)]'
              }`}
            >
              <Icon className={`w-6 h-6 mb-1 ${active ? 'scale-110' : ''} transition-transform`} />
              <span className={`text-xs ${active ? 'font-semibold' : 'font-normal'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}