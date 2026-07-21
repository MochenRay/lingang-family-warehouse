import { useEffect, useState } from 'react';
import { Calendar, FileText, Download, Eye, Share2 } from 'lucide-react';
import { MobileDetailHeader } from './MobileDetailHeader';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { noticeRepository, type NoticeRecord } from '../../services/repositories/noticeRepository';
import { toast } from 'sonner';

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
    <div className="h-full bg-[var(--color-neutral-01)] flex flex-col overflow-hidden text-white">
      {/* 顶部导航 */}
      <MobileDetailHeader
        title="通知详情"
        onBack={onBack}
        action={
          <button aria-label="分享" className="text-white/90 active:opacity-70" onClick={() => toast.info('分享功能为演示占位，暂未开放')}>
            <Share2 className="w-5 h-5" />
          </button>
        }
      />

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[var(--color-neutral-01)] to-[var(--color-neutral-00)]">
        <div className="p-5 pb-24">
          {/* 标题区 */}
          <div className="mb-6 border-b border-[var(--color-neutral-03)] pb-4">
             {/* 标题 */}
             <h1 className="text-xl font-bold text-white leading-snug text-justify tracking-wide mb-4">
               {notice?.title ?? '通知详情'}
             </h1>
             
             {/* 标签 + 作者 */}
             <div className="flex items-center gap-2 mb-3">
               <Badge variant="outline" className="text-[var(--color-status-warning-text)] border-[var(--color-status-warning)]/50 bg-[var(--color-status-warning-soft)] px-2 py-0.5 text-xs font-normal shrink-0 rounded-full h-auto">
                 {notice?.type ?? '通知'}
               </Badge>
               <span className="text-xs text-[var(--color-brand-text)] bg-[var(--color-brand-primary-hover)]/20 border border-[var(--color-brand-primary-hover)]/30 px-2 py-0.5 rounded">
                 {notice?.department ?? '蓬莱区社会治理现代化指挥中心'}
               </span>
             </div>

             {/* 时间 + 阅读量 */}
             <div className="flex items-center justify-between text-xs text-[var(--color-neutral-08)]">
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
            className="prose prose-sm prose-invert max-w-none text-[var(--color-neutral-10)] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: (notice?.content ?? '暂无公告内容').replace(/\n/g, '<br />') }}
          />

          {/* 附件区域 */}
          {notice?.attachments && notice.attachments.length > 0 && (
            <div className="mt-8 pt-6 border-t border-[var(--color-neutral-03)]">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-white" />
                <h3 className="text-sm font-bold text-white">附件下载 ({notice.attachments.length})</h3>
              </div>
              <div className="space-y-3">
                {notice.attachments.map((file, index) => (
                  <Card key={index} className="bg-[var(--color-neutral-02)] border-[var(--color-neutral-03)] shadow-none active:bg-[var(--color-neutral-03)] transition-colors cursor-pointer">
                    <div className="p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[var(--color-status-error-soft)] flex items-center justify-center shrink-0">
                         <span className="text-[10px] font-bold text-[var(--color-status-error-text)] uppercase">
                           {file.name.split('.').pop()}
                         </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--color-neutral-10)] truncate mb-0.5">{file.name}</p>
                        <p className="text-xs text-[var(--color-neutral-08)]">{file.size}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="text-[var(--color-brand-text)] hover:bg-[var(--color-neutral-03)]">
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
      <div className="bg-[var(--color-neutral-01)] border-t border-[var(--color-neutral-03)] p-4 safe-area-bottom sticky bottom-0 z-20">
        <Button className="w-full bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-hover)] text-white text-base h-11 shadow-lg shadow-blue-900/20 border-0">
          确认收到并阅读
        </Button>
      </div>
    </div>
  );
}
