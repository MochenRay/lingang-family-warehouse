import { useState, useEffect } from 'react';
import { ChevronLeft, Search, Filter, Bell, Calendar, ChevronRight } from 'lucide-react';
import { MobileStatusBar } from './MobileStatusBar';

interface MobileNoticesProps {
  onBack: () => void;
  onNoticeClick?: () => void;
}

export function MobileNotices({ onBack, onNoticeClick }: MobileNoticesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [notices, setNotices] = useState<any[]>([]);

  // 默认 Mock 数据
  const defaultNotices = [
    { id: 1, title: '关于开展人口信息核查工作的通知', time: '2小时前', type: 'urgent', content: '请各网格员注意，从即日起开展为期一周的人口信息专项核查工作...' },
    { id: 2, title: '系统维护通知：12月21日凌晨1:00-3:00', time: '5小时前', type: 'system', content: '系统将进行例行维护，期间无法访问，请提前做好准备。' },
    { id: 3, title: '关于新增"扫码识房"功能的操作指南', time: '昨天', type: 'guide', content: '为了提高采集效率，系统新增了扫码识房功能，具体操作步骤如下...' },
    { id: 4, title: '12月份优秀网格员名单公示', time: '2天前', type: 'info', content: '经考核评定，以下同志获得12月份优秀网格员称号...' },
    { id: 5, title: '关于防范电信诈骗的宣传任务', time: '3天前', type: 'task', content: '请结合日常走访，向居民普及防范电信诈骗知识...' },
    { id: 6, title: '网格通APP版本更新说明 v2.1.0', time: '1周前', type: 'system', content: '本次更新包含以下内容：1. 优化了地图加载速度...' },
    { id: 7, title: '冬季取暖安全隐患排查通知', time: '1周前', type: 'urgent', content: '随着气温下降，请重点关注辖区内独居老人的取暖安全...' },
  ];

  // 加载通知数据（包含发布的公告）
  useEffect(() => {
    loadNotices();

    // 监听新公告发布事件
    const handleNoticePublished = () => {
      loadNotices();
    };
    window.addEventListener('notice-published', handleNoticePublished);

    return () => {
      window.removeEventListener('notice-published', handleNoticePublished);
    };
  }, []);

  const loadNotices = () => {
    // 从 localStorage 读取发布的公告
    const publishedNotices = JSON.parse(localStorage.getItem('published_notices') || '[]');
    
    // 合并默认通知和发布的公告
    const allNotices = [...publishedNotices, ...defaultNotices];
    
    setNotices(allNotices);
  };

  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'urgent': return { text: '紧急', color: 'bg-red-100 text-red-600' };
      case 'system': return { text: '系统', color: 'bg-blue-100 text-blue-600' };
      case 'guide': return { text: '指南', color: 'bg-green-100 text-green-600' };
      case 'task': return { text: '任务', color: 'bg-orange-100 text-orange-600' };
      default: return { text: '通知', color: 'bg-gray-100 text-gray-600' };
    }
  };

  const filteredNotices = notices.filter(notice => {
    const matchesSearch = notice.title.includes(searchTerm) || notice.content.includes(searchTerm);
    const matchesTab = activeTab === 'all' || notice.type === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* 顶部导航 */}
      <div className="bg-white sticky top-0 z-10 border-b border-gray-100">
        <MobileStatusBar variant="dark" />
        <div className="h-11 flex items-center justify-between px-4">
          <button 
            onClick={onBack}
            className="w-8 h-8 flex items-center justify-center -ml-2 text-gray-700 active:bg-gray-100 rounded-full"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="text-gray-900 font-semibold text-lg">通知公告</div>
          <div className="w-8"></div> {/* 占位，保持标题居中 */}
        </div>

        {/* 搜索栏 */}
        <div className="px-4 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="搜索通知标题或内容"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-4 bg-gray-100 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* 分类Tab */}
        <div className="flex items-center px-4 py-2 gap-2 overflow-x-auto scrollbar-hide">
          {[
            { id: 'all', label: '全部' },
            { id: 'urgent', label: '紧急通知' },
            { id: 'system', label: '系统消息' },
            { id: 'task', label: '工作任务' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 列表区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredNotices.length > 0 ? (
          filteredNotices.map(notice => {
            const badge = getTypeLabel(notice.type);
            return (
              <div 
                key={notice.id} 
                className="bg-white rounded-xl p-4 shadow-sm active:scale-[0.99] transition-transform cursor-pointer"
                onClick={() => onNoticeClick && onNoticeClick()}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className={`px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${badge.color}`}>
                    {badge.text}
                  </div>
                  <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
                    <Calendar className="w-3 h-3" />
                    {notice.time}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-2 leading-tight">
                  {notice.title}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                  {notice.content}
                </p>
                <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400">威海市社会治理中心</span>
                  <div className="flex items-center text-xs text-blue-600 font-medium">
                    查看详情
                    <ChevronRight className="w-3 h-3 ml-0.5" />
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Bell className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm">暂无相关通知</p>
          </div>
        )}
      </div>
    </div>
  );
}