export type SecondaryAiKind = 'query' | 'policy' | 'writing';

function normalizePrompt(prompt: string): string {
  return prompt.trim().replace(/\s+/g, ' ');
}

export function buildSecondaryAiIntro(kind: SecondaryAiKind): string {
  switch (kind) {
    case 'query':
      return '您好，我是智能问数样例页。这里主要展示查询结果的输出结构；涉及真实对象联动时，请从驾驶舱、人口管理或移动工作台入口发起。';
    case 'policy':
      return '您好，我是政策解读样例页。这里展示政策答复的结构模板；涉及具体家庭或纠纷场景时，请先回到人物详情或矛盾调解页确认上下文。';
    case 'writing':
      return '您好，我是公文写作样例页。这里展示文稿生成的结构样式；需要带入真实走访或处置上下文时，请从走访记录或矛盾调解入口发起。';
  }
}

export function buildSecondaryAiReply(kind: SecondaryAiKind, prompt: string): string {
  const normalizedPrompt = normalizePrompt(prompt);

  switch (kind) {
    case 'query':
      return [
        `已记录问题：${normalizedPrompt}`,
        '',
        '当前页展示的是问数结果样例，重点说明输出结构，不直接承诺实时联动。',
        '建议输出结构：',
        '- 查询范围：人口、房屋、走访、矛盾四类对象',
        '- 统计维度：时间、网格、标签或风险级别',
        '- 下一步动作：回到驾驶舱或对象详情页核验明细',
      ].join('\n');
    case 'policy':
      return [
        `已记录问题：${normalizedPrompt}`,
        '',
        '当前页展示的是政策答复样例，重点说明答复结构，不替代主链页面里的对象化联动。',
        '建议答复结构：',
        '1. 适用对象与办理条件',
        '2. 需要补齐的证明材料或对象字段',
        '3. 可回到人物详情、矛盾调解页继续核验的上下文',
      ].join('\n');
    case 'writing':
      return [
        `已记录需求：${normalizedPrompt}`,
        '',
        '当前页展示的是文稿生成样例，重点说明成稿结构，不直接伪装成已接真实上下文。',
        '建议成稿结构：',
        '一、事项背景与对象范围',
        '二、当前处置动作与现场情况',
        '三、后续安排与责任分工',
        '如需带入真实数据，请从走访记录或矛盾调解页发起。',
      ].join('\n');
  }
}
