import svgPaths from "./svg-5azy3eqfj9";
import clsx from "clsx";
import img from "figma:asset/4cb6525c59760e7d56f8b4175e8ee7f5e7e638ab.png";

function Wrapper2({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="absolute h-[27.987px] mix-blend-overlay translate-x-[-50%] w-[28px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 28 27.9874">
        {children}
      </svg>
    </div>
  );
}
type Wrapper1Props = {
  additionalClassNames?: string;
};

function Wrapper1({ children, additionalClassNames = "" }: React.PropsWithChildren<Wrapper1Props>) {
  return (
    <div className={clsx("absolute", additionalClassNames)}>
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        {children}
      </svg>
    </div>
  );
}

function Helper4Icon1({ children }: React.PropsWithChildren<{}>) {
  return (
    <Wrapper1 additionalClassNames="inset-[30%_84.44%_30%_6.67%]">
      <g id="4.icon/å®å¨ä¸­å¿">{children}</g>
    </Wrapper1>
  );
}

function Wrapper({ children }: React.PropsWithChildren<{}>) {
  return (
    <Wrapper1 additionalClassNames="inset-[30%_84.44%_30%_6.67%]">
      <g id="Line/æ»è§">{children}</g>
    </Wrapper1>
  );
}
type Component90Helper2Props = {
  additionalClassNames?: string;
};

function Component90Helper2({ additionalClassNames = "" }: Component90Helper2Props) {
  return (
    <div className={clsx("absolute", additionalClassNames)}>
      <div className="absolute inset-[-318.2%_-1.04%_-318.2%_0]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 48.5 7.36396">
          <path d={svgPaths.p1dce4000} fill="var(--stroke-0, #D52132)" id="è·¯å¾ 5" />
        </svg>
      </div>
    </div>
  );
}
type Component90Helper1Props = {
  additionalClassNames?: string;
};

function Component90Helper1({ additionalClassNames = "" }: Component90Helper1Props) {
  return (
    <div className={clsx("absolute", additionalClassNames)}>
      <div className="absolute inset-[0_-318.2%_-1.04%_-318.2%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7.36396 48.5">
          <path d={svgPaths.pd08d380} fill="var(--stroke-0, #D52132)" id="è·¯å¾ 3" />
        </svg>
      </div>
    </div>
  );
}
type Component90HelperProps = {
  additionalClassNames?: string;
};

function Component90Helper({ additionalClassNames = "" }: Component90HelperProps) {
  return (
    <div className={clsx("absolute", additionalClassNames)}>
      <div className="absolute inset-[-318.2%_-0.89%_-318.2%_0]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 56.5 7.36396">
          <path d={svgPaths.pce92b80} fill="var(--stroke-0, #D52132)" id="è·¯å¾ 2" />
        </svg>
      </div>
    </div>
  );
}
type Helper18Props = {
  additionalClassNames?: string;
};

function Helper18({ additionalClassNames = "" }: Helper18Props) {
  return (
    <div className={clsx("absolute", additionalClassNames)}>
      <div className="absolute bg-[#0d121b] inset-0" data-name="矩形备份" />
      <Helper17 text="推理分析" text1="巡航管理" text2="城市巡航" text3="/" text4="/" />
    </div>
  );
}
type Helper17Props = {
  text: string;
  text1: string;
  text2: string;
  text3: string;
  text4: string;
};

