import { describe, expect, it } from 'vitest';
import {
  buildInitialMobileHistory,
  createMobileBrowserHistoryState,
  resolveMobileBackNavigation,
  resolveMobileNavigation,
  restoreMobileBrowserNavigation,
  toMobilePath,
} from './mobileNavigation';

describe('mobile navigation', () => {
  it('builds stable deep-link stacks', () => {
    expect(buildInitialMobileHistory('/mobile/visit-form/person-1')).toEqual([
      'home',
      'people',
      'person-detail/person-1',
      'visit-form/person-1',
    ]);
    expect(buildInitialMobileHistory('/mobile/conflict/new')).toEqual(['home', 'conflict', 'conflict-form']);
  });

  it('replaces a completed form instead of leaving it in the back stack', () => {
    expect(resolveMobileNavigation(
      ['home', 'conflict', 'conflict-form'],
      'conflict-detail/session:conflict:1',
      { replace: true },
    )).toEqual({
      history: ['home', 'conflict', 'conflict-detail/session:conflict:1'],
      method: 'replace',
      path: '/mobile/conflict/session:conflict:1',
    });
  });

  it('preserves activity query strings and ignores duplicate navigation', () => {
    expect(toMobilePath('activity-detail/activity-1?mode=application')).toBe('/mobile/activity/activity-1?mode=application');
    expect(resolveMobileNavigation(['home', 'activity'], 'activity')).toEqual({
      history: ['home', 'activity'],
      method: 'none',
      path: '/mobile/activity',
    });
  });

  it('restores the exact source stack on browser back and forward', () => {
    const sourceHistory = ['home', 'tasks?mode=today', '/mobile/tasks/task-1', 'person-detail/person-1'];
    const state = createMobileBrowserHistoryState(sourceHistory, 3);

    expect(restoreMobileBrowserNavigation(state, '/mobile/person/person-1')).toEqual({
      history: sourceHistory,
      mobileDepth: 3,
    });
  });

  it('rejects stale browser state and rebuilds a safe deep-link stack', () => {
    const staleState = createMobileBrowserHistoryState(
      ['home', 'housing', 'house-detail/house-1'],
      2,
    );

    expect(restoreMobileBrowserNavigation(staleState, '/mobile/person/person-1')).toEqual({
      history: ['home', 'people', 'person-detail/person-1'],
      mobileDepth: 0,
    });
  });

  it('uses the real browser entry for back instead of replacing it with a duplicate', () => {
    expect(resolveMobileBackNavigation(
      ['home', 'people', 'person-detail/person-1'],
      2,
    )).toEqual({ method: 'browser' });

    expect(resolveMobileBackNavigation(
      ['home', 'people', 'person-detail/person-1'],
      0,
    )).toEqual({ method: 'replace', route: 'people' });
  });
});
