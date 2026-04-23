import { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  Search, 
  Filter, 
  User, 
  Home, 
  CircleAlert, 
  Handshake, 
  Flag, 
  SquareCheck, 
  Clock,
  Ellipsis
} from 'lucide-react';
import { MobileStatusBar } from './MobileStatusBar';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '../ui/dropdown-menu';

interface MobileUpdateHistoryProps {
  onBack: () => void;
}

type RecordType = 'person' | 'house' | 'issue' | 'conflict' | 'activity' | 'task';

interface WorkRecord {
  id: string;
  time: string;
  type: RecordType;
  action: 'add' | 'update' | 'report' | 'mediate' | 'organize' | 'complete';
  title: string;
  desc: string;
  user: string;
  status?: string; // e.g. '已办结', '进行中'
}

interface DailyRecord {
  date: string; // YYYY-MM-DD
  items: WorkRecord[];
}

export function MobileUpdateHistory({ onBack }: MobileUpdateHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<RecordType | 'all'>('all');

  // Mock Data
  const rawData: DailyRecord[] = [
    {
      date: '2026-01-06',
      items: [
        {
          id: '101',
          time: '16:45',
          type: 'task',
          action: 'complete',
          title: '完成待办任务',
          desc: '完成"独居老人张大爷周探访"任务，老人身体状况良好，无特殊需求。',
          user: '李明辉',
          status: '已完成'
        },
        {
          id: '102',
          time: '14:35',
          type: 'house',
          action: 'update',
          title: '更新房屋信息',
          desc: '更新海梦苑1号楼1单元101室居住状态为"自住"，登记车牌号鲁F88***。',
          user: '李明辉'
        },
        {
          id: '103',
          time: '11:20',
          type: 'person',
          action: 'add',
          title: '新增人口信息',
          desc: '新增住户：李四 (3710xxxx...)，关系为"租客"，联系电话 138xxxx1234。',
          user: '李明辉'
        }
      ]
    },
    {
      date: '2026-01-05',
      items: [
        {
          id: '201',
          time: '15:30',
          type: 'conflict',
          action: 'mediate',
          title: '矛盾调解记录',
          desc: '调解海梦苑社区2号楼302与303噪音纠纷，双方达成和解，已签署调解协议。',
          user: '李明辉',
          status: '调解成功'
        },
        {
          id: '202',
          time: '10:00',
          type: 'activity',
          action: 'organize',
          title: '组织社区活动',
          desc: '组织"社区消防安全讲座"，参与人数 45 人，发放宣传资料 100 份。',
          user: '李明辉'
        },
        {
          id: '203',
          time: '09:15',
          type: 'person',
          action: 'update',
          title: '完善人口标签',
          desc: '为王五添加"高龄老人"、"退役军人"标签。',
          user: '李明辉'
        }
      ]
    },
    {
      date: '2026-01-04',
      items: [
        {
          id: '301',
          time: '14:20',
          type: 'issue',
          action: 'report',
          title: '问题上报',
          desc: '发现小区南门井盖破损，存在安全隐患，已上报至市政部门处理。',
          user: '李明辉',
          status: '处理中'
        },
        {
          id: '302',
          time: '09:30',
          type: 'task',
          action: 'complete',
          title: '完成待办任务',
          desc: '完成季度网格巡查任务，重点检查了消防通道占用情况。',
          user: '李明辉',
          status: '已完成'
        }
      ]
    }
  ];

  // Filter and Search Logic
  const filteredData = useMemo(() => {
    return rawData.map(day => ({
      ...day,
      items: day.items.filter(item => {
        const matchesSearch = 
          item.title.includes(searchQuery) || 
          item.desc.includes(searchQuery);
        const matchesFilter = activeFilter === 'all' || item.type === activeFilter;
        return matchesSearch && matchesFilter;
      })
    })).filter(day => day.items.length > 0);
  }, [searchQuery, activeFilter, rawData]);

  const getRecordStyle = (type: RecordType) => {
    switch(type) {
      case 'person': 
        return { icon: User, color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' };
      case 'house': 
        return { icon: Home, color: 'text-indigo-600', bg: 'bg-indigo-100', border: 'border-indigo-200' };
      case 'issue': 
        return { icon: CircleAlert, color: 'text-orange-600', bg: 'bg-orange-100', border: 'border-orange-200' };
      case 'conflict': 
        return { icon: Handshake, color: 'text-purple-600', bg: 'bg-purple-100', border: 'border-purple-200' };
      case 'activity': 
        return { icon: Flag, color: 'text-pink-600', bg: 'bg-pink-100', border: 'border-pink-200' };
      case 'task': 
        return { icon: SquareCheck, color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-200' };
      default: 
        return { icon: Ellipsis, color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200' };
    }
  };

  const getActionLabel = (action: string) => {
    const map: Record<string, string> = {
      add: '新增',
      update: '更新',
      report: '上报',
      mediate: '调解',
      organize: '组织',
      complete: '完成'
    };
    return map[action] || action;
  };

  const filterOptions = [
    { value: 'all', label: '全部' },
    { value: 'person', label: '人口' },
    { value: 'house', label: '房屋' },
    { value: 'issue', label: '问题' },
    { value: 'conflict', label: '纠纷' },
    { value: 'activity', label: '活动' },
    { value: 'task', label: '待办' },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-b from-[var(--color-neutral-01)] to-[var(--color-neutral-02)] border-b border-[var(--color-neutral-03)] sticky top-0 z-10 shrink-0">
        <MobileStatusBar variant="dark" />
        <div className="px-4 py-3 flex items-center gap-3 relative h-11">
          <button 
            onClick={onBack} 
            className="absolute left-2 w-8 h-8 flex items-center justify-center text-[var(--color-neutral-10)] active:opacity-70"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div className="flex-1 flex items-center justify-center">
             <h1 className="text-base font-bold text-[var(--color-neutral-11)]">工作记录</h1>
          </div>
          
          <div className="w-8"></div>
        </div>

        {/* Search & Filter Bar */}
        <div className="px-4 pb-3 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="搜索工作记录..." 
              className="pl-9 bg-[var(--color-neutral-03)] border-transparent text-[var(--color-neutral-10)] placeholder:text-[var(--color-neutral-06)] h-9 text-sm focus-visible:ring-1 focus-visible:ring-blue-500"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                activeFilter !== 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-[var(--color-neutral-03)] text-[var(--color-neutral-10)]'
              }`}>
                <Filter className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-[var(--color-neutral-02)] border-[var(--color-neutral-03)] text-[var(--color-neutral-10)]">
              {filterOptions.map(option => (
                <DropdownMenuItem 
                  key={option.value}
                  onClick={() => setActiveFilter(option.value as any)}
                  className="focus:bg-[var(--color-neutral-03)] focus:text-[var(--color-neutral-11)] cursor-pointer"
                >
                  <span className={activeFilter === option.value ? 'text-blue-500 font-medium' : ''}>
                    {option.label}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <div className="space-y-6 pb-6">
          {filteredData.length > 0 ? (
            filteredData.map((day) => (
              <div key={day.date}>
                <div className="flex items-center gap-3 mb-3 pl-1">
                   <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                   <div className="text-sm font-bold text-gray-500">{day.date}</div>
                   <div className="h-px flex-1 bg-gray-200"></div>
                </div>
                
                <div className="space-y-3 pl-4 border-l-2 border-gray-100 ml-1">
                  {day.items.map((item) => {
                    const style = getRecordStyle(item.type);
                    const Icon = style.icon;
                    return (
                      <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 relative overflow-hidden group active:scale-[0.99] transition-transform">
                        {/* Decorative background accent */}
                        <div className={`absolute top-0 right-0 w-16 h-16 opacity-5 -mr-4 -mt-4 rounded-full ${style.bg.replace('bg-', 'bg-current text-')}`}></div>
                        
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${style.bg} ${style.color} shadow-sm`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-gray-900 text-sm truncate pr-2">{item.title}</span>
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 font-normal ${style.color} ${style.bg} border-0`}>
                              {getActionLabel(item.action)}
                            </Badge>
                          </div>
                          
                          <div className="text-xs text-gray-600 mb-2 line-clamp-2 leading-relaxed">
                            {item.desc}
                          </div>
                          
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                            <div className="flex items-center text-[10px] text-gray-400 gap-3">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {item.time}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {item.user}
                              </span>
                            </div>
                            {item.status && (
                              <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                {item.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
             <div className="flex flex-col items-center justify-center py-20 text-gray-400">
               <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                 <Search className="w-8 h-8 text-gray-300" />
               </div>
               <p className="text-sm">没有找到相关记录</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
