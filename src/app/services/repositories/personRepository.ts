import { type Grid, type Person, type PersonType, type RiskLevel } from '../../types/core';
import { buildQueryString, callWithFallback, fetchJson, type ApiListResponse } from '../api';
import { db } from '../db';

interface GridStatsResponse {
  grids: Array<{
    id: string;
    name: string;
    parentId?: string | null;
    managerName?: string | null;
  }>;
}

export interface PersonQuery {
  q?: string;
  search?: string;
  gridId?: string;
  houseId?: string;
  type?: PersonType;
  risk?: RiskLevel;
  tag?: string;
  limit?: number;
  offset?: number;
}

type PersonFilter = PersonQuery | ((person: Person) => boolean);
type PersonCreateInput = Omit<Person, 'id'> & { id?: string };

function matchesPersonQuery(person: Person, query: PersonQuery): boolean {
  const keyword = (query.q ?? query.search ?? '').trim();
  if (keyword) {
    const haystack = [
      person.name,
      person.address,
      person.idCard,
      person.phone ?? '',
      ...(person.tags ?? []),
      ...((person.careLabels ?? []) as string[]),
    ].join('||');

    if (!haystack.includes(keyword)) {
      return false;
    }
  }

  if (query.gridId && person.gridId !== query.gridId) {
    return false;
  }
  if (query.houseId && person.houseId !== query.houseId) {
    return false;
  }
  if (query.type && person.type !== query.type) {
    return false;
  }
  if (query.risk && person.risk !== query.risk) {
    return false;
  }
  if (query.tag) {
    const tags = [...(person.tags ?? []), ...((person.careLabels ?? []) as string[])];
    if (!tags.some((tag) => tag.includes(query.tag!))) {
      return false;
    }
  }

  return true;
}

function isQueryObject(input?: PersonFilter): input is PersonQuery {
  return typeof input !== 'function';
}

async function getPeopleViaFallback(input?: PersonFilter): Promise<Person[]> {
  if (!input) {
    return db.getPeople();
  }
  if (typeof input === 'function') {
    return db.getPeople(input);
  }
  return db.getPeople((person) => matchesPersonQuery(person, input));
}

export const personRepository = {
  async getPeople(input?: PersonFilter): Promise<Person[]> {
    return callWithFallback(
      async () => {
        const query = isQueryObject(input) ? input ?? {} : {};
        const response = await fetchJson<ApiListResponse<Person>>(
          `/people${buildQueryString({ limit: 500, ...query })}`,
        );
        return typeof input === 'function' ? response.items.filter(input) : response.items;
      },
      () => getPeopleViaFallback(input),
    );
  },

  async getPerson(id: string): Promise<Person | undefined> {
    return callWithFallback(
      () => fetchJson<Person>(`/people/${id}`),
      () => db.getPerson(id),
    );
  },

  async addPerson(person: PersonCreateInput): Promise<Person> {
    return callWithFallback(
      () => {
        const { id: _id, ...payload } = person;
        return fetchJson<Person>('/people', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      },
      () => {
        const nextPerson: Person = {
          ...person,
          id: person.id ?? `person_${Date.now()}`,
        };
        db.addPerson(nextPerson);
        return nextPerson;
      },
    );
  },

  async updatePerson(id: string, updates: Partial<Person>): Promise<Person | undefined> {
    return callWithFallback(
      () =>
        fetchJson<Person>(`/people/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        }),
      () => {
        db.updatePerson(id, updates);
        return db.getPerson(id);
      },
    );
  },

  async deletePerson(id: string): Promise<void> {
    return callWithFallback(
      async () => {
        await fetchJson<{ ok: true } | null>(`/people/${id}`, {
          method: 'DELETE',
        });
      },
      () => {
        db.deletePerson(id);
      },
    );
  },

  async getGrids(): Promise<Grid[]> {
    return callWithFallback(
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
