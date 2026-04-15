import { type VisitRecord } from '../../types/core';
import { buildQueryString, callWithFallback, fetchJson, type ApiListResponse } from '../api';
import { db } from '../db';

export interface VisitQuery {
  gridId?: string;
  targetId?: string;
  targetType?: 'person' | 'house';
  visitorName?: string;
  tag?: string;
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export type VisitCreateInput = Omit<VisitRecord, 'id'>;
export type PersonVisitCreateInput = Omit<VisitCreateInput, 'targetId' | 'targetType'>;

function matchesVisitQuery(visit: VisitRecord, query: VisitQuery): boolean {
  if (query.gridId && visit.gridId !== query.gridId) {
    return false;
  }
  if (query.targetId && visit.targetId !== query.targetId) {
    return false;
  }
  if (query.targetType && visit.targetType !== query.targetType) {
    return false;
  }
  if (query.visitorName && !visit.visitorName.includes(query.visitorName)) {
    return false;
  }
  if (query.tag && !(visit.tags ?? []).some((tag) => tag.includes(query.tag!))) {
    return false;
  }
  return true;
}

export const visitRepository = {
  async getVisits(query?: VisitQuery): Promise<VisitRecord[]> {
    return callWithFallback(
      async () => {
        const response = await fetchJson<ApiListResponse<VisitRecord>>(
          `/visits${buildQueryString({ limit: 500, order: 'desc', ...query })}`,
        );
        return response.items;
      },
      () => db.getVisits((visit) => (query ? matchesVisitQuery(visit, query) : true)),
    );
  },

  async getVisit(id: string): Promise<VisitRecord | undefined> {
    return callWithFallback(
      () => fetchJson<VisitRecord>(`/visits/${id}`),
      () => db.getVisits((visit) => visit.id === id)[0],
    );
  },

  async addVisit(visit: VisitCreateInput): Promise<VisitRecord> {
    return callWithFallback(
      () =>
        fetchJson<VisitRecord>('/visits', {
          method: 'POST',
          body: JSON.stringify(visit),
        }),
      () => {
        const nextVisit: VisitRecord = {
          ...visit,
          id: `visit_${Date.now()}`,
        };
        db.addVisit(nextVisit);
        return nextVisit;
      },
    );
  },

  async addPersonVisit(personId: string, visit: PersonVisitCreateInput): Promise<VisitRecord> {
    return callWithFallback(
      () =>
        fetchJson<VisitRecord>(`/people/${personId}/visits`, {
          method: 'POST',
          body: JSON.stringify(visit),
        }),
      () => {
        const person = db.getPerson(personId);
        const nextVisit: VisitRecord = {
          id: `visit_${Date.now()}`,
          targetId: personId,
          targetType: 'person',
          gridId: visit.gridId,
          visitorName: visit.visitorName,
          date: visit.date,
          content: visit.content,
          images: visit.images,
          tags: visit.tags,
        };
        db.addVisit(nextVisit);
        if (person) {
          db.updatePerson(personId, { updatedAt: visit.date });
        }
        return nextVisit;
      },
    );
  },

  async updateVisit(id: string, updates: Partial<VisitRecord>): Promise<VisitRecord | undefined> {
    return callWithFallback(
      () =>
        fetchJson<VisitRecord>(`/visits/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        }),
      () => {
        const current = db.getVisits((visit) => visit.id === id)[0];
        if (!current) {
          return undefined;
        }

        const next = { ...current, ...updates };
        const storageKey = 'app_data_visits';
        const visits = db.getVisits();
        const index = visits.findIndex((visit) => visit.id === id);
        if (index === -1) {
          return undefined;
        }

        visits[index] = next;
        window.localStorage.setItem(storageKey, JSON.stringify(visits));
        window.dispatchEvent(new Event('db-change'));
        return next;
      },
    );
  },
};
