import svgPaths from "./svg-tl8fg8mmdp";
import clsx from "clsx";

function Wrapper1({ children }: React.PropsWithChildren<{}>) {
  return (
    <div>
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        {children}
      </svg>
    </div>
  );
}
type WrapperProps = {
  additionalClassNames?: string;
};

function Wrapper({ children, additionalClassNames = "" }: React.PropsWithChildren<WrapperProps>) {
  return (
    <div className={clsx("absolute right-[16px] size-[16px]", additionalClassNames)}>
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        {children}
      </svg>
    </div>
  );
}
type Helper12Props = {
  text: string;
  text1: string;
  additionalClassNames?: string;
};

function Helper12({ text, text1, additionalClassNames = "" }: Helper12Props) {
  return (
    <div className={clsx("absolute", additionalClassNames)}>
      <div className="absolute bg-[#1f293a] inset-0 shadow-[0px_6px_16px_-8px_rgba(0,0,0,0.08),0px_8px_28px_0px_rgba(0,0,0,0.04),0px_12px_48px_16px_rgba(0,0,0,0.03)]" data-name="矩形备份 20" />
      <Icon2 />
      <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[24px] left-[60px] not-italic text-[#f6f9fe] text-[16px] top-[16px] w-[64px]">{text}</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[60px] not-italic text-[#8194b5] text-[14px] top-[44px] w-[154px]">{text1}</p>
      <Helper3 additionalClassNames="left-[24px] top-[19px]" />
    </div>
  );
}
type Helper11Props = {
  text: string;
  text1: string;
  additionalClassNames?: string;
};

function Helper11({ text, text1, additionalClassNames = "" }: Helper11Props) {
  return (
    <div className={clsx("absolute", additionalClassNames)}>
      <div className="absolute bg-[#1f293a] inset-0 shadow-[0px_6px_16px_-8px_rgba(0,0,0,0.08),0px_8px_28px_0px_rgba(0,0,0,0.04),0px_12px_48px_16px_rgba(0,0,0,0.03)]" data-name="矩形备份 20" />
      <Icon2 />
      <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[24px] left-[60px] not-italic text-[#f6f9fe] text-[16px] top-[16px] w-[64px]">{text}</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[60px] not-italic text-[#8194b5] text-[14px] top-[44px] w-[154px]">{text1}</p>
      <div className="absolute font-['PingFang_SC:Regular',sans-serif] h-[22px] leading-[22px] left-[60px] not-italic overflow-clip text-[#4e86df] text-[14px] top-[74px] w-[128px]">
        <p className="absolute left-0 top-0 w-[56px]">{"文字按钮"}</p>
        <p className="absolute left-[72px] top-[calc(50%-11px)] w-[56px]">{"链接标题"}</p>
      </div>
      <Helper3 additionalClassNames="left-[24px] top-[19px]" />
    </div>
  );
}

function Icon2() {
  return (
    <Wrapper additionalClassNames="top-[16px]">
      <g id="icon/æåå¤ä»½ 6">
        <rect fill="var(--fill-0, black)" height="16" id="ç©å½¢" opacity="0.01" width="16" />
        <path clipRule="evenodd" d={svgPaths.pea9e180} fill="var(--fill-0, #0A1B39)" fillRule="evenodd" id="è·¯å¾" />
      </g>
    </Wrapper>
  );
}

function Icon1() {
  return (
    <Wrapper additionalClassNames="top-1/2 translate-y-[-50%]">
      <g id="icon/æåå¤ä»½ 4">
        <rect fill="var(--fill-0, black)" height="16" id="ç©å½¢" opacity="0.01" width="16" />
        <path clipRule="evenodd" d={svgPaths.pea9e180} fill="var(--fill-0, #0A1B39)" fillOpacity="0.8" fillRule="evenodd" id="è·¯å¾" />
      </g>
    </Wrapper>
  );
}
type Helper10Props = {
  additionalClassNames?: string;
};

function Helper10({ additionalClassNames = "" }: Helper10Props) {
  return (
    <div className={clsx("absolute h-[10.188px] right-[19.06px] translate-y-[-50%] w-[9.894px]", additionalClassNames)}>
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.89398 10.188">
        <path clipRule="evenodd" d={svgPaths.pda18c80} fill="var(--fill-0, #0A1B39)" fillOpacity="0.8" fillRule="evenodd" id="è·¯å¾" />
      </svg>
    </div>
  );
}

function Icon() {
  return (
    <div className="absolute contents right-[16px] top-1/2 translate-y-[-50%]">
      <div className="absolute bg-black opacity-0 right-[16px] size-[16px] top-1/2 translate-y-[-50%]" data-name="矩形" />
      <Helper10 additionalClassNames="top-1/2" />
    </div>
  );
}

function Close() {
  return (
    <div className="absolute contents right-[24px] top-1/2 translate-y-[-50%]">
      <div className="absolute bg-black opacity-0 right-[24px] size-[24px] top-1/2 translate-y-[-50%]" data-name="矩形" />
      <div className="absolute h-[15.281px] right-[28.59px] top-1/2 translate-y-[-50%] w-[14.841px]" data-name="路径">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.841 15.2812">
          <path clipRule="evenodd" d={svgPaths.p2eccd4f0} fill="var(--fill-0, black)" fillOpacity="0.85" fillRule="evenodd" id="è·¯å¾" />
        </svg>
      </div>
    </div>
  );
}
type Helper9Props = {
  additionalClassNames?: string;
};

function Helper9({ additionalClassNames = "" }: Helper9Props) {
  return (
    <div className={clsx("absolute", additionalClassNames)}>
      <DefaultText text="取消" additionalClassNames="right-[88px]" />
      <Text text="确认" additionalClassNames="right-[24px] w-[52px]" />
    </div>
  );
}
type Helper8Props = {
  additionalClassNames?: string;
};

function Helper8({ additionalClassNames = "" }: Helper8Props) {
  return (
    <Wrapper1 additionalClassNames={additionalClassNames}>
      <g id="Line/å¤±è´¥-åå½¢">
        <rect fill="var(--fill-0, black)" height="20" id="ç©å½¢" opacity="0.01" width="20" />
        <path clipRule="evenodd" d={svgPaths.p114a5228} fill="var(--fill-0, #0A1B39)" fillRule="evenodd" id="å½¢ç¶" />
      </g>
    </Wrapper1>
  );
}
type Helper7Props = {
  additionalClassNames?: string;
};

function Helper7({ additionalClassNames = "" }: Helper7Props) {
  return <Helper8 additionalClassNames={clsx("absolute left-[16px] size-[20px]", additionalClassNames)} />;
}
type Helper6Props = {
  additionalClassNames?: string;
};

function Helper6({ additionalClassNames = "" }: Helper6Props) {
  return (
    <Wrapper1 additionalClassNames={additionalClassNames}>
      <g id="Line/è­¦å-åå½¢">
        <rect fill="var(--fill-0, black)" height="20" id="ç©å½¢" opacity="0.01" width="20" />
        <path d={svgPaths.p27c59070} fill="var(--fill-0, #0A1B39)" id="å½¢ç¶ç»å" />
      </g>
    </Wrapper1>
  );
}
type Helper5Props = {
  additionalClassNames?: string;
};

function Helper5({ additionalClassNames = "" }: Helper5Props) {
  return <Helper6 additionalClassNames={clsx("absolute left-[16px] size-[20px]", additionalClassNames)} />;
}
type Text2Props = {
  text: string;
  additionalClassNames?: string;
};

function Text2({ text, additionalClassNames = "" }: Text2Props) {
  return (
    <div className={clsx("absolute", additionalClassNames)}>
      <Indicator />
      <div className="absolute bottom-[4px] flex flex-col font-['PingFang_SC:Regular',sans-serif] justify-center leading-[0] not-italic right-[20px] text-[#ff1257] text-[10px] top-[4px] tracking-[0.2px] translate-x-[100%] w-[20px]">
        <p className="leading-[16px]">{text}</p>
      </div>
    </div>
  );
}
type Text1Props = {
  text: string;
  additionalClassNames?: string;
};

function Text1({ text, additionalClassNames = "" }: Text1Props) {
  return (
    <div className={clsx("absolute", additionalClassNames)}>
      <Indicator1 />
      <div className="absolute bottom-[8px] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] left-0 not-italic right-0 text-[#ff1257] text-[10px] text-center tracking-[0.2px] translate-y-[50%]">
        <p className="leading-[16px]">{text}</p>
      </div>
    </div>
  );
}

function Indicator1() {
  return (
    <div className="absolute bottom-[20px] h-[9px] left-0 overflow-clip right-0">
      <div className="absolute bg-[#ff1257] h-[9px] left-0 rounded-[0.5px] top-0 w-px" data-name="top-indicator" />
      <div className="absolute bg-[#ff1257] h-[9px] right-0 rounded-[0.5px] top-0 w-px" data-name="bottom-indicator" />
      <div className="absolute bg-[#ff1257] bottom-[4px] h-px left-px right-px" data-name="line" />
    </div>
  );
}

function Indicator() {
  return (
    <div className="absolute bottom-0 overflow-clip right-[24px] top-0 w-[9px]">
      <div className="absolute bg-[#ff1257] h-px left-0 rounded-[0.5px] top-0 w-[9px]" data-name="top-indicator" />
      <div className="absolute bg-[#ff1257] bottom-0 h-px left-0 rounded-[0.5px] w-[9px]" data-name="bottom-indicator" />
      <div className="absolute bg-[#ff1257] bottom-px left-[4px] top-px w-px" data-name="line" />
    </div>
  );
}
type Helper4Props = {
  additionalClassNames?: string;
};

function Helper4({ additionalClassNames = "" }: Helper4Props) {
  return (
    <Wrapper1 additionalClassNames={additionalClassNames}>
      <g id="4.icon/æå-åå½¢">
        <rect fill="var(--fill-0, black)" height="20" id="ç©å½¢" opacity="0.01" width="20" />
        <path d={svgPaths.p38ade600} fill="var(--fill-0, #0A1B39)" id="å½¢ç¶ç»å" />
      </g>
    </Wrapper1>
  );
}
type Helper3Props = {
  additionalClassNames?: string;
};

function Helper3({ additionalClassNames = "" }: Helper3Props) {
  return <Helper4 additionalClassNames={clsx("absolute size-[20px]", additionalClassNames)} />;
}
type Helper2Props = {
  additionalClassNames?: string;
};

function Helper2({ additionalClassNames = "" }: Helper2Props) {
  return (
    <div className="absolute inset-[59.18%_0_0_0] overflow-clip">
      <DefaultText text="取消" additionalClassNames="right-[124px]" />
      <Text text="确认移除" additionalClassNames="right-[32px] w-[80px]" />
    </div>
  );
}
type TextProps = {
  text: string;
  additionalClassNames?: string;
};

function Text({ text, additionalClassNames = "" }: TextProps) {
  return (
    <div className={clsx("absolute h-[32px] top-1/2 translate-y-[-50%]", additionalClassNames)}>
      <div className="absolute bg-[#2761cb] inset-0" data-name="背景颜色" />
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[calc(50%-28px)] not-italic text-[14px] text-[rgba(255,255,255,0.85)] top-[calc(50%-11px)] w-[56px]">{text}</p>
    </div>
  );
}
type DefaultTextProps = {
  text: string;
  additionalClassNames?: string;
};

function DefaultText({ text, additionalClassNames = "" }: DefaultTextProps) {
  return (
    <div className={clsx("absolute h-[32px] top-1/2 translate-y-[-50%] w-[52px]", additionalClassNames)}>
      <div className="absolute bg-[#1f293a] inset-0" data-name="背景颜色" />
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[12px] not-italic text-[14px] text-[rgba(255,255,255,0.85)] top-[5px] w-[56px]">{text}</p>
    </div>
  );
}
type Helper1Props = {
  additionalClassNames?: string;
};

function Helper1({ additionalClassNames = "" }: Helper1Props) {
  return (
    <Wrapper1 additionalClassNames={additionalClassNames}>
      <g id="4.icon/æç¤º-åå½¢">
        <rect fill="var(--fill-0, black)" height="20" id="ç©å½¢" opacity="0.01" width="20" />
        <path d={svgPaths.pa53a200} fill="var(--fill-0, #0A1B39)" id="å½¢ç¶ç»å" />
      </g>
    </Wrapper1>
  );
}
type HelperProps = {
  additionalClassNames?: string;
};

function Helper({ additionalClassNames = "" }: HelperProps) {
  return <Helper1 additionalClassNames={clsx("absolute left-[16px] size-[20px]", additionalClassNames)} />;
}

export default function Component() {
  return (
    <div className="bg-black relative size-full" data-name="反馈">
      <div className="absolute h-[288px] left-[calc(50%-1px)] not-italic top-0 translate-x-[-50%] w-[1440px]" data-name="SENSORO 设计规范 / Lins备份">
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[20px] left-[calc(50%-600px)] text-[#f6f9fe] text-[12px] top-[calc(50%-64px)] w-[152px]">SENSORO 组件库/全景地图</p>
        <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[46px] left-[calc(50%-600px)] text-[#f6f9fe] text-[38px] top-[calc(50%+36px)] w-[361px]">Feedback 反馈</p>
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[8.33%] right-[8.33%] text-[#8194b5] text-[14px] top-[calc(50%+122px)]">为了帮助用户了解应用当前要做什么，也给用户的下一步行为做参考，以及了解操作后所产生的结果</p>
      </div>
      <div className="absolute bottom-0 h-[130px] left-1/2 translate-x-[-50%] w-[1440px]" data-name="底部备份 3">
        <div className="absolute bg-[#293449] inset-[0_120px_99.23%_120px]" data-name="Divider Color" />
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[120px] not-italic text-[#aec0de] text-[14px] top-[calc(50%-37px)] w-[294px]">有一天，所有人所有事所有物都会发出一个信号</p>
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] not-italic right-[120px] text-[#aec0de] text-[14px] text-right top-[calc(50%-37px)] w-[197px]">SENSORO 设计规范 / Lins 4.0</p>
      </div>
      <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[28px] left-[calc(50%-600px)] not-italic text-[#f6f9fe] text-[20px] top-[calc(50%-1407.5px)] w-[159px]">对话框（Modal）</p>
      <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[28px] left-[calc(50%-600px)] not-italic text-[#f6f9fe] text-[20px] top-[calc(50%-780.5px)] w-[140px]">二次确认对话框</p>
      <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[28px] left-[calc(50%-600px)] not-italic text-[#f6f9fe] text-[20px] top-[calc(50%+89.5px)] w-[165px]">警告提示（Alert）</p>
      <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[28px] left-[calc(50%-600px)] not-italic text-[#f6f9fe] text-[20px] top-[calc(50%+555.5px)] w-[251px]">通知提醒框（Notification）</p>
      <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[28px] left-[calc(50%-42px)] not-italic text-[#f6f9fe] text-[20px] top-[calc(50%+89.5px)] w-[205px]">全局提示（Message）</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[8.33%] not-italic right-[20.63%] text-[#8194b5] text-[14px] top-[calc(50%-1363.5px)]">需要用户处理事务，又不希望跳转页面以致打断工作流程时；可以使用 Modal 在当前页面正中打开一个浮层，承载相应的操作</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[calc(50%-600px)] not-italic text-[#8194b5] text-[14px] top-[calc(50%-736.5px)] w-[210px]">需要一个简洁的确认框询问用户时</p>
      <div className="absolute inset-[31.42%_58.33%_63.18%_8.33%]" data-name="二次确认">
        <div className="absolute bg-[#161d2a] inset-0 shadow-[0px_6px_16px_-8px_rgba(0,0,0,0.08),0px_8px_28px_0px_rgba(0,0,0,0.04),0px_12px_48px_16px_rgba(0,0,0,0.03)]" data-name="矩形备份 13" />
        <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[24px] left-[calc(50%-180px)] not-italic text-[#f6f9fe] text-[16px] top-[calc(50%-66px)] w-[282px]">确认将房间（房间001）从系统中移除？</p>
        <Helper1 additionalClassNames="absolute inset-[17.35%_89.17%_72.45%_6.67%]" />
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[12.5%] not-italic right-[14.17%] text-[#aec0de] text-[14px] top-[calc(50%-26px)]">这是一行描述文案这是一行描述文案这是一行描述文案这是一行描述文案这是一行描述文案这是一行</p>
        <Helper2 />
      </div>
      <div className="absolute inset-[38.14%_58.33%_56.46%_8.33%]" data-name="二次确认备份 2">
        <div className="absolute bg-[#161d2a] inset-0 shadow-[0px_6px_16px_-8px_rgba(0,0,0,0.08),0px_8px_28px_0px_rgba(0,0,0,0.04),0px_12px_48px_16px_rgba(0,0,0,0.03)]" data-name="矩形备份 13" />
        <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[24px] left-[calc(50%-180px)] not-italic text-[#f6f9fe] text-[16px] top-[calc(50%-66px)] w-[282px]">确认将房间（房间001）从系统中移除？</p>
        <Helper4 additionalClassNames="absolute inset-[17.35%_89.17%_72.45%_6.67%]" />
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[12.5%] not-italic right-[14.17%] text-[#aec0de] text-[14px] top-[calc(50%-26px)]">这是一行描述文案这是一行描述文案这是一行描述文案这是一行描述文案这是一行描述文案这是一行</p>
        <Helper2 />
      </div>
      <div className="absolute inset-[44.86%_58.33%_49.74%_8.33%] overflow-clip" data-name="二次确认备份 4">
        <div className="absolute bg-[#161d2a] inset-0 shadow-[0px_6px_16px_-8px_rgba(0,0,0,0.08),0px_8px_28px_0px_rgba(0,0,0,0.04),0px_12px_48px_16px_rgba(0,0,0,0.03)]" data-name="矩形备份 13" />
        <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[24px] left-[calc(50%-180px)] not-italic text-[#f6f9fe] text-[16px] top-[calc(50%-66px)] w-[282px]">确认将房间（房间001）从系统中移除？</p>
        <Helper4 additionalClassNames="absolute inset-[17.35%_89.17%_72.45%_6.67%]" />
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[12.5%] not-italic right-[14.17%] text-[#aec0de] text-[14px] top-[calc(50%-26px)]">这是一行描述文案这是一行描述文案这是一行描述文案这是一行描述文案这是一行描述文案这是一行</p>
        <Helper2 />
        <div className="absolute bg-[#e7484f] inset-[0_0_83.67%_0] opacity-20" data-name="矩形" />
        <div className="absolute bg-[#e7484f] inset-[87.76%_0_0_0] opacity-20" data-name="矩形" />
        <div className="absolute bg-[#e7484f] inset-[59.18%_0_28.57%_0] opacity-20" data-name="矩形备份" />
        <div className="absolute bg-[#e7484f] inset-[28.57%_0_63.27%_0] opacity-20" data-name="矩形备份 2" />
        <div className="absolute bg-[#e7484f] inset-[0_93.33%_0_0] opacity-20" data-name="矩形" />
        <div className="absolute bg-[#e7484f] inset-[0_0_0_93.33%] opacity-20" data-name="矩形" />
        <div className="absolute inset-[0_46.46%_83.67%_46.67%]" data-name="标注-竖">
          <Indicator />
          <div className="absolute bottom-[8px] flex flex-col font-['PingFang_SC:Regular',sans-serif] justify-center leading-[0] not-italic right-[20px] text-[#ff1257] text-[10px] top-[8px] tracking-[0.2px] translate-x-[100%] w-[20px]">
            <p className="leading-[16px]">32</p>
          </div>
        </div>
        <div className="absolute inset-[28.57%_46.46%_63.27%_46.67%]" data-name="标注-竖备份">
          <Indicator />
          <div className="absolute bottom-0 flex flex-col font-['PingFang_SC:Regular',sans-serif] justify-center leading-[0] not-italic right-[20px] text-[#ff1257] text-[10px] top-0 tracking-[0.2px] translate-x-[100%] w-[20px]">
            <p className="leading-[16px]">16</p>
          </div>
        </div>
        <Text1 text="32" additionalClassNames="inset-[42.86%_93.33%_42.35%_0]" />
        <Text1 text="32" additionalClassNames="inset-[42.86%_0_42.35%_93.33%]" />
        <Text2 text="24" additionalClassNames="inset-[87.76%_46.46%_0_46.67%]" />
        <Text2 text="24" additionalClassNames="inset-[59.18%_46.46%_28.57%_46.67%]" />
      </div>
      <div className="absolute inset-[31.42%_21.67%_63.18%_45%]" data-name="二次确认备份">
        <div className="absolute bg-[#161d2a] inset-0 shadow-[0px_6px_16px_-8px_rgba(0,0,0,0.08),0px_8px_28px_0px_rgba(0,0,0,0.04),0px_12px_48px_16px_rgba(0,0,0,0.03)]" data-name="矩形备份 13" />
        <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[24px] left-[calc(50%-180px)] not-italic text-[#f6f9fe] text-[16px] top-[calc(50%-66px)] w-[282px]">确认将房间（房间001）从系统中移除？</p>
        <Helper6 additionalClassNames="absolute inset-[17.35%_89.17%_72.45%_6.67%]" />
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[12.5%] not-italic right-[14.17%] text-[#aec0de] text-[14px] top-[calc(50%-26px)]">这是一行描述文案这是一行描述文案这是一行描述文案这是一行描述文案这是一行描述文案这是一行</p>
        <Helper2 />
      </div>
      <div className="absolute inset-[38.14%_21.67%_56.46%_45%]" data-name="二次确认备份 3">
        <div className="absolute bg-[#161d2a] inset-0 shadow-[0px_6px_16px_-8px_rgba(0,0,0,0.08),0px_8px_28px_0px_rgba(0,0,0,0.04),0px_12px_48px_16px_rgba(0,0,0,0.03)]" data-name="矩形备份 13" />
        <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[24px] left-[calc(50%-180px)] not-italic text-[#f6f9fe] text-[16px] top-[calc(50%-66px)] w-[282px]">确认将房间（房间001）从系统中移除？</p>
        <Helper8 additionalClassNames="absolute inset-[17.35%_89.17%_72.45%_6.67%]" />
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[12.5%] not-italic right-[14.17%] text-[#aec0de] text-[14px] top-[calc(50%-26px)]">这是一行描述文案这是一行描述文案这是一行描述文案这是一行描述文案这是一行描述文案这是一行</p>
        <Helper2 />
      </div>
      <div className="absolute inset-[14.38%_58.33%_74.61%_8.33%]" data-name="对话框">
        <div className="absolute bg-[#161d2a] inset-0 shadow-[0px_6px_16px_-8px_rgba(0,0,0,0.08),0px_8px_28px_0px_rgba(0,0,0,0.04),0px_12px_48px_16px_rgba(0,0,0,0.03)]" data-name="矩形备份 7" />
        <Helper9 additionalClassNames="inset-[80%_0_0_0]" />
        <div className="absolute inset-[0_0_81%_0]" data-name="模态/基本/顶部备份">
          <div className="absolute contents right-[24px] top-1/2 translate-y-[-50%]" data-name="icon/关闭">
            <Close />
          </div>
          <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[28px] left-[24px] not-italic text-[#f6f9fe] text-[20px] top-[calc(50%-14px)] w-[80px]">标题文字</p>
        </div>
      </div>
      <div className="absolute contents inset-[14.38%_21.67%_74.61%_45%]" data-name="对话框备份">
        <div className="absolute bg-[#161d2a] inset-[14.38%_21.67%_74.61%_45%] shadow-[0px_6px_16px_-8px_rgba(0,0,0,0.08),0px_8px_28px_0px_rgba(0,0,0,0.04),0px_12px_48px_16px_rgba(0,0,0,0.03)]" data-name="矩形备份 7" />
        <div className="absolute bg-[rgba(229,44,62,0.15)] inset-[16.47%_23.33%_76.81%_46.67%]" data-name="矩形备份 4" />
        <Helper9 additionalClassNames="inset-[23.19%_21.67%_74.61%_45%]" />
        <div className="absolute inset-[14.38%_21.67%_83.53%_45%]" data-name="模态/基本/顶部备份">
          <div className="absolute contents right-[24px] top-1/2 translate-y-[-50%]" data-name="icon/关闭">
            <Close />
          </div>
          <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[28px] left-[24px] not-italic text-[#f6f9fe] text-[20px] top-[calc(50%-14px)] w-[80px]">标题文字</p>
        </div>
        <Text1 text="24" additionalClassNames="inset-[15.42%_53.33%_83.78%_45%]" />
        <Text1 text="24" additionalClassNames="inset-[19.5%_53.33%_79.7%_45%]" />
        <Text1 text="24" additionalClassNames="inset-[19.5%_21.67%_79.7%_76.67%]" />
        <Text1 text="24" additionalClassNames="inset-[24.04%_21.67%_75.16%_76.67%]" />
        <Text2 text="24" additionalClassNames="inset-[24.73%_23.06%_74.61%_74.65%]" />
        <Text2 text="24" additionalClassNames="inset-[23.19%_23.06%_76.15%_74.65%]" />
        <Text1 text="12" additionalClassNames="inset-[24.04%_26.94%_75.16%_72.22%]" />
        <Text2 text="24" additionalClassNames="inset-[14.38%_49.38%_84.96%_48.33%]" />
        <Text2 text="24" additionalClassNames="inset-[15.81%_49.38%_83.53%_48.33%]" />
      </div>
      <div className="absolute inset-[25.5%_21.63%_73.7%_45.03%]" data-name="4.其他/标注-横">
        <Indicator1 />
        <div className="absolute bottom-[8px] flex flex-col font-['Inter:Bold','Noto_Sans_JP:Bold','Noto_Sans_SC:Bold',sans-serif] font-bold justify-center leading-[0] left-0 not-italic right-0 text-[#ff1257] text-[10px] text-center tracking-[0.2px] translate-y-[50%]">
          <p className="leading-[16px]">根据需求调整宽度</p>
        </div>
      </div>
      <div className="absolute inset-[54.12%_58.47%_44.78%_8.4%]" data-name="5.反馈/1.提示/警告提示/成功">
        <div className="absolute bg-[#14524b] h-[40px] left-0 shadow-[0px_6px_16px_-8px_rgba(0,0,0,0.08),0px_8px_28px_0px_rgba(0,0,0,0.04),0px_12px_48px_16px_rgba(0,0,0,0.03)] top-1/2 translate-y-[-50%] w-[477px]" data-name="矩形" />
        <Helper3 additionalClassNames="left-[16px] top-[10px]" />
        <Icon />
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[44px] not-italic text-[14px] text-[rgba(255,255,255,0.85)] top-[calc(50%-11px)] w-[385px]">此功能模块涉及权限/隐私保护，请通过手机验证完成身份验证</p>
      </div>
      <div className="absolute inset-[61.83%_58.47%_36.9%_8.4%] overflow-clip" data-name="5.反馈/1.提示/警告提示/成功备份 4">
        <div className="absolute bg-[#14524b] h-[40px] left-0 shadow-[0px_6px_16px_-8px_rgba(0,0,0,0.08),0px_8px_28px_0px_rgba(0,0,0,0.04),0px_12px_48px_16px_rgba(0,0,0,0.03)] top-[calc(50%-3px)] translate-y-[-50%] w-[477px]" data-name="矩形" />
        <Helper3 additionalClassNames="left-[16px] top-[10px]" />
        <div className="absolute contents right-[16px] top-[calc(50%-3px)] translate-y-[-50%]" data-name="icon/成功备份 4">
          <div className="absolute bg-black opacity-0 right-[16px] size-[16px] top-[calc(50%-3px)] translate-y-[-50%]" data-name="矩形" />
          <Helper10 additionalClassNames="top-[calc(50%-3px)]" />
        </div>
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[44px] not-italic text-[14px] text-[rgba(255,255,255,0.85)] top-[calc(50%-14px)] w-[385px]">此功能模块涉及权限/隐私保护，请通过手机验证完成身份验证</p>
        <Text1 text="16" additionalClassNames="inset-[36.96%_96.65%_0_0]" />
        <Text1 text="16" additionalClassNames="inset-[36.96%_0_0_96.65%]" />
        <Text1 text="16" additionalClassNames="inset-[36.96%_6.71%_0_89.94%]" />
        <Text1 text="8" additionalClassNames="inset-[36.96%_90.78%_0_7.55%]" />
      </div>
      <div className="absolute inset-[55.88%_58.47%_43.02%_8.4%]" data-name="5.反馈/1.提示/警告提示/成功备份">
        <div className="absolute bg-[#19366b] h-[40px] left-0 shadow-[0px_6px_16px_-8px_rgba(0,0,0,0.08),0px_8px_28px_0px_rgba(0,0,0,0.04),0px_12px_48px_16px_rgba(0,0,0,0.03)] top-1/2 translate-y-[-50%] w-[477px]" data-name="矩形" />
        <Helper additionalClassNames="top-[10px]" />
        <Icon />
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[44px] not-italic text-[14px] text-[rgba(255,255,255,0.85)] top-[calc(50%-11px)] w-[385px]">此功能模块涉及权限/隐私保护，请通过手机验证完成身份验证</p>
      </div>
      <div className="absolute inset-[57.64%_58.47%_41.26%_8.4%]" data-name="5.反馈/1.提示/警告提示/成功备份 2">
        <div className="absolute bg-[#573c28] h-[40px] left-0 shadow-[0px_6px_16px_-8px_rgba(0,0,0,0.08),0px_8px_28px_0px_rgba(0,0,0,0.04),0px_12px_48px_16px_rgba(0,0,0,0.03)] top-1/2 translate-y-[-50%] w-[477px]" data-name="矩形" />
        <Helper5 additionalClassNames="top-[10px]" />
        <Icon />
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[44px] not-italic text-[14px] text-[rgba(255,255,255,0.85)] top-[calc(50%-11px)] w-[385px]">此功能模块涉及权限/隐私保护，请通过手机验证完成身份验证</p>
      </div>
      <div className="absolute inset-[59.41%_58.47%_39.49%_8.4%]" data-name="5.反馈/1.提示/警告提示/成功备份 3">
        <div className="absolute bg-[#561f35] h-[40px] left-0 shadow-[0px_6px_16px_-8px_rgba(0,0,0,0.08),0px_8px_28px_0px_rgba(0,0,0,0.04),0px_12px_48px_16px_rgba(0,0,0,0.03)] top-1/2 translate-y-[-50%] w-[477px]" data-name="矩形" />
        <Helper7 additionalClassNames="top-[10px]" />
        <Icon />
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[44px] not-italic text-[14px] text-[rgba(255,255,255,0.85)] top-[calc(50%-11px)] w-[385px]">此功能模块涉及权限/隐私保护，请通过手机验证完成身份验证</p>
      </div>
      <div className="absolute inset-[62.38%_59.17%_36.96%_39.17%]" data-name="4.icon/Pointer">
        <div className="absolute inset-[0_0_-8.33%_0]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 26">
            <g id="1.éç¨/Iconå¾æ /3.Else/Pointer">
              <g filter="url(#filter0_d_2001_2550)" id="cursor">
                <mask fill="black" height="20" id="path-1-outside-1_2001_2550" maskUnits="userSpaceOnUse" width="16" x="4" y="2">
                  <rect fill="white" height="20" width="16" x="4" y="2" />
                  <path clipRule="evenodd" d={svgPaths.p3dd47800} fillRule="evenodd" />
                </mask>
                <path clipRule="evenodd" d={svgPaths.p3dd47800} fill="var(--fill-0, white)" fillRule="evenodd" />
                <path d={svgPaths.p3ecbbc60} fill="var(--stroke-0, black)" fillOpacity="0.8" mask="url(#path-1-outside-1_2001_2550)" />
              </g>
            </g>
            <defs>
              <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="26" id="filter0_d_2001_2550" width="21.9998" x="1.00016" y="0">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                <feOffset dy="1" />
                <feGaussianBlur stdDeviation="1.5" />
                <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0" />
                <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_2001_2550" />
                <feBlend in="SourceGraphic" in2="effect1_dropShadow_2001_2550" mode="normal" result="shape" />
              </filter>
            </defs>
          </svg>
        </div>
      </div>
      <div className="absolute inset-[54.12%_8.06%_44.78%_66.53%]" data-name="5.反馈/1.提示Prompt/全局提示-带链接&关闭">
        <div className="absolute bg-[#1f293a] inset-0 shadow-[0px_6px_16px_-8px_rgba(0,0,0,0.08),0px_8px_28px_0px_rgba(0,0,0,0.04),0px_12px_48px_16px_rgba(0,0,0,0.03)]" data-name="矩形备份 4" />
        <Icon1 />
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[44px] not-italic text-[#aec0de] text-[14px] top-[calc(50%-11px)] w-[210px]">这是一条提示消息，不会主动消失</p>
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[266px] not-italic text-[#4e86df] text-[14px] top-[calc(50%-11px)] w-[56px]">文字链接</p>
        <Helper3 additionalClassNames="left-[16px] top-1/2 translate-y-[-50%]" />
      </div>
      <div className="absolute inset-[55.88%_8.06%_43.02%_66.53%]" data-name="5.反馈/1.提示Prompt/全局提示-带链接&关闭备份 5">
        <div className="absolute bg-[#1f293a] inset-0 shadow-[0px_6px_16px_-8px_rgba(0,0,0,0.08),0px_8px_28px_0px_rgba(0,0,0,0.04),0px_12px_48px_16px_rgba(0,0,0,0.03)]" data-name="矩形备份 4" />
        <Icon1 />
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[44px] not-italic text-[#aec0de] text-[14px] top-[calc(50%-11px)] w-[210px]">这是一条提示消息，不会主动消失</p>
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[266px] not-italic text-[#4e86df] text-[14px] top-[calc(50%-11px)] w-[56px]">文字链接</p>
        <Helper additionalClassNames="top-1/2 translate-y-[-50%]" />
      </div>
      <div className="absolute inset-[57.64%_8.06%_41.26%_66.53%]" data-name="5.反馈/1.提示Prompt/全局提示-带链接&关闭备份 6">
        <div className="absolute bg-[#1f293a] inset-0 shadow-[0px_6px_16px_-8px_rgba(0,0,0,0.08),0px_8px_28px_0px_rgba(0,0,0,0.04),0px_12px_48px_16px_rgba(0,0,0,0.03)]" data-name="矩形备份 4" />
        <Icon1 />
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[44px] not-italic text-[#aec0de] text-[14px] top-[calc(50%-11px)] w-[210px]">这是一条提示消息，不会主动消失</p>
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[266px] not-italic text-[#4e86df] text-[14px] top-[calc(50%-11px)] w-[56px]">文字链接</p>
        <Helper5 additionalClassNames="top-1/2 translate-y-[-50%]" />
      </div>
      <div className="absolute inset-[59.41%_8.06%_39.49%_66.53%]" data-name="5.反馈/1.提示Prompt/全局提示-带链接&关闭备份 7">
        <div className="absolute bg-[#1f293a] inset-0 shadow-[0px_6px_16px_-8px_rgba(0,0,0,0.08),0px_8px_28px_0px_rgba(0,0,0,0.04),0px_12px_48px_16px_rgba(0,0,0,0.03)]" data-name="矩形备份 4" />
        <Icon1 />
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[44px] not-italic text-[#aec0de] text-[14px] top-[calc(50%-11px)] w-[210px]">这是一条提示消息，不会主动消失</p>
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[266px] not-italic text-[#4e86df] text-[14px] top-[calc(50%-11px)] w-[56px]">文字链接</p>
        <Helper7 additionalClassNames="top-1/2 translate-y-[-50%]" />
      </div>
      <div className="absolute inset-[54.12%_35.14%_44.78%_47.08%]" data-name="5.反馈/1.提示Prompt/全局提示-带链接&关闭备份">
        <div className="absolute bg-[#1f293a] inset-0 shadow-[0px_6px_16px_-8px_rgba(0,0,0,0.08),0px_8px_28px_0px_rgba(0,0,0,0.04),0px_12px_48px_16px_rgba(0,0,0,0.03)]" data-name="矩形" />
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[44px] not-italic text-[#aec0de] text-[14px] top-[calc(50%-11px)] w-[196px]">这是一条成功消息，会主动消失</p>
        <Helper3 additionalClassNames="left-[16px] top-1/2 translate-y-[-50%]" />
      </div>
      <div className="absolute inset-[55.88%_35.14%_43.02%_47.08%]" data-name="5.反馈/1.提示Prompt/全局提示-带链接&关闭备份 2">
        <div className="absolute bg-[#1f293a] inset-0 shadow-[0px_6px_16px_-8px_rgba(0,0,0,0.08),0px_8px_28px_0px_rgba(0,0,0,0.04),0px_12px_48px_16px_rgba(0,0,0,0.03)]" data-name="矩形" />
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[44px] not-italic text-[#aec0de] text-[14px] top-[calc(50%-11px)] w-[196px]">这是一条成功消息，会主动消失</p>
        <Helper additionalClassNames="top-1/2 translate-y-[-50%]" />
      </div>
      <div className="absolute inset-[57.64%_35.14%_41.26%_47.08%]" data-name="5.反馈/1.提示Prompt/全局提示-带链接&关闭备份 3">
        <div className="absolute bg-[#1f293a] inset-0 shadow-[0px_6px_16px_-8px_rgba(0,0,0,0.08),0px_8px_28px_0px_rgba(0,0,0,0.04),0px_12px_48px_16px_rgba(0,0,0,0.03)]" data-name="矩形" />
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[44px] not-italic text-[#aec0de] text-[14px] top-[calc(50%-11px)] w-[196px]">这是一条成功消息，会主动消失</p>
        <Helper5 additionalClassNames="top-1/2 translate-y-[-50%]" />
      </div>
      <div className="absolute inset-[59.41%_35.14%_39.49%_47.08%]" data-name="5.反馈/1.提示Prompt/全局提示-带链接&关闭备份 4">
        <div className="absolute bg-[#1f293a] inset-0 shadow-[0px_6px_16px_-8px_rgba(0,0,0,0.08),0px_8px_28px_0px_rgba(0,0,0,0.04),0px_12px_48px_16px_rgba(0,0,0,0.03)]" data-name="矩形" />
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[44px] not-italic text-[#aec0de] text-[14px] top-[calc(50%-11px)] w-[196px]">这是一条成功消息，会主动消失</p>
        <Helper7 additionalClassNames="top-1/2 translate-y-[-50%]" />
      </div>
      <div className="absolute inset-[70.31%_66.67%_27.43%_8.33%]" data-name="5.反馈/1.提示/通知提示框/双行-普通">
        <div className="absolute bg-[#1f293a] inset-0 shadow-[0px_6px_16px_-8px_rgba(0,0,0,0.08),0px_8px_28px_0px_rgba(0,0,0,0.04),0px_12px_48px_16px_rgba(0,0,0,0.03)]" data-name="矩形备份 4" />
        <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[24px] left-[60px] not-italic text-[#f6f9fe] text-[16px] top-[16px] w-[64px]">通知标题</p>
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[60px] not-italic text-[#8194b5] text-[14px] top-[44px] w-[154px]">这是一行通知内容的简介</p>
        <Helper3 additionalClassNames="left-[24px] top-[19px]" />
      </div>
      <div className="absolute inset-[81.44%_66.67%_16.3%_8.33%]" data-name="5.反馈/1.提示/通知提示框/双行-普通备份">
        <div className="absolute bg-[#14524b] inset-0 shadow-[0px_6px_16px_-8px_rgba(0,0,0,0.08),0px_8px_28px_0px_rgba(0,0,0,0.04),0px_12px_48px_16px_rgba(0,0,0,0.03)]" data-name="矩形备份 4" />
        <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[22px] left-[60px] not-italic text-[14px] text-[rgba(255,255,255,0.85)] top-[18px] w-[56px]">通知标题</p>
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[60px] not-italic text-[14px] text-[rgba(255,255,255,0.6)] top-[44px] w-[154px]">这是一行通知内容的简介</p>
        <Helper3 additionalClassNames="left-[24px] top-[19px]" />
      </div>
      <div className="absolute inset-[84.58%_66.67%_13.16%_8.33%]" data-name="5.反馈/1.提示/通知提示框/双行-普通备份 3">
        <div className="absolute bg-[#19366b] inset-0 shadow-[0px_6px_16px_-8px_rgba(0,0,0,0.08),0px_8px_28px_0px_rgba(0,0,0,0.04),0px_12px_48px_16px_rgba(0,0,0,0.03)]" data-name="矩形备份 4" />
        <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[22px] left-[60px] not-italic text-[14px] text-[rgba(255,255,255,0.85)] top-[18px] w-[56px]">通知标题</p>
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[60px] not-italic text-[14px] text-[rgba(255,255,255,0.6)] top-[44px] w-[154px]">这是一行通知内容的简介</p>
        <Helper3 additionalClassNames="left-[24px] top-[19px]" />
      </div>
      <div className="absolute inset-[87.72%_66.67%_10.02%_8.33%]" data-name="5.反馈/1.提示/通知提示框/双行-普通备份 4">
        <div className="absolute bg-[#561f35] inset-0 shadow-[0px_6px_16px_-8px_rgba(0,0,0,0.08),0px_8px_28px_0px_rgba(0,0,0,0.04),0px_12px_48px_16px_rgba(0,0,0,0.03)]" data-name="矩形备份 4" />
        <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[22px] left-[60px] not-italic text-[14px] text-[rgba(255,255,255,0.85)] top-[18px] w-[56px]">通知标题</p>
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[60px] not-italic text-[14px] text-[rgba(255,255,255,0.6)] top-[44px] w-[154px]">这是一行通知内容的简介</p>
        <Helper3 additionalClassNames="left-[24px] top-[19px]" />
      </div>
      <div className="absolute inset-[90.86%_66.67%_6.89%_8.33%]" data-name="5.反馈/1.提示/通知提示框/双行-普通备份 5">
        <div className="absolute bg-[#573c28] inset-0 shadow-[0px_6px_16px_-8px_rgba(0,0,0,0.08),0px_8px_28px_0px_rgba(0,0,0,0.04),0px_12px_48px_16px_rgba(0,0,0,0.03)]" data-name="矩形备份 4" />
        <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[22px] left-[60px] not-italic text-[14px] text-[rgba(255,255,255,0.85)] top-[18px] w-[56px]">通知标题</p>
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[60px] not-italic text-[14px] text-[rgba(255,255,255,0.6)] top-[44px] w-[154px]">这是一行通知内容的简介</p>
        <Helper3 additionalClassNames="left-[24px] top-[19px]" />
      </div>
      <Helper11 text="通知标题" text1="这是一行通知内容的简介" additionalClassNames="inset-[76.59%_66.67%_20.32%_8.33%]" />
      <Helper12 text="通知标题" text1="这是一行通知内容的简介" additionalClassNames="inset-[73.45%_66.67%_24.29%_8.33%]" />
      <div className="absolute inset-[67.17%_66.67%_30.57%_8.33%]" data-name="通知提示框/双行-普通">
        <div className="absolute bg-[#1f293a] inset-0 shadow-[0px_6px_16px_-8px_rgba(0,0,0,0.08),0px_8px_28px_0px_rgba(0,0,0,0.04),0px_12px_48px_16px_rgba(0,0,0,0.03)]" data-name="矩形备份 4" />
        <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[24px] left-[24px] not-italic text-[#f6f9fe] text-[16px] top-[16px] w-[64px]">通知标题</p>
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[24px] not-italic text-[#8194b5] text-[14px] top-[44px] w-[154px]">这是一行通知内容的简介</p>
      </div>
      <div className="absolute bg-[#161d2a] inset-[67.17%_8.06%_20.32%_35.56%]" data-name="矩形" />
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[normal] left-[calc(50%-147px)] not-italic text-[#f72231] text-[12px] top-[calc(50%+842.5px)] w-[294px]">距离浏览器上面和右边24px，多条通知之间卡片间隔24</p>
      <Helper11 text="通知标题" text1="这是一行通知内容的简介" additionalClassNames="inset-[67.83%_9.72%_29.08%_65.28%]" />
      <Helper12 text="通知标题" text1="这是一行通知内容的简介" additionalClassNames="inset-[71.58%_9.72%_26.16%_65.28%]" />
      <Text2 text="24" additionalClassNames="inset-[67.17%_19.93%_32.17%_77.78%]" />
      <Text1 text="24" additionalClassNames="inset-[68.99%_8.06%_30.21%_90.28%]" />
      <Text2 text="24" additionalClassNames="inset-[70.92%_19.93%_28.42%_77.78%]" />
    </div>
  );
}