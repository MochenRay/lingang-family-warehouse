import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import {
  Plus,
  Search,
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

const DARK_CARD_CLASS = 'border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)]';
const DARK_INPUT_CLASS = 'border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)] placeholder:text-[var(--color-neutral-08)]';
const DARK_DIALOG_CLASS = 'border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)] shadow-2xl';

export function NoticeManagement() {
  const [notices, setNotices] = useState<NoticeRecord[]>([]);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [previewNotice, setPreviewNotice] = useState<NoticeRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // 公告类型配置
  const noticeTypes = [
    { value: 'urgent', label: '紧急通知', color: 'border-[#D52132]/35 bg-[#D52132]/10 text-[#FFB4B4]' },
    { value: 'system', label: '系统消息', color: 'border-[#4E86DF]/35 bg-[#4E86DF]/10 text-[#9EC3FF]' },
    { value: 'guide', label: '操作指南', color: 'border-[#19B172]/35 bg-[#19B172]/10 text-[#7DE2B7]' },
    { value: 'task', label: '工作任务', color: 'border-[#D6730D]/35 bg-[#D6730D]/10 text-[#F6C27A]' },
    { value: 'info', label: '普通通知', color: 'border-[var(--color-neutral-03)] bg-[var(--color-neutral-03)] text-[var(--color-neutral-08)]' },
  ];

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

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条公告吗？')) {
      return;
    }
    await noticeRepository.deleteNotice(id);
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
    <div className="space-y-5 text-[var(--color-neutral-10)] animate-in fade-in duration-500">
      <PageHeader
        eyebrow="NOTICE MANAGEMENT"
        title="公告管理"
        description="维护公告发布、状态和触达记录，确保居民通知可追踪。"
        actions={
          <Button
            onClick={() => setShowPublishDialog(true)}
            className="bg-[#4E86DF] text-white hover:bg-[#2761CB]"
          >
            <Plus className="w-4 h-4 mr-2" />
            发布公告
          </Button>
        }
      />

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Card className={DARK_CARD_CLASS}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--color-neutral-08)]">总公告数</p>
                <p className="text-2xl font-semibold text-[var(--color-neutral-11)]">{notices.filter(n => n.status === 'published').length}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#4E86DF]/30 bg-[#4E86DF]/10">
                <Bell className="w-5 h-5 text-[#4E86DF]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={DARK_CARD_CLASS}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--color-neutral-08)]">紧急通知</p>
                <p className="text-2xl font-semibold text-[var(--color-neutral-11)]">
                  {notices.filter(n => n.type === 'urgent').length}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#D52132]/30 bg-[#D52132]/10">
                <AlertCircle className="w-5 h-5 text-[#D52132]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={DARK_CARD_CLASS}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--color-neutral-08)]">工作任务</p>
                <p className="text-2xl font-semibold text-[var(--color-neutral-11)]">
                  {notices.filter(n => n.type === 'task').length}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#D6730D]/30 bg-[#D6730D]/10">
                <CheckCircle2 className="w-5 h-5 text-[#D6730D]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={DARK_CARD_CLASS}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--color-neutral-08)]">今日发布</p>
                <p className="text-2xl font-semibold text-[var(--color-neutral-11)]">
                  {notices.filter(n => formatNoticeTime(n.publishedAt).includes('小时前') || formatNoticeTime(n.publishedAt) === '刚刚').length}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#19B172]/30 bg-[#19B172]/10">
                <Clock className="w-5 h-5 text-[#19B172]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card className={DARK_CARD_CLASS}>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-neutral-08)]" />
              <Input
                placeholder="搜索公告标题或内容..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 ${DARK_INPUT_CLASS}`}
              />
            </div>
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
                  className={filterType === option.value
                    ? 'bg-[#4E86DF] text-white hover:bg-[#2761CB]'
                    : 'border-[var(--color-neutral-03)] text-[var(--color-neutral-08)] hover:bg-[var(--color-neutral-03)] hover:text-[var(--color-neutral-11)]'}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 公告列表 */}
      <Card className={`${DARK_CARD_CLASS} overflow-hidden`}>
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
                    <TableRow key={notice.id} className="border-[var(--color-neutral-03)] hover:bg-[var(--color-neutral-03)]/70">
                      <TableCell className="w-[38%] min-w-[260px] max-w-[360px] font-medium">
                        <div className="truncate text-[var(--color-neutral-11)]">{notice.title}</div>
                        <div className="text-xs text-[var(--color-neutral-08)] truncate mt-1">
                          {notice.content}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="outline" className={typeConfig.color}>
                          {typeConfig.label}
                        </Badge>
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
                            onClick={() => setPreviewNotice(notice)}
                            className="text-[var(--color-neutral-08)] hover:bg-[var(--color-neutral-03)] hover:text-[#4E86DF]"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(notice.id)}
                            className="text-[#FFB4B4] hover:bg-[#D52132]/15 hover:text-[#D52132]"
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
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-[var(--color-neutral-08)] mx-auto mb-4" />
              <p className="text-[var(--color-neutral-08)]">暂无公告</p>
              <Button
                variant="outline"
                className="mt-4 border-[var(--color-neutral-03)] text-[var(--color-neutral-08)] hover:bg-[var(--color-neutral-03)] hover:text-[var(--color-neutral-11)]"
                onClick={() => setShowPublishDialog(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                发布第一条公告
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 发布公告对话框 */}
      <PublishNoticeDialog 
        open={showPublishDialog}
        onOpenChange={setShowPublishDialog}
      />

      <Dialog open={Boolean(previewNotice)} onOpenChange={(open) => !open && setPreviewNotice(null)}>
        <DialogContent className={DARK_DIALOG_CLASS}>
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
                <Badge variant="outline" className={getTypeConfig(previewNotice.type).color}>
                  {getTypeConfig(previewNotice.type).label}
                </Badge>
                <Badge variant="outline" className="border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-08)]">
                  {previewNotice.status === 'published' ? '已发布' : '草稿'}
                </Badge>
              </div>
              <div className="rounded-lg border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] p-4 text-sm leading-6 text-[var(--color-neutral-10)] whitespace-pre-wrap">
                {previewNotice.content}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
