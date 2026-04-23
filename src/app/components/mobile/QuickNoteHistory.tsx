import { ChevronLeft, Calendar, User, MapPin, Tag, Clock } from 'lucide-react';
import { MobileStatusBar } from './MobileStatusBar';

interface QuickNoteHistoryProps {
  onBack: () => void;
}

export function QuickNoteHistory({ onBack }: QuickNoteHistoryProps) {
  // Mock data for history timeline
  const historyData = [
    {
      id: 1,
      date: '2026-01-06',
      items: [
        {
          id: 101,
          time: '14:30',
          content: '走访海梦苑1号楼1单元101室，李大爷反映暖气不热，已联系物业维修。',
          tags: ['民情日志', '物业维修'],
          person: '李大爷',
          address: '海梦苑1-1-101',
          images: []
        },
        {
          id: 102,
          time: '10:15',
          content: '巡查小区环境，发现3号楼下有乱堆乱放现象，已协调清理。',
          tags: ['安全隐患', '环境卫生'],
          person: null,
          address: '海梦苑3号楼周边',
          images: ['img1']
        }
      ]
    },
    {
      id: 2,
      date: '2026-01-05',
      items: [
        {
          id: 201,
          time: '16:45',
          content: '入户核实流动人口信息，新增租户张三一家三口。',
          tags: ['信息采集', '流动人口'],
          person: '张三',
          address: '海梦苑5-2-302',
          images: []
        }
      ]
    },
    {
      id: 3,
      date: '2026-01-03',
      items: [
        {
          id: 301,
          time: '09:20',
          content: '探访独居老人王奶奶，送去米面油，老人身体状况良好。',
          tags: ['关爱服务', '独居老人'],
          person: '王奶奶',
          address: '海梦苑2-1-102',
          images: ['img2', 'img3']
        }
      ]
    }
  ];

  return (
    <div className="h-full bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <MobileStatusBar variant="light" />
        <div className="px-4 py-3 flex items-center justify-between">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full active:scale-95 transition-transform"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">历史走访记录</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6">
          {historyData.map((day) => (
            <div key={day.id}>
              {/* Date Header */}
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {day.date}
                </div>
                <div className="h-px bg-gray-200 flex-1"></div>
              </div>

              {/* Timeline Items */}
              <div className="space-y-4 pl-2">
                {day.items.map((item) => (
                  <div key={item.id} className="relative pl-6 border-l-2 border-gray-200 last:border-l-0 pb-2">
                    {/* Timeline Dot */}
                    <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white"></div>
                    
                    {/* Content Card */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 active:scale-[0.99] transition-transform">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {item.time}
                        </div>
                        <div className="flex gap-1">
                          {item.tags.map((tag, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px]">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="text-gray-800 text-sm leading-relaxed mb-3">
                        {item.content}
                      </div>

                      {(item.person || item.address) && (
                        <div className="bg-gray-50 rounded-lg p-2 space-y-1">
                          {item.person && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium">
                              <User className="w-3 h-3 text-blue-500" />
                              {item.person}
                            </div>
                          )}
                          {item.address && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              {item.address}
                            </div>
                          )}
                        </div>
                      )}

                      {item.images.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {item.images.map((img, idx) => (
                            <div key={idx} className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                              图片
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
