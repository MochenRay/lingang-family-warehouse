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

function getKnowledgeIcon(type: string) {
  switch (type) {
    case 'document':
      return <FileText className="w-5 h-5 text-[#4E86DF]" />;
    case 'image':
      return <ImageIcon className="w-5 h-5 text-[#8B3BCC]" />;
    case 'meeting':
      return <Mic className="w-5 h-5 text-[#D6730D]" />;
    case 'article':
      return <Newspaper className="w-5 h-5 text-[#19B172]" />;
    default:
      return <Database className="w-5 h-5 text-[var(--color-neutral-08)]" />;
  }
}

function getSearchResultIcon(kind: SearchResultItem['kind']) {
  switch (kind) {
    case 'person':
      return <User className="w-4 h-4 text-[#2761CB]" />;
    case 'house':
      return <Home className="w-4 h-4 text-[#4E86DF]" />;
    case 'notice':
      return <Bell className="w-4 h-4 text-[#D6730D]" />;
    case 'knowledge':
      return <Database className="w-4 h-4 text-[#19B172]" />;
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
    <div className="h-[calc(100vh-100px)] flex flex-col gap-6">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-neutral-11)]">知识沉淀</h1>
          <p className="text-sm text-[var(--color-neutral-08)] mt-1">
            资料沉淀、知识检索与真实对象回跳入口
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-2 h-8 border-[var(--color-neutral-03)] text-[var(--color-neutral-09)] rounded-sm"
          disabled
        >
          <Plus className="w-4 h-4" />
          上传资料（Phase 4）
        </Button>
      </div>

      <div className="flex flex-col h-full gap-4 flex-1 overflow-hidden">
        <div className="flex items-center gap-3 bg-[var(--color-neutral-02)] p-4 rounded-md border border-[var(--color-neutral-03)] shadow-sm">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[var(--color-neutral-08)]" />
            <Input
              placeholder="搜索资料、通知、人员或房屋..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-9 bg-[var(--color-neutral-01)] border-[var(--color-neutral-03)] text-[var(--color-neutral-10)] placeholder:text-[var(--color-neutral-08)]"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {typeCounts.map((option) => {
              const active = selectedType === option.id;
              return (
                <Badge
                  key={option.id}
                  variant="secondary"
                  className={`cursor-pointer border-0 font-normal transition-colors ${
                    active
                      ? 'bg-[rgba(78,134,223,0.18)] text-[#2761CB]'
                      : 'bg-[var(--color-neutral-03)] hover:bg-[rgba(78,134,223,0.15)] hover:text-[#4E86DF] text-[var(--color-neutral-10)]'
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
          <Card className="border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] shadow-sm">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-[var(--color-neutral-11)]">全局检索结果</div>
                  <div className="text-xs text-[var(--color-neutral-08)]">
                    从人口、房屋、公告和知识条目中统一检索，点击后回到真实页面
                  </div>
                </div>
                {searching ? <Loader2 className="w-4 h-4 animate-spin text-[var(--color-neutral-08)]" /> : null}
              </div>

              {globalResults.length > 0 ? (
                <div className="grid gap-3">
                  {globalResults.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-4 rounded-md border border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] p-4"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getSearchResultIcon(item.kind)}
                          <h3 className="font-medium text-[var(--color-neutral-11)] truncate">{item.title}</h3>
                          <Badge variant="outline" className="text-[10px] border-[var(--color-neutral-03)] text-[var(--color-neutral-08)]">
                            {getSearchResultBadge(item.kind)}
                          </Badge>
                        </div>
                        <p className="text-xs text-[var(--color-neutral-08)]">{item.subtitle}</p>
                        <p className="text-sm text-[var(--color-neutral-10)] mt-2">{item.summary}</p>
                        {item.tags.length > 0 ? (
                          <div className="flex gap-1 flex-wrap mt-2">
                            {item.tags.slice(0, 3).map((tag) => (
                              <span
                                key={`${item.id}-${tag}`}
                                className="bg-[var(--color-neutral-03)] px-1.5 py-0.5 rounded text-[10px] text-[var(--color-neutral-10)]"
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
                        className="shrink-0 border-[var(--color-neutral-03)] text-[#2761CB]"
                        onClick={() => void handleSearchResultClick(item)}
                      >
                        {item.routeLabel}
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] px-4 py-8 text-center text-sm text-[var(--color-neutral-08)]">
                  当前关键词没有命中任何对象或知识条目。
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        <ScrollArea className="flex-1 bg-[var(--color-neutral-02)] rounded-md border border-[var(--color-neutral-03)] shadow-sm">
          <div className="p-4 grid gap-3">
            {loading ? (
              <div className="py-20 flex items-center justify-center text-[var(--color-neutral-08)]">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                正在加载知识资料...
              </div>
            ) : entries.length > 0 ? (
              entries.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 rounded-md border border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] hover:bg-[rgba(78,134,223,0.05)] hover:border-[rgba(78,134,223,0.3)] transition-all group"
                >
                  <div className="p-2 bg-[var(--color-neutral-03)] rounded-md shrink-0">
                    {getKnowledgeIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-[var(--color-neutral-11)] truncate" title={item.title}>
                        {item.title}
                      </h4>
                      <Badge variant="outline" className="text-xs h-5 border-[var(--color-neutral-03)] text-[var(--color-neutral-08)]">
                        {item.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-[var(--color-neutral-09)] line-clamp-2">{item.summary}</p>
                    <div className="flex items-center gap-4 text-xs text-[var(--color-neutral-08)] mt-2">
                      <span>{item.size ?? '-'}</span>
                      <span>上传于 {item.uploadDate}</span>
                      <span>上传人: {item.author}</span>
                      <span>{item.source ?? '内部沉淀'}</span>
                    </div>
                    <div className="flex gap-1 flex-wrap mt-2">
                      {item.tags.map((tag) => (
                        <span
                          key={`${item.id}-${tag}`}
                          className="bg-[var(--color-neutral-03)] px-1.5 py-0.5 rounded text-[10px] text-[var(--color-neutral-10)]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="预览"
                      className="hover:bg-[var(--color-neutral-03)] hover:text-[#4E86DF]"
                      onClick={() => setSelectedEntry(item)}
                    >
                      <Eye className="w-4 h-4 text-[var(--color-neutral-08)]" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="下载"
                      className="hover:bg-[var(--color-neutral-03)] hover:text-[#4E86DF]"
                    >
                      <Download className="w-4 h-4 text-[var(--color-neutral-08)]" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center text-[var(--color-neutral-08)]">
                当前筛选条件下暂无知识资料。
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <Dialog open={Boolean(selectedEntry)} onOpenChange={(open) => (!open ? setSelectedEntry(null) : undefined)}>
        <DialogContent className="max-w-3xl bg-[var(--color-neutral-01)] border-[var(--color-neutral-03)]">
          {selectedEntry ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-[var(--color-neutral-11)]">{selectedEntry.title}</DialogTitle>
                <DialogDescription className="text-[var(--color-neutral-08)]">
                  {selectedEntry.category} · {selectedEntry.author} · {selectedEntry.uploadDate}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  {selectedEntry.tags.map((tag) => (
                    <Badge key={`${selectedEntry.id}-${tag}`} variant="outline" className="border-[var(--color-neutral-03)]">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="rounded-md bg-[var(--color-neutral-02)] border border-[var(--color-neutral-03)] p-4 text-sm leading-6 text-[var(--color-neutral-10)] whitespace-pre-wrap">
                  {selectedEntry.content}
                </div>
                {selectedEntry.relatedType && selectedEntry.relatedId ? (
                  <div className="flex items-center justify-between rounded-md border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-[var(--color-neutral-11)]">关联对象</div>
                      <div className="text-xs text-[var(--color-neutral-08)]">
                        {selectedEntry.relatedType} · {selectedEntry.relatedId}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[var(--color-neutral-03)] text-[#2761CB]"
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
