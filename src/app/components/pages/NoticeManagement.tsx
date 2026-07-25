import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Plus,
  Calendar,
  Users,
  Eye,
  Trash2,
  Clock,
  CheckCircle2,
  Bell,
  AlertCircle,
  FileText,
  ClipboardList,
  MapPin,
  ListChecks,
  MessageSquareReply,
  ShieldCheck,
  Paperclip,
  type LucideIcon,
} from 'lucide-react';
import { PublishNoticeDialog } from '../notices/PublishNoticeDialog';
import { formatNoticeTime, noticeRepository, type NoticeRecord } from '../../services/repositories/noticeRepository';
import { DetailDialogShell, DetailField, DetailFieldGrid, DetailSection } from '../patterns/DetailDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { PageHeader } from './PageHeader';
import { StatCard } from '../patterns/StatCard';
import { StatusBadge, type StatusTone } from '../patterns/StatusBadge';
import { TablePagination } from '../patterns/DataTableShell';
import { SearchInput } from '../patterns/FilterBar';
import { EmptyState } from '../patterns/states';
import { ConfirmDialog } from '../patterns/ConfirmDialog';
import { PANEL_CLASS } from '../patterns/surfaces';

const PAGE_SIZE = 20;

// 公告类型配置：label + StatusBadge tone（替代原散落 pastel 色值）
const noticeTypes: Array<{ value: string; label: string; tone: StatusTone }> = [
  { value: 'urgent', label: '紧急通知', tone: 'error' },
  { value: 'system', label: '系统消息', tone: 'info' },
  { value: 'guide', label: '操作指南', tone: 'success' },
  { value: 'task', label: '工作任务', tone: 'warning' },
  { value: 'info', label: '普通通知', tone: 'neutral' },
];

/** 通知正文中一个结构化模块（【模块名】内容） */
interface NoticeContentSection {
  title: string;
  body: string;
}

/**
 * 解析按基层通知结构撰写的正文：引言段 + 若干「【模块名】内容」分区。
 * 手工发布的公告没有结构标记时，sections 为空，调用方回退为整段展示。
 */
function parseNoticeContent(content: string): { intro: string; sections: NoticeContentSection[] } {
  const introLines: string[] = [];
  const sections: NoticeContentSection[] = [];
  let current: NoticeContentSection | null = null;

  for (const line of content.split('\n')) {
    const match = line.match(/^【([^】]+)】\s*(.*)$/);
    if (match) {
      current = { title: match[1], body: match[2] };
      sections.push(current);
    } else if (current) {
      current.body = current.body ? `${current.body}\n${line}` : line;
    } else {
      introLines.push(line);
    }
  }

  return {
    intro: introLines.join('\n').trim(),
    sections: sections.map((section) => ({ ...section, body: section.body.trim() })),
  };
}

/** 常见通知模块的展示图标（未知名称回退为正文图标） */
const SECTION_ICON_MAP: Record<string, LucideIcon> = {
  通知对象: Users,
  工作任务: ClipboardList,
  时间安排: Clock,
  覆盖范围: MapPin,
  执行要求: ListChecks,
  反馈方式: MessageSquareReply,
  责任分工: ShieldCheck,
};

/** 内容较长的模块独占一行，短模块并入字段网格 */
const WIDE_SECTION_TITLES = new Set(['工作任务', '执行要求']);

