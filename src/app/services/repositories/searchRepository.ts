import type { House, KnowledgeEntry, Person } from '../../types/core';
import { houseRepository } from './houseRepository';
import { knowledgeRepository } from './knowledgeRepository';
import { noticeRepository, type NoticeRecord } from './noticeRepository';
import { personRepository } from './personRepository';

export type SearchResultKind = 'person' | 'house' | 'notice' | 'knowledge';
export type SearchEndpoint = 'web' | 'mobile';

export interface SearchQuery {
  q: string;
  endpoint: SearchEndpoint;
  gridId?: string;
  kinds?: SearchResultKind[];
  limitPerKind?: number;
}

export interface SearchResultItem {
  id: string;
  kind: SearchResultKind;
  title: string;
  subtitle: string;
  summary: string;
  tags: string[];
  route: string;
  routeLabel: string;
  entityId: string;
}

export interface SearchBundle {
  results: SearchResultItem[];
  people: Person[];
  houses: House[];
  notices: NoticeRecord[];
  knowledgeEntries: KnowledgeEntry[];
}

function compactSummary(parts: Array<string | undefined | null>): string {
  return parts.filter((part): part is string => Boolean(part && part.trim())).join(' · ');
}

function truncate(value: string, maxLength = 88): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength)}...`;
}

function buildRoute(endpoint: SearchEndpoint, kind: SearchResultKind, id: string): { route: string; routeLabel: string } {
  if (endpoint === 'mobile') {
    switch (kind) {
      case 'person':
        return { route: `person-detail/${id}`, routeLabel: '进入人员详情' };
      case 'house':
        return { route: `house-detail/${id}`, routeLabel: '进入房屋详情' };
      case 'notice':
        return { route: `notice-detail/${id}`, routeLabel: '进入通知详情' };
      case 'knowledge':
        return { route: 'search', routeLabel: '留在移动搜索查看' };
    }
  }

  switch (kind) {
    case 'person':
      return { route: 'population', routeLabel: '进入人口管理' };
    case 'house':
      return { route: 'housing', routeLabel: '进入房屋管理' };
    case 'notice':
      return { route: 'notice-management', routeLabel: '进入公告管理' };
    case 'knowledge':
      return { route: 'knowledge-accumulation', routeLabel: '留在知识沉淀查看' };
  }
}

export const searchRepository = {
  async search(query: SearchQuery): Promise<SearchBundle> {
    const keyword = query.q.trim();

    const limit = query.limitPerKind ?? 8;
    const kinds = query.kinds ?? (query.endpoint === 'mobile' ? ['person', 'house'] : ['person', 'house', 'notice', 'knowledge']);

    const [people, houses, notices, knowledgeEntries] = await Promise.all([
      kinds.includes('person')
        ? personRepository.getPeople({ q: keyword || undefined, gridId: query.gridId, limit: limit * 2 })
        : Promise.resolve([]),
      kinds.includes('house')
        ? houseRepository.getHouses({ q: keyword || undefined, gridId: query.gridId, limit: limit * 2 })
        : Promise.resolve([]),
      kinds.includes('notice')
        ? noticeRepository.getNotices({ q: keyword || undefined, status: 'published', limit: limit * 2 })
        : Promise.resolve([]),
      kinds.includes('knowledge')
        ? knowledgeRepository.getEntries({ q: keyword || undefined, limit: limit * 2 })
        : Promise.resolve([]),
    ]);

    const resultItems: SearchResultItem[] = [
      ...people.slice(0, limit).map((person) => {
        const route = buildRoute(query.endpoint, 'person', person.id);
        return {
          id: `person-${person.id}`,
          kind: 'person' as const,
          title: person.name,
          subtitle: compactSummary([person.type, `${person.age}岁`, person.address]),
          summary: compactSummary([`风险 ${person.risk}`, ...(person.tags ?? []).slice(0, 2)]),
          tags: person.tags ?? [],
          route: route.route,
          routeLabel: route.routeLabel,
          entityId: person.id,
        };
      }),
      ...houses.slice(0, limit).map((house) => {
        const route = buildRoute(query.endpoint, 'house', house.id);
        return {
          id: `house-${house.id}`,
          kind: 'house' as const,
          title: `${house.communityName} ${house.building} ${house.unit} ${house.room}`,
          subtitle: compactSummary([house.ownerName, `${house.memberCount}人`, house.address]),
          summary: compactSummary([house.type, ...(house.tags ?? []).slice(0, 2)]),
          tags: house.tags ?? [],
          route: route.route,
          routeLabel: route.routeLabel,
          entityId: house.id,
        };
      }),
      ...notices.slice(0, limit).map((notice) => {
        const route = buildRoute(query.endpoint, 'notice', notice.id);
        return {
          id: `notice-${notice.id}`,
          kind: 'notice' as const,
          title: notice.title,
          subtitle: compactSummary([notice.type, notice.publisher, notice.publishedAt.slice(0, 10)]),
          summary: truncate(notice.content),
          tags: notice.grids.slice(0, 2),
          route: route.route,
          routeLabel: route.routeLabel,
          entityId: notice.id,
        };
      }),
      ...knowledgeEntries.slice(0, limit).map((entry) => {
        const route = buildRoute(query.endpoint, 'knowledge', entry.id);
        return {
          id: `knowledge-${entry.id}`,
          kind: 'knowledge' as const,
          title: entry.title,
          subtitle: compactSummary([entry.category, entry.author, entry.uploadDate.slice(0, 10)]),
          summary: truncate(entry.summary || entry.content),
          tags: entry.tags ?? [],
          route: route.route,
          routeLabel: route.routeLabel,
          entityId: entry.id,
        };
      }),
    ];

    return {
      results: resultItems,
      people,
      houses,
      notices,
      knowledgeEntries,
    };
  },
};
