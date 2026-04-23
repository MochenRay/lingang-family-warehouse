import type { KnowledgeEntry } from '../../types/core';
import { buildQueryString, callWithFallback, fetchJson, type ApiListResponse } from '../api';

export interface KnowledgeQuery {
  q?: string;
  type?: string;
  category?: string;
  limit?: number;
  offset?: number;
}

const FALLBACK_ENTRIES: KnowledgeEntry[] = [
  {
    id: 'knowledge_001',
    title: '独居老人入户走访要点清单',
    type: 'document',
    category: '走访手册',
    summary: '围绕身体状况、药品储备、联系人、家中安全四个方面形成的走访提纲。',
    content: '适用对象：高龄独居、行动不便、慢病长期服药对象。入户前核实联系人、最近走访和药品储备；入户时重点看身体情况、燃气和楼道；走访后形成闭环记录。',
    size: '328 KB',
    uploadDate: '2026-01-13 09:20',
    author: '王干事',
    tags: ['独居老人', '走访提纲', '安全排查'],
    relatedType: 'person',
    relatedId: 'person_li_daye',
    source: '走访知识库',
  },
  {
    id: 'knowledge_002',
    title: '群租房风险巡查现场纪要',
    type: 'meeting',
    category: '现场纪要',
    summary: '汇总群租线索房屋的消防、用电和人口登记核查要点，便于房屋支持页快速联动。',
    content: '巡查范围包括群租风险标签房屋和出租人数异常房屋，重点核查烟感、飞线充电、灭火器和实际居住人数，并同步回房屋详情和待办清单。',
    size: '86 KB',
    uploadDate: '2026-01-11 16:40',
    author: '李网格',
    tags: ['群租风险', '房屋巡查', '现场纪要'],
    relatedType: 'house',
    relatedId: 'house_haiyuan_2_2_402',
    source: '房屋治理资料',
  },
  {
    id: 'knowledge_003',
    title: '冬季取暖安全宣传素材（公众号转载）',
    type: 'article',
    category: '宣传资料',
    summary: '可直接引用到通知和入户宣传中的安全提示材料，适合作为通知页和知识页的公共内容。',
    content: '重点关注燃气报警器、电暖器周边可燃物、楼道杂物和老年人的紧急联系人知晓情况。',
    size: '-',
    uploadDate: '2026-01-09 10:10',
    author: '系统采集',
    tags: ['冬季取暖', '安全宣传', '公众号文章'],
    relatedType: 'notice',
    relatedId: 'notice_002',
    source: '平安烟台公众号',
  },
  {
    id: 'knowledge_004',
    title: '邻里纠纷回访纪要模板',
    type: 'document',
    category: '处置模板',
    summary: '用于矛盾调解后的回访记录模板，包含情绪变化、履约情况和下一步动作。',
    content: '回访纪要建议包含：回访对象及时间、当前情绪状态与矛盾变化、约定履行情况、是否需要再次协同处置以及后续责任人。',
    size: '142 KB',
    uploadDate: '2026-01-08 14:30',
    author: '赵敏',
    tags: ['矛盾调解', '回访模板', '纪要'],
    relatedType: 'conflict',
    relatedId: 'conflict_001',
    source: '矛盾调处知识库',
  },
  {
    id: 'knowledge_005',
    title: '海梦苑社区第一网格重点对象周研判摘要',
    type: 'document',
    category: '研判摘要',
    summary: '整理第一网格重点对象、待回访对象和矛盾风险的周度研判结论，用于搜索和驾驶舱补充阅读。',
    content: '本周重点对象、高龄独居关爱、群租风险补核和矛盾跟进均已形成研判结论，可辅助驾驶舱和移动待办查看。',
    size: '210 KB',
    uploadDate: '2026-01-06 18:00',
    author: '系统研判',
    tags: ['周研判', '重点对象', '待回访'],
    relatedType: 'grid',
    relatedId: 'g1',
    source: '治理研判输出',
  },
];

function matchesKnowledgeQuery(entry: KnowledgeEntry, query?: KnowledgeQuery): boolean {
  if (!query) {
    return true;
  }

  const keyword = query.q?.trim();
  if (keyword) {
    const haystack = [
      entry.title,
      entry.summary,
      entry.content,
      entry.author,
      entry.source ?? '',
      ...entry.tags,
    ].join('||');
    if (!haystack.includes(keyword)) {
      return false;
    }
  }

  if (query.type && entry.type !== query.type) {
    return false;
  }
  if (query.category && entry.category !== query.category) {
    return false;
  }
  return true;
}

function sortEntries(entries: KnowledgeEntry[]): KnowledgeEntry[] {
  return [...entries].sort((left, right) => right.uploadDate.localeCompare(left.uploadDate));
}

export const knowledgeRepository = {
  async getEntries(query?: KnowledgeQuery): Promise<KnowledgeEntry[]> {
    return callWithFallback(
      async () => {
        const response = await fetchJson<ApiListResponse<KnowledgeEntry>>(
          `/knowledge${buildQueryString({
            q: query?.q,
            type: query?.type,
            category: query?.category,
            limit: query?.limit ?? 200,
            offset: query?.offset ?? 0,
          })}`,
        );
        return response.items;
      },
      () => sortEntries(FALLBACK_ENTRIES).filter((entry) => matchesKnowledgeQuery(entry, query)),
    );
  },

  async getEntry(id: string): Promise<KnowledgeEntry | undefined> {
    return callWithFallback(
      () => fetchJson<KnowledgeEntry>(`/knowledge/${id}`),
      () => FALLBACK_ENTRIES.find((entry) => entry.id === id),
    );
  },
};
