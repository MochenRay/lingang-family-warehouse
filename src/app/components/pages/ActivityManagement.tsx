import { useState } from 'react';
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MapPin, 
  Calendar, 
  Users,
  Eye,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { 
  Table, 
  TableBody, 
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
import { MOCK_ACTIVITIES, Activity } from '../../data/activities';

export function ActivityManagement() {
  const [activities, setActivities] = useState<Activity[]>(MOCK_ACTIVITIES);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog State
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; activityId: string | null }>({ open: false, activityId: null });
  const [rejectReason, setRejectReason] = useState('');
  const [detailDialog, setDetailDialog] = useState<{ open: boolean; activity: Activity | null }>({ open: false, activity: null });

  // Filtered Lists
  const pendingActivities = activities.filter(a => a.approvalStatus === 'pending');
  
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
    if (confirm('确定要通过该活动申请吗？')) {
      setActivities(prev => prev.map(a => a.id === id ? { ...a, approvalStatus: 'approved', executionStatus: 'to_start' } : a));
      toast.success('活动已批准');
    }
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

  const getTypeBadge = (category: string) => {
     return category === 'volunteer' 
       ? <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-0">志愿服务</Badge>
       : <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-0">文娱活动</Badge>;
  };

  return (
    <div className="space-y-6 p-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">活动综合管理</h1>
          <p className="text-gray-500 mt-1">审批活动申请，查看历史活动档案及执行情况。</p>
        </div>
      </div>

      {/* Section 1: Pending Approvals */}
      <section>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-blue-600" />
          待办审批 ({pendingActivities.length})
        </h2>
        
        {pendingActivities.length === 0 ? (
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-500">
            暂无待审批的活动申请
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingActivities.map(activity => (
              <Card key={activity.id} className="border-l-4 border-l-yellow-400 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Badge variant="outline" className="mb-2">{activity.subcategory}</Badge>
                    <span className="text-xs text-gray-500">{activity.createdAt.split(' ')[0]} 申请</span>
                  </div>
                  <CardTitle className="text-base font-bold text-gray-900 line-clamp-1">
                    {activity.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 text-xs mt-1">
                    {activity.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                   <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>申请人: {activity.creatorName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{activity.date} {activity.startTime}</span>
                      </div>
                      <div className="bg-blue-50 p-2 rounded text-xs text-blue-700 mt-2">
                        <span className="font-bold">系统预测:</span> {activity.predictionText || '暂无预测'}
                      </div>
                   </div>
                </CardContent>
                <CardFooter className="pt-2 flex gap-2">
                   <Button variant="outline" className="flex-1 text-xs h-8" onClick={() => setDetailDialog({ open: true, activity })}>
                     查看详情
                   </Button>
                   <Button 
                     className="flex-1 bg-green-600 hover:bg-green-700 text-xs h-8"
                     onClick={() => handleApprove(activity.id)}
                   >
                     通过
                   </Button>
                   <Button 
                     variant="destructive" 
                     className="flex-1 text-xs h-8"
                     onClick={() => setRejectDialog({ open: true, activityId: activity.id })}
                   >
                     驳回
                   </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Section 2: History & Archives */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <HistoryIcon className="w-5 h-5 text-gray-600" />
            历史活动档案
          </h2>
          <div className="flex items-center gap-2">
             <div className="relative w-64">
               <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
               <Input 
                 placeholder="搜索活动名称或申请人..." 
                 className="pl-8 h-9 text-sm"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
             </div>
             <Button variant="outline" size="sm" className="h-9">
               <Filter className="w-4 h-4 mr-2" /> 筛选
             </Button>
          </div>
        </div>

        <div className="rounded-md border bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>活动名称</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>时间/地点</TableHead>
                <TableHead>申请人</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>执行情况</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyActivities.map(activity => (
                <TableRow key={activity.id}>
                  <TableCell className="font-medium">{activity.title}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                       {getTypeBadge(activity.category)}
                       <span className="text-xs text-gray-500">{activity.subcategory}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{activity.date}</div>
                    <div className="text-xs text-gray-500">{activity.location}</div>
                  </TableCell>
                  <TableCell>{activity.creatorName}</TableCell>
                  <TableCell>
                    {activity.approvalStatus === 'rejected' ? (
                       <Badge variant="destructive">已驳回</Badge>
                    ) : (
                       <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">已批准</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                     {activity.approvalStatus === 'approved' && (
                       <div className="flex flex-col gap-1">
                         <span className={
                           activity.executionStatus === 'in_progress' ? 'text-green-600 font-bold text-xs' : 
                           activity.executionStatus === 'ended' ? 'text-gray-500 text-xs' : 'text-blue-600 text-xs'
                         }>
                           {activity.executionStatus === 'in_progress' ? '进行中' : 
                            activity.executionStatus === 'ended' ? '已结束' : '待开始'}
                         </span>
                         <span className="text-xs text-gray-400">
                           {activity.attendeeIds.length} 人参与
                         </span>
                       </div>
                     )}
                     {activity.approvalStatus === 'rejected' && <span className="text-xs text-gray-400">-</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
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
              {historyActivities.length === 0 && (
                 <TableRow>
                   <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                     暂无相关活动记录
                   </TableCell>
                 </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>驳回申请</DialogTitle>
            <DialogDescription>
              请输入驳回原因，该原因将反馈给申请人。
            </DialogDescription>
          </DialogHeader>
          <Textarea 
             placeholder="例如：预算过高，建议缩减开支..."
             value={rejectReason}
             onChange={e => setRejectReason(e.target.value)}
             className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, activityId: null })}>取消</Button>
            <Button variant="destructive" onClick={handleReject}>确认驳回</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialog.open} onOpenChange={(open) => setDetailDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>活动详情</DialogTitle>
            <DialogDescription>
              查看活动详细信息、执行情况及现场记录。
            </DialogDescription>
          </DialogHeader>
          {detailDialog.activity && (
             <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <span className="text-sm text-gray-500 block">活动名称</span>
                     <span className="font-medium">{detailDialog.activity.title}</span>
                   </div>
                   <div>
                     <span className="text-sm text-gray-500 block">申请人</span>
                     <span className="font-medium">{detailDialog.activity.creatorName}</span>
                   </div>
                   <div>
                     <span className="text-sm text-gray-500 block">类型</span>
                     <span className="font-medium">{detailDialog.activity.category} - {detailDialog.activity.subcategory}</span>
                   </div>
                   <div>
                     <span className="text-sm text-gray-500 block">时间</span>
                     <span className="font-medium">{detailDialog.activity.date} {detailDialog.activity.startTime}-{detailDialog.activity.endTime}</span>
                   </div>
                   <div>
                     <span className="text-sm text-gray-500 block">预计人数</span>
                     <span className="font-medium">{detailDialog.activity.expectedParticipants}人</span>
                   </div>
                   <div>
                     <span className="text-sm text-gray-500 block">地点</span>
                     <span className="font-medium">{detailDialog.activity.location}</span>
                   </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                   <h4 className="font-bold mb-2 text-sm">申请详情 (策划方案)</h4>
                   <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                     {detailDialog.activity.applicationDetails || '无详细方案'}
                   </p>
                </div>

                {detailDialog.activity.media.length > 0 && (
                   <div>
                      <h4 className="font-bold mb-2 text-sm">现场记录</h4>
                      <div className="flex gap-2">
                         {detailDialog.activity.media.map((m, i) => (
                           <img key={i} src={m.url} className="w-24 h-24 object-cover rounded-lg border" alt="现场" />
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
    </div>
  );
}

function HistoryIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 12" />
      <path d="M3 3v9h9" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}
