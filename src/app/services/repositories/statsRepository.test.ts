import { afterEach, describe, expect, it, vi } from 'vitest';

import { statsRepository } from './statsRepository';

function createMemoryStorage(seed: Record<string, string> = {}): Storage {
  const values = new Map(Object.entries(seed));
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
}

const DEMOGRAPHICS_RESPONSE = {
  totalPopulation: 12,
  elderlyCount: 3,
  elderlyRate: 25,
  ageGenderData: [
    { name: '81岁及以上', male: 0, female: 1 },
    { name: '71-80', male: 1, female: 0 },
    { name: '61-70', male: 1, female: 1 },
    { name: '51-60', male: 1, female: 0 },
    { name: '41-50', male: 0, female: 1 },
    { name: '31-40', male: 1, female: 1 },
    { name: '21-30', male: 1, female: 1 },
    { name: '11-20', male: 0, female: 1 },
    { name: '0-10', male: 1, female: 0 },
  ],
  typeData: [
    { name: '户籍', value: 6 },
    { name: '流动', value: 3 },
    { name: '留守', value: 2 },
    { name: '境外', value: 1 },
  ],
  educationData: [{ name: '本科', value: 12 }],
  nationData: [{ name: '汉族', value: 12 }],
};

describe('statsRepository demographics', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('loads the compact demographics aggregate from one API endpoint', async () => {
    vi.stubEnv('VITE_DATA_MODE', 'api');
    const fetchMock = vi.fn(async (_input: string | URL | Request) => new Response(JSON.stringify(DEMOGRAPHICS_RESPONSE), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(statsRepository.getDemographics()).resolves.toEqual(DEMOGRAPHICS_RESPONSE);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toBe('http://localhost:8000/api/stats/demographics');
  });

  it('builds the same aggregate locally without fetching and keeps the age-60 boundary', async () => {
    const people = [
      { id: 'p-1', gridId: 'g-1', name: '甲', idCard: '1', gender: '男', age: 60, address: 'A', type: '户籍', tags: [], risk: 'Low', updatedAt: '2026-07-01', education: '研究生', nation: '汉族' },
      { id: 'p-2', gridId: 'g-1', name: '乙', idCard: '2', gender: '女', age: 61, address: 'B', type: '流动', tags: [], risk: 'Low', updatedAt: '2026-07-01', education: '博士后', nation: '满族' },
      { id: 'p-3', gridId: 'g-1', name: '丙', idCard: '3', gender: '女', age: 18, address: 'C', type: '户籍', tags: [], risk: 'Low', updatedAt: '2026-07-01' },
    ];
    const storage = createMemoryStorage({ app_data_people: JSON.stringify(people) });
    vi.stubEnv('VITE_DATA_MODE', 'fallback');
    vi.stubGlobal('localStorage', storage);
    vi.stubGlobal('window', {
      localStorage: storage,
      location: { hostname: 'localhost' },
      dispatchEvent: vi.fn(),
    });
    vi.stubGlobal('CustomEvent', class {
      constructor(
        public type: string,
        public init?: CustomEventInit,
      ) {}
    });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await statsRepository.getDemographics();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.totalPopulation).toBe(3);
    expect(result.elderlyCount).toBe(1);
    expect(result.elderlyRate).toBe(33.3);
    expect(result.ageGenderData).toEqual([
      { name: '81岁及以上', male: 0, female: 0 },
      { name: '71-80', male: 0, female: 0 },
      { name: '61-70', male: 0, female: 1 },
      { name: '51-60', male: 1, female: 0 },
      { name: '41-50', male: 0, female: 0 },
      { name: '31-40', male: 0, female: 0 },
      { name: '21-30', male: 0, female: 0 },
      { name: '11-20', male: 0, female: 1 },
      { name: '0-10', male: 0, female: 0 },
    ]);
    expect(result.educationData.find((item) => item.name === '硕士')?.value).toBe(1);
    expect(result.educationData.find((item) => item.name === '博士')?.value).toBe(1);
    expect(result.educationData.find((item) => item.name === '未记录')?.value).toBe(1);
  });

  it('keeps the 81+ bucket unbounded and folds uncommon nations into the fixed six categories', async () => {
    const nations = ['藏族', '朝鲜族', '汉族', '回族', '满族', '蒙古族', '壮族'];
    const people = nations.map((nation, index) => ({
      id: `p-${index}`,
      gridId: 'g-1',
      name: nation,
      idCard: String(index),
      gender: index === 0 ? '女' : '男',
      age: index === 0 ? 201 : 30,
      address: 'A',
      type: '户籍',
      tags: [],
      risk: 'Low',
      updatedAt: '2026-07-01',
      nation,
      education: index === 0 ? '𠀀学历' : index === 1 ? '\uE000学历' : undefined,
    }));
    const storage = createMemoryStorage({ app_data_people: JSON.stringify(people) });
    vi.stubEnv('VITE_DATA_MODE', 'fallback');
    vi.stubGlobal('localStorage', storage);
    vi.stubGlobal('window', {
      localStorage: storage,
      location: { hostname: 'localhost' },
      dispatchEvent: vi.fn(),
    });
    vi.stubGlobal('CustomEvent', class {
      constructor(
        public type: string,
        public init?: CustomEventInit,
      ) {}
    });

    const result = await statsRepository.getDemographics();

    expect(result.ageGenderData[0]).toEqual({ name: '81岁及以上', male: 0, female: 1 });
    expect(result.nationData).toEqual([
      { name: '汉族', value: 1 },
      { name: '朝鲜族', value: 1 },
      { name: '满族', value: 1 },
      { name: '回族', value: 1 },
      { name: '其他民族', value: 3 },
      { name: '未记录', value: 0 },
    ]);
    expect(result.educationData.slice(-2).map((item) => item.name)).toEqual(['\uE000学历', '𠀀学历']);
  });

  it('keeps 10/11, 20/21, and 80/81 in disjoint fallback buckets', async () => {
    const people = [10, 11, 20, 21, 80, 81].map((age, index) => ({
      id: `boundary-${age}`,
      gridId: 'g-1',
      name: `边界${age}`,
      idCard: String(index),
      gender: '男',
      age,
      address: 'A',
      type: '户籍',
      tags: [],
      risk: 'Low',
      updatedAt: '2026-07-01',
    }));
    const storage = createMemoryStorage({ app_data_people: JSON.stringify(people) });
    vi.stubEnv('VITE_DATA_MODE', 'fallback');
    vi.stubGlobal('localStorage', storage);
    vi.stubGlobal('window', {
      localStorage: storage,
      location: { hostname: 'localhost' },
      dispatchEvent: vi.fn(),
    });

    const result = await statsRepository.getDemographics();

    expect(result.ageGenderData).toEqual([
      { name: '81岁及以上', male: 1, female: 0 },
      { name: '71-80', male: 1, female: 0 },
      { name: '61-70', male: 0, female: 0 },
      { name: '51-60', male: 0, female: 0 },
      { name: '41-50', male: 0, female: 0 },
      { name: '31-40', male: 0, female: 0 },
      { name: '21-30', male: 1, female: 0 },
      { name: '11-20', male: 2, female: 0 },
      { name: '0-10', male: 1, female: 0 },
    ]);
  });
});
