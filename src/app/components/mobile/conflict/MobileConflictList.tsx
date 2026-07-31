import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  ChevronRight,
  ShieldAlert,
  Users,
  MapPin,
  Clock,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { Button } from '../../ui/button';
import { CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Tabs, TabsList, TabsTrigger } from '../../ui/tabs';
import { Input } from '../../ui/input';
import { MobileLayout } from '../MobileLayout';
import { conflictFacade } from '../../../services/mobileSandbox/conflictFacade';
import { useMobileSandbox } from '../MobileSandboxProvider';
import type { MobileNavigateOptions } from '../mobileNavigation';
import type { ConflictRecord } from '../../../types/core';

interface MobileConflictListProps {
  onRouteChange: (route: string, options?: MobileNavigateOptions) => void;
  onExitMobile?: () => void;
}

type ConflictListTab = 'all' | 'processing' | 'resolved';

type ListLoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready' };

// 列表视图状态（tab/搜索词）在页内跳转详情返回后保持；整页刷新才回到默认。
// 模块级缓存只保存视图状态，不缓存业务数据，列表内容始终来自 facade 真实读取。
let persistedListView: { tab: ConflictListTab; query: string } = { tab: 'all', query: '' };

function getStatusClassName(status: ConflictRecord['status']) {
  if (status === '已化解') {
    return 'text-[var(--color-status-success-text)] bg-[var(--color-status-success-soft)]';
  }
  if (status === '调解中') {
    return 'text-[var(--color-status-warning-text)] bg-[var(--color-status-warning-soft)]';
  }
  return 'text-[var(--color-brand-text)] bg-[var(--color-brand-primary)]/10';
}

function getTypeClassName(type: ConflictRecord['type']) {
  switch (type) {
    case '邻里纠纷':
      return 'bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-text)]';
    case '家庭纠纷':
      return 'bg-[var(--color-status-error-soft)] text-[var(--color-status-error-text)]';
    case '物业纠纷':
      return 'bg-[var(--color-accent-purple-soft)] text-[var(--color-accent-purple-text)]';
    default:
      return 'bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)]';
  }
}

// 与 facade matchesConflictQuery 相同的关键词语义：标题/描述/地点/当事人姓名
function matchesQuery(conflict: ConflictRecord, keyword: string) {
  const text = keyword.trim();
  if (!text) {
    return true;
  }

  return [
    conflict.title,
    conflict.description,
    conflict.location,
    ...conflict.involvedParties.map((party) => party.name),
  ].some((value) => value.includes(text));
}

