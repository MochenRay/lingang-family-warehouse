import { useState } from 'react';
import { ChevronLeft, Flashlight, Image as ImageIcon, Scan, Text } from 'lucide-react';
import { MobileStatusBar } from './MobileStatusBar';
import { toast } from 'sonner';

interface MobileScanProps {
  onBack: () => void;
  onResult?: (result: string, type: 'person' | 'house' | 'ocr') => void;
}

export function MobileScan({ onBack, onResult }: MobileScanProps) {
  const [mode, setMode] = useState<'scan' | 'ocr'>('scan');
  const [flashlight, setFlashlight] = useState(false);

  const handleSampleResult = (result: string, type: 'person' | 'house' | 'ocr', message: string) => {
    toast.success(message);
    onResult?.(result, type);
  };

  return (
    <div className="h-full bg-black flex flex-col relative overflow-hidden">
      {/* 摄像头背景模拟 */}
      <div className="absolute inset-0 z-0 bg-gray-800">
        {/* 这里可以使用真实的 Camera API，但在演示中我们用静态图或者深灰色背景代替 */}
        <div className="w-full h-full opacity-30 bg-[url('https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=600&auto=format&fit=crop')] bg-cover bg-center"></div>
      </div>

      {/* 顶部栏 - 透明 */}
      <div className="relative z-20 pt-2">
        <MobileStatusBar variant="light" />
        <div className="h-11 flex items-center justify-between px-4 mt-2">
          <button 
            onClick={onBack}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-md active:bg-black/40"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="text-white font-medium text-lg">
            {mode === 'scan' ? '扫一扫' : 'OCR识别'}
          </div>
          <button 
            onClick={() => toast.info('当前入口以现场扫码核验为主，相册导入暂未开放。')}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-md active:bg-black/40"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 中间扫描区域 */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* 上半遮罩 */}
        <div className="flex-1 bg-black/50 backdrop-blur-[1px]"></div>
        
        <div className="flex h-72">
          {/* 左遮罩 */}
          <div className="flex-1 bg-black/50 backdrop-blur-[1px]"></div>
          
          {/* 扫描框 */}
          <div className="w-72 h-72 relative border border-white/30 rounded-lg overflow-hidden">
            {/* 四角装饰 */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-500 rounded-tl-sm"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-500 rounded-tr-sm"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-500 rounded-bl-sm"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-500 rounded-br-sm"></div>

            {/* 扫描线动画 */}
            <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_10px_rgba(59,130,246,0.5)] animate-scan"></div>

            {/* 提示文字 */}
            <div className="absolute bottom-4 left-0 right-0 text-center text-white/70 text-xs">
              {mode === 'scan' ? '对准二维码即可核验，也可使用下方样例入口直接验证落点' : '可先用样例入口查看 OCR 识别后的回填链路'}
            </div>
          </div>
          
          {/* 右遮罩 */}
          <div className="flex-1 bg-black/50 backdrop-blur-[1px]"></div>
        </div>

        {/* 下半遮罩 */}
        <div className="flex-1 bg-black/50 backdrop-blur-[1px] flex flex-col items-center pt-8">
          <div className="w-full max-w-[280px] mb-6 px-4">
            <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md p-3 text-white/80">
              <p className="text-xs leading-5">
                当前页用于演示扫码核验的落点。正式识别结果会跳回居民、房屋或采集页继续处理。
              </p>
              <div className="mt-3 grid grid-cols-1 gap-2">
                {mode === 'scan' ? (
                  <>
                    <button
                      onClick={() => handleSampleResult('p_hero_061', 'person', '已识别居民二维码，正在打开居民详情')}
                      className="rounded-xl bg-white/10 px-3 py-2 text-left text-sm text-white hover:bg-white/20 transition-colors"
                    >
                      居民二维码样例
                    </button>
                    <button
                      onClick={() => handleSampleResult('h_hero_008', 'house', '已识别房屋二维码，正在打开房屋详情')}
                      className="rounded-xl bg-white/10 px-3 py-2 text-left text-sm text-white hover:bg-white/20 transition-colors"
                    >
                      房屋二维码样例
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleSampleResult('collect-person', 'ocr', '已打开证件识别后的信息采集入口')}
                    className="rounded-xl bg-white/10 px-3 py-2 text-left text-sm text-white hover:bg-white/20 transition-colors"
                  >
                    证件 OCR 样例
                  </button>
                )}
              </div>
            </div>
          </div>

           {/* 手电筒开关 */}
           <button 
             onClick={() => setFlashlight(!flashlight)}
             className="flex flex-col items-center gap-2 mb-8 group"
           >
             <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${flashlight ? 'bg-white text-gray-900' : 'bg-white/10 text-white'}`}>
               <Flashlight className={`w-5 h-5 ${flashlight ? 'fill-current' : ''}`} />
             </div>
             <span className="text-white/60 text-xs group-hover:text-white">轻触照亮</span>
           </button>
        </div>
      </div>

      {/* 底部功能切换 */}
      <div className="relative z-20 bg-black/80 pb-8 pt-4">
        <div className="flex items-center justify-center gap-12">
          <button 
            onClick={() => setMode('scan')}
            className={`flex flex-col items-center gap-1 transition-colors ${mode === 'scan' ? 'text-blue-500' : 'text-white/50'}`}
          >
            <Scan className="w-6 h-6" />
            <span className="text-xs font-medium">扫码</span>
          </button>
          
          <button 
            onClick={() => setMode('ocr')}
            className={`flex flex-col items-center gap-1 transition-colors ${mode === 'ocr' ? 'text-blue-500' : 'text-white/50'}`}
          >
            <Text className="w-6 h-6" />
            <span className="text-xs font-medium">OCR识别</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}</style>
    </div>
  );
}
