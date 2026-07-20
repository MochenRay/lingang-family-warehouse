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
  AlertCircle
} from 'lucide-react';
import { PublishNoticeDialog } from '../notices/PublishNoticeDialog';
import { formatNoticeTime, noticeRepository, type NoticeRecord } from '../../services/repositories/noticeRepository';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
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
import { SearchInput } from '../patterns/FilterBar';
import { EmptyState } from '../patterns/states';
import { ConfirmDialog } from '../patterns/ConfirmDialog';
import { DIALOG_CLASS, PANEL_CLASS } from '../patterns/surfaces';

// 公告类型配置：label + StatusBadge tone（替代原散落 pastel 色值）
const noticeTypes: Array<{ value: string; label: string; tone: StatusTone }> = [
  { value: 'urgent', label: '紧急通知', tone: 'error' },
  { value: 'system', label: '系统消息', tone: 'info' },
  { value: 'guide', label: '操作指南', tone: 'success' },
  { value: 'task', label: '工作任务', tone: 'warning' },
  { value: 'info', label: '普通通知', tone: 'neutral' },
];

export function NoticeManagement() {
  const [notices, setNotices] = useState<NoticeRecord[]>([]);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [previewNotice, setPreviewNotice] = useState<NoticeRecord | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

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
                {filteredNotices.map((notice) => {
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

      <Dialog open={Boolean(previewNotice)} onOpenChange={(open) => !open && setPreviewNotice(null)}>
        <DialogContent className={DIALOG_CLASS}>
          <DialogHeader>
            <DialogTitle className="text-[var(--color-neutral-11)]">{previewNotice?.title ?? '公告预览'}</DialogTitle>
            <DialogDescription className="text-[var(--color-neutral-08)]">
              {previewNotice
                ? `${formatNoticeTime(previewNotice.publishedAt)} · ${getScopeText(previewNotice.scope)} · ${previewNotice.publisher}`
                : '查看公告详情'}
            </DialogDescription>
          </DialogHeader>
          {previewNotice ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <StatusBadge tone={getTypeConfig(previewNotice.type).tone}>
                  {getTypeConfig(previewNotice.type).label}
                </StatusBadge>
                <Badge variant="outline" className="border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-08)]">
                  {previewNotice.status === 'published' ? '已发布' : '草稿'}
                </Badge>
              </div>
              <div className="rounded-[4px] border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] p-4 text-sm leading-6 text-[var(--color-neutral-10)] whitespace-pre-wrap">
                {previewNotice.content}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
