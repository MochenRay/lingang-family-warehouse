import { Menu, Bell, User, ChevronDown, LogOut, Settings } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';

interface HeaderProps {
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
}

export function Header({ onToggleSidebar, sidebarCollapsed }: HeaderProps) {
  return (
    <header className="h-16 bg-white dark:bg-[var(--color-neutral-01)] border-b border-gray-200 dark:border-[var(--color-neutral-03)] flex items-center justify-between px-6 transition-colors duration-200">
      {/* 左侧：菜单切换按钮 */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="text-gray-600 hover:text-gray-900 dark:text-[var(--color-neutral-10)] dark:hover:text-[var(--color-neutral-11)]"
        >
          <Menu className="w-5 h-5" />
        </Button>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-[var(--color-neutral-08)]">当前辖区:</span>
          <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 dark:text-[var(--color-brand-primary-hover)] dark:border-[var(--color-brand-primary)] dark:bg-[var(--color-neutral-02)]">
            烟台市
          </Badge>
        </div>
      </div>

      {/* 右侧：通知 + 用户信息 */}
      <div className="flex items-center gap-3">
        {/* 通知图标 */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-gray-600 dark:text-[var(--color-neutral-10)]" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </Button>

        {/* 用户下拉菜单 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 pl-2 pr-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-[var(--color-neutral-03)] flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600 dark:text-[var(--color-brand-primary-hover)]" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium text-gray-900 dark:text-[var(--color-neutral-11)]">管理员</span>
                <span className="text-xs text-gray-500 dark:text-[var(--color-neutral-08)]">系统管理员</span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500 dark:text-[var(--color-neutral-08)]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>我的账户</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="w-4 h-4 mr-2" />
              个人信息
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-2" />
              账户设置
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600 dark:text-[var(--color-status-error)]">
              <LogOut className="w-4 h-4 mr-2" />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}