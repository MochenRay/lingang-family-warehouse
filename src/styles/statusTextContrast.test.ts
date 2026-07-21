import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * status/brand 文字色 token 对比度机械断言（T1b 四审裁决）。
 * 合同：*-text 在 neutral-01/02/03 纯色底及对应 soft 衬底上均 ≥ 4.5:1（WCAG AA）。
 * **直接解析 src/styles/theme.css 的 CSS 变量**，不手抄值——token 改坏此测试必红。
 */

type Rgb = [number, number, number];

const themeCss = readFileSync(resolve(__dirname, './theme.css'), 'utf-8');

function cssVar(name: string): string {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = themeCss.match(new RegExp(`${escaped}\\s*:\\s*([^;]+);`));
  if (!match) {
    throw new Error(`theme.css 中未找到变量 ${name}`);
  }
  return match[1].trim();
}

function parseHexColor(value: string): Rgb {
  const match = value.match(/#([0-9a-fA-F]{6})/);
  if (!match) {
    throw new Error(`无法解析 hex 颜色：${value}`);
  }
  const hex = match[1];
  return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
}

function parseRgbaColor(value: string): { color: Rgb; alpha: number } {
  const match = value.match(/rgba?\(([^)]+)\)/);
  if (!match) {
    throw new Error(`无法解析 rgba 颜色：${value}`);
  }
  const parts = match[1].split(',').map((part) => parseFloat(part.trim()));
  return { color: [parts[0], parts[1], parts[2]], alpha: parts.length > 3 ? parts[3] : 1 };
}

const NEUTRALS: Array<[string, Rgb]> = [
  ['neutral-01', parseHexColor(cssVar('--color-neutral-01'))],
  ['neutral-02', parseHexColor(cssVar('--color-neutral-02'))],
  ['neutral-03', parseHexColor(cssVar('--color-neutral-03'))],
];

const TEXT_TOKENS: Record<string, { fg: Rgb; soft: { color: Rgb; alpha: number } }> = {
  '--color-status-success-text': {
    fg: parseHexColor(cssVar('--color-status-success-text')),
    soft: parseRgbaColor(cssVar('--color-status-success-soft')),
  },
  '--color-status-warning-text': {
    fg: parseHexColor(cssVar('--color-status-warning-text')),
    soft: parseRgbaColor(cssVar('--color-status-warning-soft')),
  },
  '--color-status-error-text': {
    fg: parseHexColor(cssVar('--color-status-error-text')),
    soft: parseRgbaColor(cssVar('--color-status-error-soft')),
  },
  '--color-status-info-text': {
    fg: parseHexColor(cssVar('--color-status-info-text')),
    soft: parseRgbaColor(cssVar('--color-status-info-soft')),
  },
  '--color-brand-text': {
    fg: parseHexColor(cssVar('--color-brand-text')),
    soft: { color: parseHexColor(cssVar('--color-brand-primary')), alpha: 0.1 },
  },
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

describe('status/brand text token 对比度合同（直读 theme.css）', () => {
  for (const [tokenName, { fg, soft }] of Object.entries(TEXT_TOKENS)) {
    describe(tokenName, () => {
      for (const [neutralName, neutralBg] of NEUTRALS) {
        it(`纯色底 ${neutralName} ≥ 4.5:1`, () => {
          expect(contrastRatio(fg, neutralBg)).toBeGreaterThanOrEqual(4.5);
        });

        it(`soft 衬底 ${neutralName} ≥ 4.5:1`, () => {
          const softBg = composite(soft.color, soft.alpha, neutralBg);
          expect(contrastRatio(fg, softBg)).toBeGreaterThanOrEqual(4.5);
        });
      }
    });
  }
});
