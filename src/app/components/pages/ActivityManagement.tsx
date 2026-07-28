import { useEffect, useState } from 'react';
import {
  History,
  Filter,
  Clock,
  Eye,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '../ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { 
  Table, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { MOCK_ACTIVITIES, Activity, getActivityTypePath, getCategoryLabel } from '../../data/activities';
import { PageHeader } from './PageHeader';
import { StatusBadge } from '../patterns/StatusBadge';
import { DataTableBody } from '../patterns/DataTableShell';
import { SearchInput } from '../patterns/FilterBar';
import { ConfirmDialog } from '../patterns/ConfirmDialog';
import { DIALOG_CLASS, PANEL_CLASS } from '../patterns/surfaces';

const DARK_INPUT_CLASS =
  'border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)] placeholder:text-[var(--color-neutral-08)]';
const MUTED_TEXT_CLASS = 'text-[var(--color-neutral-08)]';
const ACTION_BUTTON_CLASS =
  'border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)] hover:bg-[var(--color-neutral-03)] hover:text-[var(--color-neutral-11)]';

/** 「类型 · 子分类」层级徽标：类型作主徽标、子分类作从属文本，表达从属关系而非两个并列 pill */
function ActivityTypeBadge({ category, subcategory }: { category: Activity['category']; subcategory: string }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <StatusBadge tone={category === 'volunteer' ? 'warning' : 'info'}>{getCategoryLabel(category)}</StatusBadge>
      <span className="text-xs text-[var(--color-neutral-08)]">·</span>
      <span className="truncate text-xs text-[var(--color-neutral-10)]">{subcategory}</span>
    </span>
  );
}

