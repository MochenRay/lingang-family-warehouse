import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ChevronLeft, Info, MapPin, Calendar, Users, FileText, Tag, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { MobileStatusBar } from './MobileStatusBar';
import { toast } from 'sonner';
import { CATEGORY_OPTIONS, MOCK_ACTIVITIES, Activity, SubcategoryOption } from '../../data/activities';
import { Badge } from '../ui/badge';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose, DrawerFooter } from '../ui/drawer';
import { ScrollArea } from '../ui/scroll-area';

interface MobileActivityFormProps {
  onBack: () => void;
  editId?: string;
}

type ActivityFormData = {
  title: string;
  category: string;
  subcategory: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  expectedParticipants: number;
  description: string;
  applicationDetails: string;
};

export function MobileActivityForm({ onBack, editId }: MobileActivityFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [prediction, setPrediction] = useState<{ count: number; text: string } | null>(null);
  const [selectedSub, setSelectedSub] = useState<SubcategoryOption | null>(null);
  const [showParticipants, setShowParticipants] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<ActivityFormData>();

  useEffect(() => {
    if (editId) {
      const activity = MOCK_ACTIVITIES.find(a => a.id === editId);
      if (activity) {
        setValue('title', activity.title);
        setValue('category', activity.category);
        setSelectedCategory(activity.category);
        setTimeout(() => {
            setValue('subcategory', activity.subcategory);
            setSelectedSubcategory(activity.subcategory);
        }, 0);
        setValue('date', activity.date);
        setValue('startTime', activity.startTime);
        setValue('endTime', activity.endTime);
        setValue('location', activity.location);
        setValue('expectedParticipants', activity.expectedParticipants);
        setValue('description', activity.description || '');
        setValue('applicationDetails', activity.applicationDetails || '');
      }
    }
  }, [editId, setValue]);

  const handleCategoryChange = (val: string) => {
    setSelectedCategory(val);
    setValue('category', val);
    setValue('subcategory', '');
    setSelectedSubcategory('');
    setPrediction(null);
    setSelectedSub(null);
    setShowParticipants(false);
  };

  const handleSubcategoryChange = (val: string) => {
    setSelectedSubcategory(val);
    setValue('subcategory', val);
    const category = CATEGORY_OPTIONS.find(c => c.value === selectedCategory);
    const sub = category?.subcategories.find(s => s.value === val);
    if (sub) {
      setSelectedSub(sub);
      setShowParticipants(false);
      const tagText = sub.matchedTags.map(t => `「${t}」`).join('、');
      setPrediction({
        count: sub.predictedCount,
        text: `根据活动类型，系统认为拥有 ${tagText} 标签的居民更可能愿意参加，共匹配到约 ${sub.predictedCount} 人。但该人数仅供参考，实际能否到场还需考虑时间、地点、天气等因素。`
      });
      const currentCount = watch('expectedParticipants');
      if (!currentCount) {
        setValue('expectedParticipants', sub.predictedCount);
      }
    }
  };

  const onSubmit = (data: ActivityFormData) => {
    setSubmitting(true);
    setTimeout(() => {
      console.log('Submitted:', data);
      toast.success(editId ? '已重新提交审批' : '活动申请已提交，请等待审批');
      setSubmitting(false);
      onBack();
    }, 1500);
  };

  const currentCategoryOptions = CATEGORY_OPTIONS.find(c => c.value === selectedCategory)?.subcategories || [];

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <MobileStatusBar variant="dark" />
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="w-8 h-8 -ml-2 flex items-center justify-center text-gray-600 active:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold text-gray-900">{editId ? '修改活动申请' : '发布新活动'}</h1>
          <div className="w-8"></div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 pb-28 space-y-4">

          {/* Section 1: Basic Info */}
          <div className="space-y-4 bg-white p-4 rounded-2xl border border-gray-100">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
              基本信息
            </h3>

            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">活动名称 <span className="text-red-500">*</span></Label>
              <Input
                placeholder="请输入活动名称"
                className="h-10 rounded-lg"
                {...register("title", { required: "请输入活动名称" })}
              />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
               <div className="space-y-1.5">
                 <Label className="text-xs text-gray-500">活动大类 <span className="text-red-500">*</span></Label>
                 <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                   <SelectTrigger className="h-10 rounded-lg">
                     <SelectValue placeholder="选择大类" />
                   </SelectTrigger>
                   <SelectContent>
                     {CATEGORY_OPTIONS.map(opt => (
                       <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>

               <div className="space-y-1.5">
                 <Label className="text-xs text-gray-500">具体类型 <span className="text-red-500">*</span></Label>
                 <Select
                   value={selectedSubcategory}
                   onValueChange={handleSubcategoryChange}
                   disabled={!selectedCategory}
                 >
                   <SelectTrigger className="h-10 rounded-lg">
                     <SelectValue placeholder="选择类型" />
                   </SelectTrigger>
                   <SelectContent>
                     {currentCategoryOptions.map(opt => (
                       <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
            </div>
            <input type="hidden" {...register("category", { required: true })} />
            <input type="hidden" {...register("subcategory", { required: true })} />

            {/* Prediction Card */}
            {prediction && selectedSub && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-4 text-white shadow-lg shadow-blue-600/20">
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center">
                      <Info className="h-3.5 w-3.5 text-blue-200" />
                    </div>
                    <span className="text-sm font-bold">智能预测参考</span>
                    <span className="ml-auto text-2xl font-bold text-white/90">{prediction.count}<span className="text-xs font-normal text-blue-200 ml-0.5">人</span></span>
                  </div>
                  <p className="text-[13px] leading-relaxed text-blue-100/90 mb-3">
                    {prediction.text}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {selectedSub.matchedTags.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 bg-white/15 backdrop-blur-sm text-white text-[11px] px-2.5 py-1 rounded-full border border-white/20">
                        <Tag className="w-3 h-3" />{tag}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="text-xs text-blue-200 font-medium flex items-center gap-1.5 hover:text-white transition-colors active:scale-95"
                    onClick={() => setShowParticipants(true)}
                  >
                    <Users className="w-3.5 h-3.5" />
                    查看匹配居民名单 →
                  </button>
                </div>

                <Drawer open={showParticipants} onOpenChange={setShowParticipants}>
                  <DrawerContent className="max-h-[75vh]">
                    <DrawerHeader className="border-b border-gray-100">
                      <DrawerTitle className="text-base">匹配居民名单（{selectedSub.potentialParticipants.length} 人）</DrawerTitle>
                    </DrawerHeader>
                    <ScrollArea className="px-4 py-4 overflow-y-auto max-h-[55vh]">
                      <div className="space-y-5">
                        {selectedSub.matchedTags.map(tag => {
                          const people = selectedSub.potentialParticipants.filter(p => p.tag === tag);
                          if (people.length === 0) return null;
                          return (
                            <div key={tag}>
                              <div className="flex items-center gap-2 mb-2.5">
                                <Badge className="bg-blue-600 text-white border-0 text-[11px] px-2.5 py-0.5 rounded-full">{tag}</Badge>
                                <span className="text-[11px] text-gray-400">{people.length} 人</span>
                              </div>
                              <div className="space-y-2">
                                {people.map(p => (
                                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                      {p.name[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <span className="text-gray-800 text-sm font-medium block">{p.name}</span>
                                      <span className="text-gray-400 text-xs">{p.address}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                    <DrawerFooter className="border-t border-gray-100">
                      <DrawerClose asChild>
                        <Button variant="outline" className="w-full rounded-xl">关闭</Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              </div>
            )}

            <div className="space-y-1.5">
               <Label className="text-xs text-gray-500">预计人数</Label>
               <div className="relative">
                 <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                 <Input
                   type="number"
                   className="pl-9 h-10 rounded-lg"
                   placeholder="请输入预计参与人数"
                   {...register("expectedParticipants", { valueAsNumber: true })}
                 />
               </div>
            </div>
          </div>

          {/* Section 2: Time & Location */}
          <div className="space-y-4 bg-white p-4 rounded-2xl border border-gray-100">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
              时间地点
            </h3>

            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">活动日期 <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input type="date" className="pl-9 h-10 rounded-lg" {...register("date", { required: true })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <div className="space-y-1.5">
                 <Label className="text-xs text-gray-500">开始时间 <span className="text-red-500">*</span></Label>
                 <div className="relative">
                   <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                   <Input type="time" className="pl-9 h-10 rounded-lg" {...register("startTime", { required: true })} />
                 </div>
               </div>
               <div className="space-y-1.5">
                 <Label className="text-xs text-gray-500">结束时间 <span className="text-red-500">*</span></Label>
                 <div className="relative">
                   <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                   <Input type="time" className="pl-9 h-10 rounded-lg" {...register("endTime", { required: true })} />
                 </div>
               </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">活动地点 <span className="text-red-500">*</span></Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input className="pl-9 h-10 rounded-lg" placeholder="请输入具体地点" {...register("location", { required: true })} />
              </div>
            </div>
          </div>

          {/* Section 3: Details */}
          <div className="space-y-4 bg-white p-4 rounded-2xl border border-gray-100">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
              详细方案
            </h3>

            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">活动简介</Label>
              <Textarea
                placeholder="简要描述活动内容（用于列表展示）"
                className="min-h-[80px] rounded-lg"
                {...register("description")}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">申请详情（审批参考）<span className="text-red-500">*</span></Label>
              <Textarea
                placeholder="请详细说明活动流程、资源需求、预算计划等..."
                className="min-h-[120px] rounded-lg"
                {...register("applicationDetails", { required: "请填写申请详情" })}
              />
              {errors.applicationDetails && <p className="text-xs text-red-500">{errors.applicationDetails.message}</p>}
            </div>
          </div>
        </form>
      </div>

      {/* Fixed Bottom Button */}
      <div className="bg-white border-t border-gray-100 p-4 safe-area-bottom">
        <Button
          type="submit"
          onClick={handleSubmit(onSubmit)}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-base font-bold rounded-xl shadow-md shadow-blue-600/20"
          disabled={submitting}
        >
          {submitting ? '提交中...' : (editId ? '重新提交审批' : '提交活动申请')}
        </Button>
      </div>
    </div>
  );
}
