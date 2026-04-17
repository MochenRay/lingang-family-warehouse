import { useEffect, useState } from 'react';
import { ChevronLeft, Calendar, FileText, Download, Eye, Share2 } from 'lucide-react';
import { MobileStatusBar } from './MobileStatusBar';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { noticeRepository, type NoticeRecord } from '../../services/repositories/noticeRepository';

interface MobileNoticeDetailProps {
  onBack: () => void;
  noticeId: string;
}

export function MobileNoticeDetail({ onBack, noticeId }: MobileNoticeDetailProps) {
  const [notice, setNotice] = useState<NoticeRecord | undefined>();

  useEffect(() => {
    let active = true;
    const load = async () => {
      const detail = await noticeRepository.getNotice(noticeId);
      if (active) {
        setNotice(detail);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [noticeId]);

  return (
    <div className="h-full bg-[#1e293b] flex flex-col overflow-hidden text-white">
      {/* 顶部导航 */}
      <div className="bg-[#1e293b] sticky top-0 z-10">
        <MobileStatusBar variant="dark" />
        <div className="h-11 flex items-center justify-between px-4">
          <button 
            onClick={onBack}
            className="w-8 h-8 flex items-center justify-center -ml-2 text-white/90 active:bg-white/10 rounded-full"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="text-white font-semibold text-lg">通知详情</div>
          <div className="w-8 flex justify-end">
            <button className="text-white/90 active:opacity-70">
               <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#1e293b] to-[#0f172a]">
        <div className="p-5 pb-24">
          {/* 标题区 */}
          <div className="mb-6 border-b border-white/10 pb-4">
             {/* 标题 */}
             <h1 className="text-xl font-bold text-white leading-snug text-justify tracking-wide mb-4">
               {notice?.title ?? '通知详情'}
             </h1>
             
             {/* 标签 + 作者 */}
             <div className="flex items-center gap-2 mb-3">
               <Badge variant="outline" className="text-orange-400 border-orange-400/50 bg-orange-400/10 px-2 py-0.5 text-xs font-normal shrink-0 rounded-full h-auto">
                 {notice?.type ?? '通知'}
               </Badge>
               <span className="text-xs text-blue-300 bg-[#3b82f6]/20 border border-[#3b82f6]/30 px-2 py-0.5 rounded">
                 {notice?.department ?? '临港区社会治理现代化指挥中心'}
               </span>
             </div>

             {/* 时间 + 阅读量 */}
             <div className="flex items-center justify-between text-xs text-gray-400">
               <div className="flex items-center gap-1.5">
                 <Calendar className="w-3.5 h-3.5 opacity-70" />
                 <span>{notice?.publishedAt?.slice(0, 10) ?? '--'}</span>
               </div>
               <div className="flex items-center gap-1.5">
                 <Eye className="w-3.5 h-3.5 opacity-70" />
                 <span>{notice?.readCount ?? 0} 阅读</span>
               </div>
             </div>
          </div>

          {/* 正文内容 */}
          <div 
            className="prose prose-sm prose-invert max-w-none text-gray-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: (notice?.content ?? '暂无公告内容').replace(/\n/g, '<br />') }}
          />

          {/* 附件区域 */}
          {notice?.attachments && notice.attachments.length > 0 && (
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-white" />
                <h3 className="text-sm font-bold text-white">附件下载 ({notice.attachments.length})</h3>
              </div>
              <div className="space-y-3">
                {notice.attachments.map((file, index) => (
                  <Card key={index} className="bg-white/5 border-white/10 shadow-none active:bg-white/10 transition-colors cursor-pointer">
                    <div className="p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
                         <span className="text-[10px] font-bold text-red-400 uppercase">
                           {file.name.split('.').pop()}
                         </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-200 truncate mb-0.5">{file.name}</p>
                        <p className="text-xs text-gray-500">{file.size}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="text-blue-400 hover:text-blue-300 hover:bg-white/5">
                        <Download className="w-5 h-5" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="bg-[#1e293b] border-t border-white/5 p-4 safe-area-bottom sticky bottom-0 z-20">
        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-base h-11 shadow-lg shadow-blue-900/20 border-0">
          确认收到并阅读
        </Button>
      </div>
    </div>
  );
}
