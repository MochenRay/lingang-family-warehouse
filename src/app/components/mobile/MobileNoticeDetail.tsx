import { ChevronLeft, Calendar, FileText, Download, Eye, Share2 } from 'lucide-react';
import { MobileStatusBar } from './MobileStatusBar';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';

interface MobileNoticeDetailProps {
  onBack: () => void;
}

export function MobileNoticeDetail({ onBack }: MobileNoticeDetailProps) {
  // Mock 数据：一篇正式的通知公告
  const notice = {
    title: '关于开展家庭数仓2026年度第一季度信息核查工作的通知',
    department: '临港区社会治理现代化指挥中心',
    date: '2026-01-07',
    views: 1258,
    type: '重要通知',
    content: `
      <p class="mb-4 indent-8">各街道、社区（村）网格工作站：</p>
      <p class="mb-4 indent-8 text-justify">为进一步夯实基层治理数据基础，提升家庭数仓数据的准确性和鲜活性，经区社会治理现代化指挥中心研究决定，在全区范围内开展2026年度第一季度基础信息核查攻坚行动。现将有关事项通知如下：</p>
      
      <h3 class="font-bold text-lg mb-2 mt-6 text-white">一、工作时间</h3>
      <p class="mb-4 text-justify">2026年1月8日至1月20日。</p>

      <h3 class="font-bold text-lg mb-2 mt-6 text-white">二、核查范围</h3>
      <p class="mb-4 text-justify">全区各街道、社区（村）所辖网格内的实有人口、实有房屋、实有单位及相关关联数据。</p>

      <h3 class="font-bold text-lg mb-2 mt-6 text-white">三、重点任务</h3>
      <p class="mb-2 font-semibold text-blue-300">（一）人房关联核验</p>
      <p class="mb-4 text-justify">重点对“人户分离”、“空挂户”进行清理，确保“房-户-人”关系一致率达到98%以上。对出租房屋居住人员信息进行全面补录。</p>
      
      <p class="mb-2 font-semibold text-blue-300">（二）流动人口动态更新</p>
      <p class="mb-4 text-justify">以网格为单位，对辖区内流动人口进行拉网式排查，重点核实居住地、工作单位、联系方式等信息，做到“底数清、情况明”。</p>

      <p class="mb-2 font-semibold text-blue-300">（三）特殊人群走访关爱</p>
      <p class="mb-4 text-justify">结合信息核查，对辖区内独居老人、残疾人、低保户等特殊群体进行一次入户走访，更新健康状况及服务需求标签。</p>

      <h3 class="font-bold text-lg mb-2 mt-6 text-white">四、工作要求</h3>
      <p class="mb-4 indent-8 text-justify">各网格员要严格落实“入户见人”要求，充分利用移动采集端OCR识别、扫码录入等功能，提高采集效率。对于核查中发现的疑难问题，要及时上报街道指挥中心协调解决。</p>
      
      <p class="mb-8 indent-8 text-justify">本次核查工作将纳入第一季度网格化绩效考核，请各单位高度重视，确保按时保质完成任务。</p>

      <div class="flex justify-end mt-8">
        <div class="text-right">
          <p class="font-semibold mb-1 text-white">临港区社会治理现代化指挥中心</p>
          <p class="text-gray-400 text-sm">2026年1月7日</p>
        </div>
      </div>
    `,
    attachments: [
      { name: '附件1：2026年第一季度信息核查指标说明.pdf', size: '1.2MB' },
      { name: '附件2：特殊人群走访记录表模板.docx', size: '458KB' }
    ]
  };

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
               {notice.title}
             </h1>
             
             {/* 标签 + 作者 */}
             <div className="flex items-center gap-2 mb-3">
               <Badge variant="outline" className="text-orange-400 border-orange-400/50 bg-orange-400/10 px-2 py-0.5 text-xs font-normal shrink-0 rounded-full h-auto">
                 {notice.type}
               </Badge>
               <span className="text-xs text-blue-300 bg-[#3b82f6]/20 border border-[#3b82f6]/30 px-2 py-0.5 rounded">
                 {notice.department}
               </span>
             </div>

             {/* 时间 + 阅读量 */}
             <div className="flex items-center justify-between text-xs text-gray-400">
               <div className="flex items-center gap-1.5">
                 <Calendar className="w-3.5 h-3.5 opacity-70" />
                 <span>{notice.date}</span>
               </div>
               <div className="flex items-center gap-1.5">
                 <Eye className="w-3.5 h-3.5 opacity-70" />
                 <span>{notice.views} 阅读</span>
               </div>
             </div>
          </div>

          {/* 正文内容 */}
          <div 
            className="prose prose-sm prose-invert max-w-none text-gray-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: notice.content }}
          />

          {/* 附件区域 */}
          {notice.attachments && notice.attachments.length > 0 && (
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
