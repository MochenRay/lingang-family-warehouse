import { useEffect, useState } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Mic,
  Newspaper,
  Plus,
  Download,
  Eye,
  ArrowRight,
  Database,
  Home,
  User,
  Bell,
  Loader2,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent } from '../ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import type { KnowledgeEntry } from '../../types/core';
import { knowledgeRepository } from '../../services/repositories/knowledgeRepository';
import { searchRepository, type SearchResultItem } from '../../services/repositories/searchRepository';
import { SearchInput } from '../patterns/FilterBar';
import { EmptyState, LoadingState } from '../patterns/states';
import { DIALOG_CLASS, PANEL_CLASS } from '../patterns/surfaces';
import { PageHeader } from './PageHeader';

interface KnowledgeAccumulationProps {
  onRouteChange?: (route: string) => void;
}

const TYPE_OPTIONS = [
  { id: 'all', label: '全部' },
  { id: 'document', label: '文档' },
  { id: 'meeting', label: '会议纪要' },
  { id: 'image', label: '图片' },
  { id: 'article', label: '公众号文章' },
];

const INNER_PANEL_CLASS = 'rounded-md border border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)]';
const MUTED_TEXT_CLASS = 'text-[var(--color-neutral-08)]';
const TINY_TAG_CLASS =
  'rounded border border-[var(--color-neutral-03)] bg-[var(--color-neutral-03)] px-1.5 py-0.5 text-[10px] text-[var(--color-neutral-10)]';

function getKnowledgeIcon(type: string) {
  switch (type) {
    case 'document':
      return <FileText className="h-5 w-5 text-[var(--color-brand-text)]" />;
    case 'image':
      return <ImageIcon className="h-5 w-5 text-[var(--color-accent-purple)]" />;
    case 'meeting':
      return <Mic className="h-5 w-5 text-[var(--color-status-warning-text)]" />;
    case 'article':
      return <Newspaper className="h-5 w-5 text-[var(--color-status-success-text)]" />;
    default:
      return <Database className="h-5 w-5 text-[var(--color-neutral-10)]" />;
  }
}

function getSearchResultIcon(kind: SearchResultItem['kind']) {
  switch (kind) {
    case 'person':
      return <User className="h-4 w-4 text-[var(--color-brand-text)]" />;
    case 'house':
      return <Home className="h-4 w-4 text-[var(--color-status-info-text)]" />;
    case 'notice':
      return <Bell className="h-4 w-4 text-[var(--color-status-warning-text)]" />;
    case 'knowledge':
      return <Database className="h-4 w-4 text-[var(--color-status-success-text)]" />;
  }
}

function getSearchResultBadge(kind: SearchResultItem['kind']): string {
  switch (kind) {
    case 'person':
      return '人口台账';
    case 'house':
      return '房屋台账';
    case 'notice':
      return '公告通知';
    case 'knowledge':
      return '知识条目';
  }
}

