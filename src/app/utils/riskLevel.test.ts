import { describe, expect, it } from 'vitest';

import { getRiskLevelLabel, RISK_LEVEL_LABEL } from './riskLevel';

describe('risk level display labels', () => {
  it('keeps the API enum internal and exposes one Chinese display mapping', () => {
    expect(RISK_LEVEL_LABEL).toEqual({
      High: '高风险',
      Medium: '中风险',
      Low: '低风险',
    });
    expect(getRiskLevelLabel('High')).toBe('高风险');
    expect(getRiskLevelLabel('Medium')).toBe('中风险');
    expect(getRiskLevelLabel('Low')).toBe('低风险');
  });
});
