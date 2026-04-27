import { useState } from 'react';
import { 
  Database, 
  Tags, 
  ChartBar, 
  TrendingUp, 
  Settings,
  House,
  Users,
  Building2,
  Link,
  Upload,
  Target,
  Award,
  TriangleAlert,
  UserCog,
  Shield,
  FileText,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  GitCompare,
  Book,
  Smartphone,
  ClipboardList,
  Workflow,
  Map,
  ChartLine,
  Megaphone,
  Calendar,
  Briefcase,
  Bot,
  Sparkles
} from 'lucide-react';
import { cn } from './ui/utils';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    id: 'statistics',
    label: '统计分析',
    icon: ChartBar,
    children: [
      { id: 'statistics-overview', label: '综合统计驾驶舱', icon: BarChart3 },
      { id: 'demographics-analysis', label: '人口特征分析', icon: Users },
      { id: 'housing-statistics', label: '房屋网格画像', icon: Building2 },
      { id: 'migration-trends', label: '人口流动趋势', icon: TrendingUp },
      { id: 'population-tags', label: '标签分析画像', icon: Tags },
      { id: 'data-comparison', label: '数据对比分析', icon: GitCompare },
      { id: 'data-reports', label: '数据报表中心', icon: FileText },
    ],
  },
  {
    id: 'data-management',
    label: '数据管理',
    icon: Database,
    children: [
      { id: 'population', label: '人口管理', icon: Users },
      { id: 'housing', label: '房屋管理', icon: Building2 },
      { id: 'relationship', label: '人房关系', icon: Link },
      { id: 'batch-import', label: '批量导入', icon: Upload },
    ],
  },
  {
    id: 'tag-overview',
    label: '标签管理',
    icon: Tags,
  },
  {
    id: 'data-warehouse-agent',
    label: '数仓智能体',
    icon: Bot,
    children: [
      { id: 'knowledge-accumulation', label: '知识沉淀', icon: Database },
      { id: 'policy-interpretation', label: '政策解读', icon: Book },
      { id: 'document-writing', label: '公文写作', icon: FileText },
      { id: 'smart-query', label: '智能问数', icon: Sparkles },
    ],
  },
  {
    id: 'grid-affairs',
    label: '网格事务',
    icon: Briefcase,
    children: [
      { id: 'behavior-supervision', label: '行为督导', icon: ClipboardList },
      { id: 'activity-management', label: '活动管理', icon: Calendar },
      { id: 'conflict-management', label: '矛盾调解', icon: Shield },
      { id: 'notice-management', label: '公告管理', icon: Megaphone },
      { id: 'rule-config', label: '待办规则', icon: Workflow },
    ],
  },
  {
    id: 'attribution',
    label: '归因分析（示例）',
    icon: TrendingUp,
    children: [
      { id: 'anomaly-analysis', label: '异常结果分析', icon: TriangleAlert },
      { id: 'time-series', label: '时序分析', icon: ChartLine },
      { id: 'factor-identification', label: '影响因子识别', icon: Target },
      { id: 'contribution-ranking', label: '贡献程度排名', icon: Award },
    ],
  },
  {
    id: 'system',
    label: '系统配置',
    icon: Settings,
    children: [
      { id: 'user-management', label: '用户管理', icon: UserCog },
      { id: 'role-management', label: '角色管理', icon: Shield },
      { id: 'permission-management', label: '权限管理', icon: Shield },
      { id: 'log-management', label: '日志管理', icon: FileText },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  currentRoute: string;
  onRouteChange: (route: string) => void;
}

export function Sidebar({ collapsed, currentRoute, onRouteChange }: SidebarProps) {
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['data-management', 'statistics']);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.includes(item.id);
    const isActive = currentRoute === item.id;
    const Icon = item.icon;

    // Calculate dynamic padding based on nesting level
    // Level 0: px-3 (12px)
    // Level 1: pl-10 (40px)
    // Level 2: pl-16 (64px)
    const paddingClass = level === 0 
      ? "px-3" 
      : level === 1 
        ? "pl-10 pr-3" 
        : "pl-16 pr-3";

    return (
      <div key={item.id}>
        <button
          onClick={() => {
            if (hasChildren) {
              toggleMenu(item.id);
            } else {
              onRouteChange(item.id);
            }
          }}
          className={cn(
            "w-full flex items-center gap-3 h-10 rounded-[2px] transition-all duration-200",
            paddingClass,
            isActive && "bg-[rgba(39,97,203,0.08)] text-[#2761CB]",
            !isActive && "text-[#8194B5] hover:text-[#2761CB] hover:bg-[rgba(39,97,203,0.06)]",
            collapsed && "justify-center px-2"
          )}
        >
          <Icon className={cn("shrink-0", collapsed ? "w-5 h-5" : "w-4 h-4")} />
          {!collapsed && (
            <>
              <span className="flex-1 text-left text-sm">{item.label}</span>
              {hasChildren && (
                isExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
              )}
            </>
          )}
        </button>
        
        {hasChildren && isExpanded && !collapsed && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className={cn(
        "bg-[var(--color-neutral-00)] border-r border-[var(--color-neutral-03)] transition-all duration-300 flex flex-col h-screen",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo区域 */}
      <div className="h-16 flex items-center justify-center border-b border-[var(--color-neutral-03)] px-4 shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <Database className="w-6 h-6 text-[var(--color-brand-primary-hover)]" />
            <div className="flex flex-col">
              <span className="font-semibold text-[var(--color-neutral-11)]">家庭数仓</span>
              <span className="text-xs text-[var(--color-neutral-08)]">烟台蓬莱</span>
            </div>
          </div>
        ) : (
          <Database className="w-6 h-6 text-[var(--color-brand-primary-hover)]" />
        )}
      </div>

      {/* 菜单区域 */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {menuItems.map(item => renderMenuItem(item))}
        </nav>
      </ScrollArea>

      {/* 底部折叠按钮 */}
      <div className="p-3 border-t border-[var(--color-neutral-03)] shrink-0 space-y-2">
        {!collapsed && (
          <div className="rounded-xl border border-[rgba(78,134,223,0.18)] bg-[rgba(78,134,223,0.06)] px-3 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4E86DF]">
              建议这样看
            </div>
            <div className="mt-2 text-xs leading-5 text-[var(--color-neutral-09)]">
              面向一线网格员的移动工作台入口，用于查看待办、人口、房屋和走访任务。
            </div>
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onRouteChange('mobile')}
          className="w-full justify-center bg-[var(--color-neutral-02)] text-[var(--color-brand-primary-hover)] border-[var(--color-brand-primary)] hover:bg-[var(--color-neutral-03)]"
        >
          <Smartphone className={cn("shrink-0", collapsed ? "w-5 h-5" : "w-4 h-4")} />
          {!collapsed && <span className="ml-2 text-xs">体验移动端工作台</span>}
        </Button>

      </div>
    </aside>
  );
}
