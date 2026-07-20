import { describe, expect, it } from 'vitest';

/**
 * status/brand 文字色 token 对比度机械断言（T1b 三审裁决）。
 * 合同：*-text 在 neutral-01/02/03 纯色底及对应 soft 衬底上均 ≥ 4.5:1（WCAG AA）。
 * 值与 src/styles/theme.css 保持一致；改 token 须同步改这里。
 */

type Rgb = [number, number, number];

const NEUTRAL_01: Rgb = [0x1d, 0x23, 0x36];
const NEUTRAL_02: Rgb = [0x2c, 0x33, 0x4d];
const NEUTRAL_03: Rgb = [0x3d, 0x46, 0x63];

const TEXT_TOKENS: Record<string, Rgb> = {
  successText: [0x5b, 0xdc, 0xac],
  warningText: [0xf7, 0xbc, 0x6b],
  errorText: [0xf9, 0x9c, 0xa3],
  infoText: [0x8a, 0xd7, 0xf0],
  brandText: [0x9d, 0xc0, 0xf2],
};

const SOFT_BACKGROUNDS: Record<string, { color: Rgb; alpha: number }> = {
  successText: { color: [25, 177, 114], alpha: 0.14 },
  warningText: { color: [214, 115, 13], alpha: 0.16 },
  errorText: { color: [213, 33, 50], alpha: 0.16 },
  infoText: { color: [42, 163, 207], alpha: 0.16 },
  brandText: { color: [39, 97, 203], alpha: 0.1 },
};

function luminance([r, g, b]: Rgb): number {
  const channel = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(fg: Rgb, bg: Rgb): number {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function composite(fg: Rgb, alpha: number, bg: Rgb): Rgb {
  return [
    fg[0] * alpha + bg[0] * (1 - alpha),
    fg[1] * alpha + bg[1] * (1 - alpha),
    fg[2] * alpha + bg[2] * (1 - alpha),
  ];
}

const NEUTRALS: Array<[string, Rgb]> = [
  ['neutral-01', NEUTRAL_01],
  ['neutral-02', NEUTRAL_02],
  ['neutral-03', NEUTRAL_03],
];

describe('status/brand text token 对比度合同', () => {
  for (const [tokenName, fg] of Object.entries(TEXT_TOKENS)) {
    describe(tokenName, () => {
      for (const [neutralName, neutralBg] of NEUTRALS) {
        it(`纯色底 ${neutralName} ≥ 4.5:1`, () => {
          expect(contrastRatio(fg, neutralBg)).toBeGreaterThanOrEqual(4.5);
        });

        it(`soft 衬底 ${neutralName} ≥ 4.5:1`, () => {
          const soft = SOFT_BACKGROUNDS[tokenName];
          const softBg = composite(soft.color, soft.alpha, neutralBg);
          expect(contrastRatio(fg, softBg)).toBeGreaterThanOrEqual(4.5);
        });
      }
    });
  }
});
