export interface MobileNavigateOptions {
  replace?: boolean;
}

export interface MobileNavigationResult {
  history: string[];
  method: 'push' | 'replace' | 'none';
  path: string;
}

export interface MobileBrowserHistoryState {
  route: 'mobile';
  mobileRoute: string;
  mobileHistory: string[];
  mobileDepth: number;
}

export interface RestoredMobileNavigation {
  history: string[];
  mobileDepth: number;
}

export type MobileBackNavigationResult =
  | { method: 'browser' }
  | { method: 'replace'; route: string }
  | { method: 'none' };

export function buildInitialMobileHistory(pathname: string, search = ''): string[] {
  const path = pathname.replace(/\/+$/, '') || '/mobile';
  const params = new URLSearchParams(search);

  if (path.startsWith('/mobile/tasks/')) return ['home', 'tasks?mode=today', path];
  if (path === '/mobile/tasks') return ['home', `tasks?mode=${params.get('mode') || 'today'}`];
  if (path.includes('/mobile/visit-form/')) {
    const personId = path.split('/mobile/visit-form/')[1];
    if (personId) return ['home', 'people', `person-detail/${personId}`, `visit-form/${personId}`];
  }
  if (path.includes('/mobile/person/') && path.endsWith('/edit')) {
    const personId = path.split('/mobile/person/')[1]?.replace('/edit', '');
    if (personId) return ['home', 'people', `person-detail/${personId}`, `person-edit/${personId}`];
  }
  if (path.includes('/mobile/person/')) {
    const personId = path.split('/mobile/person/')[1];
    if (personId) return ['home', 'people', `person-detail/${personId}`];
  }
  if (path.includes('/mobile/house/') && path.endsWith('/edit')) {
    const houseId = path.split('/mobile/house/')[1]?.replace('/edit', '');
    if (houseId) return ['home', 'housing', `house-detail/${houseId}`, `house-edit/${houseId}`];
  }
  if (path.includes('/mobile/house/')) {
    const houseId = path.split('/mobile/house/')[1];
    if (houseId) return ['home', 'housing', `house-detail/${houseId}`];
  }
  if (path.includes('/mobile/notices/')) {
    const noticeId = path.split('/mobile/notices/')[1];
    if (noticeId) return ['home', 'notices', `notice-detail/${noticeId}`];
  }
  if (path === '/mobile/notices') return ['home', 'notices'];
  if (path.includes('/mobile/conflict/new')) return ['home', 'conflict', 'conflict-form'];
  if (path.includes('/mobile/conflict/')) {
    const id = path.split('/mobile/conflict/')[1];
    if (id) return ['home', 'conflict', `conflict-detail/${id}`];
  }
  if (path.includes('/mobile/conflict')) return ['home', 'conflict'];
  if (path.includes('/mobile/activity/new')) return ['home', 'activity', search ? `activity-form${search}` : 'activity-form'];
  if (path.includes('/mobile/activity/')) {
    const id = path.split('/mobile/activity/')[1];
    if (id) return ['home', 'activity', `activity-detail/${id}${search}`];
  }
  if (path === '/mobile/activity') return ['home', 'activity'];
  if (path.includes('/mobile/grid')) return ['home', 'grid-overview'];
  if (path.includes('/mobile/housing')) return ['home', 'housing'];
  if (path.includes('/mobile/people')) return ['home', 'people'];
  if (path.includes('/mobile/profile')) return ['home', 'profile'];
  if (path.includes('/mobile/patrol')) return ['home', 'patrol'];
  if (path.includes('/mobile/collect-house')) return ['home', 'collect-house'];
  if (path.includes('/mobile/collect-person')) return ['home', 'collect-person'];
  if (path.includes('/mobile/quick-note-history')) return ['home', 'quick-note-history'];
  if (path.includes('/mobile/quick-note')) return ['home', 'quick-note'];
  if (path.includes('/mobile/scan')) return ['home', 'scan'];
  if (path.includes('/mobile/search')) return ['home', 'search'];
  if (path.includes('/mobile/stats')) return ['home', 'stats'];
  if (path.includes('/mobile/update-history')) return ['home', 'update-history'];
  if (path.includes('/mobile/policy-interpretation')) return ['home', 'policy-interpretation'];
  if (path.includes('/mobile/official-writing')) return ['home', 'official-writing'];
  if (path.includes('/mobile/smart-query')) return ['home', 'smart-query'];
  return ['home'];
}

