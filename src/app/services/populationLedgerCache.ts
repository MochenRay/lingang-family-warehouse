import type { Grid, House, Person } from '../types/core';
import { houseRepository } from './repositories/houseRepository';
import { personRepository } from './repositories/personRepository';

export const POPULATION_LEDGER_CACHE_TTL_MS = 5 * 60 * 1_000;

export interface PopulationLedgerSnapshot {
  people: Person[];
  total: number;
  grids: Grid[];
  houses: House[];
  fetchedAt: number;
}

type PopulationLedgerLoaderResult = Omit<PopulationLedgerSnapshot, 'fetchedAt'> & {
  fetchedAt?: number;
};

interface PopulationLedgerCacheOptions {
  load: () => Promise<PopulationLedgerLoaderResult>;
  now?: () => number;
  ttlMs?: number;
}

export function createPopulationLedgerCache({
  load,
  now = Date.now,
  ttlMs = POPULATION_LEDGER_CACHE_TTL_MS,
}: PopulationLedgerCacheOptions) {
  let cached: PopulationLedgerSnapshot | null = null;
  let generation = 0;
  let inFlight: { generation: number; promise: Promise<PopulationLedgerSnapshot> } | null = null;

  const peek = () => cached;

  const isFresh = () =>
    cached !== null && now() - cached.fetchedAt < ttlMs;

  const get = () => {
    if (isFresh()) {
      return Promise.resolve(cached!);
    }

    if (inFlight?.generation === generation) {
      return inFlight.promise;
    }

    const requestGeneration = generation;
    const promise = load()
      .then((result) => {
        const snapshot: PopulationLedgerSnapshot = {
          people: result.people,
          total: result.total,
          grids: result.grids,
          houses: result.houses,
          fetchedAt: now(),
        };
        if (requestGeneration === generation) {
          cached = snapshot;
        }
        return snapshot;
      })
      .finally(() => {
        if (inFlight?.generation === requestGeneration) {
          inFlight = null;
        }
      });

    inFlight = { generation: requestGeneration, promise };
    return promise;
  };

  const invalidate = () => {
    generation += 1;
    cached = null;
    inFlight = null;
  };

  return { peek, isFresh, get, invalidate };
}

const populationLedgerCache = createPopulationLedgerCache({
  load: async () => {
    const [peopleResult, grids, houses] = await Promise.all([
      personRepository.getPeopleList(),
      personRepository.getGrids(),
      houseRepository.getHouses(),
    ]);
    return {
      people: peopleResult.items,
      total: peopleResult.total,
      grids,
      houses,
    };
  },
});

export const readPopulationLedgerCache = () => populationLedgerCache.peek();
export const isPopulationLedgerCacheFresh = () => populationLedgerCache.isFresh();
export const getPopulationLedgerSnapshot = () => populationLedgerCache.get();
export const invalidatePopulationLedgerCache = () => populationLedgerCache.invalidate();