export function NoticeManagement() {
  const [notices, setNotices] = useState<NoticeRecord[]>([]);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [previewNotice, setPreviewNotice] = useState<NoticeRecord | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // 加载公告列表
  useEffect(() => {
    void loadNotices();

    // 监听新公告发布事件
    const handleNoticePublished = () => {
      void loadNotices();
    };
    window.addEventListener('notice-published', handleNoticePublished);

    return () => {
      window.removeEventListener('notice-published', handleNoticePublished);
    };
  }, []);

  const loadNotices = async () => {
    const items = await noticeRepository.getNotices();
    setNotices(items);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) {
      return;
    }
    await noticeRepository.deleteNotice(deleteTargetId);
    await loadNotices();
    window.dispatchEvent(new CustomEvent('notice-published'));
  };

  const getTypeConfig = (type: string) => {
    return noticeTypes.find(t => t.value === type) || noticeTypes[4];
  };

  const getScopeText = (scope: string[]) => {
    if (scope.includes('all')) return '全体网格员';
    const parts = [];
    if (scope.includes('grid')) parts.push('指定网格');
    if (scope.includes('community')) parts.push('指定社区');
    if (scope.includes('street')) parts.push('指定街道');
    return parts.join(', ') || '未指定';
  };

  // 筛选公告
  const filteredNotices = notices.filter(notice => {
    const matchesSearch = notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notice.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || notice.type === filterType;
    return matchesSearch && matchesType;
  });

  // 筛选/搜索变化时回到第 1 页
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  const totalPages = Math.max(1, Math.ceil(filteredNotices.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * PAGE_SIZE;
  const paginatedNotices = filteredNotices.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <div className="space-y-5 text-[var(--color-neutral-10)] page-enter">
      <PageHeader
        eyebrow="NOTICE MANAGEMENT"
        title="公告管理"
        description="维护公告发布、状态和触达记录，确保居民通知可追踪。"
        actions={
          <Button onClick={() => setShowPublishDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            发布公告
          </Button>
        }
      />

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <StatCard
          label="总公告数"
          value={notices.filter(n => n.status === 'published').length}
          icon={Bell}
          tone="brand"
        />
        <StatCard
          label="紧急通知"
          value={notices.filter(n => n.type === 'urgent').length}
          icon={AlertCircle}
          tone="error"
        />
        <StatCard
          label="工作任务"
          value={notices.filter(n => n.type === 'task').length}
          icon={CheckCircle2}
          tone="warning"
        />
        <StatCard
          label="今日发布"
          value={notices.filter(n => formatNoticeTime(n.publishedAt).includes('小时前') || formatNoticeTime(n.publishedAt) === '刚刚').length}
          icon={Clock}
          tone="success"
        />
      </div>

      {/* 搜索和筛选 */}
      <Card className={PANEL_CLASS}>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <SearchInput
              placeholder="搜索公告标题或内容..."
              value={searchTerm}
              onChange={setSearchTerm}
              className="flex-1"
            />
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: '全部' },
                { value: 'urgent', label: '紧急' },
                { value: 'system', label: '系统' },
                { value: 'task', label: '任务' },
              ].map(option => (
                <Button
                  key={option.value}
                  variant={filterType === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 公告列表 */}
      <Card className={`${PANEL_CLASS} overflow-hidden`}>
        <CardHeader className="border-b border-[var(--color-neutral-03)] px-5 py-4">
          <CardTitle className="text-base text-[var(--color-neutral-11)]">公告列表</CardTitle>
          <CardDescription className="text-[var(--color-neutral-08)]">共 {filteredNotices.length} 条公告</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredNotices.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow className="border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] hover:bg-[var(--color-neutral-02)]">
                  <TableHead className="w-[38%] min-w-[260px]">标题</TableHead>
                  <TableHead className="whitespace-nowrap">类型</TableHead>
                  <TableHead className="whitespace-nowrap">通知范围</TableHead>
                  <TableHead className="whitespace-nowrap">发布时间</TableHead>
                  <TableHead className="whitespace-nowrap">发布人</TableHead>
                  <TableHead className="w-24 text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedNotices.map((notice) => {
                  const typeConfig = getTypeConfig(notice.type);
                  return (
                    <TableRow key={notice.id}>
                      <TableCell className="w-[38%] min-w-[260px] max-w-[360px] font-medium">
                        <div className="truncate text-[var(--color-neutral-11)]">{notice.title}</div>
                        <div className="text-xs text-[var(--color-neutral-08)] truncate mt-1">
                          {notice.content}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <StatusBadge tone={typeConfig.tone}>{typeConfig.label}</StatusBadge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-[var(--color-neutral-08)]">
                          <Users className="w-3 h-3" />
                          {getScopeText(notice.scope)}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-[var(--color-neutral-08)]">
                          <Calendar className="w-3 h-3" />
                          {formatNoticeTime(notice.publishedAt)}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-[var(--color-neutral-08)]">
                        {notice.publisher}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label="预览公告"
                            onClick={() => setPreviewNotice(notice)}
                            className="text-[var(--color-neutral-08)] hover:bg-[var(--color-neutral-03)] hover:text-[var(--color-brand-primary-hover)]"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label="删除公告"
                            onClick={() => setDeleteTargetId(notice.id)}
                            className="text-[var(--color-status-error-text)] hover:bg-[var(--color-status-error)]/15 hover:text-[var(--color-status-error)]"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState
              icon={Bell}
              title="暂无公告"
              description="还没有符合当前筛选条件的公告。"
              action={
                <Button variant="outline" onClick={() => setShowPublishDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  发布第一条公告
                </Button>
              }
            />
          )}
          <TablePagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            totalItems={filteredNotices.length}
            pageStart={pageStart}
            pageEnd={Math.min(pageStart + PAGE_SIZE, filteredNotices.length)}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      {/* 发布公告对话框 */}
      <PublishNoticeDialog 
        open={showPublishDialog}
        onOpenChange={setShowPublishDialog}
      />

      {/* 删除确认对话框（替代原生 confirm） */}
      <ConfirmDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
        title="删除公告"
        description="确定要删除这条公告吗？删除后不可恢复。"
        confirmText="删除"
        destructive
        onConfirm={() => void handleDeleteConfirm()}
      />

      {previewNotice ? (
        <DetailDialogShell
          open={Boolean(previewNotice)}
          onOpenChange={(open) => !open && setPreviewNotice(null)}
          contentLabel="公告详情"
          maxWidth="4xl"
          badges={
            <>
              <StatusBadge tone={getTypeConfig(previewNotice.type).tone}>
                {getTypeConfig(previewNotice.type).label}
              </StatusBadge>
              <Badge variant="outline" className="border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-08)]">
                {previewNotice.status === 'published' ? '已发布' : '草稿'}
              </Badge>
            </>
          }
          title={previewNotice.title}
          description={`${previewNotice.department} · ${previewNotice.publisher} · ${formatNoticeTime(previewNotice.publishedAt)}发布`}
        >
          {(() => {
            const { intro, sections } = parseNoticeContent(previewNotice.content);
            return (
              <div className="space-y-4">
                <DetailSection
                  icon={FileText}
                  title="通知正文"
                  description={`${getScopeText(previewNotice.scope)} · 已读 ${previewNotice.readCount} 次`}
                >
                  {sections.length > 0 ? (
                    <div className="space-y-4">
                      {intro ? (
                        <p className="text-sm leading-6 text-[var(--color-neutral-10)]">{intro}</p>
                      ) : null}
                      <DetailFieldGrid>
                        {sections.map((section) => {
                          const SectionIcon = SECTION_ICON_MAP[section.title] ?? FileText;
                          const wide = WIDE_SECTION_TITLES.has(section.title);
                          return (
                            <DetailField
                              key={section.title}
                              label={section.title}
                              icon={<SectionIcon className="h-3.5 w-3.5" />}
                              value={section.body}
                              className={wide ? 'sm:col-span-2 xl:col-span-3' : undefined}
                            />
                          );
                        })}
                      </DetailFieldGrid>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap text-sm leading-6 text-[var(--color-neutral-10)]">
                      {previewNotice.content}
                    </div>
                  )}
                </DetailSection>

                {previewNotice.attachments.length > 0 ? (
                  <DetailSection icon={Paperclip} title={`附件（${previewNotice.attachments.length}）`}>
                    <div className="space-y-2">
                      {previewNotice.attachments.map((attachment, index) => (
                        <div
                          key={`${previewNotice.id}-attachment-${index}`}
                          className="flex items-center justify-between gap-3 rounded border border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] px-3 py-2"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <Paperclip className="h-3.5 w-3.5 shrink-0 text-[var(--color-neutral-08)]" />
                            <span className="truncate text-sm text-[var(--color-neutral-11)]">{attachment.name}</span>
                          </div>
                          <span className="shrink-0 text-xs text-[var(--color-neutral-08)]">{attachment.size}</span>
                        </div>
                      ))}
                    </div>
                  </DetailSection>
                ) : null}
              </div>
            );
          })()}
        </DetailDialogShell>
      ) : null}
    </div>
  );
}
