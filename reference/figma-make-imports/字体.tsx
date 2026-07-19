import clsx from "clsx";
type TextProps = {
  text: string;
  additionalClassNames?: string;
};

function Text({ text, additionalClassNames = "" }: TextProps) {
  return (
    <div className={clsx("absolute", additionalClassNames)}>
      <Indicator />
      <div className="absolute bottom-[8px] flex flex-col font-['Inter:Bold','Noto_Sans_JP:Bold',sans-serif] font-bold justify-center leading-[0] left-0 not-italic right-0 text-[#ff1257] text-[10px] text-center tracking-[0.2px] translate-y-[50%]">
        <p className="leading-[16px]">{text}</p>
      </div>
    </div>
  );
}

function Indicator() {
  return (
    <div className="absolute bottom-[20px] h-[9px] left-0 overflow-clip right-0">
      <div className="absolute bg-[#ff1257] h-[9px] left-0 rounded-[0.5px] top-0 w-px" data-name="top-indicator" />
      <div className="absolute bg-[#ff1257] h-[9px] right-0 rounded-[0.5px] top-0 w-px" data-name="bottom-indicator" />
      <div className="absolute bg-[#ff1257] bottom-[4px] h-px left-px right-0" data-name="line" />
    </div>
  );
}

export default function Component() {
  return (
    <div className="bg-white relative size-full" data-name="字体">
      <div className="absolute h-[346px] left-[120px] overflow-clip top-[1594px] w-[1023px]" data-name="编组 38">
        <div className="absolute bg-[#f6f7f8] inset-[32.95%_34.7%_52.02%_0]" data-name="矩形" />
        <div className="absolute bg-[#f1f2f4] inset-[49.13%_92.57%_34.68%_0]" data-name="矩形备份 21" />
        <div className="absolute bg-[#fbfbfc] inset-[49.13%_78.1%_34.68%_7.82%]" data-name="矩形备份 44" />
        <div className="absolute bg-[#fbfbfc] inset-[49.13%_63.64%_34.68%_22.29%]" data-name="矩形备份 47" />
        <div className="absolute bg-[#fbfbfc] inset-[49.13%_49.17%_34.68%_36.75%]" data-name="矩形备份 50" />
        <div className="absolute bg-[#fbfbfc] inset-[49.13%_34.7%_34.68%_51.22%]" data-name="矩形备份 53" />
        <div className="absolute bg-[#fbfbfc] inset-[66.47%_78.1%_17.34%_7.82%]" data-name="矩形备份 45" />
        <div className="absolute bg-[#fbfbfc] inset-[66.47%_63.64%_17.34%_22.29%]" data-name="矩形备份 48" />
        <div className="absolute bg-[#fbfbfc] inset-[66.47%_49.17%_17.34%_36.75%]" data-name="矩形备份 51" />
        <div className="absolute bg-[#fbfbfc] inset-[66.47%_34.7%_17.34%_51.22%]" data-name="矩形备份 54" />
        <div className="absolute bg-[#fbfbfc] inset-[83.82%_78.1%_0_7.82%]" data-name="矩形备份 46" />
        <div className="absolute bg-[#fbfbfc] inset-[83.82%_63.64%_0_22.29%]" data-name="矩形备份 49" />
        <div className="absolute bg-[#fbfbfc] inset-[83.82%_49.17%_0_36.75%]" data-name="矩形备份 52" />
        <div className="absolute bg-[#fbfbfc] inset-[83.82%_34.7%_0_51.22%]" data-name="矩形备份 55" />
        <div className="absolute bg-[#f1f2f4] inset-[66.47%_92.57%_17.34%_0]" data-name="矩形备份 22" />
        <div className="absolute bg-[#f1f2f4] inset-[83.82%_92.57%_0_0]" data-name="矩形备份 43" />
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-0 not-italic right-0 text-[#3c4a61] text-[14px] top-[calc(50%-121px)]">定义不同标题文本的大小、字号、字重、行高。字体颜色为 #0A1B39</p>
        <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[normal] left-[calc(50%-511.5px)] not-italic text-[#0a1c39] text-[20px] text-nowrap top-[calc(50%-173px)]">标题</p>
        <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[32px] left-[calc(50%-487.5px)] not-italic text-[#0a1b39] text-[24px] text-nowrap top-[calc(50%+9px)]">H1</p>
        <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[24px] left-[calc(50%-484.5px)] not-italic text-[#0a1b39] text-[16px] text-nowrap top-[calc(50%+73px)]">H2</p>
        <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[22px] left-[calc(50%-482.5px)] not-italic text-[#0a1b39] text-[14px] text-nowrap top-[calc(50%+134px)]">H3</p>
        <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[32px] left-[calc(50%-407.5px)] not-italic text-[#0a1b39] text-[24px] text-nowrap top-[calc(50%+9px)]">一级标题</p>
        <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[24px] left-[calc(50%-407.5px)] not-italic text-[#0a1b39] text-[16px] text-nowrap top-[calc(50%+73px)]">二级标题</p>
        <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[22px] left-[calc(50%-407.5px)] not-italic text-[#0a1b39] text-[14px] text-nowrap top-[calc(50%+133px)]">三级标题</p>
        <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[32px] left-[calc(50%-239.5px)] not-italic text-[#0a1b39] text-[24px] text-nowrap top-[calc(50%+9px)]">24px</p>
        <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[24px] left-[calc(50%-239.5px)] not-italic text-[#0a1b39] text-[16px] text-nowrap top-[calc(50%+75px)]">16px</p>
        <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[22px] left-[calc(50%-239.5px)] not-italic text-[#0a1b39] text-[14px] text-nowrap top-[calc(50%+133px)]">14px</p>
        <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[32px] left-[calc(50%-85.5px)] not-italic text-[#0a1b39] text-[24px] text-nowrap top-[calc(50%+9px)]">500</p>
        <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[24px] left-[calc(50%-85.5px)] not-italic text-[#0a1b39] text-[16px] text-nowrap top-[calc(50%+73px)]">500</p>
        <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[22px] left-[calc(50%-85.5px)] not-italic text-[#0a1b39] text-[14px] text-nowrap top-[calc(50%+134px)]">500</p>
        <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[32px] left-[calc(50%+70.5px)] not-italic text-[#0a1b39] text-[24px] text-nowrap top-[calc(50%+9px)]">32</p>
        <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[24px] left-[calc(50%+70.5px)] not-italic text-[#0a1b39] text-[16px] text-nowrap top-[calc(50%+75px)]">24</p>
        <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[22px] left-[calc(50%+70.5px)] not-italic text-[#0a1b39] text-[14px] text-nowrap top-[calc(50%+133px)]">22</p>
        <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[22px] left-[calc(50%-239.5px)] not-italic text-[14px] text-[rgba(10,27,57,0.8)] text-nowrap top-[calc(50%-42px)]">字号</p>
        <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[22px] left-[calc(50%-407.5px)] not-italic text-[14px] text-[rgba(10,27,57,0.8)] text-nowrap top-[calc(50%-42px)]">样式</p>
        <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[22px] left-[calc(50%-85.5px)] not-italic text-[14px] text-[rgba(10,27,57,0.8)] text-nowrap top-[calc(50%-42px)]">字重</p>
        <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[22px] left-[calc(50%+70.5px)] not-italic text-[14px] text-[rgba(10,27,57,0.8)] text-nowrap top-[calc(50%-42px)]">行高</p>
      </div>
      <div className="absolute h-[551px] left-[120px] not-italic overflow-clip top-[3008px] w-[744px]" data-name="段落间距">
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-0 right-[3.23%] text-[#3c4a61] text-[14px] top-[calc(50%-223.5px)]">一般需要用到段落间距的地方为正文（14px）及备注（12px），暂定段间距=字号</p>
        <div className="absolute inset-[23.59%_89.65%_61.71%_0] leading-[22px] overflow-clip text-[14px] text-nowrap" data-name="编组 33">
          <p className="absolute font-['PingFang_SC:Medium',sans-serif] left-[calc(50%-38.5px)] text-[#0a1c39] top-[calc(50%-40.5px)]">正文</p>
          <div className="absolute font-['PingFang_SC:Regular',sans-serif] left-[calc(50%-38.5px)] text-[#6d7789] top-[calc(50%-3.5px)]">
            <p className="mb-0">字号 14px</p>
            <p>段间距 14px</p>
          </div>
        </div>
        <div className="absolute inset-[23.59%_0_40.65%_33.6%] leading-[22px] overflow-clip text-[14px]" data-name="编组 34">
          <p className="absolute font-['PingFang_SC:Medium',sans-serif] left-[calc(50%-247px)] text-[#0a1c39] text-nowrap top-[calc(50%-98.5px)]">示例</p>
          <div className="absolute font-['PingFang_SC:Regular',sans-serif] left-0 right-0 text-[#6d7789] top-[calc(50%-61.5px)] tracking-[0.4px]">
            <p className="mb-[14px]">行距和段间距是最常用的段落格式之一，以Microsoft Word2010软件为例介绍Word中设置行距和段间距的方法：</p>
            <p className="mb-[14px]">第1步，打开Word2010文档窗口，选中需要设置行距的段落或全部文档。</p>
            <p>
              <span className="tracking-[0.4px]">第2步，在“开始”功能区的“段落”分组中单击“行距”按钮，并在打开的行距列表中选中合适的行距。也可以单击“增加段前间距”或“增加段后间距”设置段落和段落之间的距离</span>。
            </p>
          </div>
        </div>
        <div className="absolute inset-[70.6%_89.65%_14.52%_0] leading-[22px] overflow-clip text-[14px] text-nowrap" data-name="编组 35">
          <p className="absolute font-['PingFang_SC:Medium',sans-serif] left-[calc(50%-38.5px)] text-[#0a1c39] top-[calc(50%-41px)]">备注</p>
          <div className="absolute font-['PingFang_SC:Regular',sans-serif] left-[calc(50%-38.5px)] text-[#6d7789] top-[calc(50%-3px)]">
            <p className="mb-0">字号 12px</p>
            <p>段间距 12px</p>
          </div>
        </div>
        <div className="absolute inset-[70.6%_0_0_33.6%] overflow-clip" data-name="编组 36">
          <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[22px] left-[calc(50%-247px)] text-[#0a1c39] text-[14px] text-nowrap top-[calc(50%-81px)]">示例</p>
          <div className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[20px] left-0 right-0 text-[#6d7789] text-[12px] top-[calc(50%-43px)] tracking-[0.3429px]">
            <p className="mb-[12px]">行距和段间距是最常用的段落格式之一，以Microsoft Word2010软件为例介绍Word中设置行距和段间距的方法：</p>
            <p className="mb-[12px]">第1步，打开Word2010文档窗口，选中需要设置行距的段落或全部文档。</p>
            <p>
              <span className="tracking-[0.3429px]">第2步，在“开始”功能区的“段落”分组中单击“行距”按钮，并在打开的行距列表中选中合适的行距。也可以单击“增加段前间距”或“增加段后间距”设置段落和段落之间的距离</span>
              <span className="tracking-[0.2939px]">。</span>
            </p>
          </div>
        </div>
        <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[normal] left-[calc(50%-372px)] text-[#0a1c39] text-[20px] text-nowrap top-[calc(50%-275.5px)]">段落间距</p>
      </div>
      <div className="absolute h-[354px] left-[120px] overflow-clip top-[2534px] w-[1023px]" data-name="链接颜色">
        <div className="absolute inset-[32.2%_37.83%_0_0] overflow-clip" data-name="编组 32">
          <div className="absolute bg-[#fbfbfc] inset-[40%_0]" data-name="矩形备份 40" />
          <div className="absolute bg-[#fbfbfc] inset-[80%_0_0_0]" data-name="矩形备份 41" />
          <div className="absolute bg-[#f6f7f8] inset-[0_0_80%_0]" data-name="矩形备份 39" />
          <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[normal] left-[calc(50%-300px)] not-italic text-[#3c4a61] text-[14px] text-nowrap top-[calc(50%-107px)]">名称</p>
          <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[normal] left-[calc(50%-108px)] not-italic text-[#3c4a61] text-[14px] text-nowrap top-[calc(50%-107px)]">对应色盘</p>
          <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[normal] left-[calc(50%-4px)] not-italic text-[#3c4a61] text-[14px] text-nowrap top-[calc(50%-107px)]">色值</p>
          <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[normal] left-[calc(50%+110px)] not-italic text-[#3c4a61] text-[14px] text-nowrap top-[calc(50%-107px)]">用法</p>
          <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[normal] left-[calc(50%-253.5px)] not-italic text-[#0a1c39] text-[14px] text-nowrap top-[calc(50%-58px)]">Link-regular</p>
          <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[normal] left-[calc(50%-254px)] not-italic text-[#0a1c39] text-[14px] text-nowrap top-[calc(50%+38px)]">Link-active</p>
          <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[normal] left-[calc(50%-254px)] not-italic text-[#0a1c39] text-[14px] text-nowrap top-[calc(50%-10px)]">Link-hover</p>
          <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[normal] left-[calc(50%-254px)] not-italic text-[#0a1c39] text-[14px] text-nowrap top-[calc(50%+86px)]">Link-disabled</p>
          <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%-108px)] not-italic text-[#0a1c39] text-[14px] text-nowrap top-[calc(50%-58px)]">Blue 06</p>
          <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%-108px)] not-italic text-[#0a1c39] text-[14px] text-nowrap top-[calc(50%+38px)]">Blue 07</p>
          <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%-4px)] not-italic text-[#0a1c39] text-[14px] text-nowrap top-[calc(50%-58px)]">#2B6DE5</p>
          <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%+110px)] not-italic text-[#0a1c39] text-[14px] text-nowrap top-[calc(50%-58px)]">链接颜色</p>
          <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%-4px)] not-italic text-[#0a1c39] text-[14px] text-nowrap top-[calc(50%+38px)]">#1B4FBF</p>
          <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%+110px)] not-italic text-[#0a1c39] text-[14px] text-nowrap top-[calc(50%+38px)]">链接颜色-点击</p>
          <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%-108px)] not-italic text-[#0a1c39] text-[14px] text-nowrap top-[calc(50%-10px)]">Blue 05</p>
          <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%-108px)] not-italic text-[#0a1c39] text-[14px] text-nowrap top-[calc(50%+86px)]">Blue 03</p>
          <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%-4px)] not-italic text-[#0a1c39] text-[14px] text-nowrap top-[calc(50%-10px)]">#5591F2</p>
          <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%-4px)] not-italic text-[#0a1c39] text-[14px] text-nowrap top-[calc(50%+86px)]">#ABD1FF</p>
          <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%+110px)] not-italic text-[#0a1c39] text-[14px] text-nowrap top-[calc(50%-10px)]">链接颜色-悬浮</p>
          <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%+110px)] not-italic text-[#0a1c39] text-[14px] text-nowrap top-[calc(50%+86px)]">链接颜色-禁用</p>
          <div className="absolute bg-[#2b6de5] bottom-[65%] left-[2.52%] right-[93.71%] rounded-[4px] top-1/4" data-name="矩形备份 28" />
          <div className="absolute bg-[#1b4fbf] bottom-1/4 left-[2.52%] right-[93.71%] rounded-[4px] top-[65%]" data-name="矩形备份 34" />
          <div className="absolute bg-[#5591f2] inset-[45%_93.71%_45%_2.52%] rounded-[4px]" data-name="矩形备份 35" />
          <div className="absolute bg-[#abd1ff] inset-[85%_93.71%_5%_2.52%] rounded-[4px]" data-name="矩形备份 42" />
        </div>
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-0 not-italic right-0 text-[#3c4a61] text-[14px] top-[calc(50%-125px)]">用于产品中超链接的文本</p>
        <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[normal] left-[calc(50%-511.5px)] not-italic text-[#0a1c39] text-[20px] text-nowrap top-[calc(50%-177px)]">链接颜色</p>
      </div>
      <div className="absolute h-[287px] left-[120px] overflow-clip top-[1187px] w-[1023px]" data-name="编组 37">
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-0 not-italic right-0 text-[#3c4a61] text-[14px] top-[calc(50%-91.5px)]">决定不同层级文本的粗细。多数情况下，只出现 regular 以及 medium 的两种字体重量，分别对应代码中的 400 和 500。在英文字体加粗的情况下会采用 semibold 的字体重量，对应代码中的 600。</p>
        <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[normal] left-[calc(50%-511.5px)] not-italic text-[#0a1c39] text-[20px] text-nowrap top-[calc(50%-143.5px)]">字重</p>
        <div className="absolute contents inset-[47.39%_51.91%_12.2%_0]" data-name="编组 30">
          <div className="absolute inset-[47.39%_92.57%_33.1%_0] overflow-clip" data-name="编组 20">
            <div className="absolute bg-[#f1f2f4] inset-0" data-name="矩形备份 18" />
            <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[normal] left-1/2 not-italic text-[#0a1c39] text-[14px] text-center text-nowrap top-[calc(50%-10px)] translate-x-[-50%]">字重</p>
          </div>
          <div className="absolute inset-[68.29%_92.57%_12.2%_0] overflow-clip" data-name="编组 21">
            <div className="absolute bg-[#f1f2f4] inset-0" data-name="矩形备份 29" />
            <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[normal] left-1/2 not-italic text-[#0a1c39] text-[14px] text-center text-nowrap top-[calc(50%-11px)] translate-x-[-50%]">粗细</p>
          </div>
          <div className="absolute inset-[47.39%_82.4%_33.1%_7.82%] overflow-clip" data-name="编组 22">
            <div className="absolute bg-[#fbfbfc] inset-0" data-name="矩形备份 19" />
            <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%-16px)] not-italic text-[14px] text-black text-nowrap top-[calc(50%-10px)]">Light</p>
          </div>
          <div className="absolute inset-[47.39%_72.24%_33.1%_17.99%] overflow-clip" data-name="编组 23">
            <div className="absolute bg-[#fbfbfc] inset-0" data-name="矩形备份 20" />
            <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%-25px)] not-italic text-[14px] text-black text-nowrap top-[calc(50%-10px)]">Regular</p>
          </div>
          <div className="absolute inset-[68.29%_82.4%_12.2%_7.82%] overflow-clip" data-name="编组 26">
            <div className="absolute bg-[#fbfbfc] inset-0" data-name="矩形备份 30" />
            <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%-13px)] not-italic text-[14px] text-black text-nowrap top-[calc(50%-10px)]">300</p>
          </div>
          <div className="absolute inset-[68.29%_72.24%_12.2%_17.99%] overflow-clip" data-name="编组 27">
            <div className="absolute bg-[#fbfbfc] inset-0" data-name="矩形备份 31" />
            <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%-13px)] not-italic text-[14px] text-black text-nowrap top-[calc(50%-10px)]">400</p>
          </div>
          <div className="absolute inset-[47.39%_62.07%_33.1%_28.15%] overflow-clip" data-name="编组 24">
            <div className="absolute bg-[#fbfbfc] inset-0" data-name="矩形备份 23" />
            <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%-26px)] not-italic text-[14px] text-black text-nowrap top-[calc(50%-10px)]">Medium</p>
          </div>
          <div className="absolute inset-[68.29%_62.07%_12.2%_28.15%] overflow-clip" data-name="编组 28">
            <div className="absolute bg-[#fbfbfc] inset-0" data-name="矩形备份 32" />
            <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%-13px)] not-italic text-[14px] text-black text-nowrap top-[calc(50%-10px)]">500</p>
          </div>
          <div className="absolute inset-[47.39%_51.91%_33.1%_38.32%] overflow-clip" data-name="编组 25">
            <div className="absolute bg-[#fbfbfc] inset-0" data-name="矩形备份 24" />
            <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%-16px)] not-italic text-[14px] text-black text-nowrap top-[calc(50%-10px)]">Bold</p>
          </div>
          <div className="absolute inset-[68.29%_51.91%_12.2%_38.32%] overflow-clip" data-name="编组 29">
            <div className="absolute bg-[#fbfbfc] inset-0" data-name="矩形备份 33" />
            <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%-13px)] not-italic text-[14px] text-black text-nowrap top-[calc(50%-10px)]">600</p>
          </div>
        </div>
        <Text text="常用字重" additionalClassNames="inset-[89.9%_62.07%_0_17.99%]" />
      </div>
      <div className="absolute h-[354px] left-[120px] overflow-clip top-[2060px] w-[1023px]" data-name="字体颜色">
        <div className="absolute inset-[32.2%_37.83%_0_0] overflow-clip" data-name="编组 31">
          <div className="absolute bg-[#fbfbfc] inset-[40%_0]" data-name="矩形备份 36" />
          <div className="absolute bg-[#fbfbfc] inset-[80%_0_0_0]" data-name="矩形备份 37" />
          <div className="absolute bg-[#f6f7f8] inset-[0_0_80%_0]" data-name="矩形备份 38" />
          <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[normal] left-[calc(50%-254px)] not-italic text-[#0a1c39] text-[14px] text-nowrap top-[calc(50%-58px)]">Text 1</p>
          <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[normal] left-[calc(50%-300px)] not-italic text-[#3c4a61] text-[14px] text-nowrap top-[calc(50%-107px)]">名称</p>
          <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[normal] left-[calc(50%-108px)] not-italic text-[#3c4a61] text-[14px] text-nowrap top-[calc(50%-107px)]">对应色盘</p>
          <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[normal] left-[calc(50%-4px)] not-italic text-[#3c4a61] text-[14px] text-nowrap top-[calc(50%-107px)]">透明度</p>
          <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[normal] left-[calc(50%+110px)] not-italic text-[#3c4a61] text-[14px] text-nowrap top-[calc(50%-107px)]">用法</p>
          <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[normal] left-[calc(50%-254px)] not-italic text-[#0a1c39] text-[14px] text-nowrap top-[calc(50%+38px)]">Text 3</p>
          <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[normal] left-[calc(50%-254px)] not-italic text-[#0a1c39] text-[14px] text-nowrap top-[calc(50%-10px)]">Text 2</p>
          <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[normal] left-[calc(50%-254px)] not-italic text-[#0a1c39] text-[14px] text-nowrap top-[calc(50%+86px)]">Text 4</p>
          <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%-107px)] not-italic text-[#0a1c39] text-[14px] text-nowrap top-[calc(50%-58px)]">Grey10</p>
          <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%-109px)] not-italic text-[#0a1c39] text-[14px] text-nowrap top-[calc(50%+38px)]">Grey10</p>
          <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%-4px)] not-italic text-[#0a1c39] text-[14px] text-nowrap top-[calc(50%-58px)]">100%</p>
          <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%+110px)] not-italic text-[#0a1c39] text-[14px] text-nowrap top-[calc(50%-58px)]">文本/图标颜色 - 最主要</p>
          <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%-4px)] not-italic text-[#0a1c39] text-[14px] text-nowrap top-[calc(50%+38px)]">60%</p>
          <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%+110px)] not-italic text-[#0a1c39] text-[14px] text-nowrap top-[calc(50%+38px)]">文本/图标颜色 - 次要</p>
          <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%-109px)] not-italic text-[#0a1c39] text-[14px] text-nowrap top-[calc(50%-10px)]">Grey10</p>
          <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%-108px)] not-italic text-[#0a1c39] text-[14px] text-nowrap top-[calc(50%+86px)]">Grey10</p>
          <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%-4px)] not-italic text-[#0a1c39] text-[14px] text-nowrap top-[calc(50%-10px)]">80%</p>
          <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%+110px)] not-italic text-[#0a1c39] text-[14px] text-nowrap top-[calc(50%-10px)]">文本/图标颜色 - 稍次要</p>
          <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%-4px)] not-italic text-[#0a1c39] text-[14px] text-nowrap top-[calc(50%+86px)]">35%</p>
          <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%+110px)] not-italic text-[#0a1c39] text-[14px] text-nowrap top-[calc(50%+86px)]">文本/图标颜色 - 最次要</p>
          <div className="absolute bg-[#0a1b39] bottom-[65%] left-[2.83%] right-[93.4%] rounded-[4px] top-1/4" data-name="矩形" />
          <div className="absolute bg-[rgba(10,27,57,0.6)] bottom-1/4 left-[2.83%] right-[93.4%] rounded-[4px] top-[65%]" data-name="矩形备份 26" />
          <div className="absolute bg-[rgba(10,27,57,0.8)] inset-[45%_93.4%_45%_2.83%] rounded-[4px]" data-name="矩形备份 25" />
          <div className="absolute bg-[rgba(10,27,57,0.35)] inset-[85%_93.4%_5%_2.83%] rounded-[4px]" data-name="矩形备份 27" />
        </div>
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-0 not-italic right-0 text-[#3c4a61] text-[14px] top-[calc(50%-125px)]">四个不同层级的文本/图标颜色，依次代表产品界面中最主要、次主要、稍次要和最次要的内容</p>
        <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[normal] left-[calc(50%-511.5px)] not-italic text-[#0a1c39] text-[20px] text-nowrap top-[calc(50%-177px)]">字体颜色</p>
      </div>
      <div className="absolute h-[265px] left-[120px] overflow-clip top-[796px] w-[1023px]" data-name="字号">
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-0 not-italic right-0 text-[#3c4a61] text-[14px] top-[calc(50%-80.5px)]">决定不同层级文本的大小；12号为小文本字号，14号为常规文本字号；16号字以上为标题文字</p>
        <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[normal] left-[calc(50%-511.5px)] not-italic text-[#0a1c39] text-[20px] text-nowrap top-[calc(50%-132.5px)]">字号</p>
        <div className="absolute contents inset-[43.02%_30.01%_12.83%_0]" data-name="编组 19">
          <div className="absolute inset-[43.02%_92.57%_35.85%_0] overflow-clip" data-name="编组">
            <div className="absolute bg-[#f1f2f4] inset-0" data-name="矩形" />
            <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[normal] left-1/2 not-italic text-[#0a1c39] text-[14px] text-center text-nowrap top-[calc(50%-11px)] translate-x-[-50%]">字号</p>
          </div>
          <div className="absolute inset-[66.04%_92.57%_12.83%_0] overflow-clip" data-name="编组 10">
            <div className="absolute bg-[#f1f2f4] inset-0" data-name="矩形备份 2" />
            <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[normal] left-1/2 not-italic text-[#0a1c39] text-[14px] text-center text-nowrap top-[calc(50%-12px)] translate-x-[-50%]">行高</p>
          </div>
          <div className="absolute inset-[43.02%_84.75%_35.85%_7.82%] overflow-clip" data-name="编组 2">
            <div className="absolute bg-[#fbfbfc] inset-0" data-name="矩形备份" />
            <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%-7px)] not-italic text-[#0b1c39] text-[14px] text-nowrap top-[calc(50%-10px)]">12</p>
          </div>
          <div className="absolute inset-[43.02%_61.29%_35.85%_31.28%] overflow-clip" data-name="编组 5">
            <div className="absolute bg-[#fbfbfc] inset-0" data-name="矩形备份 8" />
            <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%-7px)] not-italic text-[#0b1c39] text-[14px] text-nowrap top-[calc(50%-10px)]">20</p>
          </div>
          <div className="absolute inset-[43.02%_76.93%_35.85%_15.64%] overflow-clip" data-name="编组 3">
            <div className="absolute bg-[#fbfbfc] inset-0" data-name="矩形备份 4" />
            <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%-7px)] not-italic text-[#0b1c39] text-[14px] text-nowrap top-[calc(50%-10px)]">14</p>
          </div>
          <div className="absolute inset-[43.02%_53.47%_35.85%_39.1%] overflow-clip" data-name="编组 6">
            <div className="absolute bg-[#fbfbfc] inset-0" data-name="矩形备份 9" />
            <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%-7px)] not-italic text-[#0b1c39] text-[14px] text-nowrap top-[calc(50%-10px)]">24</p>
          </div>
          <div className="absolute inset-[43.02%_69.11%_35.85%_23.46%] overflow-clip" data-name="编组 4">
            <div className="absolute bg-[#fbfbfc] inset-0" data-name="矩形备份 6" />
            <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%-7px)] not-italic text-[#0b1c39] text-[14px] text-nowrap top-[calc(50%-10px)]">16</p>
          </div>
          <div className="absolute inset-[43.02%_45.65%_35.85%_46.92%] overflow-clip" data-name="编组 7">
            <div className="absolute bg-[#fbfbfc] inset-0" data-name="矩形备份 10" />
            <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%-7px)] not-italic text-[#0b1c39] text-[14px] text-nowrap top-[calc(50%-10px)]">30</p>
          </div>
          <div className="absolute inset-[43.02%_37.83%_35.85%_54.74%] overflow-clip" data-name="编组 8">
            <div className="absolute bg-[#fbfbfc] inset-0" data-name="矩形备份 14" />
            <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%-7px)] not-italic text-[#0b1c39] text-[14px] text-nowrap top-[calc(50%-10px)]">38</p>
          </div>
          <div className="absolute inset-[43.02%_30.01%_35.85%_62.56%] overflow-clip" data-name="编组 9">
            <div className="absolute bg-[#fbfbfc] inset-0" data-name="矩形备份 16" />
            <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%-7px)] not-italic text-[#0b1c39] text-[14px] text-nowrap top-[calc(50%-10px)]">46</p>
          </div>
          <div className="absolute inset-[66.04%_84.75%_12.83%_7.82%] overflow-clip" data-name="编组 11">
            <div className="absolute bg-[#fbfbfc] inset-0" data-name="矩形备份 3" />
            <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%-8px)] not-italic text-[#0b1c39] text-[14px] text-nowrap top-[calc(50%-10px)]">20</p>
          </div>
          <div className="absolute inset-[66.04%_61.29%_12.83%_31.28%] overflow-clip" data-name="编组 14">
            <div className="absolute bg-[#fbfbfc] inset-0" data-name="矩形备份 11" />
            <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%-8px)] not-italic text-[#0b1c39] text-[14px] text-nowrap top-[calc(50%-10px)]">28</p>
          </div>
          <div className="absolute inset-[66.04%_76.93%_12.83%_15.64%] overflow-clip" data-name="编组 12">
            <div className="absolute bg-[#fbfbfc] inset-0" data-name="矩形备份 5" />
            <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%-8px)] not-italic text-[#0b1c39] text-[14px] text-nowrap top-[calc(50%-10px)]">22</p>
          </div>
          <div className="absolute inset-[66.04%_53.47%_12.83%_39.1%] overflow-clip" data-name="编组 15">
            <div className="absolute bg-[#fbfbfc] inset-0" data-name="矩形备份 12" />
            <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%-8px)] not-italic text-[#0b1c39] text-[14px] text-nowrap top-[calc(50%-10px)]">32</p>
          </div>
          <div className="absolute inset-[66.04%_69.11%_12.83%_23.46%] overflow-clip" data-name="编组 13">
            <div className="absolute bg-[#fbfbfc] inset-0" data-name="矩形备份 7" />
            <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%-8px)] not-italic text-[#0b1c39] text-[14px] text-nowrap top-[calc(50%-10px)]">24</p>
          </div>
          <div className="absolute inset-[66.04%_45.65%_12.83%_46.92%] overflow-clip" data-name="编组 16">
            <div className="absolute bg-[#fbfbfc] inset-0" data-name="矩形备份 13" />
            <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%-8px)] not-italic text-[#0b1c39] text-[14px] text-nowrap top-[calc(50%-10px)]">38</p>
          </div>
          <div className="absolute inset-[66.04%_37.83%_12.83%_54.74%] overflow-clip" data-name="编组 17">
            <div className="absolute bg-[#fbfbfc] inset-0" data-name="矩形备份 15" />
            <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%-8px)] not-italic text-[#0b1c39] text-[14px] text-nowrap top-[calc(50%-10px)]">46</p>
          </div>
          <div className="absolute inset-[66.04%_30.01%_12.83%_62.56%] overflow-clip" data-name="编组 18">
            <div className="absolute bg-[#fbfbfc] inset-0" data-name="矩形备份 17" />
            <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%-8px)] not-italic text-[#0b1c39] text-[14px] text-nowrap top-[calc(50%-10px)]">54</p>
          </div>
        </div>
        <Text text="文本字号" additionalClassNames="inset-[89.06%_76.93%_0_7.82%]" />
        <div className="absolute inset-[89.06%_30.01%_0_23.46%]" data-name="Dimension / Bottom / 32px备份">
          <Indicator />
          <div className="absolute bottom-[8px] flex flex-col font-['Inter:Bold','Noto_Sans_SC:Bold','Noto_Sans_JP:Bold',sans-serif] font-bold justify-center leading-[0] left-0 not-italic right-0 text-[#ff1257] text-[10px] text-center tracking-[0.2px] translate-y-[50%]">
            <p className="leading-[16px]">标题字号</p>
          </div>
        </div>
      </div>
      <div className="absolute h-[228px] left-[120px] overflow-clip top-[448px] w-[576px]" data-name="编组 39">
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[calc(50%-288px)] not-italic text-[#3c4a61] text-[14px] text-nowrap top-[calc(50%-62px)]">优先使用系统默认的界面字体。特殊数字字体用DIN字体</p>
        <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[normal] left-[calc(50%-288px)] not-italic text-[#0a1c39] text-[20px] text-nowrap top-[calc(50%-114px)]">字体</p>
        <div className="absolute bg-[#f6f7f8] bottom-0 left-0 right-0 top-1/2" data-name="矩形" />
        <div className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[calc(50%-264px)] not-italic text-[14px] text-[rgba(10,27,57,0.8)] text-nowrap top-[calc(50%+24px)]">
          <p className="mb-0">{`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,`}</p>
          <p className="mb-0">{`'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol',`}</p>
          <p>{`'Noto Color Emoji`}</p>
        </div>
      </div>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[120px] not-italic text-[#3c4a61] text-[14px] top-[266px] w-[1023px]">用户通过文本来理解内容和完成工作，科学的字体系统将大大提升用户的阅读体验及工作效率</p>
      <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[46px] left-[120px] not-italic text-[#0a1c39] text-[38px] text-nowrap top-[180px]">字体</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[20px] left-[120px] not-italic text-[#6d7789] text-[12px] text-nowrap top-[80px]">SENSORO 设计规范 / Lins 4.0</p>
    </div>
  );
}