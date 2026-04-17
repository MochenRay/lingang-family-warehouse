import type { Grid, Notification } from '../../types/core';
import { buildQueryString, callWithFallback, fetchJson, type ApiListResponse } from '../api';
import { db } from '../db';
import { statsRepository } from './statsRepository';

export type NoticeType = 'urgent' | 'system' | 'guide' | 'task' | 'info';
export type NoticeStatus = 'published' | 'draft';

export interface NoticeAttachment {
  name: string;
  size: string;
}

export interface NoticeRecord {
  id: string;
  title: string;
  type: NoticeType;
  content: string;
  scope: string[];
  grids: string[];
  status: NoticeStatus;
  publishedAt: string;
  publisher: string;
  department: string;
  scheduledTime?: string;
  readCount: number;
  attachments: NoticeAttachment[];
}

export interface NoticeQuery {
  q?: string;
  type?: NoticeType | 'all';
  status?: NoticeStatus;
  limit?: number;
  offset?: number;
}

export interface NoticeCreateInput {
  title: string;
  type: NoticeType;
  content: string;
  scope: string[];
  grids: string[];
  status: NoticeStatus;
  publishNow: boolean;
  scheduledTime?: string;
  publisher?: string;
  department?: string;
  attachments?: NoticeAttachment[];
}

function normalizeNoticeType(type: string): NoticeType {
  if (type === 'urgent' || type === 'system' || type === 'guide' || type === 'task' || type === 'info') {
    return type;
  }
  return type === 'alert' ? 'urgent' : 'info';
}

function normalizeFallbackNotification(notification: Notification, index: number): NoticeRecord {
  return {
    id: notification.id,
    title: notification.title,
    type: normalizeNoticeType(notification.type),
    content: notification.content,
    scope: notification.scope ?? ['all'],
    grids: notification.grids ?? [],
    status: notification.status ?? 'published',
    publishedAt: notification.date,
    publisher: notification.publisher ?? '系统管理员',
    department: notification.department ?? '临港区社会治理现代化指挥中心',
    scheduledTime: notification.scheduledTime,
    readCount: notification.readCount ?? Math.max(120 - index * 7, 0),
    attachments: notification.attachments ?? [],
  };
}

function parseDate(value: string | undefined): Date | null {
  if (!value) {
    return null;
  }
  const normalized = value.replace(/\//g, '-');
  const timestamp = Date.parse(normalized);
  return Number.isNaN(timestamp) ? null : new Date(timestamp);
}

export function formatNoticeTime(value: string): string {
  const parsed = parseDate(value);
  if (!parsed) {
    return value;
  }
  const diffHours = Math.floor((Date.now() - parsed.getTime()) / (1000 * 60 * 60));
  if (diffHours < 1) {
    return '刚刚';
  }
  if (diffHours < 24) {
    return `${diffHours}小时前`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) {
    return '昨天';
  }
  if (diffDays < 7) {
    return `${diffDays}天前`;
  }
  return value.slice(0, 10);
}

function matchesNoticeQuery(notice: NoticeRecord, query?: NoticeQuery): boolean {
  if (!query) {
    return true;
  }

  const keyword = query.q?.trim();
  if (keyword) {
    const haystack = `${notice.title}||${notice.content}||${notice.publisher}||${notice.department}`;
    if (!haystack.includes(keyword)) {
      return false;
    }
  }

  if (query.type && query.type !== 'all' && notice.type !== query.type) {
    return false;
  }

  if (query.status && notice.status !== query.status) {
    return false;
  }

  return true;
}

function sortNotices(notices: NoticeRecord[]): NoticeRecord[] {
  return [...notices].sort((left, right) => {
    const rightTime = parseDate(right.publishedAt)?.getTime() ?? 0;
    const leftTime = parseDate(left.publishedAt)?.getTime() ?? 0;
    return rightTime - leftTime;
  });
}

function buildFallbackNotices(): NoticeRecord[] {
  return sortNotices(db.getNotifications().map(normalizeFallbackNotification));
}

export const noticeRepository = {
  async getNotices(query?: NoticeQuery): Promise<NoticeRecord[]> {
    return callWithFallback(
      async () => {
        const response = await fetchJson<ApiListResponse<NoticeRecord>>(
          `/notices${buildQueryString({
            q: query?.q,
            type: query?.type && query.type !== 'all' ? query.type : undefined,
            status: query?.status,
            limit: query?.limit ?? 200,
            offset: query?.offset ?? 0,
          })}`,
        );
        return response.items;
      },
      () => buildFallbackNotices().filter((notice) => matchesNoticeQuery(notice, query)),
    );
  },

  async getNotice(id: string): Promise<NoticeRecord | undefined> {
    return callWithFallback(
      () => fetchJson<NoticeRecord>(`/notices/${id}`),
      () => buildFallbackNotices().find((notice) => notice.id === id),
    );
  },

  async createNotice(input: NoticeCreateInput): Promise<NoticeRecord> {
    const payload = {
      title: input.title,
      type: input.type,
      content: input.content,
      scope: input.scope,
      grids: input.grids,
      status: input.status,
      publishedAt: input.publishNow ? new Date().toISOString().slice(0, 16).replace('T', ' ') : input.scheduledTime,
      publisher: input.publisher ?? '系统管理员',
      department: input.department ?? '临港区社会治理现代化指挥中心',
      scheduledTime: input.publishNow ? undefined : input.scheduledTime,
      attachments: input.attachments ?? [],
      readCount: 0,
    };

    return callWithFallback(
      () =>
        fetchJson<NoticeRecord>('/notices', {
          method: 'POST',
          body: JSON.stringify(payload),
        }),
      () => {
        const created: NoticeRecord = {
          id: `notice_${Date.now()}`,
          ...payload,
          type: payload.type as NoticeType,
          status: payload.status as NoticeStatus,
          publishedAt: payload.publishedAt ?? new Date().toISOString().slice(0, 16).replace('T', ' '),
          attachments: payload.attachments ?? [],
        };
        db.addNotification({
          id: created.id,
          title: created.title,
          content: created.content,
          date: created.publishedAt,
          read: false,
          type: created.type,
          scope: created.scope,
          grids: created.grids,
          status: created.status,
          publisher: created.publisher,
          department: created.department,
          scheduledTime: created.scheduledTime,
          readCount: created.readCount,
          attachments: created.attachments,
        });
        return created;
      },
    );
  },

  async deleteNotice(id: string): Promise<void> {
    return callWithFallback(
      () =>
        fetchJson<void>(`/notices/${id}`, {
          method: 'DELETE',
        }),
      () => {
        db.deleteNotification(id);
      },
    );
  },

  async getGridOptions(): Promise<string[]> {
    return callWithFallback(
      async () => {
        const grids = await statsRepository.getGrids();
        return grids.map((grid: Grid) => grid.name);
      },
      () => db.getGrids().map((grid) => grid.name),
    );
  },
};
