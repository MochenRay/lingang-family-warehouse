import { describe, expect, it, vi } from 'vitest';
import type { Grid, House, Person } from '../types/core';
import {
  POPULATION_LEDGER_CACHE_TTL_MS,
  createPopulationLedgerCache,
  type PopulationLedgerSnapshot,
} from './populationLedgerCache';

function snapshot(version: number, fetchedAt = 0): PopulationLedgerSnapshot {
  return {
    people: [{ id: 'person-' + version, name: '人员' + version } as Person],
    total: version,
    grids: [{ id: 'grid-' + version, name: '网格' + version } as Grid],
    houses: [{ id: 'house-' + version, address: '房屋' + version } as House],
    fetchedAt,
  };
}

describe('populationLedgerCache', () => {
  it('五分钟内复用快照，过期后保留旧值并合并并发刷新', async () => {
    let now = 1_000;
    let version = 0;
    let releaseRefresh!: () => void;
    const refreshGate = new Promise<void>((resolve) => { releaseRefresh = resolve; });
    const load = vi.fn(async () => {
      version += 1;
      if (version === 2) await refreshGate;
      return snapshot(version);
    });
    const cache = createPopulationLedgerCache({ load, now: () => now });

    const first = await cache.get();
    expect(first.people[0].id).toBe('person-1');
    expect(first.fetchedAt).toBe(now);
    expect(cache.isFresh()).toBe(true);
    expect(await cache.get()).toBe(first);
    expect(load).toHaveBeenCalledTimes(1);

    now += POPULATION_LEDGER_CACHE_TTL_MS + 1;
    expect(cache.peek()).toBe(first);
    expect(cache.isFresh()).toBe(false);
    const refreshA = cache.get();
    const refreshB = cache.get();
    expect(load).toHaveBeenCalledTimes(2);
    releaseRefresh();
    const [secondA, secondB] = await Promise.all([refreshA, refreshB]);
    expect(secondA).toBe(secondB);
    expect(secondA.people[0].id).toBe('person-2');
    expect(cache.peek()).toBe(secondA);
  });

  it('刷新失败不丢旧快照，invalidate 后下一次必重新读取', async () => {
    let now = 10_000;
    let fail = false;
    let version = 0;
    const load = vi.fn(async () => {
      if (fail) throw new Error('planned refresh failure');
      version += 1;
      return snapshot(version);
    });
    const cache = createPopulationLedgerCache({ load, now: () => now });
    const first = await cache.get();

    now += POPULATION_LEDGER_CACHE_TTL_MS + 1;
    fail = true;
    await expect(cache.get()).rejects.toThrow('planned refresh failure');
    expect(cache.peek()).toBe(first);

    cache.invalidate();
    expect(cache.peek()).toBeNull();
    fail = false;
    const second = await cache.get();
    expect(second.people[0].id).toBe('person-2');
    expect(second).not.toBe(first);
    expect(load).toHaveBeenCalledTimes(3);
  });

  it('invalidate 后旧 in-flight 结果不得回填新一代缓存', async () => {
    const releases: Array<(value: PopulationLedgerSnapshot) => void> = [];
    const load = vi.fn(() => new Promise<PopulationLedgerSnapshot>((resolve) => releases.push(resolve)));
    const cache = createPopulationLedgerCache({ load, now: () => 20_000 });

    const staleRequest = cache.get();
    cache.invalidate();
    const freshRequest = cache.get();
    expect(load).toHaveBeenCalledTimes(2);

    releases[0](snapshot(1));
    await staleRequest;
    expect(cache.peek()).toBeNull();

    releases[1](snapshot(2));
    const fresh = await freshRequest;
    expect(fresh.people[0].id).toBe('person-2');
    expect(cache.peek()).toBe(fresh);
  });
});
