import { useEffect, useState } from 'react';
import { Menu, Bell, User, ChevronDown, LogOut, Settings, Database, ServerOff, HelpCircle } from 'lucide-react';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { API_DATA_SOURCE_EVENT, getApiDataSourceSnapshot, type ApiDataSourceSnapshot } from '../services/api';

interface HeaderProps {
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
}

export function Header({ onToggleSidebar, sidebarCollapsed }: HeaderProps) {
  const [dataSource, setDataSource] = useState<ApiDataSourceSnapshot>(() => getApiDataSourceSnapshot());

  useEffect(() => {
    const handleDataSourceChange = () => setDataSource(getApiDataSourceSnapshot());
    window.addEventListener(API_DATA_SOURCE_EVENT, handleDataSourceChange);
    window.addEventListener('storage', handleDataSourceChange);
    return () => {
      window.removeEventListener(API_DATA_SOURCE_EVENT, handleDataSourceChange);
      window.removeEventListener('storage', handleDataSourceChange);
    };
  }, []);

  const isFallback = dataSource.source === 'fallback';
  const isApiError = dataSource.source === 'api-error';
  const isUnknown = dataSource.source === 'unknown';
  const dataSourceLabel = isFallback ? '本地降级' : isApiError ? 'API 异常' : dataSource.source === 'api' ? 'API 数据' : '数据源待探测';
  const modeLabel = dataSource.mode === 'auto' ? '自动' : dataSource.mode === 'api' ? '仅 API' : '本地 fallback';
  const sourceDetail = isFallback
    ? 'API 调用失败后已使用本地数据。'
    : isApiError
      ? 'API 调用失败，且当前模式不允许降级。'
      : dataSource.source === 'api'
        ? '当前正在使用 API 返回数据。'
        : '尚未完成 API 探测。';
  const errorDetail = dataSource.lastError || (isFallback || isApiError ? '未记录具体异常。' : '暂无异常。');
  const updatedAtLabel = dataSource.updatedAt
    ? new Date(dataSource.updatedAt).toLocaleString('zh-CN', { hour12: false })
    : '尚未记录';

  return (
    <header className="h-16 bg-[var(--color-neutral-01)] border-b border-[var(--color-neutral-03)] flex items-center justify-between px-6 transition-colors duration-200">
      {/* 左侧：菜单切换按钮 */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="text-[var(--color-neutral-10)] hover:text-[var(--color-neutral-11)]"
        >
          <Menu className="w-5 h-5" />
        </Button>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--color-neutral-08)]">当前辖区:</span>
          <Badge variant="outline" className="text-[var(--color-brand-primary-hover)] border-[var(--color-brand-primary)] bg-[var(--color-neutral-02)]">
            烟台市
          </Badge>
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  tabIndex={0}
                  aria-label={`数据源状态：${dataSourceLabel}，${errorDetail}`}
                  className={isFallback || isApiError
                    ? "cursor-help border-amber-500/70 bg-amber-500/10 text-amber-200"
                    : isUnknown
                      ? "cursor-help border-[var(--color-neutral-04)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-08)]"
                    : "cursor-help border-emerald-500/60 bg-emerald-500/10 text-emerald-200"
                  }
                >
                  {isFallback || isApiError ? <ServerOff className="mr-1 h-3 w-3" /> : <Database className="mr-1 h-3 w-3" />}
                  {dataSourceLabel}
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm space-y-2 text-left text-xs leading-5">
                <p className="font-semibold">{dataSourceLabel}</p>
                <p>{sourceDetail}</p>
                <div className="space-y-1 text-[rgba(255,255,255,0.78)]">
                  <p>模式：{modeLabel}</p>
                  <p>地址：{dataSource.baseUrl}</p>
                  <p>最近探测：{updatedAtLabel}</p>
                </div>
                <p className="break-words border-t border-white/15 pt-2 font-mono text-[rgba(255,255,255,0.82)]">
                  {errorDetail}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* 右侧：通知 + 用户信息 */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          title="重新打开浏览建议"
          aria-label="重新打开浏览建议"
          onClick={() => window.dispatchEvent(new Event('homedata:open-journey-overlay'))}
        >
          <HelpCircle className="w-5 h-5 text-[var(--color-neutral-10)]" />
        </Button>

        {/* 通知图标 */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-[var(--color-neutral-10)]" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </Button>

        {/* 用户下拉菜单 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 pl-2 pr-3">
              <div className="w-8 h-8 rounded-full bg-[var(--color-neutral-03)] flex items-center justify-center">
                <User className="w-4 h-4 text-[var(--color-brand-primary-hover)]" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium text-[var(--color-neutral-11)]">管理员</span>
                <span className="text-xs text-[var(--color-neutral-08)]">系统管理员</span>
              </div>
              <ChevronDown className="w-4 h-4 text-[var(--color-neutral-08)]" />
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
            <DropdownMenuItem className="text-[var(--color-status-error)]">
              <LogOut className="w-4 h-4 mr-2" />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
