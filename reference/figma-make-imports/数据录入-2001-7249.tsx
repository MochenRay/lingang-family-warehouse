import svgPaths from "./svg-cfzltnxnkr";
import clsx from "clsx";
type WrapperProps = {
  additionalClassNames?: string;
};

function Wrapper({ children, additionalClassNames = "" }: React.PropsWithChildren<WrapperProps>) {
  return (
    <div className={clsx("absolute", additionalClassNames)}>
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8 8">
        {children}
      </svg>
    </div>
  );
}
type Helper31Input4HoverProps = {
  additionalClassNames?: string;
};

function Helper31Input4Hover({ additionalClassNames = "" }: Helper31Input4HoverProps) {
  return (
    <div className={clsx("absolute h-[24px] right-[48px] translate-y-[-50%] w-[20px]", additionalClassNames)}>
      <div className="absolute bg-[#293449] bottom-0 left-0 right-0 top-1/2" data-name="矩形" />
      <div className="absolute bg-[#293449] bottom-1/2 left-0 right-0 top-0" data-name="矩形" />
      <Helper1IconLineArrowUp />
      <Helper1IconLineArrowDown />
    </div>
  );
}

function Helper1IconLineArrowDown() {
  return (
    <Wrapper additionalClassNames="inset-[58.33%_30%_8.33%_30%]">
      <g id="1.éç¨/Iconå¾æ /Line/Arrow/Down">
        <rect fill="var(--fill-0, black)" height="8" id="ç©å½¢" opacity="0.01" width="8" />
        <path clipRule="evenodd" d={svgPaths.p14ecad00} fill="var(--fill-0, #0A1B39)" fillOpacity="0.8" fillRule="evenodd" id="è·¯å¾" />
      </g>
    </Wrapper>
  );
}

function Helper1IconLineArrowUp() {
  return (
    <Wrapper additionalClassNames="inset-[8.33%_30%_58.33%_30%]">
      <g id="1.éç¨/Iconå¾æ /Line/Arrow/Up">
        <rect fill="var(--fill-0, black)" height="8" id="ç©å½¢" opacity="0.01" width="8" />
        <path clipRule="evenodd" d={svgPaths.p7089a00} fill="var(--fill-0, #0A1B39)" fillRule="evenodd" id="è·¯å¾" />
      </g>
    </Wrapper>
  );
}
type Text4Props = {
  text: string;
};