export function toMobilePath(route: string): string {
  if (route.startsWith('/mobile')) return route;
  if (route === 'home') return '/mobile';
  if (route.startsWith('tasks')) {
    const mode = route.includes('mode=month') ? 'month' : route.includes('mode=all') ? 'all' : 'today';
    return `/mobile/tasks?mode=${mode}`;
  }
  if (route.startsWith('person-detail/')) return `/mobile/person/${route.split('/').pop()}`;
  if (route.startsWith('house-detail/')) return `/mobile/house/${route.split('/').pop()}`;
  if (route.startsWith('person-edit/')) return `/mobile/person/${route.split('/').pop()}/edit`;
  if (route.startsWith('house-edit/')) return `/mobile/house/${route.split('/').pop()}/edit`;
  if (route.startsWith('visit-form/')) return `/mobile/visit-form/${route.split('/').pop()}`;
  if (route.startsWith('notice-detail/')) return `/mobile/notices/${route.split('/').pop()}`;
  if (route.startsWith('conflict-detail/')) return `/mobile/conflict/${route.split('/').pop()}`;
  if (route === 'conflict-form') return '/mobile/conflict/new';
  if (route.startsWith('activity-detail/')) {
    const [pathPart, queryPart] = route.split('?');
    return `/mobile/activity/${pathPart.split('/').pop()}${queryPart ? `?${queryPart}` : ''}`;
  }
  if (route.startsWith('activity-form')) {
    const query = route.includes('?') ? `?${route.split('?')[1]}` : '';
    return `/mobile/activity/new${query}`;
  }

  const staticPaths: Record<string, string> = {
    housing: '/mobile/housing',
    people: '/mobile/people',
    patrol: '/mobile/patrol',
    profile: '/mobile/profile',
    'collect-house': '/mobile/collect-house',
    'collect-person': '/mobile/collect-person',
    'quick-note': '/mobile/quick-note',
    scan: '/mobile/scan',
    notices: '/mobile/notices',
    search: '/mobile/search',
    'quick-note-history': '/mobile/quick-note-history',
    stats: '/mobile/stats',
    'update-history': '/mobile/update-history',
    'grid-overview': '/mobile/grid',
    conflict: '/mobile/conflict',
    activity: '/mobile/activity',
    'policy-interpretation': '/mobile/policy-interpretation',
    'official-writing': '/mobile/official-writing',
    'smart-query': '/mobile/smart-query',
  };
  return staticPaths[route] ?? '/mobile';
}

export function normalizeMobileRoute(route: string): string {
  if (!route.startsWith('/mobile')) return route;
  const [pathname, query = ''] = route.split('?');
  const nextHistory = buildInitialMobileHistory(pathname, query ? `?${query}` : '');
  return nextHistory[nextHistory.length - 1];
}

export function createMobileBrowserHistoryState(
  history: readonly string[],
  mobileDepth: number,
): MobileBrowserHistoryState {
  const mobileHistory = history.length > 0 ? [...history] : ['home'];
  return {
    route: 'mobile',
    mobileRoute: mobileHistory[mobileHistory.length - 1],
    mobileHistory,
    mobileDepth,
  };
}

export function restoreMobileBrowserNavigation(
  state: unknown,
  pathname: string,
  search = '',
): RestoredMobileNavigation {
  const fallbackHistory = buildInitialMobileHistory(pathname, search);
  const fallback = { history: fallbackHistory, mobileDepth: 0 };
  if (!state || typeof state !== 'object') return fallback;

  const candidate = state as Partial<MobileBrowserHistoryState>;
  const expectedRoute = fallbackHistory[fallbackHistory.length - 1];
  if (
    candidate.route !== 'mobile'
    || candidate.mobileRoute !== expectedRoute
    || !Array.isArray(candidate.mobileHistory)
    || candidate.mobileHistory.length === 0
    || candidate.mobileHistory.some((route) => typeof route !== 'string' || route.length === 0)
    || candidate.mobileHistory[candidate.mobileHistory.length - 1] !== expectedRoute
    || !Number.isInteger(candidate.mobileDepth)
    || (candidate.mobileDepth ?? -1) < 0
  ) {
    return fallback;
  }

  return {
    history: [...candidate.mobileHistory],
    mobileDepth: candidate.mobileDepth,
  };
}

export function resolveMobileBackNavigation(
  currentHistory: readonly string[],
  mobileDepth: number,
): MobileBackNavigationResult {
  if (currentHistory.length <= 1) return { method: 'none' };
  if (mobileDepth > 0) return { method: 'browser' };
  return {
    method: 'replace',
    route: currentHistory[currentHistory.length - 2],
  };
}

export function resolveMobileNavigation(
  currentHistory: readonly string[],
  route: string,
  options: MobileNavigateOptions = {},
): MobileNavigationResult {
  const nextRoute = normalizeMobileRoute(route);
  const currentRoute = currentHistory[currentHistory.length - 1] ?? 'home';
  if (nextRoute === currentRoute) {
    return { history: [...currentHistory], method: 'none', path: toMobilePath(currentRoute) };
  }
  if (nextRoute === 'home') {
    return { history: ['home'], method: options.replace ? 'replace' : 'push', path: '/mobile' };
  }
  const history = options.replace
    ? [...currentHistory.slice(0, -1), nextRoute]
    : [...currentHistory, nextRoute];
  return {
    history: history.length > 0 ? history : [nextRoute],
    method: options.replace ? 'replace' : 'push',
    path: toMobilePath(nextRoute),
  };
}
