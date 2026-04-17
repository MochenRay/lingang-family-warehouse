import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { 
  Send, 
  Save, 
  Eye, 
  Bell, 
  Users, 
  Calendar,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import { Checkbox } from '../ui/checkbox';
import { noticeRepository } from '../../services/repositories/noticeRepository';

interface NoticeFormData {
  title: string;
  type: string;
  content: string;
  scope: string[];
  grids: string[];
  publishNow: boolean;
  scheduledTime?: string;
}

interface PublishNoticeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PublishNoticeDialog({ open, onOpenChange }: PublishNoticeDialogProps) {
  const [formData, setFormData] = useState<NoticeFormData>({
    title: '',
    type: 'info',
    content: '',
    scope: [],
    grids: [],
    publishNow: true,
    scheduledTime: '',
  });

  const [showPreview, setShowPreview] = useState(false);
  const [gridList, setGridList] = useState<string[]>([]);

  // 公告类型选项
  const noticeTypes = [
    { value: 'urgent', label: '紧急通知', color: 'bg-red-100 text-red-600' },
    { value: 'system', label: '系统消息', color: 'bg-blue-100 text-blue-600' },
    { value: 'guide', label: '操作指南', color: 'bg-green-100 text-green-600' },
    { value: 'task', label: '工作任务', color: 'bg-orange-100 text-orange-600' },
    { value: 'info', label: '普通通知', color: 'bg-gray-100 text-gray-600' },
  ];

  // 通知范围选项
  const scopeOptions = [
    { value: 'all', label: '全体网格员' },
    { value: 'grid', label: '指定网格' },
    { value: 'community', label: '指定社区' },
    { value: 'street', label: '指定街道' },
  ];

  useEffect(() => {
    let active = true;
    const load = async () => {
      const grids = await noticeRepository.getGridOptions();
      if (active) {
        setGridList(grids);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const handleScopeChange = (value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      scope: checked 
        ? [...prev.scope, value]
        : prev.scope.filter(s => s !== value)
    }));
  };

  const handleGridChange = (grid: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      grids: checked
        ? [...prev.grids, grid]
        : prev.grids.filter(g => g !== grid)
    }));
  };

  const handlePublish = async () => {
    // 验证必填项
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('请填写标题和内容');
      return;
    }

    if (formData.scope.length === 0) {
      alert('请选择通知范围');
      return;
    }

    const created = await noticeRepository.createNotice({
      title: formData.title,
      type: formData.type as 'urgent' | 'system' | 'guide' | 'task' | 'info',
      content: formData.content,
      scope: formData.scope,
      grids: formData.grids,
      status: formData.publishNow ? 'published' : 'draft',
      publishNow: formData.publishNow,
      scheduledTime: formData.publishNow ? undefined : formData.scheduledTime,
    });
    window.dispatchEvent(new CustomEvent('notice-published', { detail: created }));

    // 重置表单并关闭对话框
    setFormData({
      title: '',
      type: 'info',
      content: '',
      scope: [],
      grids: [],
      publishNow: true,
      scheduledTime: '',
    });
    onOpenChange(false);
  };

  const handleSaveDraft = async () => {
    await noticeRepository.createNotice({
      title: formData.title || '未命名草稿',
      type: formData.type as 'urgent' | 'system' | 'guide' | 'task' | 'info',
      content: formData.content,
      scope: formData.scope,
      grids: formData.grids,
      status: 'draft',
      publishNow: false,
      scheduledTime: formData.scheduledTime,
    });
    alert('草稿已保存');
  };

  const getTypeColor = (type: string) => {
    return noticeTypes.find(t => t.value === type)?.color || 'bg-gray-100 text-gray-600';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>发布公告</DialogTitle>
          <DialogDescription>
            创建并发布公告通知，实时触达移动端网格员
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-4">
          <div className="space-y-6 py-4">
            {/* 基本信息 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Bell className="w-4 h-4 text-blue-600" />
                基本信息
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">
                  公告标题 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="例如：关于开展人口信息核查工作的通知"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">
                  公告类型 <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {noticeTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs ${type.color}`}>
                            {type.label}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">
                  公告内容 <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="content"
                  placeholder="请输入公告详细内容..."
                  rows={6}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500">{formData.content.length} / 2000 字符</p>
              </div>
            </div>

            {/* 通知范围 */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Users className="w-4 h-4 text-purple-600" />
                通知范围
              </div>

              <div className="space-y-3">
                <Label>接收对象 <span className="text-red-500">*</span></Label>
                <div className="space-y-2">
                  {scopeOptions.map(option => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`scope-${option.value}`}
                        checked={formData.scope.includes(option.value)}
                        onCheckedChange={(checked) => handleScopeChange(option.value, checked as boolean)}
                      />
                      <label
                        htmlFor={`scope-${option.value}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* 如果选择了"指定网格"，显示网格选择 */}
              {formData.scope.includes('grid') && (
                <div className="space-y-3 pt-3 border-t">
                  <Label>选择网格</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50 rounded-lg">
                    {gridList.map(grid => (
                      <div key={grid} className="flex items-center space-x-2">
                        <Checkbox
                          id={`grid-${grid}`}
                          checked={formData.grids.includes(grid)}
                          onCheckedChange={(checked) => handleGridChange(grid, checked as boolean)}
                        />
                        <label
                          htmlFor={`grid-${grid}`}
                          className="text-xs leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {grid}
                        </label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">已选择 {formData.grids.length} 个网格</p>
                </div>
              )}
            </div>

            {/* 发布设置 */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Calendar className="w-4 h-4 text-green-600" />
                发布设置
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="publishNow"
                  checked={formData.publishNow}
                  onCheckedChange={(checked) => setFormData({ ...formData, publishNow: checked as boolean })}
                />
                <label
                  htmlFor="publishNow"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  立即发布
                </label>
              </div>

              {!formData.publishNow && (
                <div className="space-y-2">
                  <Label htmlFor="scheduledTime">定时发布时间</Label>
                  <Input
                    id="scheduledTime"
                    type="datetime-local"
                    value={formData.scheduledTime}
                    onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                  />
                </div>
              )}
            </div>

            {/* 预览 */}
            {showPreview && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Eye className="w-4 h-4 text-blue-600" />
                    移动端预览
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="bg-gray-100 rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getTypeColor(formData.type)}`}>
                      {noticeTypes.find(t => t.value === formData.type)?.label}
                    </span>
                    <span className="text-xs text-gray-400">刚刚</span>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">
                    {formData.title || '公告标题'}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-3 whitespace-pre-line">
                    {formData.content || '公告内容将在此处显示...'}
                  </p>
                  <div className="pt-2 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">威海市社会治理中心</span>
                    <span className="text-xs text-blue-600">查看详情</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部操作按钮 */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="w-4 h-4 mr-2" />
            {showPreview ? '关闭预览' : '预览效果'}
          </Button>

          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={handleSaveDraft}
            >
              <Save className="w-4 h-4 mr-2" />
              保存草稿
            </Button>
            <Button 
              onClick={handlePublish}
              disabled={!formData.title || !formData.content || formData.scope.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4 mr-2" />
              {formData.publishNow ? '立即发布' : '定时发布'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
