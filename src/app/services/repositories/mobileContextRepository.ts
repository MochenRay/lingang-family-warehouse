export interface CurrentGridSelection {
  id?: string;
  name?: string;
}

const DEFAULT_GRID_NAME = '登州街道海梦苑社区第一网格';
const DEFAULT_WORKER_NAME = '张三峰';
// 迁移前的出厂默认名；仅当本地值仍是该默认值（即用户从未自定义）时才迁移。
const LEGACY_DEFAULT_WORKER_NAME = '网格员';

export const mobileContextRepository = {
  getCurrentGridSelection(): CurrentGridSelection {
    if (typeof window === 'undefined') {
      return { name: DEFAULT_GRID_NAME };
    }

    try {
      const raw = window.localStorage.getItem('current_grid');
      if (!raw) {
        return { name: DEFAULT_GRID_NAME };
      }
      const parsed = JSON.parse(raw) as CurrentGridSelection;
      return {
        id: parsed.id,
        name: parsed.name || DEFAULT_GRID_NAME,
      };
    } catch (error) {
      console.warn('Failed to parse current_grid from localStorage', error);
      return { name: DEFAULT_GRID_NAME };
    }
  },

  getCurrentWorkerName(): string {
    if (typeof window === 'undefined') {
      return DEFAULT_WORKER_NAME;
    }
    const stored = window.localStorage.getItem('mobile_user');
    if (!stored) {
      return DEFAULT_WORKER_NAME;
    }
    if (stored === LEGACY_DEFAULT_WORKER_NAME) {
      // 用户未自定义过：把旧默认名一次性迁移为新默认名；已自定义的值原样保留。
      // 写回失败（隐私模式/配额）不影响本次返回新默认名。
      try {
        window.localStorage.setItem('mobile_user', DEFAULT_WORKER_NAME);
      } catch (error) {
        console.warn('Failed to persist migrated worker name', error);
      }
      return DEFAULT_WORKER_NAME;
    }
    return stored;
  },

  setCurrentGridSelection(selection: CurrentGridSelection): void {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(
      'current_grid',
      JSON.stringify({
        id: selection.id,
        name: selection.name || DEFAULT_GRID_NAME,
      }),
    );
  },

  setCurrentWorkerName(name: string): void {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem('mobile_user', name || DEFAULT_WORKER_NAME);
  },

  clearCurrentWorkerName(): void {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.removeItem('mobile_user');
  },
};
