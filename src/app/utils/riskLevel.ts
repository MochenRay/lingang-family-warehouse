import type { RiskLevel } from '../types/core';

export const RISK_LEVEL_LABEL: Record<RiskLevel, string> = {
  High: '高风险',
  Medium: '中风险',
  Low: '低风险',
};

export function getRiskLevelLabel(value?: string | null): string {
  if (!value) return '风险未评估';
  return RISK_LEVEL_LABEL[value as RiskLevel] ?? value;
}