function Helper17({ text, text1, text2, text3, text4 }: Helper17Props) {
  return (
    <div className="absolute bottom-[27.5%] left-[20px] overflow-clip top-[45%] w-[263px]">
      <div className="absolute bg-[#314059] inset-[18.18%_87.45%_18.18%_12.17%]" data-name="矩形备份" />
      <div className="absolute contents inset-[13.64%_93.92%_13.64%_0]">
        <div className="absolute bg-black inset-[13.64%_93.92%_13.64%_0] opacity-0" data-name="矩形" />
        <div className="absolute inset-[32.91%_94.58%_32.94%_0.81%]" data-name="路径">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12.1299 7.513">
            <path clipRule="evenodd" d={svgPaths.p17ffdd80} fill="var(--fill-0, #0A1B39)" fillRule="evenodd" id="è·¯å¾" />
          </svg>
        </div>
      </div>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[calc(50%-82.5px)] not-italic text-[#8194b5] text-[14px] top-[calc(50%-11px)] w-[56px]">{text}</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[calc(50%+75.5px)] not-italic text-[#f6f9fe] text-[14px] top-[calc(50%-11px)] w-[56px]">{text1}</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[calc(50%-3.5px)] not-italic text-[#546789] text-[14px] top-[calc(50%-11px)] w-[56px]">{text2}</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[calc(50%-18.5px)] not-italic text-[#8194b5] text-[14px] top-[calc(50%-11px)] w-[7px]">{text3}</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[calc(50%+60.5px)] not-italic text-[#8194b5] text-[14px] top-[calc(50%-11px)] w-[7px]">{text4}</p>
    </div>
  );
}
type Text10Props = {
  text: string;
  additionalClassNames?: string;
};

function Text10({ text, additionalClassNames = "" }: Text10Props) {
  return (
    <div className={clsx("absolute", additionalClassNames)}>
      <Indicator />
      <div className="absolute bottom-[3px] flex flex-col font-['PingFang_SC:Regular',sans-serif] justify-center leading-[0] not-italic right-[20px] text-[#ff1257] text-[10px] top-[3px] tracking-[0.2px] translate-x-[100%] w-[20px]">
        <p className="leading-[16px]">{text}</p>
      </div>
    </div>
  );
}
type Text9Props = {
  text: string;
  additionalClassNames?: string;
};

function Text9({ text, additionalClassNames = "" }: Text9Props) {
  return (
    <div className={additionalClassNames}>
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
type Text8Props = {
  text: string;
  additionalClassNames?: string;
};

function Text8({ text, additionalClassNames = "" }: Text8Props) {
  return <Text9 text={text} additionalClassNames={clsx("absolute bottom-[13.75%] top-1/2", additionalClassNames)} />;
}
type Helper16Props = {
  text: string;
  text1: string;
};

function Helper16({ text, text1 }: Helper16Props) {
  return (
    <div className="absolute bottom-[30%] font-['PingFang_SC:Regular',sans-serif] leading-[20px] not-italic overflow-clip right-[24px] text-[#8194b5] text-[12px] top-[45%] w-[201px]">
      <p className="absolute left-[calc(50%-100.5px)] top-[calc(50%-10px)] w-[72px]">{text}</p>
      <p className="absolute left-[calc(50%-20.5px)] top-[calc(50%-10px)] w-[121px]">{text1}</p>
    </div>
  );
}
type Text7Props = {
  text: string;
  additionalClassNames?: string;
};

function Text7({ text, additionalClassNames = "" }: Text7Props) {
  return (
    <div className={clsx("absolute", additionalClassNames)}>
      <Indicator />
      <div className="absolute bottom-0 flex flex-col font-['PingFang_SC:Regular',sans-serif] justify-center leading-[0] not-italic right-[20px] text-[#ff1257] text-[10px] top-0 tracking-[0.2px] translate-x-[100%] w-[20px]">
        <p className="leading-[16px]">{text}</p>
      </div>
    </div>
  );
}
type Text6Props = {
  text: string;
  additionalClassNames?: string;
};

function Text6({ text, additionalClassNames = "" }: Text6Props) {
  return (
    <div className={clsx("absolute", additionalClassNames)}>
      <Indicator />
      <div className="absolute bottom-[4px] flex flex-col font-['PingFang_SC:Regular',sans-serif] justify-center leading-[0] not-italic right-[20px] text-[#ff1257] text-[10px] top-[4px] tracking-[0.2px] translate-x-[100%] w-[20px]">
        <p className="leading-[16px]">{text}</p>
      </div>
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

function Logo() {
  return (
    <div className="absolute contents left-[calc(50%+4px)] top-0 translate-x-[-50%]">
      <div className="absolute left-[calc(50%+4px)] size-[32px] top-0 translate-x-[-50%]" data-name="矩形" />
      <div className="absolute contents left-[calc(50%+4px)] top-[2px] translate-x-[-50%]">
        <Helper15 additionalClassNames="left-[calc(50%+4px)] top-[2px]" />
        <div className="absolute contents left-[calc(50%+4px)] top-[2px] translate-x-[-50%]">
          <Helper6 additionalClassNames="left-[calc(50%+12.27px)] top-[25.84px]" />
          <Helper7 additionalClassNames="left-[calc(50%-7.36px)] top-[5.87px]" />
          <Helper9 additionalClassNames="left-[calc(50%+10.93px)] top-[17.44px]" />
          <Helper10 additionalClassNames="left-[calc(50%+3.53px)] top-[3.74px]" />
          <Helper11 additionalClassNames="left-[calc(50%-4.45px)] top-[2.3px]" />
          <Helper12 additionalClassNames="left-[calc(50%+13.16px)] top-[13.15px]" />
          <Helper13 additionalClassNames="left-[calc(50%+4px)] top-[2px]" />
          <Helper14 additionalClassNames="left-[calc(50%+4px)] top-[2px]" />
        </div>
      </div>
    </div>
  );
}
type Helper15Props = {
  additionalClassNames?: string;
};

function Helper15({ additionalClassNames = "" }: Helper15Props) {
  return (
    <div className={clsx("absolute size-[28px] translate-x-[-50%]", additionalClassNames)}>
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 28 28">
        <path d={svgPaths.p2c21d4f0} fill="url(#paint0_linear_2001_23237)" id="å½¢ç¶" />
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_2001_23237" x1="15.0509" x2="32.3257" y1="32.6889" y2="14.4045">
            <stop stopColor="#C9D6EA" />
            <stop offset="0.544819" stopColor="#AEC0DE" />
            <stop offset="1" stopColor="#8194B5" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
type Helper14Props = {
  additionalClassNames?: string;
};

function Helper14({ additionalClassNames = "" }: Helper14Props) {
  return (
    <Wrapper2 additionalClassNames={additionalClassNames}>
      <g id="å½¢ç¶" opacity="0.25" style={{ mixBlendMode: "overlay" }}>
        <path clipRule="evenodd" d={svgPaths.p33eae200} fill="var(--fill-0, white)" fillRule="evenodd" />
      </g>
    </Wrapper2>
  );
}
type Helper13Props = {
  additionalClassNames?: string;
};

function Helper13({ additionalClassNames = "" }: Helper13Props) {
  return (
    <Wrapper2 additionalClassNames={additionalClassNames}>
      <g id="å½¢ç¶" opacity="0.2" style={{ mixBlendMode: "overlay" }}>
        <path clipRule="evenodd" d={svgPaths.p33eae200} fill="var(--fill-0, white)" fillRule="evenodd" />
      </g>
    </Wrapper2>
  );
}
type Helper12Props = {
  additionalClassNames?: string;
};

function Helper12({ additionalClassNames = "" }: Helper12Props) {
  return (
    <div className={clsx("absolute h-[9.838px] mix-blend-overlay translate-x-[-50%] w-[3.368px]", additionalClassNames)}>
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3.36761 9.83784">
        <g id="è·¯å¾" opacity="0.25" style={{ mixBlendMode: "overlay" }}>
          <path d={svgPaths.p8fac880} fill="var(--fill-0, white)" />
        </g>
      </svg>
    </div>
  );
}
type Helper11Props = {
  additionalClassNames?: string;
};

function Helper11({ additionalClassNames = "" }: Helper11Props) {
  return (
    <div className={clsx("absolute h-[13.811px] mix-blend-overlay translate-x-[-50%] w-[11.099px]", additionalClassNames)}>
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11.0991 13.8108">
        <g id="è·¯å¾" opacity="0.25" style={{ mixBlendMode: "overlay" }}>
          <path d={svgPaths.p46ecd72} fill="var(--fill-0, white)" />
        </g>
      </svg>
    </div>
  );
}
type Helper10Props = {
  additionalClassNames?: string;
};

function Helper10({ additionalClassNames = "" }: Helper10Props) {
  return (
    <div className={clsx("absolute h-[24.345px] mix-blend-overlay translate-x-[-50%] w-[22.351px]", additionalClassNames)}>
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 22.351 24.345">
        <g id="è·¯å¾" opacity="0.2" style={{ mixBlendMode: "overlay" }}>
          <path d={svgPaths.p156fd00} fill="var(--fill-0, white)" />
        </g>
      </svg>
    </div>
  );
}
type Helper9Props = {
  additionalClassNames?: string;
};

function Helper9({ additionalClassNames = "" }: Helper9Props) {
  return (
    <div className={clsx("absolute h-[12.6px] mix-blend-overlay translate-x-[-50%] w-[13.987px]", additionalClassNames)}>
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13.9874 12.6">
        <g id="è·¯å¾" opacity="0.2" style={{ mixBlendMode: "overlay" }}>
          <path d={svgPaths.p24b21b80} fill="var(--fill-0, white)" />
        </g>
      </svg>
    </div>
  );
}
type Helper8Props = {
  additionalClassNames?: string;
};

function Helper8({ additionalClassNames = "" }: Helper8Props) {
  return (
    <div className={additionalClassNames}>
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <g id="è·¯å¾"></g>
      </svg>
    </div>
  );
}
type Helper7Props = {
  additionalClassNames?: string;
};

function Helper7({ additionalClassNames = "" }: Helper7Props) {
  return <Helper8 additionalClassNames={clsx("absolute h-[5.045px] translate-x-[-50%] w-[3.342px]", additionalClassNames)} />;
}
type Helper6Props = {
  additionalClassNames?: string;
};

function Helper6({ additionalClassNames = "" }: Helper6Props) {
  return <Helper8 additionalClassNames={clsx("absolute h-[2.523px] translate-x-[-50%] w-[3.443px]", additionalClassNames)} />;
}

function Line5() {
  return (
    <Wrapper1 additionalClassNames="inset-1/4">
      <g id="Line/åºç¨å¸åº">
        <rect fill="var(--fill-0, black)" height="16" id="ç©å½¢" opacity="0.01" width="16" />
        <path clipRule="evenodd" d={svgPaths.p2fa37e00} fill="var(--fill-0, #0A1B39)" fillRule="evenodd" id="å½¢ç¶" />
      </g>
    </Wrapper1>
  );
}

function Line4() {
  return (
    <Wrapper1 additionalClassNames="inset-1/4">
      <g id="Line/é¢è­¦">
        <rect fill="var(--fill-0, black)" height="16" id="ç©å½¢" opacity="0.01" width="16" />
        <path clipRule="evenodd" d={svgPaths.p2ff5e680} fill="var(--fill-0, #0A1B39)" fillRule="evenodd" id="å½¢ç¶" />
      </g>
    </Wrapper1>
  );
}

function Line3() {
  return (
    <Wrapper1 additionalClassNames="inset-1/4">
      <g id="Line/å¨æ¯å°å¾">
        <rect fill="var(--fill-0, black)" height="16" id="ç©å½¢" opacity="0.01" width="16" />
        <path clipRule="evenodd" d={svgPaths.p202439c0} fill="var(--fill-0, #0A1B39)" fillRule="evenodd" id="å½¢ç¶" />
      </g>
    </Wrapper1>
  );
}

function Helper4Icon() {
  return (
    <Wrapper1 additionalClassNames="inset-1/4">
      <g id="4.icon/è½®å·¡">
        <rect fill="var(--fill-0, black)" height="16" id="ç©å½¢" opacity="0.01" width="16" />
        <path clipRule="evenodd" d={svgPaths.p3ddc64e0} fill="var(--fill-0, #0A1B39)" fillRule="evenodd" id="å½¢ç¶" />
      </g>
    </Wrapper1>
  );
}

function Line2() {
  return (
    <Wrapper1 additionalClassNames="inset-1/4">
      <g id="Line/å·¡èªå¼æ">
        <rect fill="var(--fill-0, black)" height="16" id="ç©å½¢" opacity="0.01" width="16" />
        <path clipRule="evenodd" d={svgPaths.pff36b80} fill="var(--fill-0, #0A1B39)" fillRule="evenodd" id="å½¢ç¶" />
      </g>
    </Wrapper1>
  );
}

function Line1() {
  return (
    <Wrapper1 additionalClassNames="inset-1/4">
      <g id="Line/è¯­ä¹æºæ">
        <rect fill="var(--fill-0, black)" height="16" id="ç©å½¢" opacity="0.01" width="16" />
        <path clipRule="evenodd" d={svgPaths.p38b04600} fill="var(--fill-0, #0A1B39)" fillRule="evenodd" id="å½¢ç¶" />
      </g>
    </Wrapper1>
  );
}

function Line() {
  return (
    <Wrapper1 additionalClassNames="inset-1/4">
      <g id="Line/æ°æ®æ´å¯">
        <rect fill="var(--fill-0, black)" height="16" id="ç©å½¢" opacity="0.01" width="16" />
        <path clipRule="evenodd" d={svgPaths.p321e7b00} fill="var(--fill-0, #0A1B39)" fillRule="evenodd" id="å½¢ç¶" />
      </g>
    </Wrapper1>
  );
}
type Helper5Props = {
  additionalClassNames?: string;
};

function Helper5({ additionalClassNames = "" }: Helper5Props) {
  return (
    <Wrapper1 additionalClassNames={additionalClassNames}>
      <g id="Line/åæ¢">
        <rect fill="var(--fill-0, black)" height="16" id="ç©å½¢" opacity="0.01" width="16" />
        <path clipRule="evenodd" d={svgPaths.pc659b80} fill="var(--fill-0, #0A1B39)" fillRule="evenodd" id="å½¢ç¶" />
      </g>
    </Wrapper1>
  );
}

function Helper4() {
  return (
    <svg fill="none" preserveAspectRatio="none" viewBox="0 0 16 16" className="block size-full">
      <g id="Line/åå¸ç®å">
        <rect fill="var(--fill-0, black)" height="16" id="ç©å½¢" opacity="0.01" width="16" />
        <path clipRule="evenodd" d={svgPaths.p177e7c40} fill="var(--fill-0, #0A1B39)" fillRule="evenodd" id="å½¢ç¶" />
      </g>
    </svg>
  );
}

function Helper3() {
  return (
    <div className="absolute inset-1/4">
      <Helper4 />
    </div>
  );
}
type Helper2Props = {
  additionalClassNames?: string;
};

function Helper2({ additionalClassNames = "" }: Helper2Props) {
  return (
    <div className={clsx("absolute flex items-center justify-center", additionalClassNames)}>
      <div className="flex-none h-[7px] scale-y-[-100%] w-[10.39px]">
        <Helper additionalClassNames="relative size-full" />
      </div>
    </div>
  );
}
type Helper1Props = {
  additionalClassNames?: string;
};

function Helper1({ additionalClassNames = "" }: Helper1Props) {
  return (
    <div className={clsx("absolute flex items-center justify-center", additionalClassNames)}>
      <div className="flex-none scale-y-[-100%] size-[14px]">
        <div className="bg-black opacity-0 size-full" data-name="矩形" />
      </div>
    </div>
  );
}
type Text5Props = {
  text: string;
  additionalClassNames?: string;
};

function Text5({ text, additionalClassNames = "" }: Text5Props) {
  return (
    <div className={clsx("absolute", additionalClassNames)}>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[calc(50%-24px)] not-italic text-[#aec0de] text-[14px] top-[calc(50%-11px)] w-[84px]">{text}</p>
    </div>
  );
}
type Text4Props = {
  text: string;
  additionalClassNames?: string;
};

function Text4({ text, additionalClassNames = "" }: Text4Props) {
  return (
    <div className={clsx("absolute", additionalClassNames)}>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[calc(50%-38px)] not-italic text-[#aec0de] text-[14px] top-[calc(50%-11px)] w-[56px]">{text}</p>
    </div>
  );
}
type HelperProps = {
  additionalClassNames?: string;
};

function Helper({ additionalClassNames = "" }: HelperProps) {
  return (
    <div className={additionalClassNames}>
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.3903 7">
        <path clipRule="evenodd" d={svgPaths.p1cac700} fill="var(--fill-0, #546789)" fillRule="evenodd" id="è·¯å¾" />
      </svg>
    </div>
  );
}
type Text3Props = {
  text: string;
  additionalClassNames?: string;
};

function Text3({ text, additionalClassNames = "" }: Text3Props) {
  return (
    <div className={clsx("absolute", additionalClassNames)}>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[calc(50%-50px)] not-italic text-[#aec0de] text-[14px] top-[calc(50%-11px)] w-[56px]">{text}</p>
      <Wrapper1 additionalClassNames="inset-[30%_84.44%_30%_6.67%]">
        <g id="Line/æ°æ®èµäº§">
          <rect fill="var(--fill-0, black)" height="16" id="ç©å½¢" opacity="0.01" width="16" />
          <path clipRule="evenodd" d={svgPaths.p5c0f280} fill="var(--fill-0, #8194B5)" fillRule="evenodd" id="å½¢ç¶" />
        </g>
      </Wrapper1>
    </div>
  );
}
type Text2Props = {
  text: string;
  additionalClassNames?: string;
};

function Text2({ text, additionalClassNames = "" }: Text2Props) {
  return (
    <div className={clsx("absolute", additionalClassNames)}>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[calc(50%-50px)] not-italic text-[#aec0de] text-[14px] top-[calc(50%-11px)] w-[56px]">{text}</p>
      <Wrapper1 additionalClassNames="inset-[30%_84.44%_30%_6.67%]">
        <g id="4.icon/ä»»å¡">
          <rect fill="var(--fill-0, black)" height="16" id="ç©å½¢" opacity="0.01" width="16" />
          <path clipRule="evenodd" d={svgPaths.p10c75600} fill="var(--fill-0, #8194B5)" fillRule="evenodd" id="å½¢ç¶" />
        </g>
      </Wrapper1>
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
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[calc(50%-50px)] not-italic text-[#aec0de] text-[14px] top-[calc(50%-11px)] w-[56px]">{text}</p>
      <Wrapper1 additionalClassNames="inset-[30%_84.44%_30%_6.67%]">
        <g id="4.icon/é¡¹ç®">
          <rect fill="var(--fill-0, black)" height="16" id="ç©å½¢" opacity="0.01" width="16" />
          <path clipRule="evenodd" d={svgPaths.pc8c8400} fill="var(--fill-0, #8194B5)" fillRule="evenodd" id="å½¢ç¶" />
        </g>
      </Wrapper1>
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
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[calc(50%-50px)] not-italic text-[#aec0de] text-[14px] top-[calc(50%-11px)] w-[56px]">{text}</p>
      <Wrapper>
        <rect fill="var(--fill-0, black)" height="16" id="ç©å½¢" opacity="0.01" width="16" />
        <path clipRule="evenodd" d={svgPaths.p7514b00} fill="var(--fill-0, #8194B5)" fillRule="evenodd" id="å½¢ç¶" />
      </Wrapper>
    </div>
  );
}

export default function Component() {
  return (
    <div className="bg-black relative size-full" data-name="导航">
      <div className="absolute h-[288px] left-[calc(50%-1px)] not-italic top-0 translate-x-[-50%] w-[1440px]" data-name="SENSORO 设计规范 / Lins备份">
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[20px] left-[calc(50%-600px)] text-[#f6f9fe] text-[12px] top-[calc(50%-64px)] w-[152px]">SENSORO 组件库/全景地图</p>
        <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[46px] left-[calc(50%-600px)] text-[#f6f9fe] text-[38px] top-[calc(50%+36px)] w-[361px]">Navigation 导航</p>
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[8.33%] right-[8.33%] text-[#8194b5] text-[14px] top-[calc(50%+122px)]">任何告知用户他在哪里，他能去什么地方以及如何到达那里的方式，都可以称之为导航。</p>
      </div>
      <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[28px] left-[calc(50%-600px)] not-italic text-[#f6f9fe] text-[20px] top-[calc(50%-1498px)] w-[80px]">全局导航</p>
      <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[28px] left-[calc(50%-600px)] not-italic text-[#f6f9fe] text-[20px] top-[calc(50%-364px)] w-[60px]">面包屑</p>
      <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[28px] left-[calc(50%-600px)] not-italic text-[#f6f9fe] text-[20px] top-[calc(50%+640px)] w-[60px]">控制台</p>
      <div className="absolute inset-[69.83%_76.39%_6.56%_8.33%]" data-name="控制台-收起">
        <div className="absolute bg-[#0d121b] inset-0" data-name="矩形" />
        <div className="absolute h-[280px] left-[9.09%] overflow-clip right-[9.09%] top-[32px]" data-name="编组">
          <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[24px] left-[calc(50%-90px)] not-italic text-[#f6f9fe] text-[16px] top-[calc(50%-140px)] w-[48px]">控制台</p>
          <Text text="平台管理" additionalClassNames="inset-[14.29%_0_71.43%_0]" />
          <Text1 text="项目管理" additionalClassNames="inset-[28.57%_0_57.14%_0]" />
          <Text2 text="任务中心" additionalClassNames="inset-[57.14%_0_28.57%_0]" />
          <Text text="设备管理" additionalClassNames="inset-[85.71%_0_0_0]" />
          <Text3 text="数据管理" additionalClassNames="inset-[71.43%_0_14.29%_0]" />
          <div className="absolute inset-[42.86%_0]" data-name="导航-一级备份 2">
            <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[calc(50%-50px)] not-italic text-[#aec0de] text-[14px] top-[calc(50%-11px)] w-[56px]">安全中心</p>
            <Helper4Icon1>
              <rect fill="var(--fill-0, black)" height="16" id="ç©å½¢" opacity="0.01" width="16" />
              <path clipRule="evenodd" d={svgPaths.p27bf6500} fill="var(--fill-0, #8194B5)" fillRule="evenodd" id="å½¢ç¶" />
            </Helper4Icon1>
          </div>
          <div className="absolute contents inset-[18.93%_4.44%_76.07%_87.78%]" data-name="icon/方向- 上">
            <div className="absolute bg-black inset-[18.93%_4.44%_76.07%_87.78%] opacity-0" data-name="矩形" />
            <Helper additionalClassNames="absolute inset-[20.18%_5.45%_77.32%_88.78%]" />
          </div>
          <div className="absolute contents inset-[33.21%_4.44%_61.79%_87.78%]" data-name="icon/方向- 上备份 4">
            <div className="absolute bg-black inset-[33.21%_4.44%_61.79%_87.78%] opacity-0" data-name="矩形" />
            <Helper additionalClassNames="absolute inset-[34.46%_5.45%_63.04%_88.78%]" />
          </div>
          <div className="absolute contents inset-[47.5%_4.44%_47.5%_87.78%]" data-name="icon/方向- 上备份 5">
            <div className="absolute bg-black inset-[47.5%_4.44%_47.5%_87.78%] opacity-0" data-name="矩形" />
            <Helper additionalClassNames="absolute inset-[48.75%_5.45%_48.75%_88.78%]" />
          </div>
          <div className="absolute contents inset-[76.07%_4.44%_18.93%_87.78%]" data-name="icon/方向- 上备份 3">
            <div className="absolute bg-black inset-[76.07%_4.44%_18.93%_87.78%] opacity-0" data-name="矩形" />
            <Helper additionalClassNames="absolute inset-[77.32%_5.45%_20.18%_88.78%]" />
          </div>
        </div>
      </div>
      <div className="absolute inset-[69.83%_52.78%_6.56%_31.94%]" data-name="平台管理-导航">
        <div className="absolute bg-[#0d121b] inset-0" data-name="矩形" />
        <div className="absolute h-[520px] left-0 overflow-clip right-0 top-[32px]" data-name="编组">
          <Text text="平台管理" additionalClassNames="inset-[7.69%_9.09%_84.62%_9.09%]" />
          <Text1 text="项目管理" additionalClassNames="inset-[15.38%_9.09%_76.92%_9.09%]" />
          <div className="absolute inset-[23.08%_9.09%_69.23%_9.09%]" data-name="导航-一级备份 2">
            <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[22px] left-[calc(50%-50px)] not-italic text-[#f6f9fe] text-[14px] top-[calc(50%-11px)] w-[56px]">安全中心</p>
            <Helper4Icon1>
              <rect fill="var(--fill-0, black)" height="16" id="ç©å½¢" opacity="0.01" width="16" />
              <path clipRule="evenodd" d={svgPaths.p27bf6500} fill="var(--fill-0, #F6F9FE)" fillRule="evenodd" id="å½¢ç¶" />
            </Helper4Icon1>
          </div>
          <div className="absolute inset-[92.31%_9.09%_0_9.09%] overflow-clip" data-name="导航-一级备份 6">
            <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[calc(50%-50px)] not-italic text-[#aec0de] text-[14px] top-[calc(50%-11px)] w-[56px]">设备管理</p>
            <Wrapper>
              <rect fill="var(--fill-0, black)" height="16" id="ç©å½¢" opacity="0.01" width="16" />
              <path clipRule="evenodd" d={svgPaths.p30648cf0} fill="var(--fill-0, #8194B5)" fillRule="evenodd" id="å½¢ç¶" />
            </Wrapper>
          </div>
          <div className="absolute bg-[#161d2a] inset-[38.46%_0_53.85%_0]" data-name="矩形" />
          <Text4 text="安全审计" additionalClassNames="inset-[53.85%_9.09%_38.46%_9.09%]" />
          <Text4 text="访问日志" additionalClassNames="inset-[61.54%_9.09%_30.77%_9.09%]" />
          <Text4 text="异常行为检测" additionalClassNames="inset-[69.23%_9.09%_23.08%_9.09%]" />
          <Text5 text="PingFangSC-Medium" additionalClassNames="inset-[38.46%_9.09%_53.85%_9.09%]" />
          <Text5 text="数据授权记录" additionalClassNames="inset-[46.15%_9.09%]" />
          <Text4 text="PingFangSC-Medium" additionalClassNames="inset-[30.77%_9.09%_61.54%_9.09%]" />
          <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[24px] left-[calc(50%-90px)] not-italic text-[#f6f9fe] text-[16px] top-[calc(50%-260px)] w-[64px]">控制台</p>
          <Text2 text="任务中心" additionalClassNames="inset-[76.92%_9.09%_15.38%_9.09%] overflow-clip" />
          <Text3 text="数据管理" additionalClassNames="inset-[84.62%_9.09%_7.69%_9.09%] overflow-clip" />
          <div className="absolute contents inset-[10.19%_12.73%_87.12%_80.91%]" data-name="icon/方向- 上">
            <div className="absolute bg-black inset-[10.19%_12.73%_87.12%_80.91%] opacity-0" data-name="矩形" />
            <Helper additionalClassNames="absolute inset-[10.87%_13.55%_87.79%_81.73%]" />
          </div>
          <div className="absolute contents inset-[17.88%_12.73%_79.42%_80.91%]" data-name="icon/方向- 上备份">
            <div className="absolute bg-black inset-[17.88%_12.73%_79.42%_80.91%] opacity-0" data-name="矩形" />
            <Helper additionalClassNames="absolute inset-[18.56%_13.55%_80.1%_81.73%]" />
          </div>
          <div className="absolute contents inset-[33.27%_12.73%_64.04%_80.91%]" data-name="icon/方向- 上备份 2">
            <Helper1 additionalClassNames="inset-[33.27%_12.73%_64.04%_80.91%]" />
            <Helper2 additionalClassNames="inset-[33.94%_13.55%_64.71%_81.73%]" />
          </div>
          <div className="absolute contents inset-[25.58%_12.73%_71.73%_80.91%]" data-name="icon/方向- 上备份 4">
            <Helper1 additionalClassNames="inset-[25.58%_12.73%_71.73%_80.91%]" />
            <Helper2 additionalClassNames="inset-[26.25%_13.55%_72.4%_81.73%]" />
          </div>
          <div className="absolute contents inset-[87.12%_12.73%_10.19%_80.91%]" data-name="icon/方向- 上备份 3">
            <div className="absolute bg-black inset-[87.12%_12.73%_10.19%_80.91%] opacity-0" data-name="矩形" />
            <Helper additionalClassNames="absolute inset-[87.79%_13.55%_10.87%_81.73%]" />
          </div>
        </div>
      </div>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[calc(50%-600px)] not-italic text-[#8194b5] text-[14px] top-[calc(50%-1454px)] w-[98px]">新系统布局左侧</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[calc(50%-600px)] not-italic text-[#8194b5] text-[14px] top-[calc(50%-320px)] w-[154px]">二级导航，位于页面顶部</p>
      <div className="absolute bg-[#722ed1] inset-[19.41%_-6.94%_79.01%_102.78%]" data-name="矩形备份 21" />
      <div className="absolute bg-[#eb2f96] inset-[19.41%_-16.39%_79.01%_112.22%]" data-name="矩形备份 22" />
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[calc(50%-323.21px)] not-italic text-[#8194b5] text-[14px] top-[calc(50%-1307px)] w-[47px]">Default</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[calc(50%-323.21px)] not-italic text-[#8194b5] text-[14px] top-[calc(50%-1067px)] w-[28px]">选中</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[calc(50%-323.21px)] not-italic text-[#8194b5] text-[14px] top-[calc(50%-576px)] w-[28px]">选中</p>
      <div className="absolute bottom-0 h-[130px] left-1/2 translate-x-[-50%] w-[1440px]" data-name="底部备份 3">
        <div className="absolute bg-[#293449] inset-[0_120px_99.23%_120px]" data-name="Divider Color" />
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[120px] not-italic text-[#aec0de] text-[14px] top-[calc(50%-37px)] w-[294px]">有一天，所有人所有事所有物都会发出一个信号</p>
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] not-italic right-[120px] text-[#aec0de] text-[14px] text-right top-[calc(50%-37px)] w-[197px]">SENSORO 设计规范 / Lins 4.0</p>
      </div>
      <div className="absolute inset-[13.69%_88.33%_62.7%_8.33%]" data-name="left-bar">
        <div className="absolute bg-[#0d121b] inset-0" data-name="矩形" />
        <div className="absolute bg-[#293449] bottom-0 left-[calc(50%+23.5px)] top-0 translate-x-[-50%] w-px" data-name="分割线" />
        <div className="absolute bottom-[24px] h-[120px] left-1/2 overflow-clip translate-x-[-50%] w-[32px]" data-name="编组">
          <div className="absolute bottom-[88px] left-1/2 size-[32px] translate-x-[-50%]" data-name="6.导航/全局导航/未选中">
            <Helper3 />
          </div>
          <div className="absolute bottom-[40px] left-1/2 size-[32px] translate-x-[-50%]" data-name="6.导航/全局导航/未选中">
            <Helper5 additionalClassNames="inset-1/4" />
          </div>
          <div className="absolute bottom-0 left-1/2 size-[24px] translate-x-[-50%]" data-name="椭圆形">
            <img alt="" className="block max-w-none size-full" height="24" src={img} width="24" />
          </div>
        </div>
        <div className="absolute h-[368px] left-0 overflow-clip top-[24px] w-[40px]" data-name="编组 3">
          <div className="absolute h-[32px] left-[20%] right-0 top-[240px]" data-name="未选中">
            <Line />
          </div>
          <div className="absolute h-[32px] left-[20%] right-0 top-[192px]" data-name="未选中备份 2">
            <Line1 />
          </div>
          <div className="absolute h-[32px] left-[20%] right-0 top-[144px]" data-name="未选中备份">
            <Line2 />
          </div>
          <div className="absolute h-[32px] left-[20%] right-0 top-[96px]" data-name="未选中备份 9">
            <Helper4Icon />
          </div>
          <div className="absolute h-[32px] left-[20%] right-0 top-[48px]" data-name="未选中备份 9">
            <Line3 />
          </div>
          <div className="absolute h-[32px] left-[20%] right-0 top-[288px]" data-name="未选中备份 3">
            <Line4 />
          </div>
          <div className="absolute h-[32px] left-[20%] right-0 top-[336px]" data-name="未选中备份 5">
            <Line5 />
          </div>
          <Logo />
          <div className="absolute h-[24px] left-0 top-[292px] w-[3px]" data-name="左侧工具栏/定位标备份 2">
            <div className="absolute bg-[#4e85dd] inset-0" data-name="矩形" />
          </div>
        </div>
      </div>
      <div className="absolute inset-[13.69%_76.67%_62.7%_20%]" data-name="left-bar备份 2">
        <div className="absolute bg-[#0d121b] inset-0" data-name="矩形" />
        <div className="absolute bg-[#293449] bottom-0 left-[calc(50%+23.5px)] top-0 translate-x-[-50%] w-px" data-name="分割线" />
        <div className="absolute bottom-[24px] h-[120px] left-1/2 overflow-clip translate-x-[-50%] w-[32px]" data-name="编组">
          <div className="absolute bottom-[88px] left-1/2 size-[32px] translate-x-[-50%]" data-name="6.导航/全局导航/未选中">
            <Helper3 />
          </div>
          <div className="absolute bottom-[40px] left-1/2 size-[32px] translate-x-[-50%]" data-name="6.导航/1.全局导航/选中-down">
            <div className="absolute bg-[#1f293a] inset-0" data-name="矩形" />
            <Helper5 additionalClassNames="inset-1/4" />
          </div>
          <div className="absolute bottom-0 left-1/2 size-[24px] translate-x-[-50%]" data-name="椭圆形">
            <img alt="" className="block max-w-none size-full" height="24" src={img} width="24" />
          </div>
        </div>
        <div className="absolute h-[368px] left-0 overflow-clip top-[24px] w-[40px]" data-name="编组 3">
          <div className="absolute h-[32px] left-[20%] right-0 top-[240px]" data-name="未选中">
            <Line />
          </div>
          <div className="absolute h-[32px] left-[20%] right-0 top-[192px]" data-name="未选中备份 2">
            <Line1 />
          </div>
          <div className="absolute h-[32px] left-[20%] right-0 top-[144px]" data-name="未选中备份">
            <Line2 />
          </div>
          <div className="absolute h-[32px] left-[20%] right-0 top-[96px]" data-name="未选中备份 9">
            <Helper4Icon />
          </div>
          <div className="absolute h-[32px] left-[20%] right-0 top-[48px]" data-name="未选中备份 9">
            <Line3 />
          </div>
          <div className="absolute h-[32px] left-[20%] right-0 top-[288px]" data-name="未选中备份 3">
            <Line4 />
          </div>
          <div className="absolute h-[32px] left-[20%] right-0 top-[336px]" data-name="未选中备份 5">
            <Line5 />
          </div>
          <Logo />
          <div className="absolute h-[24px] left-0 top-[292px] w-[3px]" data-name="左侧工具栏/定位标备份 2">
            <div className="absolute bg-[#4e85dd] inset-0" data-name="矩形" />
          </div>
        </div>
      </div>
      <div className="absolute inset-[13.69%_52.56%_62.7%_43.87%] overflow-clip" data-name="left-bar备份">
        <div className="absolute bg-[#0d121b] inset-[0_6.52%_0_0]" data-name="矩形" />
        <div className="absolute bg-[#d52132] inset-[8%_22.1%_56.44%_15.58%] opacity-20" data-name="矩形" />
        <div className="absolute bg-[#d52132] inset-[84%_22.1%_2.67%_15.58%] opacity-20" data-name="矩形" />
        <div className="absolute bg-[#d52132] inset-[84%_22.1%_12.44%_15.58%] opacity-20" data-name="矩形" />
        <div className="absolute bg-[#d52132] inset-[89.33%_22.1%_7.11%_15.58%] opacity-20" data-name="矩形" />
        <div className="absolute bg-[#d52132] inset-[94.67%_29.89%_2.67%_23.37%] opacity-20" data-name="矩形" />
        <div className="absolute bg-[#d52132] inset-[8%_22.1%_88.44%_15.58%] opacity-20" data-name="矩形" />
        <div className="absolute bg-[#d52132] inset-[13.33%_22.1%_83.11%_15.58%] opacity-20" data-name="矩形" />
        <div className="absolute bg-[#d52132] inset-[18.67%_22.1%_77.78%_15.58%] opacity-20" data-name="矩形" />
        <div className="absolute bg-[#d52132] inset-[24%_22.1%_72.44%_15.58%] opacity-20" data-name="矩形" />
        <div className="absolute bg-[#d52132] inset-[29.33%_22.1%_67.11%_15.58%] opacity-20" data-name="矩形" />
        <div className="absolute bg-[#d52132] inset-[34.67%_22.1%_61.78%_15.58%] opacity-20" data-name="矩形" />
        <div className="absolute bg-[#d52132] inset-[40%_22.1%_56.44%_15.58%] opacity-20" data-name="矩形" />
        <div className="absolute bg-[#293449] bottom-0 left-[calc(50%+21.83px)] top-0 translate-x-[-50%] w-px" data-name="分割线" />
        <div className="absolute bottom-[112px] contents left-[calc(50%-1.67px)] translate-x-[-50%]" data-name="未选中备份 6">
          <div className="absolute bottom-[112px] left-[calc(50%-1.67px)] size-[32px] translate-x-[-50%]" data-name="矩形" />
          <div className="absolute bottom-[120px] left-[calc(50%-1.67px)] size-[16px] translate-x-[-50%]" data-name="Line/设备-泛设备系统">
            <Helper4 />
          </div>
        </div>
        <Helper5 additionalClassNames="inset-[90.22%_37.68%_8%_31.16%]" />
        <div className="absolute bottom-[24px] left-[calc(50%-1.67px)] size-[24px] translate-x-[-50%]" data-name="椭圆形">
          <img alt="" className="block max-w-none size-full" height="24" src={img} width="24" />
        </div>
        <div className="absolute h-[32px] left-[15.58%] right-[22.1%] top-[264px]" data-name="未选中">
          <Line />
        </div>
        <div className="absolute h-[32px] left-[15.58%] right-[22.1%] top-[216px]" data-name="未选中备份 2">
          <Line1 />
        </div>
        <div className="absolute h-[32px] left-[15.58%] right-[22.1%] top-[168px]" data-name="未选中备份">
          <Line2 />
        </div>
        <div className="absolute h-[32px] left-[15.58%] right-[22.1%] top-[72px]" data-name="未选中备份 9">
          <Helper4Icon />
        </div>
        <div className="absolute h-[32px] left-[15.58%] right-[22.1%] top-[120px]" data-name="未选中备份 9">
          <Line3 />
        </div>
        <div className="absolute h-[32px] left-[15.58%] right-[22.1%] top-[312px]" data-name="未选中备份 3">
          <Line4 />
        </div>
        <div className="absolute h-[32px] left-[15.58%] right-[22.1%] top-[360px]" data-name="未选中备份 5">
          <Line5 />
        </div>
        <div className="absolute contents left-[calc(50%-1.67px)] top-[24px] translate-x-[-50%]" data-name="logo">
          <div className="absolute bg-[#d52132] left-[calc(50%-1.67px)] opacity-30 size-[32px] top-[24px] translate-x-[-50%]" data-name="矩形" />
          <div className="absolute contents left-[calc(50%-1.67px)] top-[26px] translate-x-[-50%]" data-name="编组 2">
            <Helper15 additionalClassNames="left-[calc(50%-1.67px)] top-[26px]" />
            <div className="absolute contents left-[calc(50%-1.67px)] top-[26px] translate-x-[-50%]" data-name="编组">
              <Helper6 additionalClassNames="left-[calc(50%+6.59px)] top-[49.84px]" />
              <Helper7 additionalClassNames="left-[calc(50%-13.03px)] top-[29.87px]" />
              <Helper9 additionalClassNames="left-[calc(50%+5.26px)] top-[41.44px]" />
              <Helper10 additionalClassNames="left-[calc(50%-2.14px)] top-[27.74px]" />
              <Helper11 additionalClassNames="left-[calc(50%-10.12px)] top-[26.3px]" />
              <Helper12 additionalClassNames="left-[calc(50%+7.49px)] top-[37.15px]" />
              <Helper13 additionalClassNames="left-[calc(50%-1.67px)] top-[26px]" />
              <Helper14 additionalClassNames="left-[calc(50%-1.67px)] top-[26px]" />
            </div>
          </div>
        </div>
        <div className="absolute h-[24px] left-0 top-[316px] w-[3px]" data-name="左侧工具栏/定位标备份 2">
          <div className="absolute bg-[#4e85dd] inset-0" data-name="矩形" />
        </div>
        <Text6 text="24" additionalClassNames="inset-[0_0_97.33%_35.73%]" />
        <Text6 text="24" additionalClassNames="inset-[97.33%_0.68%_0_35.06%]" />
        <Text7 text="16" additionalClassNames="inset-[6.22%_0_92%_35.73%]" />
        <Text7 text="16" additionalClassNames="inset-[11.56%_0_86.67%_35.73%]" />
        <Text7 text="16" additionalClassNames="inset-[16.89%_0_81.33%_35.73%]" />
        <Text7 text="16" additionalClassNames="inset-[22.22%_0_76%_35.73%]" />
        <Text7 text="16" additionalClassNames="inset-[27.56%_0_70.67%_35.73%]" />
        <Text7 text="16" additionalClassNames="inset-[32.89%_0_65.33%_35.73%]" />
        <Text7 text="16" additionalClassNames="inset-[38.22%_0_60%_35.73%]" />
        <Text7 text="16" additionalClassNames="inset-[87.56%_0.68%_10.67%_35.06%]" />
        <Text7 text="16" additionalClassNames="inset-[92.89%_0.68%_5.33%_35.06%]" />
      </div>
      <Component90Helper additionalClassNames="inset-[15.99%_73.28%_83.98%_22.83%]" />
      <Component90Helper additionalClassNames="inset-[22.28%_73.28%_77.69%_22.83%]" />
      <Component90Helper additionalClassNames="inset-[35.17%_73.28%_64.81%_22.83%]" />
      <div className="absolute inset-[16.74%_71.39%_82.27%_22.78%]" data-name="3.数据展示/Tootips/左">
        <div className="absolute bottom-0 flex h-[38px] items-center justify-center left-[4px] w-[136px]">
          <div className="flex-none rotate-[180deg]">
            <div className="h-[38px] relative w-[136px]" data-name="Bg Copy">
              <div className="absolute inset-[-31.58%_-5.88%_-10.53%_-5.88%]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 152 54">
                  <g filter="url(#filter0_dd_2001_14086)" id="Bg Copy">
                    <path d="M8 12H144V50H8V12Z" fill="var(--fill-0, #314059)" />
                  </g>
                  <defs>
                    <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="54" id="filter0_dd_2001_14086" width="152" x="0" y="0">
                      <feFlood floodOpacity="0" result="BackgroundImageFix" />
                      <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                      <feOffset dy="-4" />
                      <feGaussianBlur stdDeviation="4" />
                      <feColorMatrix type="matrix" values="0 0 0 0 0.0705882 0 0 0 0 0.0705882 0 0 0 0 0.0705882 0 0 0 0.32 0" />
                      <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_2001_14086" />
                      <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                      <feOffset />
                      <feGaussianBlur stdDeviation="1" />
                      <feColorMatrix type="matrix" values="0 0 0 0 0.0705882 0 0 0 0 0.0705882 0 0 0 0 0.0705882 0 0 0 0.16 0" />
                      <feBlend in2="effect1_dropShadow_2001_14086" mode="normal" result="effect2_dropShadow_2001_14086" />
                      <feBlend in="SourceGraphic" in2="effect2_dropShadow_2001_14086" mode="normal" result="shape" />
                    </filter>
                  </defs>
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[8px] items-center justify-center left-0 top-1/2 translate-y-[-50%] w-[4px]" style={{ "--transform-inner-width": "300", "--transform-inner-height": "150" } as React.CSSProperties}>
          <div className="flex-none rotate-[270deg]">
            <div className="h-[4px] relative w-[8px]" data-name="Triangle 1">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8 4">
                <path d="M4 0L8 4H0L4 0Z" fill="var(--fill-0, #314059)" id="Triangle 1" />
              </svg>
            </div>
          </div>
        </div>
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[16px] not-italic text-[#f6f9fe] text-[14px] top-[calc(50%-11px)] w-[112px]">全景地图</p>
      </div>
      <div className="absolute inset-[17.24%_77.5%_82.14%_20.83%]" data-name="4.icon/Pointer">
        <div className="absolute inset-[0_0_-8.33%_0]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 26">
            <g id="4.icon/Pointer">
              <g filter="url(#filter0_d_2001_6580)" id="cursor">
                <mask fill="black" height="20" id="path-1-outside-1_2001_6580" maskUnits="userSpaceOnUse" width="16" x="4" y="2">
                  <rect fill="white" height="20" width="16" x="4" y="2" />
                  <path clipRule="evenodd" d={svgPaths.p3dd47800} fillRule="evenodd" />
                </mask>
                <path clipRule="evenodd" d={svgPaths.p3dd47800} fill="var(--fill-0, white)" fillRule="evenodd" />
                <path d={svgPaths.p3ecbbc60} fill="var(--stroke-0, black)" fillOpacity="0.8" mask="url(#path-1-outside-1_2001_6580)" />
              </g>
            </g>
            <defs>
              <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="26" id="filter0_d_2001_6580" width="21.9998" x="1.00016" y="0">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                <feOffset dy="1" />
                <feGaussianBlur stdDeviation="1.5" />
                <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0" />
                <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_2001_6580" />
                <feBlend in="SourceGraphic" in2="effect1_dropShadow_2001_6580" mode="normal" result="shape" />
              </filter>
            </defs>
          </svg>
        </div>
      </div>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[calc(50%-246.21px)] not-italic text-[#8194b5] text-[14px] top-[calc(50%-1259px)] w-[38px]">Hover</p>
      <Component90Helper additionalClassNames="inset-[17.25%_67.93%_82.73%_28.18%]" />
      <div className="absolute inset-[44.91%_11.11%_52.99%_8.33%]" data-name="面包屑-一级">
        <div className="absolute bg-[#0d121b] inset-0" data-name="矩形备份" />
        <div className="absolute bg-[#293449] inset-[98.75%_0_0_0]" data-name="分割线" />
        <p className="absolute bottom-[50px] font-['PingFang_SC:Medium',sans-serif] leading-[28px] left-[20px] not-italic text-[#f6f9fe] text-[20px] translate-y-[100%] w-[80px]">数据资产</p>
        <Helper16 text="数据更新时间" text1="2025-04-12 12:00:00" />
      </div>
      <div className="absolute inset-[48.27%_11.11%_49.63%_8.33%] overflow-clip" data-name="面包屑-一级备份">
        <div className="absolute bg-[#0d121b] inset-0" data-name="矩形备份" />
        <div className="absolute bg-[#d52132] inset-[45%_2.07%_30%_80.6%] opacity-20" data-name="矩形" />
        <div className="absolute bg-[#293449] inset-[98.75%_0_0_0]" data-name="分割线" />
        <p className="absolute bottom-[50px] font-['PingFang_SC:Medium',sans-serif] leading-[28px] left-[20px] not-italic text-[#f6f9fe] text-[20px] translate-y-[100%] w-[80px]">数据资产</p>
        <Helper16 text="数据更新时间" text1="2025-04-12 12:00:00" />
        <Text8 text="20" additionalClassNames="left-0 right-[98.28%]" />
        <Text8 text="24" additionalClassNames="left-[97.93%] right-0" />
        <div className="absolute inset-[0_93.28%_62.5%_3.88%]" data-name="标注-横备份">
          <Indicator />
          <div className="absolute bottom-[7px] flex flex-col font-['PingFang_SC:Regular',sans-serif] justify-center leading-[0] not-italic right-[20px] text-[#ff1257] text-[10px] top-[7px] tracking-[0.2px] translate-x-[100%] w-[20px]">
            <p className="leading-[16px]">30</p>
          </div>
        </div>
        <Text10 text="22" additionalClassNames="inset-[72.5%_93.28%_0_3.88%]" />
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[20px] left-[calc(50%+444px)] not-italic text-[#d52132] text-[12px] top-[calc(50%-28px)] w-[24px]">若有</p>
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[20px] left-[calc(50%-29px)] not-italic text-[#d52132] text-[12px] top-[calc(50%-20px)] w-[24px]">若有</p>
      </div>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[24px] left-[calc(50%-600px)] not-italic text-[#f6f9fe] text-[16px] top-[calc(50%-250px)] w-[64px]">功能首页</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[24px] left-[calc(50%-600px)] not-italic text-[#f6f9fe] text-[16px] top-[calc(50%+86px)] w-[64px]">次级页面</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[24px] left-[calc(50%-600px)] not-italic text-[#f6f9fe] text-[16px] top-[calc(50%+700px)] w-[32px]">收起</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[24px] left-[calc(50%-260px)] not-italic text-[#f6f9fe] text-[16px] top-[calc(50%+700px)] w-[32px]">展开</p>
      <Helper18 additionalClassNames="inset-[53.73%_11.11%_44.18%_8.33%]" />
      <Helper18 additionalClassNames="inset-[56.66%_11.11%_41.24%_8.33%]" />
      <div className="absolute inset-[61.54%_58.33%_36.36%_8.33%] overflow-clip" data-name="1.通用/nav/顶部-面包屑new备份">
        <div className="absolute bg-[#0d121b] inset-0" data-name="矩形备份" />
        <Text8 text="20" additionalClassNames="left-0 right-[95.83%]" />
        <Text10 text="22" additionalClassNames="inset-[72.5%_77.92%_0_15.21%]" />
        <div className="absolute inset-[0_77.92%_55%_15.21%]" data-name="标注-横备份 2">
          <Indicator />
          <div className="absolute bottom-[10px] flex flex-col font-['PingFang_SC:Regular',sans-serif] justify-center leading-[0] not-italic right-[20px] text-[#ff1257] text-[10px] top-[10px] tracking-[0.2px] translate-x-[100%] w-[20px]">
            <p className="leading-[16px]">36</p>
          </div>
        </div>
        <div className="absolute bg-[#d52132] inset-[45%_41.04%_27.5%_4.17%] opacity-20" data-name="矩形" />
        <Helper17 text="推理分析" text1="巡航管理" text2="城市巡航" text3="/" text4="/" />
      </div>
      <div className="absolute inset-[61.54%_21.67%_36.36%_45%] overflow-clip" data-name="1.通用/nav/顶部-面包屑new备份 2">
        <div className="absolute bg-[#0d121b] inset-0" data-name="矩形备份" />
        <div className="absolute bg-[#d52132] inset-[45%_41.04%_27.5%_4.17%] opacity-20" data-name="矩形" />
        <div className="absolute bg-[#d52132] inset-[48.75%_92.5%_31.25%_4.17%] opacity-20" data-name="矩形" />
        <div className="absolute bg-[#314059] bottom-[32.5%] left-[10.83%] right-[88.96%] top-1/2" data-name="矩形备份" />
        <Wrapper1 additionalClassNames="inset-[48.75%_92.5%_31.25%_4.17%]">
          <g id="Arrow-å·¦">
            <rect fill="var(--fill-0, black)" height="16" id="ç©å½¢" opacity="0.01" width="16" />
            <path clipRule="evenodd" d={svgPaths.p69afd00} fill="var(--fill-0, #0A1B39)" fillRule="evenodd" id="è·¯å¾" />
          </g>
        </Wrapper1>
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[calc(50%-171px)] not-italic text-[#8194b5] text-[14px] top-[calc(50%-4px)] w-[56px]">推理分析</p>
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[calc(50%-13px)] not-italic text-[#f6f9fe] text-[14px] top-[calc(50%-4px)] w-[56px]">巡航管理</p>
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[calc(50%-92px)] not-italic text-[#546789] text-[14px] top-[calc(50%-4px)] w-[56px]">城市巡航</p>
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[calc(50%-107px)] not-italic text-[#8194b5] text-[14px] top-[calc(50%-4px)] w-[7px]">/</p>
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[calc(50%-28px)] not-italic text-[#8194b5] text-[14px] top-[calc(50%-4px)] w-[7px]">/</p>
        <Text9 text="16" additionalClassNames="absolute inset-[55%_89.17%_8.75%_7.5%]" />
        <Text9 text="16" additionalClassNames="absolute inset-[55%_85.63%_8.75%_11.04%]" />
        <Text9 text="8" additionalClassNames="absolute inset-[55%_72.29%_8.75%_26.04%]" />
        <Text9 text="8" additionalClassNames="absolute inset-[55%_69.17%_8.75%_29.17%]" />
      </div>
      <Component90Helper1 additionalClassNames="inset-[58.39%_89.55%_40.35%_10.38%]" />
      <Component90Helper1 additionalClassNames="inset-[58.39%_84.9%_40.35%_15.03%]" />
      <Component90Helper1 additionalClassNames="inset-[58.39%_79.48%_40.35%_20.45%]" />
      <Component90Helper1 additionalClassNames="inset-[58.39%_73.85%_40.35%_26.08%]" />
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[20px] left-[calc(50%-586px)] not-italic text-[#546789] text-[12px] top-[calc(50%+372px)] w-[33px]">Hover</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[20px] left-[calc(50%-524px)] not-italic text-[#546789] text-[12px] top-[calc(50%+372px)] w-[41px]">Default</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[20px] left-[calc(50%-449px)] not-italic text-[#546789] text-[12px] top-[calc(50%+372px)] w-[47px]">Dissable</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[20px] left-[calc(50%-383px)] not-italic text-[#546789] text-[12px] top-[calc(50%+372px)] w-[84px]">{`Choose&Hover`}</p>
      <div className="absolute inset-[49.59%_52.53%_49.65%_47.41%]" data-name="路径 4">
        <div className="absolute inset-[-1.71%_-318.2%_0_-318.2%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7.36396 29.6621">
            <path d={svgPaths.p9884900} fill="var(--stroke-0, #D52132)" id="è·¯å¾ 4" />
          </svg>
        </div>
      </div>
      <Component90Helper2 additionalClassNames="inset-[76.51%_50.49%_23.47%_46.18%]" />
      <Component90Helper2 additionalClassNames="inset-[72.26%_50.49%_27.72%_46.18%]" />
      <Component90Helper2 additionalClassNames="inset-[74.33%_50.49%_25.64%_46.18%]" />
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[20px] left-[calc(50%+5px)] not-italic text-[#e7484f] text-[12px] top-[calc(50%+1001px)] w-[24px]">选中</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[20px] left-[calc(50%+5px)] not-italic text-[#e7484f] text-[12px] top-[calc(50%+839px)] w-[41px]">Default</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[20px] left-[calc(50%+5px)] not-italic text-[#e7484f] text-[12px] top-[calc(50%+918px)] w-[48px]">下级选中</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[20px] left-[calc(50%-238px)] not-italic text-[#e7484f] text-[12px] top-[calc(50%+997px)] w-[33px]">Hover</p>
    </div>
  );
}