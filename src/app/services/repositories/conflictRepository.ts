import { type ConflictRecord } from '../../types/core';
import { buildQueryString, callWithFallback, fetchJson, type ApiListResponse } from '../api';
import { db } from '../db';

export interface ConflictQuery {
  q?: string;
  search?: string;
  status?: ConflictRecord['status'];
  type?: ConflictRecord['type'];
  gridId?: string;
  limit?: number;
  offset?: number;
}

function matchesConflictQuery(conflict: ConflictRecord, query: ConflictQuery): boolean {
  const keyword = (query.q ?? query.search ?? '').trim();
  if (keyword) {
    const haystack = [
      conflict.title,
      conflict.description,
      conflict.location,
      ...conflict.involvedParties.map((party) => party.name),
    ].join('||');
    if (!haystack.includes(keyword)) {
      return false;
    }
  }

  if (query.status && conflict.status !== query.status) {
    return false;
  }
  if (query.type && conflict.type !== query.type) {
    return false;
  }
  if (query.gridId && conflict.gridId !== query.gridId) {
    return false;
  }

  return true;
}

export const conflictRepository = {
  async getConflicts(query?: ConflictQuery): Promise<ConflictRecord[]> {
    return callWithFallback(
      async () => {
        const response = await fetchJson<ApiListResponse<ConflictRecord>>(
          `/conflicts${buildQueryString({ limit: 500, ...query })}`,
        );
        return response.items;
      },
      () => db.getConflicts((conflict) => (query ? matchesConflictQuery(conflict, query) : true)),
    );
  },

  async getConflict(id: string): Promise<ConflictRecord | undefined> {
    return callWithFallback(
      () => fetchJson<ConflictRecord>(`/conflicts/${id}`),
      () => db.getConflicts((conflict) => conflict.id === id)[0],
    );
  },

  async addConflict(conflict: ConflictRecord): Promise<ConflictRecord> {
    return callWithFallback(
      () => {
        const { id: _id, ...payload } = conflict;
        return fetchJson<ConflictRecord>('/conflicts', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      },
      () => {
        db.addConflict(conflict);
        return conflict;
      },
    );
  },

  async updateConflict(id: string, updates: Partial<ConflictRecord>): Promise<ConflictRecord | undefined> {
    return callWithFallback(
      () =>
        fetchJson<ConflictRecord>(`/conflicts/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        }),
      () => {
        db.updateConflict(id, updates);
        return db.getConflicts((conflict) => conflict.id === id)[0];
      },
    );
  },
};
