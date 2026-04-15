import { type Grid, type House, type HouseType, type HousingHistory, type Person } from '../../types/core';
import { buildQueryString, callWithFallback, fetchJson, type ApiListResponse } from '../api';
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

export const houseRepository = {
  async getHouses(input?: HouseFilter): Promise<House[]> {
    return callWithFallback(
      async () => {
        const query = isQueryObject(input) ? input ?? {} : {};
        const response = await fetchJson<ApiListResponse<House>>(
          `/houses${buildQueryString({ limit: 500, ...query })}`,
        );
        return typeof input === 'function' ? response.items.filter(input) : response.items;
      },
      () => getHousesViaFallback(input),
    );
  },

  async getHouse(id: string): Promise<House | undefined> {
    return callWithFallback(
      () => fetchJson<House>(`/houses/${id}`),
      () => db.getHouse(id),
    );
  },

  async addHouse(house: House): Promise<House> {
    db.addHouse(house);
    return house;
  },

  async updateHouse(id: string, updates: Partial<House>): Promise<House | undefined> {
    return callWithFallback(
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
    return callWithFallback(
      () => fetchJson<HousingHistory[]>(`/houses/${houseId}/history`),
      () => db.getHousingHistory((item) => item.houseId === houseId),
    );
  },

  async getGrids(): Promise<Grid[]> {
    return db.getGrids();
  },
};