function Text4({ text }: Text4Props) {
  return (
    <div className="absolute h-[32px] left-0 top-1/2 translate-y-[-50%] w-[160px]">
      <div className="absolute bg-[#1f293a] inset-0" data-name="背景颜色" />
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[12px] not-italic text-[#8194b5] text-[14px] top-[calc(50%-11px)] w-[42px]">{text}</p>
    </div>
  );
}
type Text3Props = {
  text: string;
  additionalClassNames?: string;
};

function Text3({ text, additionalClassNames = "" }: Text3Props) {
  return (
    <div className={clsx("absolute h-[32px] overflow-clip right-0 translate-y-[-50%] w-[44px]", additionalClassNames)}>
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 44 32">
        <path clipRule="evenodd" d="M0 0H44V32H0V0Z" fill="var(--fill-0, #161D2A)" fillRule="evenodd" id="ç©å½¢" />
      </svg>
      <div className="absolute inset-[0_97.73%_0_0]" data-name="矩形">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 32">
          <path clipRule="evenodd" d="M0 0H1V32H0V0Z" fill="var(--fill-0, #293449)" fillRule="evenodd" id="ç©å½¢" />
        </svg>
      </div>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[calc(50%-10px)] not-italic text-[#8194b5] text-[14px] top-[calc(50%-11px)] w-[20px]">{text}</p>
    </div>
  );
}
type Text2Props = {
  text: string;
};

function Text2({ text }: Text2Props) {
  return (
    <div className="absolute h-[32px] left-0 top-1/2 translate-y-[-50%] w-[160px]">
      <div className="absolute bg-[#161d2a] inset-0" data-name="背景颜色" />
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[12px] not-italic text-[#8194b5] text-[14px] top-[calc(50%-11px)] w-[42px]">{text}</p>
    </div>
  );
}
type Helper40TextProps = {
  text: string;
  additionalClassNames?: string;
};

function Helper40Text({ text, additionalClassNames = "" }: Helper40TextProps) {
  return (
    <div className={clsx("absolute", additionalClassNames)}>
      <div className="absolute bg-[#1f293a] inset-0" data-name="背景颜色" />
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[12px] not-italic text-[#8194b5] text-[14px] top-[calc(50%-11px)] w-[42px]">{text}</p>
      <Helper1Icon additionalClassNames="top-1/2" />
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
      <div className="absolute bottom-[20px] h-[9px] left-0 overflow-clip right-0">
        <div className="absolute bg-[#ff1257] h-[9px] left-0 rounded-[0.5px] top-0 w-px" data-name="top-indicator" />
        <div className="absolute bg-[#ff1257] h-[9px] right-0 rounded-[0.5px] top-0 w-px" data-name="bottom-indicator" />
        <div className="absolute bg-[#ff1257] bottom-[4px] h-px left-px right-px" data-name="line" />
      </div>
      <div className="absolute bottom-[8px] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] left-0 not-italic right-0 text-[#ff1257] text-[10px] text-center tracking-[0.2px] translate-y-[50%]">
        <p className="leading-[16px]">{text}</p>
      </div>
    </div>
  );
}
type TextProps = {
  text: string;
  additionalClassNames?: string;
};

function Text({ text, additionalClassNames = "" }: TextProps) {
  return (
    <div className={clsx("absolute", additionalClassNames)}>
      <div className="absolute bg-[#161d2a] inset-0" data-name="背景颜色" />
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[12px] not-italic text-[#8194b5] text-[14px] top-[calc(50%-11px)] w-[42px]">{text}</p>
      <Helper1Icon additionalClassNames="top-1/2" />
    </div>
  );
}
type Helper1IconProps = {
  additionalClassNames?: string;
};

function Helper1Icon({ additionalClassNames = "" }: Helper1IconProps) {
  return (
    <div className={clsx("absolute right-[12px] size-[16px] translate-y-[-50%]", additionalClassNames)}>
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="1.icon/æ¹å-ä¸">
          <rect fill="var(--fill-0, black)" height="16" id="ç©å½¢" opacity="0.01" width="16" />
          <path clipRule="evenodd" d={svgPaths.p2a1dc200} fill="var(--fill-0, #0A1B39)" fillRule="evenodd" id="å½¢ç¶" />
        </g>
      </svg>
    </div>
  );
}

export default function Component() {
  return (
    <div className="bg-black relative size-full" data-name="数据录入">
      <div className="absolute h-[288px] left-[calc(50%-1px)] not-italic top-0 translate-x-[-50%] w-[1440px]" data-name="SENSORO 设计规范 / Lins备份">
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[20px] left-[calc(50%-600px)] text-[#f6f9fe] text-[12px] top-[calc(50%-64px)] w-[152px]">SENSORO 组件库/全景地图</p>
        <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[46px] left-[calc(50%-600px)] text-[#f6f9fe] text-[38px] top-[calc(50%+36px)] w-[361px]">Input 输入框</p>
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[8.33%] right-[8.33%] text-[#8194b5] text-[14px] top-[calc(50%+122px)]">数据录入是获取对象信息的重要交互方式，用户会频繁的进行信息增加、修改或删除。</p>
      </div>
      <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[28px] left-[calc(50%-600px)] not-italic text-[#f6f9fe] text-[20px] top-[calc(50%-692px)] w-[80px]">基本用法</p>
      <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[28px] left-[calc(50%-600px)] not-italic text-[#f6f9fe] text-[20px] top-[calc(50%-74px)] w-[80px]">后置标签</p>
      <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[28px] left-[calc(50%-600px)] not-italic text-[#f6f9fe] text-[20px] top-[calc(50%+408px)] w-[166px]">搜索框（Search）</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[8.33%] not-italic right-[20.63%] text-[#8194b5] text-[14px] top-[calc(50%-648px)]">通过鼠标或键盘输入内容，表单基础组成元素之一。</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[calc(50%-600px)] not-italic text-[#8194b5] text-[14px] top-[calc(50%-30px)] w-[322px]">用于配置一些固定组合，常用于带单位的数据输入。</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[calc(50%-600px)] not-italic text-[#8194b5] text-[14px] top-[calc(50%+452px)] w-[462px]">搜索可以让用户在巨大的信息池中缩小目标范围，并快速获取需要的信息。</p>
      <div className="absolute bg-[#722ed1] inset-[33.64%_-6.94%_63.64%_102.78%]" data-name="矩形备份 21" />
      <div className="absolute bg-[#eb2f96] inset-[33.64%_-16.39%_63.64%_112.22%]" data-name="矩形备份 22" />
      <div className="absolute bottom-0 h-[130px] left-1/2 translate-x-[-50%] w-[1440px]" data-name="底部备份 3">
        <div className="absolute bg-[#293449] inset-[0_120px_99.23%_120px]" data-name="Divider Color" />
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[120px] not-italic text-[#aec0de] text-[14px] top-[calc(50%-37px)] w-[294px]">有一天，所有人所有事所有物都会发出一个信号</p>
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] not-italic right-[120px] text-[#aec0de] text-[14px] text-right top-[calc(50%-37px)] w-[197px]">SENSORO 设计规范 / Lins 4.0</p>
      </div>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[20px] left-[calc(50%-551px)] not-italic text-[#8194b5] text-[14px] text-right top-[calc(50%+532px)] translate-x-[-100%] w-[47px]">Default</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[20px] left-[calc(50%-551px)] not-italic text-[#8194b5] text-[14px] text-right top-[calc(50%+748px)] translate-x-[-100%] w-[38px]">Finish</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[20px] left-[calc(50%-551px)] not-italic text-[#8194b5] text-[14px] text-right top-[calc(50%+820px)] translate-x-[-100%] w-[55px]">Dissable</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[20px] left-[calc(50%-551px)] not-italic text-[#8194b5] text-[14px] text-right top-[calc(50%+604px)] translate-x-[-100%] w-[38px]">Hover</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[20px] left-[calc(50%-551px)] not-italic text-[#8194b5] text-[14px] text-right top-[calc(50%+676px)] translate-x-[-100%] w-[33px]">Click</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[20px] left-[calc(50%-551px)] not-italic text-[#8194b5] text-[14px] text-right top-[calc(50%-568px)] translate-x-[-100%] w-[47px]">Default</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[20px] left-[calc(50%-551px)] not-italic text-[#8194b5] text-[14px] text-right top-[calc(50%+46px)] translate-x-[-100%] w-[47px]">Default</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[20px] left-[calc(50%-551px)] not-italic text-[#8194b5] text-[14px] text-right top-[calc(50%-496px)] translate-x-[-100%] w-[38px]">Hover</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[20px] left-[calc(50%-551px)] not-italic text-[#8194b5] text-[14px] text-right top-[calc(50%+110px)] translate-x-[-100%] w-[38px]">Hover</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[20px] left-[calc(50%-551px)] not-italic text-[#8194b5] text-[14px] text-right top-[calc(50%-423px)] translate-x-[-100%] w-[33px]">Click</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[20px] left-[calc(50%-551px)] not-italic text-[#8194b5] text-[14px] text-right top-[calc(50%+174px)] translate-x-[-100%] w-[33px]">Click</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[20px] left-[calc(50%-551px)] not-italic text-[#8194b5] text-[14px] text-right top-[calc(50%-351px)] translate-x-[-100%] w-[38px]">Finish</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[20px] left-[calc(50%-551px)] not-italic text-[#8194b5] text-[14px] text-right top-[calc(50%+238px)] translate-x-[-100%] w-[38px]">Finish</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[20px] left-[calc(50%-551px)] not-italic text-[#8194b5] text-[14px] text-right top-[calc(50%-278px)] translate-x-[-100%] w-[55px]">Dissable</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[20px] left-[calc(50%-551px)] not-italic text-[#8194b5] text-[14px] text-right top-[calc(50%+302px)] translate-x-[-100%] w-[55px]">Dissable</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[20px] left-[calc(50%-551px)] not-italic text-[#8194b5] text-[14px] text-right top-[calc(50%-206px)] translate-x-[-100%] w-[28px]">校验</p>
      <Text text="请输入" additionalClassNames="inset-[73.73%_68.82%_24.45%_14.51%]" />
      <div className="absolute inset-[73.73%_46.6%_24.41%_36.74%] overflow-clip" data-name="选择器-40备份">
        <div className="absolute bg-[#161d2a] inset-[0_0_1px_0]" data-name="背景颜色" />
        <div className="absolute bg-[#d52132] inset-[21.95%_16.67%_24.39%_5%] opacity-20" data-name="矩形" />
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[12px] not-italic text-[#8194b5] text-[14px] top-[calc(50%-11.5px)] w-[42px]">请输入</p>
        <Helper1Icon additionalClassNames="top-[calc(50%-0.5px)]" />
        <Text1 text="12" additionalClassNames="inset-[29.27%_95%_0_0]" />
        <Text1 text="12" additionalClassNames="inset-[29.27%_0_0_95%]" />
        <Text1 text="12" additionalClassNames="inset-[29.27%_11.67%_0_83.33%]" />
      </div>
      <Text text="灵思智能服务" additionalClassNames="inset-[83.55%_68.82%_14.64%_14.51%]" />
      <Text text="灵思智能服务" additionalClassNames="inset-[86.82%_68.82%_11.36%_14.51%]" />
      <Helper40Text text="请输入" additionalClassNames="inset-[77%_68.82%_21.18%_14.51%]" />
      <Helper40Text text="灵思智能服务" additionalClassNames="inset-[80.27%_68.82%_17.91%_14.51%]" />
      <div className="absolute inset-[23.73%_68.82%_74.45%_14.51%]" data-name="选择器-40备份 12">
        <div className="absolute bg-[#161d2a] inset-0" data-name="背景颜色" />
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[12px] not-italic text-[#8194b5] text-[14px] top-[calc(50%-11px)] w-[42px]">请输入</p>
      </div>
      <div className="absolute inset-[51.82%_74.38%_46.73%_14.51%]" data-name="选择器-40备份 14">
        <Text2 text="请输入" />
        <Text3 text="km" additionalClassNames="top-1/2" />
      </div>
      <div className="absolute inset-[60.55%_74.38%_38%_14.51%]" data-name="选择器-40备份 21">
        <Text2 text="123" />
        <Text3 text="km" additionalClassNames="top-1/2" />
      </div>
      <div className="absolute inset-[63.45%_74.38%_35.09%_14.51%]" data-name="选择器-40备份 22">
        <Text2 text="123" />
        <Text3 text="km" additionalClassNames="top-1/2" />
      </div>
      <div className="absolute inset-[54.73%_74.38%_43.82%_14.51%]" data-name="选择器-40备份 19">
        <Text4 text="请输入" />
        <Text3 text="km" additionalClassNames="top-1/2" />
        <Helper31Input4Hover additionalClassNames="top-1/2" />
      </div>
      <div className="absolute inset-[54.73%_47.71%_43.55%_41.18%] overflow-clip" data-name="选择器-40备份 24">
        <div className="absolute bg-[#1f293a] inset-[0_0_6px_0]" data-name="背景颜色" />
        <div className="absolute bg-[#d52132] inset-[13.16%_45%_28.95%_7.5%] opacity-20" data-name="矩形" />
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[12px] not-italic text-[#8194b5] text-[14px] top-[calc(50%-14px)] w-[42px]">请输入</p>
        <Text3 text="km" additionalClassNames="top-[calc(50%-3px)]" />
        <Helper31Input4Hover additionalClassNames="top-[calc(50%-3px)]" />
        <Text1 text="12" additionalClassNames="inset-[23.68%_92.5%_0_0]" />
        <Text1 text="4" additionalClassNames="inset-[23.68%_42.5%_0_55%]" />
      </div>
      <div className="absolute inset-[54.73%_61.04%_43.82%_27.85%]" data-name="选择器-40备份 23">
        <Text4 text="请输入" />
        <Text3 text="km" additionalClassNames="top-1/2" />
        <div className="absolute h-[24px] right-[48px] top-1/2 translate-y-[-50%] w-[20px]" data-name="3.数据录入/1.input输入框/4.数字输入-Hover/切换/默认">
          <div className="absolute bg-[#314059] bottom-0 left-0 right-0 top-1/2" data-name="矩形" />
          <div className="absolute bg-[#293449] bottom-1/2 left-0 right-0 top-0" data-name="矩形" />
          <Helper1IconLineArrowUp />
          <Helper1IconLineArrowDown />
        </div>
      </div>
      <div className="absolute inset-[57.64%_74.38%_40.91%_14.51%]" data-name="选择器-40备份 20">
        <Text3 text="km" additionalClassNames="top-1/2" />
        <div className="absolute h-[32px] left-0 overflow-clip top-1/2 translate-y-[-50%] w-[117px]" data-name="2.数据录入/输入框/40">
          <div className="absolute bg-[#1f293a] border border-[#2761cb] border-solid inset-0" data-name="背景颜色" />
          <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[12px] not-italic text-[#aec0de] text-[14px] top-[calc(50%-11px)] w-[23px]">123</p>
        </div>
        <Helper31Input4Hover additionalClassNames="top-1/2" />
        <div className="absolute bg-[#f6f9fe] inset-[28.13%_76.88%_28.13%_22.5%]" data-name="矩形" />
      </div>
      <div className="absolute inset-[23.73%_46.6%_74.18%_36.74%] overflow-clip" data-name="选择器-40备份 13">
        <div className="absolute bg-[#161d2a] inset-[0_0_6px_0]" data-name="背景颜色" />
        <div className="absolute bg-[#d52132] inset-[19.57%_5%_32.61%_5%] opacity-20" data-name="矩形" />
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[12px] not-italic text-[#8194b5] text-[14px] top-[calc(50%-14px)] w-[42px]">请输入</p>
        <Text1 text="12" additionalClassNames="inset-[36.96%_95%_0_0]" />
        <Text1 text="12" additionalClassNames="inset-[36.96%_0_0_95%]" />
      </div>
      <div className="absolute inset-[27%_68.82%_71.18%_14.51%]" data-name="选择器-40备份 15">
        <div className="absolute bg-[#1f293a] inset-0" data-name="背景颜色" />
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[12px] not-italic text-[#8194b5] text-[14px] top-[calc(50%-11px)] w-[42px]">请输入</p>
      </div>
      <div className="absolute inset-[30.27%_68.82%_67.91%_14.51%]" data-name="选择器-40备份 16">
        <div className="absolute bg-[#1f293a] inset-0" data-name="背景颜色" />
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[12px] not-italic text-[#8194b5] text-[14px] top-[calc(50%-11px)] w-[42px]">灵思智能服务</p>
      </div>
      <div className="absolute bg-[#f6f9fe] inset-[30.82%_78.61%_68.45%_21.32%]" data-name="矩形" />
      <div className="absolute inset-[33.55%_68.82%_64.64%_14.51%]" data-name="选择器-40备份 17">
        <div className="absolute bg-[#161d2a] inset-0" data-name="背景颜色" />
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[12px] not-italic text-[#8194b5] text-[14px] top-[calc(50%-11px)] w-[42px]">灵思智能服务</p>
      </div>
      <div className="absolute inset-[36.82%_68.82%_61.36%_14.51%]" data-name="选择器-40备份 18">
        <div className="absolute bg-[#161d2a] inset-0" data-name="背景颜色" />
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[12px] not-italic text-[#8194b5] text-[14px] top-[calc(50%-11px)] w-[42px]">灵思智能服务</p>
      </div>
      <div className="absolute inset-[40.09%_67.85%_57%_14.51%]" data-name="校验">
        <div className="absolute inset-[0_0_37.5%_0]" data-name="选择器-40备份 19">
          <div className="absolute bg-[rgba(213,33,50,0.08)] inset-0" data-name="背景颜色" />
          <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[12px] not-italic text-[#8194b5] text-[14px] top-[calc(50%-11px)] w-[42px]">我是文案</p>
        </div>
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[20px] left-[calc(50%-120px)] not-italic text-[#e7484f] text-[12px] top-[calc(50%+12px)] w-[72px]">我是校验文案</p>
      </div>
      <div className="absolute bg-[#f6f9fe] inset-[80.82%_78.68%_18.45%_21.25%]" data-name="矩形" />
      <div className="absolute inset-[55.64%_64.51%_43.27%_33.82%]" data-name="4.icon/Pointer">
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
    </div>
  );
}