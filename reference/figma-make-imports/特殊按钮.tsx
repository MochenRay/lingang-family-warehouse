import svgPaths from "./svg-f07arn2xcc";
import clsx from "clsx";
type Wrapper1Props = {
  additionalClassNames?: string;
};

function Wrapper1({ children, additionalClassNames = "" }: React.PropsWithChildren<Wrapper1Props>) {
  return (
    <div className={additionalClassNames}>
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        {children}
      </svg>
    </div>
  );
}
type WrapperProps = {
  additionalClassNames?: string;
};

function Wrapper({ children, additionalClassNames = "" }: React.PropsWithChildren<WrapperProps>) {
  return <Wrapper1 additionalClassNames={clsx("absolute size-[16px] top-1/2 translate-y-[-50%]", additionalClassNames)}>{children}</Wrapper1>;
}

function Line3({ children }: React.PropsWithChildren<{}>) {
  return (
    <Wrapper1 additionalClassNames="absolute inset-[30%_61.11%_30%_16.67%]">
      <g id="Line/åå¸ç®å">{children}</g>
    </Wrapper1>
  );
}

function Line2() {
  return (
    <div className="absolute contents left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%]">
      <div className="absolute bg-black left-1/2 opacity-0 size-[16px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="矩形" />
      <div className="absolute h-[8.75px] left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] w-[14px]" data-name="形状">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 8.75">
          <path clipRule="evenodd" d={svgPaths.p3b3ce300} fill="var(--fill-0, #0A1B39)" fillRule="evenodd" id="å½¢ç¶" />
        </svg>
      </div>
    </div>
  );
}

function Line1() {
  return (
    <Wrapper additionalClassNames="left-1/2 translate-x-[-50%]">
      <g id="Line/ä¸å¯è§å¤ä»½ 2">
        <rect fill="var(--fill-0, black)" height="16" id="ç©å½¢" opacity="0.01" width="16" />
        <path clipRule="evenodd" d={svgPaths.p1b9e6680} fill="var(--fill-0, #0A1B39)" fillRule="evenodd" id="å½¢ç¶" />
      </g>
    </Wrapper>
  );
}
type HelperProps = {
  additionalClassNames?: string;
};

function Helper({ additionalClassNames = "" }: HelperProps) {
  return (
    <div className={clsx("absolute", additionalClassNames)}>
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
  );
}

function Helper1Icon() {
  return (
    <Wrapper additionalClassNames="left-[16px]">
      <g id="1.icon/å¾ä¾-å¾è°±">
        <rect fill="var(--fill-0, black)" height="16" id="ç©å½¢" opacity="0.01" width="16" />
        <path clipRule="evenodd" d={svgPaths.p1ab3eea0} fill="var(--fill-0, #0A1B39)" fillRule="evenodd" id="å½¢ç¶" />
      </g>
    </Wrapper>
  );
}

function Line() {
  return (
    <Wrapper additionalClassNames="left-[104px]">
      <g id="Line/ç®­å¤´-å³">
        <rect fill="var(--fill-0, black)" height="16" id="ç©å½¢" opacity="0.01" transform="matrix(-1 0 0 1 16 0)" width="16" />
        <path clipRule="evenodd" d={svgPaths.pba6a600} fill="var(--fill-0, #0A1B39)" fillRule="evenodd" id="è·¯å¾" />
      </g>
    </Wrapper>
  );
}

