import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  MapPin,
  Clock,
  Calendar,
  Flag,
  CheckCircle2,
  Clock3,
  XCircle,
  AlertCircle,
  PlayCircle,
  Sprout,
  HeartHandshake,
  Megaphone,
  Wrench,
  Trophy,
  Music,
  Film,
  Scissors,
  Users,
  ChevronRight
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { MobileLayout } from './MobileLayout';
import { MOCK_ACTIVITIES, Activity } from '../../data/activities';

interface MobileActivityProps {
  onRouteChange: (route: string) => void;
  onExitMobile?: () => void;
}

export function MobileActivity({ onRouteChange, onExitMobile }: MobileActivityProps) {
  const [activeTab, setActiveTab] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');

  const CURRENT_USER_ID = 'u1';

  const filteredActivities = useMemo(() => {
    let filtered = [...MOCK_ACTIVITIES];

    if (activeTab === 'grid') {
      filtered = filtered.filter(a => a.approvalStatus === 'approved');
    } else {
      filtered = filtered.filter(a => a.creatorId === CURRENT_USER_ID);
    }

    if (searchQuery) {
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      if (activeTab === 'grid') {
        const statusOrder: Record<string, number> = { 'in_progress': 0, 'to_start': 1, 'ended': 2, 'cancelled': 3 };
        const scoreA = statusOrder[a.executionStatus] ?? 99;
        const scoreB = statusOrder[b.executionStatus] ?? 99;
        if (scoreA !== scoreB) return scoreA - scoreB;
        return new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime();
      } else {
        const statusOrder: Record<string, number> = { 'rejected': 0, 'pending': 1, 'approved': 2 };
        const scoreA = statusOrder[a.approvalStatus] ?? 99;
        const scoreB = statusOrder[b.approvalStatus] ?? 99;
        if (scoreA !== scoreB) return scoreA - scoreB;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

    return filtered;
  }, [activeTab, searchQuery]);

  const getStatusConfig = (activity: Activity) => {
    if (activeTab === 'grid') {
      switch (activity.executionStatus) {
        case 'in_progress': return { label: '进行中', icon: PlayCircle, bg: 'bg-emerald-500', dot: 'bg-emerald-400', pulse: true };
        case 'to_start': return { label: '待开始', icon: Clock, bg: 'bg-blue-500', dot: 'bg-blue-400', pulse: false };
        case 'ended': return { label: '已结束', icon: CheckCircle2, bg: 'bg-gray-400', dot: 'bg-gray-300', pulse: false };
        case 'cancelled': return { label: '已取消', icon: XCircle, bg: 'bg-gray-400', dot: 'bg-gray-300', pulse: false };
        default: return { label: '未知', icon: Clock, bg: 'bg-gray-400', dot: 'bg-gray-300', pulse: false };
      }
    } else {
      switch (activity.approvalStatus) {
        case 'pending': return { label: '审批中', icon: Clock3, bg: 'bg-amber-500', dot: 'bg-amber-400', pulse: true };
        case 'rejected': return { label: '未通过', icon: AlertCircle, bg: 'bg-red-500', dot: 'bg-red-400', pulse: false };
        case 'approved': {
          if (activity.executionStatus === 'in_progress') return { label: '已通过·进行中', icon: PlayCircle, bg: 'bg-emerald-500', dot: 'bg-emerald-400', pulse: true };
          if (activity.executionStatus === 'ended') return { label: '已通过·已结束', icon: CheckCircle2, bg: 'bg-gray-400', dot: 'bg-gray-300', pulse: false };
          return { label: '已通过', icon: CheckCircle2, bg: 'bg-blue-500', dot: 'bg-blue-400', pulse: false };
        }
        default: return { label: '未知', icon: Clock, bg: 'bg-gray-400', dot: 'bg-gray-300', pulse: false };
      }
    }
  };

  const getCategoryStyle = (subcategory: string) => {
    switch (subcategory) {
      case '环境整治': return { icon: Sprout, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' };
      case '助老扶弱': return { icon: HeartHandshake, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100' };
      case '政策宣传': return { icon: Megaphone, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' };
      case '便民服务': return { icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' };
      case '趣味运动会': return { icon: Trophy, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-100' };
      case '社区音乐会': return { icon: Music, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' };
      case '露天电影': return { icon: Film, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' };
      case '手工制作': return { icon: Scissors, color: 'text-pink-500', bg: 'bg-pink-50', border: 'border-pink-100' };
      default: return { icon: Calendar, color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-100' };
    }
  };

  const getTypeLabel = (activity: Activity) => {
    return activity.category === 'volunteer' ? '志愿服务' : '文娱活动';
  };

  return (
    <MobileLayout currentRoute="activity" onRouteChange={onRouteChange} onExitMobile={onExitMobile} title="活动组织">
      <div className="bg-gray-50 h-full flex flex-col">
        {/* Header Area */}
        <div className="bg-white sticky top-0 z-10">
          {/* Search + Add */}
          <div className="px-4 pt-3 pb-2 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder={activeTab === 'grid' ? "搜索活动名称或地点..." : "搜索我的申请..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 h-9 text-sm bg-gray-50 border-gray-200 focus-visible:bg-white focus-visible:border-blue-500 transition-all rounded-lg w-full"
              />
            </div>
            <button
              className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/25 active:scale-90 transition-transform shrink-0"
              onClick={() => onRouteChange('activity-form')}
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="grid" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full flex h-10 bg-transparent p-0 border-b border-gray-100">
              <TabsTrigger
                value="grid"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:shadow-none text-gray-400 font-medium text-sm transition-colors bg-transparent"
              >
                本网格活动
              </TabsTrigger>
              <TabsTrigger
                value="my"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:shadow-none text-gray-400 font-medium text-sm transition-colors bg-transparent"
              >
                我的申请
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-20">
          {filteredActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <Flag className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-400">暂无相关活动</p>
              <p className="text-xs text-gray-300 mt-1">点击右上角 + 发起新活动</p>
            </div>
          ) : (
            filteredActivities.map(activity => {
              const status = getStatusConfig(activity);
              const catStyle = getCategoryStyle(activity.subcategory);
              const StatusIcon = status.icon;
              const CatIcon = catStyle.icon;

              return (
                <div
                  key={activity.id}
                  className="bg-white rounded-2xl overflow-hidden active:scale-[0.98] transition-all cursor-pointer shadow-sm border border-gray-100/80"
                  onClick={() => {
                    const mode = activeTab === 'grid' ? 'execution' : 'application';
                    onRouteChange(`activity-detail/${activity.id}?mode=${mode}`);
                  }}
                >
                  {/* Top: Status Indicator Bar */}
                  <div className={`h-1 ${status.bg}`} />

                  <div className="p-4">
                    {/* Row 1: Title + Status */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-10 h-10 rounded-xl ${catStyle.bg} ${catStyle.border} border flex items-center justify-center shrink-0`}>
                          <CatIcon className={`w-5 h-5 ${catStyle.color}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-gray-900 text-[15px] line-clamp-1 leading-tight">{activity.title}</h3>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[11px] text-gray-400">{getTypeLabel(activity)}</span>
                            <span className="text-gray-200">·</span>
                            <span className="text-[11px] text-gray-400">{activity.subcategory}</span>
                          </div>
                        </div>
                      </div>
                      <div className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium text-white ${status.bg}`}>
                        {status.pulse && <span className="relative flex h-1.5 w-1.5"><span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${status.dot} opacity-75`}></span><span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${status.dot}`}></span></span>}
                        {status.label}
                      </div>
                    </div>

                    {/* Row 2: Meta Info */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-300" />
                        <span>{activity.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-300" />
                        <span>{activity.startTime}-{activity.endTime}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-gray-300" />
                        <span>{activity.expectedParticipants}人</span>
                      </div>
                    </div>

                    {/* Row 3: Location + Arrow */}
                    <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-gray-50">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="line-clamp-1">{activity.location}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
