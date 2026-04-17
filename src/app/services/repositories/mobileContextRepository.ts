export interface CurrentGridSelection {
  id?: string;
  name?: string;
}

const DEFAULT_GRID_NAME = '竹岛街道海源社区第一网格';

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
      return '网格员';
    }
    return window.localStorage.getItem('mobile_user') || '网格员';
  },
};