export function ActivityManagement() {
  const [activities, setActivities] = useState<Activity[]>(MOCK_ACTIVITIES);
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog State
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; activityId: string | null }>({ open: false, activityId: null });
  const [rejectReason, setRejectReason] = useState('');
  const [detailDialog, setDetailDialog] = useState<{ open: boolean; activity: Activity | null }>({ open: false, activity: null });
  const [approveTargetId, setApproveTargetId] = useState<string | null>(null);

  // Filtered Lists
  const pendingActivities = activities.filter(a => a.approvalStatus === 'pending');

  // 默认落在待办审批；待办被清空（或初始为空）时自动落到历史活动档案
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>(() =>
    MOCK_ACTIVITIES.some(a => a.approvalStatus === 'pending') ? 'pending' : 'history',
  );

  useEffect(() => {
    if (pendingActivities.length === 0) {
      setActiveTab('history');
    }
  }, [pendingActivities.length]);
  
  const historyActivities = activities.filter(a => {
    if (a.approvalStatus === 'pending') return false; // Exclude pending from history list? Or include? Requirement says "History Archive". Usually pending is separate.
    if (searchQuery) {
      return a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
             a.creatorName.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  // Actions
  const handleApprove = (id: string) => {
    setApproveTargetId(id);
  };

  const handleApproveConfirm = () => {
    if (!approveTargetId) {
      return;
    }
    setActivities(prev => prev.map(a => a.id === approveTargetId ? { ...a, approvalStatus: 'approved', executionStatus: 'to_start' } : a));
    toast.success('活动已批准');
    setApproveTargetId(null);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error('请填写驳回原因');
      return;
    }
    if (rejectDialog.activityId) {
      setActivities(prev => prev.map(a => a.id === rejectDialog.activityId ? { ...a, approvalStatus: 'rejected', timeline: [...a.timeline, { timestamp: new Date().toISOString(), operatorName: '管理员', action: 'reject', comment: rejectReason }] } : a));
      toast.success('活动已驳回');
      setRejectDialog({ open: false, activityId: null });
      setRejectReason('');
    }
  };

  return (
    <div className="space-y-5 pb-16 text-[var(--color-neutral-10)]">
      <PageHeader
        eyebrow="ACTIVITY MANAGEMENT"
        title="活动综合管理"
        description="统筹社区活动报名、签到和反馈，辅助评估居民参与情况。"
      />

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'pending' | 'history')}
        className="gap-4"
      >
        <TabsList className="border-b border-[var(--color-neutral-03)]">
          <TabsTrigger value="pending">
            <Clock className="w-4 h-4" />
            待办审批 ({pendingActivities.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="w-4 h-4" />
            历史活动档案 ({historyActivities.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {pendingActivities.length === 0 ? (
            <div className="rounded-[8px] border border-dashed border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] p-6 text-center text-[var(--color-neutral-08)]">
              暂无待审批的活动申请
            </div>
          ) : (
            <div className={`${PANEL_CLASS} overflow-hidden`}>
              <Table className="min-w-[920px]">
                <TableHeader>
                  <TableRow className="border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] hover:bg-[var(--color-neutral-02)]">
                    <TableHead>活动</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>时间</TableHead>
                    <TableHead>申请人</TableHead>
                    <TableHead>参与预测</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <DataTableBody columnCount={6}>
                  {pendingActivities.map(activity => (
                    <TableRow key={activity.id} className="border-[var(--color-neutral-03)] hover:bg-[var(--color-brand-primary)]/8">
                      <TableCell className="min-w-[190px]">
                        <p className="font-medium text-[var(--color-neutral-11)]">{activity.title}</p>
                        <p className="mt-1 line-clamp-1 text-xs text-[var(--color-neutral-08)]">{activity.description}</p>
                      </TableCell>
                      <TableCell>
                        <ActivityTypeBadge category={activity.category} subcategory={activity.subcategory} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <p>{activity.date}</p>
                        <p className="text-xs text-[var(--color-neutral-08)]">{activity.startTime} · {activity.createdAt.split(' ')[0]} 申请</p>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{activity.creatorName}</TableCell>
                      <TableCell className="max-w-[220px] text-sm text-[var(--color-brand-text)]">
                        {activity.predictionText || '暂无预测'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2 whitespace-nowrap">
                          <Button variant="outline" size="sm" className={ACTION_BUTTON_CLASS} onClick={() => setDetailDialog({ open: true, activity })}>
                            查看
                          </Button>
                          <Button
                            size="sm"
                            className="bg-[var(--color-status-success)] text-[var(--color-neutral-11)] hover:bg-[var(--color-status-success)]/90"
                            onClick={() => handleApprove(activity.id)}
                          >
                            通过
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setRejectDialog({ open: true, activityId: activity.id })}
                          >
                            驳回
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </DataTableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
               <SearchInput
                 className="w-64"
                 placeholder="搜索活动名称或申请人..."
                 value={searchQuery}
                 onChange={setSearchQuery}
               />
               <Button variant="outline" size="sm" className={`h-9 ${ACTION_BUTTON_CLASS}`}>
                 <Filter className="w-4 h-4 mr-2" /> 筛选
               </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-[8px] border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] shadow-none">
            <Table>
              <TableHeader>
                <TableRow className="border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] hover:bg-[var(--color-neutral-02)]">
                  <TableHead>活动名称</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>时间/地点</TableHead>
                  <TableHead>申请人</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>执行情况</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <DataTableBody
                empty={historyActivities.length === 0}
                emptyText="暂无相关活动记录"
                columnCount={7}
              >
                {historyActivities.map(activity => (
                  <TableRow key={activity.id} className="border-[var(--color-neutral-03)] hover:bg-[var(--color-brand-primary)]/8">
                    <TableCell className="font-medium text-[var(--color-neutral-11)]">{activity.title}</TableCell>
                    <TableCell>
                      <ActivityTypeBadge category={activity.category} subcategory={activity.subcategory} />
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{activity.date}</div>
                      <div className="text-xs text-[var(--color-neutral-08)]">{activity.location}</div>
                    </TableCell>
                    <TableCell>{activity.creatorName}</TableCell>
                    <TableCell>
                      {activity.approvalStatus === 'rejected' ? (
                         <StatusBadge tone="error">已驳回</StatusBadge>
                      ) : (
                         <StatusBadge tone="success">已批准</StatusBadge>
                      )}
                    </TableCell>
                    <TableCell>
                       {activity.approvalStatus === 'approved' && (
                         <div className="flex flex-col gap-1">
                           <span className={
                             activity.executionStatus === 'in_progress' ? 'text-[var(--color-status-success-text)] font-bold text-xs' :
                             activity.executionStatus === 'ended' ? 'text-[var(--color-neutral-08)] text-xs' : 'text-[var(--color-brand-text)] text-xs'
                           }>
                             {activity.executionStatus === 'in_progress' ? '进行中' :
                              activity.executionStatus === 'ended' ? '已结束' : '待开始'}
                           </span>
                           <span className="text-xs text-[var(--color-neutral-08)]">
                             {activity.attendeeIds.length} 人参与
                           </span>
                         </div>
                       )}
                       {activity.approvalStatus === 'rejected' && <span className="text-xs text-[var(--color-neutral-08)]">-</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 text-[var(--color-neutral-08)] hover:bg-[var(--color-neutral-03)] hover:text-[var(--color-neutral-11)]">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setDetailDialog({ open: true, activity })}>
                            <Eye className="mr-2 h-4 w-4" />
                            查看详情
                          </DropdownMenuItem>
                          {activity.executionStatus === 'ended' && (
                            <DropdownMenuItem>
                               查看执行报告
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </DataTableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog(prev => ({ ...prev, open }))}>
        <DialogContent className={DIALOG_CLASS}>
          <DialogHeader>
            <DialogTitle>驳回申请</DialogTitle>
            <DialogDescription className={MUTED_TEXT_CLASS}>
              请输入驳回原因，该原因将反馈给申请人。
            </DialogDescription>
          </DialogHeader>
          <Textarea 
             placeholder="例如：预算过高，建议缩减开支..."
             value={rejectReason}
             onChange={e => setRejectReason(e.target.value)}
             className={`min-h-[100px] ${DARK_INPUT_CLASS}`}
          />
          <DialogFooter>
            <Button variant="outline" className={ACTION_BUTTON_CLASS} onClick={() => setRejectDialog({ open: false, activityId: null })}>取消</Button>
            <Button variant="destructive" onClick={handleReject}>确认驳回</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialog.open} onOpenChange={(open) => setDetailDialog(prev => ({ ...prev, open }))}>
        <DialogContent className={`max-h-[80vh] max-w-2xl overflow-y-auto ${DIALOG_CLASS}`}>
          <DialogHeader>
            <DialogTitle>活动详情</DialogTitle>
            <DialogDescription className={MUTED_TEXT_CLASS}>
              查看活动详细信息、执行情况及现场记录。
            </DialogDescription>
          </DialogHeader>
          {detailDialog.activity && (
             <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <span className="block text-sm text-[var(--color-neutral-08)]">活动名称</span>
                     <span className="font-medium text-[var(--color-neutral-11)]">{detailDialog.activity.title}</span>
                   </div>
                   <div>
                     <span className="block text-sm text-[var(--color-neutral-08)]">申请人</span>
                     <span className="font-medium text-[var(--color-neutral-11)]">{detailDialog.activity.creatorName}</span>
                   </div>
                   <div>
                     <span className="block text-sm text-[var(--color-neutral-08)]">类型</span>
                     <span className="font-medium text-[var(--color-neutral-11)]">{getActivityTypePath(detailDialog.activity)}</span>
                   </div>
                   <div>
                     <span className="block text-sm text-[var(--color-neutral-08)]">时间</span>
                     <span className="font-medium text-[var(--color-neutral-11)]">{detailDialog.activity.date} {detailDialog.activity.startTime}-{detailDialog.activity.endTime}</span>
                   </div>
                   <div>
                     <span className="block text-sm text-[var(--color-neutral-08)]">预计人数</span>
                     <span className="font-medium text-[var(--color-neutral-11)]">{detailDialog.activity.expectedParticipants}人</span>
                   </div>
                   <div>
                     <span className="block text-sm text-[var(--color-neutral-08)]">地点</span>
                     <span className="font-medium text-[var(--color-neutral-11)]">{detailDialog.activity.location}</span>
                   </div>
                </div>
                
                <div className="rounded-lg border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] p-4">
                   <h4 className="mb-2 text-sm font-bold text-[var(--color-neutral-11)]">申请详情 (策划方案)</h4>
                   <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-neutral-10)]">
                     {detailDialog.activity.applicationDetails || '无详细方案'}
                   </p>
                </div>

                {detailDialog.activity.media.length > 0 && (
                   <div>
                      <h4 className="mb-2 text-sm font-bold text-[var(--color-neutral-11)]">现场记录</h4>
                      <div className="flex gap-2">
                         {detailDialog.activity.media.map((m, i) => (
                           <img key={i} src={m.url} className="h-24 w-24 rounded-lg border border-[var(--color-neutral-03)] object-cover" alt="现场" />
                         ))}
                      </div>
                   </div>
                )}
             </div>
          )}
          <DialogFooter>
             <Button onClick={() => setDetailDialog({ open: false, activity: null })}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Confirm Dialog */}
      <ConfirmDialog
        open={approveTargetId !== null}
        onOpenChange={(open) => !open && setApproveTargetId(null)}
        title="通过活动申请"
        description="确定要通过该活动申请吗？"
        confirmText="通过"
        destructive
        onConfirm={handleApproveConfirm}
      />
    </div>
  );
}