export function MobileConflictList({ onRouteChange, onExitMobile }: MobileConflictListProps) {
  const { mode } = useMobileSandbox();
  const [activeTab, setActiveTab] = useState<ConflictListTab>(persistedListView.tab);
  const [searchQuery, setSearchQuery] = useState(persistedListView.query);
  const [conflicts, setConflicts] = useState<ConflictRecord[]>([]);
  const [loadState, setLoadState] = useState<ListLoadState>({ status: 'loading' });
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    persistedListView = { tab: activeTab, query: searchQuery };
  }, [activeTab, searchQuery]);

  useEffect(() => {
    // sandbox mode 未就绪时保持 loading，不得提前打 facade（fail closed）；
    // mode resolve 后 effect 重跑，再真实加载。
    if (mode === 'checking') {
      setLoadState({ status: 'loading' });
      return;
    }
    let active = true;

    const loadConflicts = async () => {
      if (active) {
        setLoadState({ status: 'loading' });
      }
      try {
        // facade 返回 API seed + session overlay 的完整集合，顺序为 updatedAt 降序、id 破同值；
        // 本组件不再另行排序，保持 facade 的确定性顺序。
        const result = await conflictFacade.listConflicts();
        if (active) {
          setConflicts(result.items);
          setLoadState({ status: 'ready' });
        }
      } catch (error) {
        console.error('Failed to load conflicts', error);
        if (active) {
          setLoadState({
            status: 'error',
            message: error instanceof Error ? error.message : '纠纷清单加载失败',
          });
        }
      }
    };

    void loadConflicts();

    // session mutation（本页或其他页）后真实刷新
    const unsubscribe = conflictFacade.subscribe(() => {
      void loadConflicts();
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [reloadToken, mode]);

  const displayConflicts = useMemo(() => {
    let filtered = conflicts;

    if (activeTab === 'processing') {
      filtered = filtered.filter((conflict) => conflict.status === '调解中');
    } else if (activeTab === 'resolved') {
      filtered = filtered.filter((conflict) => conflict.status === '已化解');
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter((conflict) => matchesQuery(conflict, searchQuery));
    }

    return filtered;
  }, [activeTab, conflicts, searchQuery]);

  // 计数基于完整真实集合，不使用分页片段
  const tabCounts = useMemo(() => ({
    all: conflicts.length,
    processing: conflicts.filter((conflict) => conflict.status === '调解中').length,
    resolved: conflicts.filter((conflict) => conflict.status === '已化解').length,
  }), [conflicts]);

  return (
    <MobileLayout currentRoute="conflict" onRouteChange={onRouteChange} onExitMobile={onExitMobile} title="矛盾调解">
      <div className="bg-[var(--color-neutral-01)] h-full flex flex-col" data-testid="conflict-list">
        <div className="bg-[var(--color-neutral-01)] px-4 py-3 border-b border-[var(--color-neutral-03)] sticky top-0 z-10 shadow-sm space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-neutral-08)]" />
            <Input
              type="text"
              data-testid="conflict-search-input"
              aria-label="搜索纠纷记录"
              placeholder="搜索纠纷记录..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 min-h-[44px] text-sm bg-[var(--color-neutral-02)] border-transparent focus-visible:bg-[var(--color-neutral-01)] focus-visible:border-[var(--color-brand-primary)] transition-all rounded-xl w-full"
            />
          </div>

          <Button
            data-testid="conflict-create-button"
            onClick={() => onRouteChange('conflict-form')}
            className="w-full min-h-[44px] bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-hover)] text-white shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            上报纠纷
          </Button>
        </div>

        <div className="bg-[var(--color-neutral-01)] border-b border-[var(--color-neutral-03)]">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ConflictListTab)} className="w-full">
            <TabsList className="w-full flex h-auto bg-transparent p-0">
              {([
                ['all', '全部', tabCounts.all, 'conflict-tab-all'],
                ['processing', '调解中', tabCounts.processing, 'conflict-tab-processing'],
                ['resolved', '已化解', tabCounts.resolved, 'conflict-tab-resolved'],
              ] as const).map(([tab, label, count, testId]) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  data-testid={testId}
                  className="flex-1 min-h-[44px] rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--color-brand-primary)] data-[state=active]:text-[var(--color-brand-text)] text-[var(--color-neutral-08)] font-medium text-sm transition-colors"
                >
                  <span>{label}</span>
                  <span className="ml-1 text-[10px] text-[var(--color-neutral-08)]">{count}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loadState.status === 'loading' ? (
            <div
              data-testid="conflict-list-loading"
              role="status"
              className="flex flex-col items-center justify-center py-16 text-[var(--color-neutral-08)]"
            >
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <p className="text-sm">正在加载纠纷清单...</p>
            </div>
          ) : loadState.status === 'error' ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3" data-testid="conflict-list-error">
              <div role="alert" className="text-sm text-[var(--color-status-error-text)] text-center px-6">
                纠纷清单加载失败：{loadState.message}
              </div>
              <button
                type="button"
                data-testid="conflict-list-retry"
                onClick={() => setReloadToken((token) => token + 1)}
                className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-[var(--color-neutral-03)] px-4 text-sm text-[var(--color-neutral-10)] active:bg-[var(--color-neutral-02)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
              >
                <RotateCcw className="w-4 h-4" />
                重新加载
              </button>
            </div>
          ) : displayConflicts.length === 0 ? (
            <div
              data-testid="conflict-list-empty"
              className="flex flex-col items-center justify-center py-12 text-[var(--color-neutral-08)]"
            >
              <div className="w-16 h-16 bg-[var(--color-neutral-02)] rounded-full flex items-center justify-center mb-3">
                <ShieldAlert className="w-8 h-8 text-[var(--color-neutral-08)]" />
              </div>
              <p className="text-sm">{conflicts.length === 0 ? '暂无相关记录' : '没有符合条件的记录'}</p>
            </div>
          ) : (
            displayConflicts.map((conflict) => (
              <button
                key={conflict.id}
                type="button"
                data-testid={`conflict-card-${conflict.id}`}
                aria-label={`查看纠纷详情：${conflict.title}`}
                className="block w-full rounded-xl border-none bg-[var(--color-neutral-01)] text-left shadow-sm transition-transform active:scale-[0.99] overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
                onClick={() => onRouteChange(`conflict-detail/${conflict.id}`)}
              >
                <CardContent className="p-4 relative">
                  <div
                    className={`absolute top-0 left-0 px-2 py-0.5 text-[10px] font-medium rounded-br-lg ${
                      conflict.source === '上级下派' ? 'bg-[var(--color-status-error-soft)] text-[var(--color-status-error-text)]' : 'bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-text)]'
                    }`}
                  >
                    {conflict.source}
                  </div>

                  <div className="flex justify-between items-start mt-3 mb-2">
                    <h3 className="text-[15px] font-bold text-[var(--color-neutral-11)] line-clamp-1 flex-1 pr-2">
                      {conflict.title}
                    </h3>
                    <Badge className={`shrink-0 text-[10px] border-0 px-1.5 py-0.5 rounded ${getStatusClassName(conflict.status)}`}>
                      {conflict.status}
                    </Badge>
                  </div>

                  <p className="text-xs text-[var(--color-neutral-08)] line-clamp-2 mb-3 leading-relaxed">
                    {conflict.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="outline" className={`text-[10px] border-0 px-2 py-0.5 ${getTypeClassName(conflict.type)}`}>
                      {conflict.type}
                    </Badge>
                    <div className="flex items-center gap-1 text-[10px] text-[var(--color-neutral-08)] bg-[var(--color-neutral-01)] px-2 py-0.5 rounded-full">
                      <Users className="w-3 h-3" />
                      <span>{conflict.involvedParties.length}人涉事</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[var(--color-neutral-03)] text-[10px] text-[var(--color-neutral-08)]">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate max-w-[120px]">{conflict.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{conflict.updatedAt.split(' ')[0]}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-end text-[11px] text-[var(--color-brand-text)] font-medium">
                    查看详情
                    <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                  </div>
                </CardContent>
              </button>
            ))
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
