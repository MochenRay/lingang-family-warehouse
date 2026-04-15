import { type ConflictRecord, type House, type Person, type VisitRecord } from '../../types/core';
import { buildQueryString, callWithFallback, fetchJson, type ApiListResponse } from '../api';
import { db } from '../db';

export interface ConflictQuery {
  q?: string;
  search?: string;
  status?: ConflictRecord['status'];
  type?: ConflictRecord['type'];
  gridId?: string;
  personId?: string;
  houseId?: string;
  limit?: number;
  offset?: number;
}

export interface ConflictCreateInput extends Omit<ConflictRecord, 'id'> {
  id?: string;
}

export interface ConflictFollowUpStatus {
  code: string;
  label: string;
  detail: string;
}

export interface ConflictContext {
  relatedPeople: Person[];
  relatedHouse?: House;
  recentVisits: VisitRecord[];
  followUpStatus: ConflictFollowUpStatus;
  suggestedActions: string[];
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
  if (
    query.personId &&
    !conflict.involvedParties.some((party) => party.type === 'resident' && party.id === query.personId)
  ) {
    return false;
  }
  if (query.houseId) {
    const residents = db.getPeople((person) => person.houseId === query.houseId);
    const residentIds = new Set(residents.map((resident) => resident.id));
    const house = db.getHouse(query.houseId);
    const location = conflict.location.toLowerCase();
    const matchesResident = conflict.involvedParties.some(
      (party) => party.type === 'resident' && residentIds.has(party.id),
    );
    const matchesAddress = house
      ? location.includes(house.address.toLowerCase()) || house.address.toLowerCase().includes(location)
      : false;
    if (!matchesResident && !matchesAddress) {
      return false;
    }
  }

  return true;
}

function parseConflictTime(value?: string): number {
  if (!value) {
    return 0;
  }
  const timestamp = Date.parse(value.replace(/\//g, '-'));
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function buildFallbackFollowUpStatus(conflict: ConflictRecord, recentVisits: VisitRecord[]): ConflictFollowUpStatus {
  if (conflict.status === '已化解') {
    return {
      code: 'resolved',
      label: '已化解，转入观察',
      detail: '当前案件已完成处置，建议保留一次回访观察，确认是否再次反复。',
    };
  }

  const lastTouchAt = Math.max(
    parseConflictTime(conflict.updatedAt),
    ...recentVisits.map((visit) => parseConflictTime(visit.date)),
  );
  if (!lastTouchAt) {
    return {
      code: 'needs-followup',
      label: '缺少最新跟进',
      detail: '当前案件缺少可确认的最新跟进记录，建议尽快补一次入户或电话回访。',
    };
  }

  const daysSinceTouch = Math.max(
    Math.floor((Date.now() - lastTouchAt) / (1000 * 60 * 60 * 24)),
    0,
  );
  if (daysSinceTouch >= 7) {
    return {
      code: 'overdue',
      label: '回访已超期',
      detail: `距离最近一次更新已超过 ${daysSinceTouch} 天，建议优先安排本周跟进。`,
    };
  }
  if (daysSinceTouch >= 3) {
    return {
      code: 'watch',
      label: '建议继续跟进',
      detail: `距离最近一次更新已 ${daysSinceTouch} 天，适合补一轮确认和结果回填。`,
    };
  }
  return {
    code: 'active',
    label: '近期已跟进',
    detail: '案件在最近几天内有更新，可继续围绕处置结果和回访安排推进。',
  };
}

function buildFallbackConflictContext(conflict: ConflictRecord): ConflictContext {
  const relatedPeople = conflict.involvedParties
    .filter((party) => party.type === 'resident')
    .map((party) => db.getPerson(party.id))
    .filter((person): person is Person => Boolean(person));

  const relatedHouseId =
    new Set(relatedPeople.map((person) => person.houseId).filter(Boolean)).size === 1
      ? relatedPeople[0]?.houseId
      : undefined;

  const relatedHouse =
    (relatedHouseId ? db.getHouse(relatedHouseId) : undefined) ??
    db.getHouses((house) => {
      const location = conflict.location.toLowerCase();
      const address = house.address.toLowerCase();
      return location.includes(address) || address.includes(location);
    })[0];

  const recentVisits = db
    .getVisits((visit) => {
      const targetMatchesPerson =
        visit.targetType === 'person' && relatedPeople.some((person) => person.id === visit.targetId);
      const targetMatchesHouse = relatedHouse && visit.targetType === 'house' && visit.targetId === relatedHouse.id;
      return Boolean(targetMatchesPerson || targetMatchesHouse);
    })
    .sort((left, right) => parseConflictTime(right.date) - parseConflictTime(left.date))
    .slice(0, 5);

  const suggestedActions: string[] = [];
  if (conflict.type === '物业纠纷') {
    suggestedActions.push('结合物业反馈和现场情况，确认是否涉及群租、消防隐患或公共秩序问题。');
  } else if (conflict.type === '家庭纠纷') {
    suggestedActions.push('优先梳理家庭成员诉求和赡养/照护分工，形成一轮书面调解纪要。');
  } else if (conflict.type === '邻里纠纷') {
    suggestedActions.push('明确争议发生时段、频次和影响范围，避免双方口径长期停留在感受层。');
  } else {
    suggestedActions.push('先补一轮事实核验，再决定是转调解、转条线还是继续社区跟进。');
  }
  if (!recentVisits.length) {
    suggestedActions.push('补一次带结果回填的走访，确保当事人、房屋和网格信息能互相印证。');
  }
  if (relatedPeople.some((person) => person.risk === 'High')) {
    suggestedActions.push('相关当事人中存在高风险对象，建议同步做重点对象复核。');
  }
  if (relatedHouse?.type === '出租') {
    suggestedActions.push('该案件关联出租房，建议同步核查同住关系、租住人数和居住合规情况。');
  }
  if (conflict.status !== '已化解') {
    suggestedActions.push('当前仍处调解中，建议补齐下一步责任人、时间点和回访口径。');
  }

  return {
    relatedPeople,
    relatedHouse: relatedHouse ?? undefined,
    recentVisits,
    followUpStatus: buildFallbackFollowUpStatus(conflict, recentVisits),
    suggestedActions: suggestedActions.slice(0, 4),
  };
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

  async getConflictContext(id: string): Promise<ConflictContext> {
    return callWithFallback(
      () => fetchJson<ConflictContext>(`/conflicts/${id}/context`),
      () => {
        const conflict = db.getConflicts((item) => item.id === id)[0];
        if (!conflict) {
          throw new Error(`Conflict '${id}' not found`);
        }
        return buildFallbackConflictContext(conflict);
      },
    );
  },

  async addConflict(conflict: ConflictCreateInput): Promise<ConflictRecord> {
    return callWithFallback(
      () => {
        const { id: _id, ...payload } = conflict;
        return fetchJson<ConflictRecord>('/conflicts', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      },
      () => {
        const nextConflict: ConflictRecord = {
          ...conflict,
          id: conflict.id ?? `conflict_${Date.now()}`,
        };
        db.addConflict(nextConflict);
        return nextConflict;
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
