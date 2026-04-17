import { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  MapPin,
  Clock,
  Users,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Camera,
  PlayCircle,
  History,
  Trash2,
  Edit3,
  Sprout,
  HeartHandshake,
  Megaphone,
  Wrench,
  Trophy,
  Music,
  Film,
  Scissors,
  Calendar as CalendarIcon,
  X,
  Plus,
  Tag
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { MOCK_ACTIVITIES, Activity, CATEGORY_OPTIONS, PotentialParticipant } from '../../data/activities';
import { toast } from 'sonner';
import { MobileStatusBar } from './MobileStatusBar';
import { cn } from '../../components/ui/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from '../ui/drawer';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';

interface MobileActivityDetailProps {
  id: string;
  mode?: 'execution' | 'application';
  onBack: () => void;
  onRouteChange: (route: string) => void;
}

const MOCK_RESIDENTS = [
  { id: 'p1', name: '张三', address: '1号楼101' },
  { id: 'p2', name: '李四', address: '1号楼102' },
  { id: 'p3', name: '王五', address: '2号楼201' },
  { id: 'p4', name: '赵六', address: '3号楼303' },
  { id: 'p5', name: '孙七', address: '5号楼502' },
];

export function MobileActivityDetail({ id, mode = 'execution', onBack, onRouteChange }: MobileActivityDetailProps) {
  const [activity, setActivity] = useState<Activity | null>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isResidentDrawerOpen, setIsResidentDrawerOpen] = useState(false);
  const [residentSearch, setResidentSearch] = useState('');
  const [selectedResidents, setSelectedResidents] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const found = MOCK_ACTIVITIES.find(a => a.id === id);
    if (found) {
      setActivity(found);
      setSelectedResidents(found.attendeeIds || []);
      if (found.media?.length > 0) {
        setUploadedImages(found.media.map(m => m.url));
      }
    }
  }, [id]);

  if (!activity) return null;

  const handleCancelActivity = () => {
    toast.success('活动已取消');
    setIsCancelDialogOpen(false);
  };

  const handleSaveResidents = () => {
    toast.success(`已关联 ${selectedResidents.length} 名居民`);
    setIsResidentDrawerOpen(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) {
      return;
    }
    const nextImages = files.map((file) => URL.createObjectURL(file));
    setUploadedImages((prev) => [...prev, ...nextImages].slice(0, 9));
    toast.success(`已添加 ${nextImages.length} 张现场图片`);
    event.target.value = '';
  };

  const handleDeleteImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    toast.success('图片已删除');
  };

  const handleDeleteResident = (rid: string) => {
    setSelectedResidents(prev => prev.filter(id => id !== rid));
    toast.success('已移除关联居民');
  };

  const getStatusConfig = () => {
    if (activity.approvalStatus === 'pending') return { label: '审批中', bg: 'bg-amber-500', textColor: 'text-white' };
    if (activity.approvalStatus === 'rejected') return { label: '未通过', bg: 'bg-red-500', textColor: 'text-white' };
    switch (activity.executionStatus) {
      case 'to_start': return { label: '待开始', bg: 'bg-blue-500', textColor: 'text-white' };
      case 'in_progress': return { label: '进行中', bg: 'bg-emerald-500', textColor: 'text-white' };
      case 'ended': return { label: '已结束', bg: 'bg-gray-400', textColor: 'text-white' };
      case 'cancelled': return { label: '已取消', bg: 'bg-gray-400', textColor: 'text-white' };
      default: return { label: '未知', bg: 'bg-gray-400', textColor: 'text-white' };
    }
  };

  const getCategoryStyle = (subcategory: string) => {
    switch (subcategory) {
      case '环境整治': return { icon: Sprout, color: 'text-emerald-600', bg: 'bg-emerald-50' };
      case '助老扶弱': return { icon: HeartHandshake, color: 'text-rose-500', bg: 'bg-rose-50' };
      case '政策宣传': return { icon: Megaphone, color: 'text-blue-600', bg: 'bg-blue-50' };
      case '便民服务': return { icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-50' };
      case '趣味运动会': return { icon: Trophy, color: 'text-yellow-600', bg: 'bg-yellow-50' };
      case '社区音乐会': return { icon: Music, color: 'text-purple-600', bg: 'bg-purple-50' };
      case '露天电影': return { icon: Film, color: 'text-indigo-600', bg: 'bg-indigo-50' };
      case '手工制作': return { icon: Scissors, color: 'text-pink-500', bg: 'bg-pink-50' };
      default: return { icon: CalendarIcon, color: 'text-gray-500', bg: 'bg-gray-50' };
    }
  };

  const filteredResidents = MOCK_RESIDENTS.filter(r =>
    r.name.includes(residentSearch) || r.address.includes(residentSearch)
  );

  const status = getStatusConfig();
  const catStyle = getCategoryStyle(activity.subcategory);
  const CatIcon = catStyle.icon;

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 border-b border-gray-100">
        <MobileStatusBar variant="dark" />
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-8 h-8 -ml-2 rounded-full flex items-center justify-center text-gray-600 active:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold text-gray-900 truncate flex-1">活动详情</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24">

        {/* Hero Card */}
        <div className="bg-white p-5 border-b border-gray-100">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl ${catStyle.bg} flex items-center justify-center shrink-0`}>
              <CatIcon className={`w-7 h-7 ${catStyle.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900 leading-tight mb-2">{activity.title}</h2>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-400">
                  {activity.category === 'volunteer' ? '志愿服务' : '文娱活动'} · {activity.subcategory}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${status.bg} ${status.textColor}`}>
                  {status.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Info Grid */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[11px] text-gray-400 flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> 活动日期</span>
                <span className="text-sm font-semibold text-gray-900">{activity.date}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> 活动时间</span>
                <span className="text-sm font-semibold text-gray-900">{activity.startTime} - {activity.endTime}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-gray-400 flex items-center gap-1"><Users className="w-3 h-3" /> 预计人数</span>
                <span className="text-sm font-semibold text-gray-900">{activity.expectedParticipants} 人</span>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> 活动地点</span>
                <span className="text-sm font-semibold text-gray-900">{activity.location}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 space-y-4">
            <div>
              <h3 className="font-bold text-sm text-gray-900 mb-2 flex items-center gap-2">
                <span className="w-1 h-3 bg-blue-500 rounded-full"></span>
                活动简介
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {activity.description || '暂无简介'}
              </p>
            </div>

            {activity.applicationDetails && (
              <div className="pt-3 border-t border-gray-50">
                <h3 className="font-bold text-sm text-gray-900 mb-2 flex items-center gap-2">
                  <span className="w-1 h-3 bg-purple-500 rounded-full"></span>
                  申请详情
                </h3>
                <div className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl">
                  {activity.applicationDetails}
                </div>
              </div>
            )}
          </div>

          {/* Participating Residents */}
          {mode === 'execution' && (activity.executionStatus === 'in_progress' || activity.executionStatus === 'ended') && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <span className="w-1 h-3 bg-purple-500 rounded-full"></span>
                  参与居民 ({selectedResidents.length})
                </h3>
                {activity.executionStatus === 'in_progress' && (
                  <button
                    className="text-xs text-blue-600 font-medium flex items-center gap-1 active:scale-95"
                    onClick={() => setIsResidentDrawerOpen(true)}
                  >
                    <Plus className="w-3.5 h-3.5" /> 添加
                  </button>
                )}
              </div>
              <div className="p-4">
                {selectedResidents.length > 0 ? (
                  <div className="space-y-2">
                    {selectedResidents.map(rid => {
                      const resident = MOCK_RESIDENTS.find(r => r.id === rid);
                      if (!resident) return null;
                      return (
                        <div key={rid} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {resident.name[0]}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{resident.name}</div>
                              <div className="text-xs text-gray-400">{resident.address}</div>
                            </div>
                          </div>
                          {activity.executionStatus === 'in_progress' && (
                            <button
                              onClick={() => handleDeleteResident(rid)}
                              className="p-1.5 text-gray-300 hover:text-red-500 rounded-full transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    暂无参与居民
                  </div>
                )}
              </div>
            </div>
          )}

          {/* On-site Records */}
          {mode === 'execution' && (activity.executionStatus === 'in_progress' || activity.executionStatus === 'ended') && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-50">
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <span className="w-1 h-3 bg-cyan-500 rounded-full"></span>
                  现场记录 ({uploadedImages.length})
                </h3>
              </div>
              <div className="p-4">
                <input
                  ref={uploadInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <div className="grid grid-cols-3 gap-3">
                  {uploadedImages.map((img, idx) => (
                    <div key={idx} className="aspect-square rounded-xl relative overflow-hidden border border-gray-100">
                      <img src={img} alt="现场记录" className="w-full h-full object-cover" />
                      {activity.executionStatus === 'in_progress' && (
                        <button
                          onClick={() => handleDeleteImage(idx)}
                          className="absolute top-1.5 right-1.5 p-1 bg-black/50 rounded-full text-white hover:bg-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  {activity.executionStatus === 'in_progress' && (
                    <button
                      onClick={() => uploadInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-1.5 text-gray-400 active:bg-gray-100 transition-colors"
                    >
                      <Camera className="w-5 h-5" />
                      <span className="text-[10px]">添加照片</span>
                    </button>
                  )}
                </div>
                {uploadedImages.length === 0 && activity.executionStatus !== 'in_progress' && (
                  <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    暂无现场记录
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Potential Participants (to_start) */}
          {activity.approvalStatus === 'approved' && activity.executionStatus === 'to_start' && (() => {
            const cat = CATEGORY_OPTIONS.find(c => c.value === activity.category);
            const sub = cat?.subcategories.find(s => s.label === activity.subcategory);
            if (!sub || !sub.potentialParticipants || sub.potentialParticipants.length === 0) return null;
            const groupedByTag: Record<string, PotentialParticipant[]> = {};
            for (const p of sub.potentialParticipants) {
              if (!groupedByTag[p.tag]) groupedByTag[p.tag] = [];
              groupedByTag[p.tag].push(p);
            }
            return (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                  <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                    <span className="w-1 h-3 bg-blue-500 rounded-full"></span>
                    潜在参与者 ({sub.potentialParticipants.length})
                  </h3>
                </div>
                <div className="p-4 space-y-4">
                  <p className="text-xs text-gray-500 leading-relaxed bg-blue-50 p-3 rounded-xl border border-blue-100">
                    以下居民根据标签匹配，可能对本次活动感兴趣，您可以考虑专门通知他们。
                  </p>
                  {Object.entries(groupedByTag).map(([tag, people]) => (
                    <div key={tag}>
                      <div className="flex items-center gap-2 mb-2.5">
                        <Badge className="bg-blue-600 text-white border-0 text-[11px] px-2.5 py-0.5 rounded-full">
                          <Tag className="w-3 h-3 mr-1" />{tag}
                        </Badge>
                        <span className="text-[11px] text-gray-400">{people.length} 人</span>
                      </div>
                      <div className="space-y-2">
                        {people.map(p => (
                          <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {p.name[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-gray-900 block">{p.name}</span>
                              <span className="text-xs text-gray-400">{p.address}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Timeline (Application Mode) */}
          {mode === 'application' && (
            <div className="bg-white p-4 rounded-2xl border border-gray-100">
              <h3 className="font-bold text-sm text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-3 bg-orange-500 rounded-full"></span>
                审批记录
              </h3>
              <div className="space-y-0 pl-2">
                {activity.timeline.map((item, index) => (
                  <div key={index} className="flex gap-3 pb-5 relative last:pb-0">
                    {index !== activity.timeline.length - 1 && (
                      <div className="absolute left-[5px] top-3 bottom-0 w-0.5 bg-gray-100"></div>
                    )}
                    <div className={cn(
                      "w-3 h-3 rounded-full mt-1 shrink-0 z-10 ring-2 ring-white",
                      item.action === 'reject' ? "bg-red-500" :
                      item.action === 'approve' ? "bg-emerald-500" :
                      item.action === 'create' || item.action === 'modify' ? "bg-blue-500" : "bg-gray-300"
                    )} />
                    <div className="flex-1 -mt-0.5">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-medium text-gray-900">
                          {item.action === 'create' && '提交申请'}
                          {item.action === 'modify' && '修改重提'}
                          {item.action === 'approve' && '审批通过'}
                          {item.action === 'reject' && '审批驳回'}
                          {item.action === 'start' && '开始活动'}
                          {item.action === 'finish' && '结束活动'}
                          {item.action === 'cancel' && '取消活动'}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400 mb-1">
                        {item.operatorName} · {item.timestamp.split(' ')[0]}
                      </div>
                      {item.comment && (
                        <div className="text-xs bg-gray-50 text-gray-600 p-2.5 rounded-lg border border-gray-100 leading-relaxed">
                          {item.comment}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="bg-white border-t border-gray-100 p-4 safe-area-bottom flex gap-3 z-20 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        {mode === 'application' && activity.approvalStatus === 'rejected' && (
          <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold shadow-md shadow-blue-600/20" onClick={() => onRouteChange(`activity-form?edit=${activity.id}`)}>
            <Edit3 className="w-4 h-4 mr-2" />
            修改并重新提交
          </Button>
        )}

        {activity.approvalStatus === 'pending' && (
          <Button disabled className="w-full h-12 bg-gray-100 text-gray-400 rounded-xl font-bold">
            审批中（不可撤回）
          </Button>
        )}

        {activity.approvalStatus === 'approved' && activity.executionStatus === 'to_start' && (
          <Button
            variant="outline"
            className="w-full h-12 text-red-500 border-red-200 hover:bg-red-50 rounded-xl font-bold"
            onClick={() => setIsCancelDialogOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            取消活动
          </Button>
        )}

        {mode === 'execution' && activity.approvalStatus === 'approved' && activity.executionStatus === 'in_progress' && (
          <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold shadow-md shadow-blue-600/20" onClick={() => toast.success('活动已结束')}>
            结束活动
          </Button>
        )}

        {mode === 'application' && activity.approvalStatus === 'approved' && activity.executionStatus === 'in_progress' && (
          <Button disabled className="w-full h-12 bg-emerald-50 text-emerald-600 rounded-xl font-bold">
            活动进行中
          </Button>
        )}

        {(activity.executionStatus === 'ended' || activity.executionStatus === 'cancelled') && (
          <Button disabled className="w-full h-12 bg-gray-100 text-gray-400 rounded-xl font-bold">
            活动已{activity.executionStatus === 'ended' ? '结束' : '取消'}
          </Button>
        )}
      </div>

      {/* Cancel Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="w-[90%] rounded-2xl">
          <DialogHeader>
            <DialogTitle>确认取消活动？</DialogTitle>
            <DialogDescription>取消后无法恢复，需要重新申请。</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-center">
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)} className="flex-1 rounded-xl">暂不取消</Button>
            <Button variant="destructive" onClick={handleCancelActivity} className="flex-1 rounded-xl">确认取消</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resident Picker Drawer */}
      <Drawer open={isResidentDrawerOpen} onOpenChange={setIsResidentDrawerOpen}>
        <DrawerContent className="h-[85vh]">
          <DrawerHeader className="border-b border-gray-100">
            <DrawerTitle className="text-base">关联参与居民</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 py-4 flex flex-col h-full">
            <Input
              placeholder="搜索姓名或房号..."
              value={residentSearch}
              onChange={e => setResidentSearch(e.target.value)}
              className="mb-4 rounded-lg"
            />
            <ScrollArea className="flex-1 -mx-4 px-4">
              <div className="space-y-2">
                {filteredResidents.map(resident => {
                  const isSelected = selectedResidents.includes(resident.id);
                  return (
                    <div
                      key={resident.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer",
                        isSelected ? "bg-blue-50 border-blue-200" : "bg-white border-gray-100"
                      )}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedResidents(prev => prev.filter(id => id !== resident.id));
                        } else {
                          setSelectedResidents(prev => [...prev, resident.id]);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                          {resident.name[0]}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{resident.name}</div>
                          <div className="text-xs text-gray-400">{resident.address}</div>
                        </div>
                      </div>
                      <Checkbox checked={isSelected} />
                    </div>
                  );
                })}
                {filteredResidents.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">未找到相关居民</div>
                )}
              </div>
            </ScrollArea>
            <div className="pt-4 mt-auto border-t border-gray-100 flex gap-3">
              <DrawerClose asChild>
                <Button variant="outline" className="flex-1 rounded-xl">取消</Button>
              </DrawerClose>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-xl" onClick={handleSaveResidents}>确认 ({selectedResidents.length})</Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
