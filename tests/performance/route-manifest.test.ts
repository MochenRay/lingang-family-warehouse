import { describe, expect, it } from 'vitest';

import { ROUTE_DEFINITIONS } from '../../src/app/navigation/routes';
import { DESKTOP_ROUTES } from '../e2e/support/desktop-routes';

describe('desktop performance route manifest', () => {
  it('covers every non-mobile production route exactly once', () => {
    const productionRoutes = ROUTE_DEFINITIONS.filter((route) => route.id !== 'mobile')
      .map(({ id, path }) => ({ id, path }))
      .sort((left, right) => left.id.localeCompare(right.id));
    const measuredRoutes = DESKTOP_ROUTES.map(({ id, path }) => ({ id, path }))
      .sort((left, right) => left.id.localeCompare(right.id));

    expect(DESKTOP_ROUTES).toHaveLength(30);
    expect(new Set(DESKTOP_ROUTES.map((route) => route.path)).size).toBe(30);
    expect(measuredRoutes).toEqual(productionRoutes);
  });
});
