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

export function NoticeManagement() {
  const [notices, setNotices] = useState<NoticeRecord[]>([]);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [previewNotice, setPreviewNotice] = useState<NoticeRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // 公告类型配置
  const noticeTypes = [
    { value: 'urgent', label: '紧急通知', color: 'bg-red-100 text-red-600' },
    { value: 'system', label: '系统消息', color: 'bg-blue-100 text-blue-600' },
    { value: 'guide', label: '操作指南', color: 'bg-green-100 text-green-600' },
    { value: 'task', label: '工作任务', color: 'bg-orange-100 text-orange-600' },
    { value: 'info', label: '普通通知', color: 'bg-gray-100 text-gray-600' },
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
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 页面标题和操作区 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">公告管理</h2>
          <p className="text-muted-foreground">管理和发布系统公告通知</p>
        </div>
        <Button 
          onClick={() => setShowPublishDialog(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          发布公告
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">总公告数</p>
                <p className="text-2xl font-bold">{notices.filter(n => n.status === 'published').length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Bell className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">紧急通知</p>
                <p className="text-2xl font-bold">
                  {notices.filter(n => n.type === 'urgent').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">工作任务</p>
                <p className="text-2xl font-bold">
                  {notices.filter(n => n.type === 'task').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">今日发布</p>
                <p className="text-2xl font-bold">
                  {notices.filter(n => formatNoticeTime(n.publishedAt).includes('小时前') || formatNoticeTime(n.publishedAt) === '刚刚').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="搜索公告标题或内容..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
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
      <Card>
        <CardHeader>
          <CardTitle>公告列表</CardTitle>
          <CardDescription>共 {filteredNotices.length} 条公告</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredNotices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>标题</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>通知范围</TableHead>
                  <TableHead>发布时间</TableHead>
                  <TableHead>发布人</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotices.map((notice) => {
                  const typeConfig = getTypeConfig(notice.type);
                  return (
                    <TableRow key={notice.id}>
                      <TableCell className="font-medium max-w-md">
                        <div className="truncate">{notice.title}</div>
                        <div className="text-xs text-gray-500 truncate mt-1">
                          {notice.content}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={typeConfig.color}>
                          {typeConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Users className="w-3 h-3" />
                          {getScopeText(notice.scope)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="w-3 h-3" />
                          {formatNoticeTime(notice.publishedAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {notice.publisher}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPreviewNotice(notice)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(notice.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
          ) : (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">暂无公告</p>
              <Button
                variant="outline"
                className="mt-4"
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{previewNotice?.title ?? '公告预览'}</DialogTitle>
            <DialogDescription>
              {previewNotice
                ? `${formatNoticeTime(previewNotice.publishedAt)} · ${getScopeText(previewNotice.scope)} · ${previewNotice.publisher}`
                : '查看公告详情'}
            </DialogDescription>
          </DialogHeader>
          {previewNotice ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={getTypeConfig(previewNotice.type).color}>
                  {getTypeConfig(previewNotice.type).label}
                </Badge>
                <Badge variant="outline">{previewNotice.status === 'published' ? '已发布' : '草稿'}</Badge>
              </div>
              <div className="rounded-lg border bg-slate-50 p-4 text-sm leading-6 text-slate-700 whitespace-pre-wrap">
                {previewNotice.content}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
