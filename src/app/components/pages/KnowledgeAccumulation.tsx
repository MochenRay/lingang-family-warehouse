import { useEffect, useState } from 'react';
import {
  Search,
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
import { Input } from '../ui/input';
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

const SURFACE_CLASS =
  'rounded-lg border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)] shadow-none';
const INNER_PANEL_CLASS = 'rounded-md border border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)]';
const MUTED_TEXT_CLASS = 'text-[var(--color-neutral-08)]';
const TINY_TAG_CLASS =
  'rounded border border-[var(--color-neutral-03)] bg-[var(--color-neutral-03)] px-1.5 py-0.5 text-[10px] text-[var(--color-neutral-10)]';

function getKnowledgeIcon(type: string) {
  switch (type) {
    case 'document':
      return <FileText className="h-5 w-5 text-[#4E86DF]" />;
    case 'image':
      return <ImageIcon className="h-5 w-5 text-[#8B3BCC]" />;
    case 'meeting':
      return <Mic className="h-5 w-5 text-[#D6730D]" />;
    case 'article':
      return <Newspaper className="h-5 w-5 text-[#19B172]" />;
    default:
      return <Database className="h-5 w-5 text-[var(--color-neutral-08)]" />;
  }
}

function getSearchResultIcon(kind: SearchResultItem['kind']) {
  switch (kind) {
    case 'person':
      return <User className="h-4 w-4 text-[#4E86DF]" />;
    case 'house':
      return <Home className="h-4 w-4 text-[#2AA3CF]" />;
    case 'notice':
      return <Bell className="h-4 w-4 text-[#D6730D]" />;
    case 'knowledge':
      return <Database className="h-4 w-4 text-[#19B172]" />;
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
    <div className="flex h-[calc(100vh-100px)] min-w-0 flex-col gap-5 text-[var(--color-neutral-10)] animate-in fade-in duration-500">
      <div className="shrink-0">
        <PageHeader
          eyebrow="KNOWLEDGE LEDGER"
          title="知识沉淀"
          description="沉淀政策、公告和治理经验，给智能体问答与报表生成提供可信材料。"
          actions={
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-2 rounded-sm border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-08)] hover:bg-[var(--color-neutral-03)] hover:text-white disabled:bg-[var(--color-neutral-02)] disabled:text-[var(--color-neutral-08)]"
              disabled
            >
              <Plus className="h-4 w-4" />
              上传资料（Phase 4）
            </Button>
          }
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
        <div className={`${SURFACE_CLASS} flex flex-col gap-3 p-3 lg:flex-row lg:items-center`}>
          <div className="relative w-full lg:w-[340px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[var(--color-neutral-08)]" />
            <Input
              placeholder="搜索资料、通知、人员或房屋..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] pl-9 text-[var(--color-neutral-10)] placeholder:text-[var(--color-neutral-08)]"
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-wrap gap-2">
            {typeCounts.map((option) => {
              const active = selectedType === option.id;
              return (
                <Badge
                  key={option.id}
                  variant="secondary"
                  className={`cursor-pointer rounded border px-2 py-1 text-[11px] font-normal transition-colors ${
                    active
                      ? 'border-[#4E86DF]/45 bg-[#2761CB]/18 text-[#9FC4FF]'
                      : 'border-[var(--color-neutral-03)] bg-[var(--color-neutral-03)] text-[var(--color-neutral-10)] hover:border-[#4E86DF]/40 hover:bg-[#2761CB]/14 hover:text-[#9FC4FF]'
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
          <Card className={SURFACE_CLASS}>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white">全局检索结果</div>
                  <div className={`text-xs ${MUTED_TEXT_CLASS}`}>
                    从人口、房屋、公告和知识条目中统一检索，点击后回到真实页面
                  </div>
                </div>
                {searching ? <Loader2 className="h-4 w-4 animate-spin text-[var(--color-neutral-08)]" /> : null}
              </div>

              {globalResults.length > 0 ? (
                <div className="grid gap-3">
                  {globalResults.map((item) => (
                    <div
                      key={item.id}
                      className={`${INNER_PANEL_CLASS} flex items-start justify-between gap-4 p-3 transition-colors hover:border-[#4E86DF]/35 hover:bg-[#2761CB]/8`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex min-w-0 items-center gap-2">
                          {getSearchResultIcon(item.kind)}
                          <h3 className="truncate font-medium text-white">{item.title}</h3>
                          <Badge variant="outline" className="border-[var(--color-neutral-03)] bg-[var(--color-neutral-03)] text-[10px] text-[var(--color-neutral-08)]">
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
                        className="shrink-0 border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[#9FC4FF] hover:bg-[#2761CB]/14 hover:text-white"
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

        <ScrollArea className={`${SURFACE_CLASS} flex-1`}>
          <div className="grid gap-3 p-4">
            {loading ? (
              <div className={`flex items-center justify-center py-20 ${MUTED_TEXT_CLASS}`}>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                正在加载知识资料...
              </div>
            ) : entries.length > 0 ? (
              entries.map((item) => (
                <div
                  key={item.id}
                  className={`${INNER_PANEL_CLASS} group flex items-center gap-4 p-3 transition-colors hover:border-[#4E86DF]/35 hover:bg-[#2761CB]/8`}
                >
                  <div className="shrink-0 rounded-md bg-[var(--color-neutral-03)] p-2 ring-1 ring-[var(--color-neutral-04)]/40">
                    {getKnowledgeIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="mb-1 flex min-w-0 items-center gap-2">
                      <h4 className="truncate font-medium text-white" title={item.title}>
                        {item.title}
                      </h4>
                      <Badge variant="outline" className="h-5 border-[var(--color-neutral-03)] bg-[var(--color-neutral-03)] text-xs text-[var(--color-neutral-08)]">
                        {item.category}
                      </Badge>
                    </div>
                    <p className="line-clamp-2 text-sm leading-6 text-[var(--color-neutral-10)]">{item.summary}</p>
                    <div className={`mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs ${MUTED_TEXT_CLASS}`}>
                      <span>{item.size ?? '-'}</span>
                      <span>上传于 {item.uploadDate}</span>
                      <span>上传人: {item.author}</span>
                      <span>{item.source ?? '内部沉淀'}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {item.tags.map((tag) => (
                        <span
                          key={`${item.id}-${tag}`}
                          className={TINY_TAG_CLASS}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="预览"
                      className="text-[var(--color-neutral-08)] hover:bg-[var(--color-neutral-03)] hover:text-[#9FC4FF]"
                      onClick={() => setSelectedEntry(item)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="下载"
                      className="text-[var(--color-neutral-08)] hover:bg-[var(--color-neutral-03)] hover:text-[#9FC4FF]"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className={`py-20 text-center ${MUTED_TEXT_CLASS}`}>
                当前筛选条件下暂无知识资料。
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <Dialog open={Boolean(selectedEntry)} onOpenChange={(open) => (!open ? setSelectedEntry(null) : undefined)}>
        <DialogContent className="max-w-3xl border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)]">
          {selectedEntry ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-white">{selectedEntry.title}</DialogTitle>
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
                <div className={`${SURFACE_CLASS} whitespace-pre-wrap p-4 text-sm leading-6`}>
                  {selectedEntry.content}
                </div>
                {selectedEntry.relatedType && selectedEntry.relatedId ? (
                  <div className={`${SURFACE_CLASS} flex items-center justify-between px-4 py-3`}>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white">关联对象</div>
                      <div className={`text-xs ${MUTED_TEXT_CLASS}`}>
                        {selectedEntry.relatedType} · {selectedEntry.relatedId}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[#9FC4FF] hover:bg-[#2761CB]/14 hover:text-white"
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
                      回到真实页面
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
