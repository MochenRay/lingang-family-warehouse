import svgPaths from "./svg-w406qitw5c";
import clsx from "clsx";
type Space4Props = {
  additionalClassNames?: string;
};

function Space4({ children, additionalClassNames = "" }: React.PropsWithChildren<Space4Props>) {
  return (
    <div className={clsx("absolute h-[9px] w-px", additionalClassNames)}>
      <div className="absolute inset-[-5.56%_-318.2%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7.36396 10">
          {children}
        </svg>
      </div>
    </div>
  );
}
type Space3Props = {
  additionalClassNames?: string;
};

function Space3({ additionalClassNames = "" }: Space3Props) {
  return (
    <div className={clsx("absolute h-[8px] w-px", additionalClassNames)}>
      <div className="absolute inset-[-6.25%_-318.2%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7.36396 9">
          <path d={svgPaths.p72a1ec0} fill="var(--stroke-0, #FF0000)" id="è·¯å¾ 10" />
        </svg>
      </div>
    </div>
  );
}
type Space2Props = {
  additionalClassNames?: string;
};

function Space2({ additionalClassNames = "" }: Space2Props) {
  return (
    <div className={clsx("absolute h-px w-[8px]", additionalClassNames)}>
      <div className="absolute inset-[-318.2%_-6.25%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9 7.36396">
          <path d={svgPaths.p15f4e600} fill="var(--stroke-0, #FF0000)" id="è·¯å¾ 7" />
        </svg>
      </div>
    </div>
  );
}
type Space1Props = {
  additionalClassNames?: string;
};

function Space1({ additionalClassNames = "" }: Space1Props) {
  return (
    <div className={clsx("absolute bg-white left-[120px] w-[960px]", additionalClassNames)}>
      <div aria-hidden="true" className="absolute border border-[rgba(10,27,57,0.15)] border-solid inset-[-1px] pointer-events-none" />
    </div>
  );
}
type TextProps = {
  text: string;
  additionalClassNames?: string;
};

function Text({ text, additionalClassNames = "" }: TextProps) {
  return (
    <div className={clsx("absolute h-[22px] w-[68px]", additionalClassNames)}>
      <div className="absolute bg-[rgba(10,27,57,0.04)] h-[22px] left-0 right-0 rounded-[11px] top-1/2 translate-y-[-50%]" data-name="Rectangle" />
      <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[20px] left-[10px] not-italic text-[12px] text-[rgba(10,27,57,0.8)] text-nowrap top-[calc(50%-10px)]">{text}</p>
    </div>
  );
}
type Helper1Props = {
  text: string;
  text1: string;
  additionalClassNames?: string;
};

