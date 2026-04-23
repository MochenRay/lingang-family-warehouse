export const DEFAULT_ROUTE_ID = 'statistics-overview';

type RouteDefinition = {
  id: string;
  path: string;
  aliases?: string[];
};

export const ROUTE_DEFINITIONS: RouteDefinition[] = [
  { id: DEFAULT_ROUTE_ID, path: '/', aliases: ['/dashboard', '/statistics', '/statistics-overview', '/dashboard/overview'] },
  { id: 'demographics-analysis', path: '/analysis/demographics', aliases: ['/demographics-analysis'] },
  { id: 'housing-statistics', path: '/analysis/housing', aliases: ['/housing-statistics'] },
  { id: 'migration-trends', path: '/analysis/migration-trends', aliases: ['/migration-trends'] },
  { id: 'population-tags', path: '/analysis/tags', aliases: ['/population-tags'] },
  { id: 'data-comparison', path: '/analysis/comparison', aliases: ['/data-comparison'] },
  { id: 'data-reports', path: '/analysis/reports', aliases: ['/data-reports'] },
  { id: 'heatmap', path: '/analysis/warning-map', aliases: ['/heatmap', '/warning-map'] },
  { id: 'population', path: '/population' },
  { id: 'housing', path: '/housing' },
  { id: 'relationship', path: '/relationship' },
  { id: 'batch-import', path: '/batch-import' },
  { id: 'tag-overview', path: '/tags', aliases: ['/tag-overview'] },
  { id: 'knowledge-accumulation', path: '/knowledge', aliases: ['/knowledge-accumulation'] },
  { id: 'policy-interpretation', path: '/ai/policy', aliases: ['/policy-interpretation'] },
  { id: 'document-writing', path: '/ai/document-writing', aliases: ['/document-writing'] },
  { id: 'smart-query', path: '/ai/smart-query', aliases: ['/smart-query'] },
  { id: 'behavior-supervision', path: '/grid/behavior', aliases: ['/behavior-supervision'] },
  { id: 'activity-management', path: '/grid/activities', aliases: ['/activity-management'] },
  { id: 'conflict-management', path: '/grid/conflicts', aliases: ['/conflict-management'] },
  { id: 'notice-management', path: '/grid/notices', aliases: ['/notice-management', '/notices'] },
  { id: 'publish-notice', path: '/grid/notices/publish', aliases: ['/publish-notice'] },
  { id: 'rule-config', path: '/grid/rules', aliases: ['/rule-config'] },
  { id: 'anomaly-analysis', path: '/attribution/anomaly', aliases: ['/anomaly-analysis'] },
  { id: 'time-series', path: '/attribution/time-series', aliases: ['/time-series'] },
  { id: 'factor-identification', path: '/attribution/factors', aliases: ['/factor-identification'] },
  { id: 'contribution-ranking', path: '/attribution/contribution', aliases: ['/contribution-ranking'] },
  { id: 'user-management', path: '/settings/users', aliases: ['/user-management'] },
  { id: 'role-management', path: '/settings/roles', aliases: ['/role-management'] },
  { id: 'permission-management', path: '/settings/permissions', aliases: ['/permission-management'] },
  { id: 'log-management', path: '/settings/logs', aliases: ['/log-management'] },
  { id: 'mobile', path: '/mobile', aliases: ['/mobile/home'] },
];

const routeById = new Map(ROUTE_DEFINITIONS.map((route) => [route.id, route]));
const routeByPath = new Map<string, string>();

for (const route of ROUTE_DEFINITIONS) {
  routeByPath.set(route.path, route.id);
  for (const alias of route.aliases ?? []) {
    routeByPath.set(alias, route.id);
  }
}

export function isKnownRoute(route: string) {
  return routeById.has(route);
}

export function getPathForRoute(route: string) {
  return routeById.get(route)?.path ?? routeById.get(DEFAULT_ROUTE_ID)!.path;
}

export function getRouteForPath(pathname: string) {
  const normalizedPath = normalizePath(pathname);

  if (normalizedPath.startsWith('/mobile')) {
    return 'mobile';
  }

  return routeByPath.get(normalizedPath) ?? DEFAULT_ROUTE_ID;
}

export function isKnownPath(pathname: string) {
  const normalizedPath = normalizePath(pathname);
  return normalizedPath.startsWith('/mobile') || routeByPath.has(normalizedPath);
}

export function normalizeRouteInput(route: string) {
  if (route.startsWith('/')) {
    return getRouteForPath(route);
  }

  return isKnownRoute(route) ? route : DEFAULT_ROUTE_ID;
}

function normalizePath(pathname: string) {
  if (!pathname || pathname === '/') {
    return '/';
  }

  return pathname.replace(/\/+$/, '') || '/';
}