export default function Component() {
  return (
    <div className="bg-black relative size-full" data-name="特殊按钮">
      <div className="absolute h-[288px] left-[calc(50%-1px)] not-italic top-0 translate-x-[-50%] w-[1440px]" data-name="SENSORO 设计规范 / Lins备份">
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[20px] left-[calc(50%-600px)] text-[#f6f9fe] text-[12px] top-[calc(50%-64px)] w-[152px]">SENSORO 组件库/全景地图</p>
        <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[46px] left-[calc(50%-600px)] text-[#f6f9fe] text-[38px] top-[calc(50%+36px)] w-[361px]">Button 特殊按钮</p>
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[8.33%] right-[8.33%] text-[#8194b5] text-[14px] top-[calc(50%+122px)]">用户使用按钮来触发一个操作或者进行跳转。</p>
      </div>
      <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[28px] left-[calc(50%-600px)] not-italic text-[#f6f9fe] text-[20px] top-[calc(50%-253px)] w-[80px]">特殊按钮</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[calc(50%-600px)] not-italic text-[#8194b5] text-[14px] top-[calc(50%-209px)] w-[182px]">1. 业务中用到的特殊样式按钮</p>
      <div className="absolute bg-[#722ed1] inset-[55.98%_-6.94%_39.49%_102.78%]" data-name="矩形备份 21" />
      <div className="absolute bg-[#eb2f96] inset-[55.98%_-16.39%_39.49%_112.22%]" data-name="矩形备份 22" />
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[calc(50%-600px)] not-italic text-[14px] text-[rgba(255,255,255,0.85)] top-[calc(50%-131px)] w-[47px]">Default</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[calc(50%-359px)] not-italic text-[14px] text-[rgba(255,255,255,0.85)] top-[calc(50%-131px)] w-[38px]">Hover</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[calc(50%-188px)] not-italic text-[14px] text-[rgba(255,255,255,0.85)] top-[calc(50%+389px)] w-[28px]">选中</p>
      <div className="absolute bottom-0 h-[130px] left-1/2 translate-x-[-50%] w-[1440px]" data-name="底部备份 3">
        <div className="absolute bg-[#293449] inset-[0_120px_99.23%_120px]" data-name="Divider Color" />
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[120px] not-italic text-[#aec0de] text-[14px] top-[calc(50%-37px)] w-[294px]">有一天，所有人所有事所有物都会发出一个信号</p>
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] not-italic right-[120px] text-[#aec0de] text-[14px] text-right top-[calc(50%-37px)] w-[197px]">SENSORO 设计规范 / Lins 4.0</p>
      </div>
      <div className="absolute inset-[43.57%_82.22%_52.8%_8.33%]" data-name="全局/按钮-功能入口">
        <div className="absolute bg-[#0d121b] inset-0" data-name="矩形备份 4" />
        <Line />
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[16px] not-italic text-[#aec0de] text-[14px] top-[calc(50%-11px)] w-[84px]">人员流动分析</p>
      </div>
      <div className="absolute inset-[43.57%_65.49%_52.8%_25.07%]" data-name="全局/按钮-功能入口备份">
        <div className="absolute bg-[#0d121b] inset-0" data-name="矩形备份 4" />
        <Line />
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[16px] not-italic text-[#f6f9fe] text-[14px] top-[calc(50%-11px)] w-[84px]">人员流动分析</p>
      </div>
      <div className="absolute inset-[65.36%_86.67%_31.62%_8.33%]" data-name="按钮-退出">
        <div className="absolute bg-[#0d121b] inset-0" data-name="矩形" />
        <Line3>
          <rect fill="var(--fill-0, black)" height="16" id="ç©å½¢" opacity="0.01" width="16" />
          <path clipRule="evenodd" d={svgPaths.p38f47400} fill="var(--fill-0, white)" fillRule="evenodd" id="å½¢ç¶" />
        </Line3>
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[calc(50%-4px)] not-italic text-[#aec0de] text-[14px] top-[calc(50%-11px)] w-[28px]">退出</p>
      </div>
      <div className="absolute inset-[65.36%_69.93%_31.62%_25.07%]" data-name="按钮-退出备份">
        <div className="absolute bg-[#0d121b] inset-0" data-name="矩形" />
        <Line3>
          <rect fill="var(--fill-0, black)" height="16" id="ç©å½¢" opacity="0.01" width="16" />
          <path clipRule="evenodd" d={svgPaths.p38f47400} fill="var(--fill-0, #AEC0DE)" fillRule="evenodd" id="å½¢ç¶" />
        </Line3>
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[calc(50%-4px)] not-italic text-[#f6f9fe] text-[14px] top-[calc(50%-11px)] w-[28px]">退出</p>
      </div>
      <div className="absolute inset-[58.09%_84.17%_38.28%_8.33%]" data-name="按钮-48-default">
        <div className="absolute bg-[#0d121b] inset-0" data-name="矩形备份 4" />
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[36px] not-italic text-[#aec0de] text-[14px] top-[calc(50%-11px)] w-[56px]">要素识别</p>
        <Helper1Icon />
      </div>
      <div className="absolute inset-[58.09%_67.43%_38.28%_25.07%]" data-name="按钮-48-default备份">
        <div className="absolute bg-[#0d121b] inset-0" data-name="矩形备份 4" />
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[36px] not-italic text-[#f6f9fe] text-[14px] top-[calc(50%-11px)] w-[56px]">要素识别</p>
        <Helper1Icon />
      </div>
      <div className="absolute inset-[50.83%_79.38%_45.54%_8.33%]" data-name="按钮/地图内/两个操作-Default">
        <div className="absolute bg-[#0d121b] inset-0" data-name="矩形备份 4" />
        <div className="absolute bg-[#293449] inset-[35.42%_49.72%]" data-name="矩形" />
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[16px] not-italic text-[#aec0de] text-[14px] top-[calc(50%-11px)] w-[56px]">应急调度</p>
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[105px] not-italic text-[#aec0de] text-[14px] top-[calc(50%-11px)] w-[56px]">历史影像</p>
      </div>
      <div className="absolute inset-[50.83%_62.64%_45.54%_25.07%]" data-name="按钮/地图内/两个操作-Default备份">
        <div className="absolute bg-[#0d121b] inset-0" data-name="矩形备份 4" />
        <div className="absolute bg-[#293449] inset-[35.42%_49.72%]" data-name="矩形" />
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[16px] not-italic text-[#aec0de] text-[14px] top-[calc(50%-11px)] w-[56px]">应急调度</p>
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[105px] not-italic text-[#f6f9fe] text-[14px] top-[calc(50%-11px)] w-[56px]">历史影像</p>
      </div>
      <Helper additionalClassNames="inset-[45.76%_69.38%_52.42%_28.96%]" />
      <Helper additionalClassNames="inset-[53.1%_64.72%_45.08%_33.61%]" />
      <Helper additionalClassNames="inset-[59.91%_70.21%_38.28%_28.13%]" />
      <Helper additionalClassNames="inset-[67.47%_71.46%_30.71%_26.88%]" />
      <div className="absolute inset-[71.71%_67.5%_21.18%_25.07%]" data-name="特殊按钮-Hover">
        <div className="absolute inset-[48.94%_17.76%_8.51%_0]" data-name="调度工单筛选栏-Default">
          <div className="absolute bg-[#293449] inset-[0_54.55%_0_44.42%]" data-name="矩形" />
          <div className="absolute bottom-0 left-1/2 overflow-clip right-0 top-0" data-name="首页/感知设备/已选中备份 14">
            <div className="absolute bg-[#0d121b] inset-0" data-name="矩形" />
            <Line1 />
          </div>
          <div className="absolute bottom-0 left-0 overflow-clip right-1/2 top-0" data-name="要素识别-Default">
            <div className="absolute bg-[#0d121b] inset-0" data-name="矩形" />
            <Line2 />
          </div>
          <div className="absolute bg-[#293449] bottom-0 left-[48.86%] right-1/2 top-0" data-name="矩形" />
        </div>
        <Helper additionalClassNames="inset-[74.47%_26.17%_0_51.4%]" />
        <div className="absolute inset-[0_0_55.32%_25.23%] overflow-clip" data-name="编组 7">
          <div className="absolute inset-[-9.52%_-10%_-28.57%_-10%]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 96 58">
              <g id="3.æ°æ®å±ç¤º/Tootips/ä¸­ä¸">
                <g filter="url(#filter0_dd_2001_2545)" id="å½¢ç¶ç»å">
                  <path d={svgPaths.p309e4c80} fill="var(--fill-0, #314059)" />
                </g>
              </g>
              <defs>
                <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="58" id="filter0_dd_2001_2545" width="96" x="0" y="0">
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                  <feOffset dy="4" />
                  <feGaussianBlur stdDeviation="4" />
                  <feColorMatrix type="matrix" values="0 0 0 0 0.0705882 0 0 0 0 0.0705882 0 0 0 0 0.0705882 0 0 0 0.32 0" />
                  <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_2001_2545" />
                  <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                  <feOffset />
                  <feGaussianBlur stdDeviation="1" />
                  <feColorMatrix type="matrix" values="0 0 0 0 0.0705882 0 0 0 0 0.0705882 0 0 0 0 0.0705882 0 0 0 0.16 0" />
                  <feBlend in2="effect1_dropShadow_2001_2545" mode="normal" result="effect2_dropShadow_2001_2545" />
                  <feBlend in="SourceGraphic" in2="effect2_dropShadow_2001_2545" mode="normal" result="shape" />
                </filter>
              </defs>
            </svg>
          </div>
          <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[12px] not-italic text-[#f6f9fe] text-[14px] top-[calc(50%-13px)] w-[56px]">历史影像</p>
        </div>
      </div>
      <div className="absolute inset-[75.19%_85.56%_21.79%_8.33%]" data-name="调度工单筛选栏-Default备份">
        <div className="absolute bg-[#293449] inset-[0_54.55%_0_44.42%]" data-name="矩形" />
        <div className="absolute bottom-0 left-1/2 overflow-clip right-0 top-0" data-name="首页/感知设备/已选中备份 14">
          <div className="absolute bg-[#0d121b] inset-0" data-name="矩形" />
          <Line1 />
        </div>
        <div className="absolute bottom-0 left-0 overflow-clip right-1/2 top-0" data-name="要素识别-Default">
          <div className="absolute bg-[#0d121b] inset-0" data-name="矩形" />
          <Line2 />
        </div>
        <div className="absolute bg-[#293449] bottom-0 left-[48.86%] right-1/2 top-0" data-name="矩形" />
      </div>
      <div className="absolute inset-[75.19%_56.94%_21.79%_36.94%]" data-name="调度工单筛选栏-Default备份 2">
        <div className="absolute bg-[#293449] inset-[0_54.55%_0_44.42%]" data-name="矩形" />
        <div className="absolute bottom-0 left-1/2 overflow-clip right-0 top-0" data-name="首页/感知设备/已选中备份 14">
          <div className="absolute bg-[#0d121b] inset-0" data-name="矩形" />
          <Line1 />
        </div>
        <div className="absolute bottom-0 left-0 overflow-clip right-1/2 top-0" data-name="要素识别-Default">
          <div className="absolute bg-[#0d121b] inset-0" data-name="矩形" />
          <Line2 />
        </div>
        <div className="absolute bg-[#293449] bottom-0 left-[48.86%] right-1/2 top-0" data-name="矩形" />
      </div>
    </div>
  );
}