function Helper1({ text, text1, additionalClassNames = "" }: Helper1Props) {
  return (
    <div className={clsx("absolute h-[60px] not-italic overflow-clip text-nowrap top-[1354px] w-[93px]", additionalClassNames)}>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[20px] left-[calc(50%-46.5px)] text-[#6d7789] text-[12px] top-[calc(50%+10px)]">{text}</p>
      <p className="absolute font-['DIN_Alternate:Bold',sans-serif] leading-[32px] left-[calc(50%-46.5px)] text-[#0a1b39] text-[24px] top-[calc(50%-30px)]">{text1}</p>
    </div>
  );
}
type HelperProps = {
  additionalClassNames?: string;
};

function Helper({ additionalClassNames = "" }: HelperProps) {
  return (
    <div className={clsx("absolute h-[40px] top-[1364px] w-[32px]", additionalClassNames)}>
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 40">
        <g id="1.éç¨/Iconå¾æ /3.Else/åéç¬¦">
          <g id="Rectangle"></g>
          <path d="M16 0V40" id="Line" stroke="var(--stroke-0, #0A1B39)" strokeOpacity="0.08" />
        </g>
      </svg>
    </div>
  );
}

export default function Space() {
  return (
    <div className="bg-white relative size-full" data-name="间距（Space）">
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[20px] left-[120px] not-italic text-[#6d7789] text-[12px] text-nowrap top-[80px]">SENSORO 设计规范 / Lins 4.0</p>
      <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[46px] left-[120px] not-italic text-[#0a1b39] text-[38px] text-nowrap top-[180px]">间距（Space）</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[120px] not-italic text-[14px] text-[rgba(10,27,57,0.6)] text-nowrap top-[266px]">设置组件之间的间距。</p>
      <div className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[120px] not-italic text-[#2b6de5] text-[14px] text-nowrap top-[304px]">
        <p className="mb-0">基本用法</p>
        <p>分隔符</p>
      </div>
      <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[normal] left-[120px] not-italic text-[#0a1b39] text-[20px] text-nowrap top-[508px]">基本用法</p>
      <p className="absolute font-['PingFang_SC:Medium',sans-serif] leading-[normal] left-[120px] not-italic text-[#0a1b39] text-[20px] text-nowrap top-[1168px]">分隔符</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[120px] not-italic text-[#3c4961] text-[14px] text-nowrap top-[552px]">推荐使用 4px 、 8px 、 12px 、16px 、 24px 5种尺寸，也可根据8n原则自定义。</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[120px] not-italic text-[#3c4961] text-[14px] text-nowrap top-[1212px]">为相邻元素设置分隔符。</p>
      <Space1 additionalClassNames="h-[394px] top-[614px]" />
      <Space1 additionalClassNames="h-[220px] top-[1274px]" />
      <Helper additionalClassNames="left-[341px]" />
      <Helper additionalClassNames="left-[528px]" />
      <Helper1 text="累计登记车辆" text1="1,995,245" additionalClassNames="left-[208px]" />
      <Helper1 text="累计识别车辆" text1="2,381,669" additionalClassNames="left-[600px]" />
      <div className="absolute h-[60px] left-[413px] not-italic overflow-clip text-nowrap top-[1354px] w-[75px]" data-name="编组 9">
        <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[20px] left-[calc(50%-37.5px)] text-[#6d7789] text-[12px] top-[calc(50%+10px)]">累计识别次数</p>
        <p className="absolute font-['DIN_Alternate:Bold',sans-serif] leading-[32px] left-[calc(50%-37.5px)] text-[#0a1b39] text-[24px] top-[calc(50%-30px)]">351,669</p>
      </div>
      <Text text="标签名称" additionalClassNames="left-[312px] top-[678px]" />
      <Text text="标签名称" additionalClassNames="left-[312px] top-[739px]" />
      <Text text="标签名称" additionalClassNames="left-[388px] top-[678px]" />
      <Text text="标签名称" additionalClassNames="left-[464px] top-[678px]" />
      <Text text="标签名称" additionalClassNames="left-[312px] top-[770px]" />
      <Text text="标签名称" additionalClassNames="left-[312px] top-[800px]" />
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[200px] not-italic text-[14px] text-[rgba(0,0,0,0.65)] text-nowrap top-[678px]">水平间距</p>
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[200px] not-italic text-[14px] text-[rgba(0,0,0,0.65)] text-nowrap top-[740px]">垂直间距</p>
      <Text text="标签名称" additionalClassNames="left-[312px] top-[862px]" />
      <Text text="标签名称" additionalClassNames="left-[312px] top-[892px]" />
      <Text text="标签名称" additionalClassNames="left-[312px] top-[922px]" />
      <Text text="标签名称" additionalClassNames="left-[388px] top-[862px]" />
      <Text text="标签名称" additionalClassNames="left-[388px] top-[892px]" />
      <Text text="标签名称" additionalClassNames="left-[388px] top-[922px]" />
      <Text text="标签名称" additionalClassNames="left-[464px] top-[922px]" />
      <Text text="标签名称" additionalClassNames="left-[464px] top-[862px]" />
      <Text text="标签名称" additionalClassNames="left-[540px] top-[862px]" />
      <Text text="标签名称" additionalClassNames="left-[616px] top-[862px]" />
      <Text text="标签名称" additionalClassNames="left-[464px] top-[892px]" />
      <Text text="标签名称" additionalClassNames="left-[540px] top-[892px]" />
      <Text text="标签名称" additionalClassNames="left-[616px] top-[892px]" />
      <p className="absolute font-['PingFang_SC:Regular',sans-serif] leading-[22px] left-[200px] not-italic text-[14px] text-[rgba(0,0,0,0.65)] text-nowrap top-[862px]">环绕间距</p>
      <Space2 additionalClassNames="left-[380px] top-[688.5px]" />
      <Space2 additionalClassNames="left-[456px] top-[688.5px]" />
      <Space4 additionalClassNames="left-[345.5px] top-[761px]">
        <path d={svgPaths.p2cf0000} fill="var(--stroke-0, #FF0000)" id="è·¯å¾ 9" />
      </Space4>
      <Space3 additionalClassNames="left-[345.5px] top-[792px]" />
      <Space3 additionalClassNames="left-[421.5px] top-[884px]" />
      <Space4 additionalClassNames="left-[421.5px] top-[914px]">
        <path d={svgPaths.p2cf0000} fill="var(--stroke-0, #FF0000)" id="è·¯å¾ 13" />
      </Space4>
      <Space2 additionalClassNames="left-[380px] top-[902.5px]" />
      <Space2 additionalClassNames="left-[456px] top-[902.5px]" />
    </div>
  );
}