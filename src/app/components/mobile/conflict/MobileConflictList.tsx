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
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Tabs, TabsList, TabsTrigger } from '../../ui/tabs';
import { Input } from '../../ui/input';
import { MobileLayout } from '../MobileLayout';
import { conflictRepository } from '../../../services/repositories/conflictRepository';
import type { ConflictRecord } from '../../../types/core';

interface MobileConflictListProps {
  onRouteChange: (route: string) => void;
  onExitMobile?: () => void;
}

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

function matchesQuery(conflict: ConflictRecord, keyword: string) {
  const text = keyword.trim();
  if (!text) {
    return true;
  }

  return [
    conflict.title,
    conflict.description,
    conflict.location,
    conflict.source,
    ...conflict.involvedParties.map((party) => party.name),
  ].some((value) => value.includes(text));
}

export function MobileConflictList({ onRouteChange, onExitMobile }: MobileConflictListProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [conflicts, setConflicts] = useState<ConflictRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadConflicts = async () => {
      setLoading(true);
      try {
        const items = await conflictRepository.getConflicts({ limit: 500 });
        if (active) {
          setConflicts(items);
        }
      } catch (error) {
        console.error('Failed to load conflicts', error);
        if (active) {
          setConflicts([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadConflicts();

    const handleDbChange = () => {
      void loadConflicts();
    };

    window.addEventListener('db-change', handleDbChange);
    return () => {
      active = false;
      window.removeEventListener('db-change', handleDbChange);
    };
  }, []);

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

  const tabCounts = useMemo(() => ({
    all: conflicts.length,
    processing: conflicts.filter((conflict) => conflict.status === '调解中').length,
    resolved: conflicts.filter((conflict) => conflict.status === '已化解').length,
  }), [conflicts]);

  return (
    <MobileLayout currentRoute="conflict" onRouteChange={onRouteChange} onExitMobile={onExitMobile} title="矛盾调解">
      <div className="bg-[var(--color-neutral-01)] h-full flex flex-col">
        <div className="bg-[var(--color-neutral-01)] px-4 py-3 border-b border-[var(--color-neutral-03)] sticky top-0 z-10 shadow-sm space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-neutral-08)]" />
            <Input
              type="text"
              placeholder="搜索纠纷记录..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 h-9 text-sm bg-[var(--color-neutral-02)] border-transparent focus-visible:bg-[var(--color-neutral-01)] focus-visible:border-[var(--color-brand-primary)] transition-all rounded-xl w-full"
            />
          </div>

          <Button
            onClick={() => onRouteChange('conflict-form')}
            className="w-full h-9 bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-hover)] text-white shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            上报纠纷
          </Button>
        </div>

        <div className="bg-[var(--color-neutral-01)] border-b border-[var(--color-neutral-03)]">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full flex h-10 bg-transparent p-0">
              {[
                ['all', '全部', tabCounts.all],
                ['processing', '调解中', tabCounts.processing],
                ['resolved', '已化解', tabCounts.resolved],
              ].map(([tab, label, count]) => (
                <TabsTrigger
                  key={String(tab)}
                  value={String(tab)}
                  className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--color-brand-primary)] data-[state=active]:text-[var(--color-brand-text)] text-[var(--color-neutral-08)] font-medium text-sm transition-colors"
                >
                  <span>{label}</span>
                  <span className="ml-1 text-[10px] text-[var(--color-neutral-08)]">{count}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-[var(--color-neutral-08)]">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <p className="text-sm">正在加载纠纷清单...</p>
            </div>
          ) : displayConflicts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[var(--color-neutral-08)]">
              <div className="w-16 h-16 bg-[var(--color-neutral-02)] rounded-full flex items-center justify-center mb-3">
                <ShieldAlert className="w-8 h-8 text-[var(--color-neutral-08)]" />
              </div>
              <p className="text-sm">暂无相关记录</p>
            </div>
          ) : (
            displayConflicts.map((conflict) => (
              <Card
                key={conflict.id}
                className="border-none shadow-sm active:scale-[0.99] transition-transform cursor-pointer overflow-hidden"
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
              </Card>
            ))
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
