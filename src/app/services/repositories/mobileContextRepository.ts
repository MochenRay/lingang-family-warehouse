export interface CurrentGridSelection {
  id?: string;
  name?: string;
}

const DEFAULT_GRID_NAME = '竹岛街道海源社区第一网格';
const DEFAULT_WORKER_NAME = '网格员';

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
    return window.localStorage.getItem('mobile_user') || DEFAULT_WORKER_NAME;
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