export function KnowledgeAccumulation({ onRouteChange }: KnowledgeAccumulationProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [globalResults, setGlobalResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(null);

  useEffect(() => {
    let active = true;

    const loadEntries = async () => {
      setLoading(true);
      try {
        const items = await knowledgeRepository.getEntries({
          q: searchQuery.trim() || undefined,
          type: selectedType !== 'all' ? selectedType : undefined,
          limit: 200,
        });
        if (!active) {
          return;
        }
        setEntries(items);
        if (selectedEntry) {
          const nextSelected = items.find((item) => item.id === selectedEntry.id);
          setSelectedEntry(nextSelected ?? null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadEntries();

    return () => {
      active = false;
    };
  }, [searchQuery, selectedType, selectedEntry?.id]);

  useEffect(() => {
    let active = true;

    if (!searchQuery.trim()) {
      setGlobalResults([]);
      return () => {
        active = false;
      };
    }

    const loadSearchResults = async () => {
      setSearching(true);
      try {
        const bundle = await searchRepository.search({
          q: searchQuery,
          endpoint: 'web',
          limitPerKind: 4,
        });
        if (!active) {
          return;
        }
        setGlobalResults(bundle.results);
      } finally {
        if (active) {
          setSearching(false);
        }
      }
    };

    void loadSearchResults();

    return () => {
      active = false;
    };
  }, [searchQuery]);

  const handleSearchResultClick = async (item: SearchResultItem) => {
    if (item.kind === 'knowledge') {
      const detail = await knowledgeRepository.getEntry(item.entityId);
      setSelectedEntry(detail ?? null);
      return;
    }
    onRouteChange?.(item.route);
  };

  const typeCounts = TYPE_OPTIONS.map((option) => ({
    ...option,
    count:
      option.id === 'all'
        ? entries.length
        : entries.filter((entry) => entry.type === option.id).length,
  }));

  return (
    <div className="flex h-[calc(100vh-100px)] min-w-0 flex-col gap-5 text-[var(--color-neutral-10)] page-enter">
      <div className="shrink-0">
        <PageHeader
          eyebrow="KNOWLEDGE LEDGER"
          title="知识沉淀"
          description="集中沉淀政策文件、公告材料和治理经验，方便网格员随查随用。"
          actions={
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-2 rounded-sm border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-08)] hover:bg-[var(--color-neutral-03)] hover:text-[var(--color-neutral-11)] disabled:bg-[var(--color-neutral-02)] disabled:text-[var(--color-neutral-08)]"
              disabled
            >
              <Plus className="h-4 w-4" />
              上传资料
            </Button>
          }
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
        <div className={`${PANEL_CLASS} flex flex-col gap-3 p-3 lg:flex-row lg:items-center`}>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="搜索资料、通知、人员或房屋..."
            className="w-full lg:w-[340px]"
          />
          <div className="flex min-w-0 flex-1 flex-wrap gap-2">
            {typeCounts.map((option) => {
              const active = selectedType === option.id;
              return (
                <Badge
                  key={option.id}
                  variant="secondary"
                  className={`cursor-pointer rounded border px-2 py-1 text-[11px] font-normal transition-colors ${
                    active
                      ? 'border-[var(--color-brand-primary-hover)]/45 bg-[var(--color-brand-primary)]/18 text-[var(--color-status-info-text)]'
                      : 'border-[var(--color-neutral-03)] bg-[var(--color-neutral-03)] text-[var(--color-neutral-10)] hover:border-[var(--color-brand-primary-hover)]/40 hover:bg-[var(--color-brand-primary)]/14 hover:text-[var(--color-status-info-text)]'
                  }`}
                  onClick={() => setSelectedType(option.id)}
                >
                  {option.label} {option.count > 0 ? `(${option.count})` : ''}
                </Badge>
              );
            })}
          </div>
        </div>

        {searchQuery.trim() ? (
          <Card className={PANEL_CLASS}>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[var(--color-neutral-11)]">全局检索结果</div>
                  <div className={`text-xs ${MUTED_TEXT_CLASS}`}>
                    从人口、房屋、公告和知识条目中统一检索，点击跳转到对应页面
                  </div>
                </div>
                {searching ? <Loader2 className="h-4 w-4 animate-spin text-[var(--color-neutral-08)]" /> : null}
              </div>

              {globalResults.length > 0 ? (
                <div className="grid gap-3">
                  {globalResults.map((item) => (
                    <div
                      key={item.id}
                      className={`${INNER_PANEL_CLASS} flex items-start justify-between gap-4 p-3 transition-colors hover:border-[var(--color-brand-primary-hover)]/35 hover:bg-[var(--color-brand-primary)]/8`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex min-w-0 items-center gap-2">
                          {getSearchResultIcon(item.kind)}
                          <h3 className="truncate font-medium text-[var(--color-neutral-11)]">{item.title}</h3>
                          <Badge variant="outline" className="border-[var(--color-neutral-03)] bg-[var(--color-neutral-03)] text-[10px] text-[var(--color-neutral-10)]">
                            {getSearchResultBadge(item.kind)}
                          </Badge>
                        </div>
                        <p className={`text-xs ${MUTED_TEXT_CLASS}`}>{item.subtitle}</p>
                        <p className="mt-2 text-sm leading-6 text-[var(--color-neutral-10)]">{item.summary}</p>
                        {item.tags.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {item.tags.slice(0, 3).map((tag) => (
                              <span
                                key={`${item.id}-${tag}`}
                                className={TINY_TAG_CLASS}
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0 border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-status-info-text)] hover:bg-[var(--color-brand-primary)]/14 hover:text-[var(--color-neutral-11)]"
                        onClick={() => void handleSearchResultClick(item)}
                      >
                        {item.routeLabel}
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`${INNER_PANEL_CLASS} border-dashed px-4 py-8 text-center text-sm ${MUTED_TEXT_CLASS}`}>
                  当前关键词没有命中任何对象或知识条目。
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        <ScrollArea className={`${PANEL_CLASS} flex-1`}>
          <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3" data-knowledge-grid>
            {loading ? (
              <div className="sm:col-span-2 xl:col-span-3">
                <LoadingState title="正在加载知识资料..." />
              </div>
            ) : entries.length > 0 ? (
              entries.map((item) => (
                <div
                  key={item.id}
                  data-knowledge-card
                  className={`${INNER_PANEL_CLASS} group flex flex-col gap-2 p-3 transition-colors hover:border-[var(--color-brand-primary-hover)]/35 hover:bg-[var(--color-brand-primary)]/8`}
                >
                  <div className="flex items-start gap-2">
                    <div className="shrink-0 rounded-md bg-[var(--color-neutral-03)] p-2 ring-1 ring-[var(--color-neutral-04)]/40">
                      {getKnowledgeIcon(item.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate font-medium text-[var(--color-neutral-11)]" title={item.title}>
                        {item.title}
                      </h4>
                      <Badge variant="outline" className="mt-1 h-5 border-[var(--color-neutral-03)] bg-[var(--color-neutral-03)] text-xs text-[var(--color-neutral-10)]">
                        {item.category}
                      </Badge>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="预览"
                        className="h-7 w-7 text-[var(--color-neutral-08)] hover:bg-[var(--color-neutral-03)] hover:text-[var(--color-status-info-text)]"
                        onClick={() => setSelectedEntry(item)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="下载"
                        className="h-7 w-7 text-[var(--color-neutral-08)] hover:bg-[var(--color-neutral-03)] hover:text-[var(--color-status-info-text)]"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="line-clamp-3 min-h-[3rem] text-sm leading-6 text-[var(--color-neutral-10)]">{item.summary}</p>
                  <div className={`mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs ${MUTED_TEXT_CLASS}`}>
                    <span>{item.size ?? '-'}</span>
                    <span>上传于 {item.uploadDate}</span>
                    <span>{item.author}</span>
                    <span>{item.source ?? '内部沉淀'}</span>
                  </div>
                  {item.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {item.tags.map((tag) => (
                        <span
                          key={`${item.id}-${tag}`}
                          className={TINY_TAG_CLASS}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="sm:col-span-2 xl:col-span-3">
                <EmptyState title="当前筛选条件下暂无知识资料。" />
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <Dialog open={Boolean(selectedEntry)} onOpenChange={(open) => (!open ? setSelectedEntry(null) : undefined)}>
        <DialogContent className={`max-w-3xl ${DIALOG_CLASS}`}>
          {selectedEntry ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-[var(--color-neutral-11)]">{selectedEntry.title}</DialogTitle>
                <DialogDescription className={MUTED_TEXT_CLASS}>
                  {selectedEntry.category} · {selectedEntry.author} · {selectedEntry.uploadDate}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  {selectedEntry.tags.map((tag) => (
                    <Badge key={`${selectedEntry.id}-${tag}`} variant="outline" className="border-[var(--color-neutral-03)] bg-[var(--color-neutral-03)] text-[var(--color-neutral-10)]">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className={`${PANEL_CLASS} whitespace-pre-wrap p-4 text-sm leading-6`}>
                  {selectedEntry.content}
                </div>
                {selectedEntry.relatedType && selectedEntry.relatedId ? (
                  <div className={`${PANEL_CLASS} flex items-center justify-between px-4 py-3`}>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[var(--color-neutral-11)]">关联对象</div>
                      <div className={`text-xs ${MUTED_TEXT_CLASS}`}>
                        {selectedEntry.relatedType} · {selectedEntry.relatedId}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-status-info-text)] hover:bg-[var(--color-brand-primary)]/14 hover:text-[var(--color-neutral-11)]"
                      onClick={() => {
                        if (selectedEntry.relatedType === 'notice') {
                          onRouteChange?.('notice-management');
                          return;
                        }
                        if (selectedEntry.relatedType === 'house') {
                          onRouteChange?.('housing');
                          return;
                        }
                        if (selectedEntry.relatedType === 'person') {
                          onRouteChange?.('population');
                          return;
                        }
                      }}
                    >
                      打开关联页面
                    </Button>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
