import { type Grid, type House, type HouseType, type HousingHistory, type Person } from '../../types/core';
import {
  buildQueryString,
  callWithFallback,
  callWriteWithFallback,
  fetchAllListPages,
  fetchJson,
  type ApiListResponse,
} from '../api';
import { db } from '../db';

export interface HouseQuery {
  q?: string;
  search?: string;
  gridId?: string;
  communityName?: string;
  type?: HouseType;
  tag?: string;
  limit?: number;
  offset?: number;
}

type HouseFilter = HouseQuery | ((house: House) => boolean);
type HouseCreateInput = Omit<House, 'id'> & { id?: string };

interface GridStatsResponse {
  grids: Array<{
    id: string;
    name: string;
    parentId?: string | null;
    managerName?: string | null;
  }>;
}

function matchesHouseQuery(house: House, query: HouseQuery): boolean {
  const keyword = (query.q ?? query.search ?? '').trim();
  if (keyword) {
    const haystack = [
      house.address,
      house.ownerName ?? '',
      house.communityName ?? '',
      house.building ?? '',
      ...(house.tags ?? []),
    ].join('||');

    if (!haystack.includes(keyword)) {
      return false;
    }
  }

  if (query.gridId && house.gridId !== query.gridId) {
    return false;
  }
  if (query.communityName && house.communityName !== query.communityName) {
    return false;
  }
  if (query.type && house.type !== query.type) {
    return false;
  }
  if (query.tag && !(house.tags ?? []).some((tag) => tag.includes(query.tag!))) {
    return false;
  }

  return true;
}

function isQueryObject(input?: HouseFilter): input is HouseQuery {
  return typeof input !== 'function';
}

async function getHousesViaFallback(input?: HouseFilter): Promise<House[]> {
  if (!input) {
    return db.getHouses();
  }
  if (typeof input === 'function') {
    return db.getHouses(input);
  }
  return db.getHouses((house) => matchesHouseQuery(house, input));
}

async function getHousesList(input?: HouseFilter): Promise<ApiListResponse<House>> {
  return callWithFallback(
    async () => {
      const query = isQueryObject(input) ? input ?? {} : {};
      const { limit, offset, ...filters } = query;
      const response = limit !== undefined || offset !== undefined
        ? await fetchJson<ApiListResponse<House>>(
            `/houses${buildQueryString({ limit: limit ?? 500, offset: offset ?? 0, ...filters })}`,
          )
        : await fetchAllListPages<House>(({ limit: pageLimit, offset: pageOffset }) =>
            fetchJson<ApiListResponse<House>>(
              `/houses${buildQueryString({ limit: pageLimit, offset: pageOffset, ...filters })}`,
            ),
          );
      const items = typeof input === 'function' ? response.items.filter(input) : response.items;
      return {
        items,
        total: typeof input === 'function' ? items.length : response.total,
      };
    },
    async () => {
      const items = await getHousesViaFallback(input);
      return { items, total: items.length };
    },
  );
}

export const houseRepository = {
  getHousesList,

  async getHouses(input?: HouseFilter): Promise<House[]> {
    const response = await getHousesList(input);
    return response.items;
  },

  async getHouse(id: string): Promise<House | undefined> {
    return callWithFallback(
      () => fetchJson<House>(`/houses/${id}`),
      () => db.getHouse(id),
    );
  },

  async addHouse(house: HouseCreateInput): Promise<House> {
    return callWriteWithFallback(
      () => {
        const { id: _id, ...payload } = house;
        return fetchJson<House>('/houses', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      },
      () => {
        const nextHouse: House = {
          ...house,
          id: house.id ?? `house_${Date.now()}`,
        };
        db.addHouse(nextHouse);
        return nextHouse;
      },
    );
  },

  async updateHouse(id: string, updates: Partial<House>): Promise<House | undefined> {
    return callWriteWithFallback(
      () =>
        fetchJson<House>(`/houses/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        }),
      () => {
        db.updateHouse(id, updates);
        return db.getHouse(id);
      },
    );
  },

  async getHouseResidents(id: string): Promise<Person[]> {
    return callWithFallback(
      () => fetchJson<Person[]>(`/houses/${id}/residents`),
      () => db.getPeople((person) => person.houseId === id),
    );
  },

  async getHousingHistory(houseId: string): Promise<HousingHistory[]> {
    const records = await callWithFallback(
      () => fetchJson<HousingHistory[]>(`/houses/${houseId}/history`),
      () => db.getHousingHistory((item) => item.houseId === houseId),
    );
    return records.sort((left, right) => {
      const leftPeriod = left.period ?? '';
      const rightPeriod = right.period ?? '';
      const leftCurrent = leftPeriod.split('~').slice(-1)[0]?.trim() === '至今' ? 1 : 0;
      const rightCurrent = rightPeriod.split('~').slice(-1)[0]?.trim() === '至今' ? 1 : 0;
      return rightCurrent - leftCurrent || rightPeriod.localeCompare(leftPeriod);
    });
  },

  async getHousingHistoryRecords(gridId?: string): Promise<HousingHistory[]> {
    const records = await callWithFallback(
      () =>
        fetchJson<HousingHistory[]>(
          `/houses/history-records${buildQueryString({
            gridId,
            limit: 2000,
          })}`,
        ),
      () => db.getHousingHistory((item) => {
        if (!gridId) {
          return true;
        }
        const house = db.getHouse(item.houseId);
        return house?.gridId === gridId;
      }),
    );
    return records.sort((left, right) => {
      const leftPeriod = left.period ?? '';
      const rightPeriod = right.period ?? '';
      const leftCurrent = leftPeriod.split('~').slice(-1)[0]?.trim() === '至今' ? 1 : 0;
      const rightCurrent = rightPeriod.split('~').slice(-1)[0]?.trim() === '至今' ? 1 : 0;
      return rightCurrent - leftCurrent || rightPeriod.localeCompare(leftPeriod);
    });
  },

  async deleteHouse(id: string): Promise<void> {
    return callWriteWithFallback(
      async () => {
        await fetchJson<{ ok: true } | null>(`/houses/${id}`, {
          method: 'DELETE',
        });
      },
      () => {
        const residents = db.getPeople((person) => person.houseId === id);
        const history = db.getHousingHistory((item) => item.houseId === id);
        if (residents.length > 0 || history.length > 0) {
          throw new Error('House still has bound data');
        }
        const houses = db.getHouses();
        const nextHouses = houses.filter((house) => house.id !== id);
        window.localStorage.setItem('app_data_houses', JSON.stringify(nextHouses));
        window.dispatchEvent(new Event('db-change'));
      },
    );
  },

  async getGrids(): Promise<Grid[]> {
    return callWithFallback<Grid[]>(
      async () => {
        const response = await fetchJson<GridStatsResponse>('/stats/grids');
        return response.grids.map((grid) => ({
          id: grid.id,
          name: grid.name,
          parentId: grid.parentId ?? undefined,
          managerName: grid.managerName ?? undefined,
        }));
      },
      () => db.getGrids(),
    );
  },
};
