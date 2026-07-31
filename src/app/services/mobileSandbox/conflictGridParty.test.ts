import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Grid, Person } from '../../types/core';
import { personRepository } from '../repositories/personRepository';
import {
  canSubmitConflictGridParty,
  createConflictGridOptionsLoadingState,
  createConflictResidentsIdleState,
  loadConflictGridOptions,
  loadConflictResidents,
  selectConflictGrid,
  validateConflictGridParty,
} from './conflictGridParty';
import type { MobileConflictParty } from './conflictPayloads';
import { personVisitFacade } from './personVisitFacade';

const GRIDS: Grid[] = [
  { id: 'grid-1', name: '海梦苑第一网格' },
  { id: 'grid-2', name: '海梦苑第二网格' },
];

function resident(overrides: Partial<Person> = {}): Person {
  return {
    id: 'person-1',
    gridId: 'grid-1',
    name: '居民甲',
    idCard: '310000199001010001',
    gender: '女',
    age: 36,
    address: '海梦苑一号楼',
    type: '户籍',
    tags: [],
    risk: 'Low',
    updatedAt: '2026-08-01 09:00',
    ...overrides,
  };
}

const ORGANIZATION: MobileConflictParty = {
  type: 'organization',
  id: 'org-property',
  name: '物业公司',
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('conflict grid and party contract', () => {
  it('loads options only from personRepository.getGrids and preselects exact IDs only', async () => {
    const gridsSpy = vi.spyOn(personRepository, 'getGrids').mockResolvedValue(GRIDS);

    const exact = await loadConflictGridOptions('grid-2');
    const nameOnly = await loadConflictGridOptions('海梦苑第二网格');

    expect(gridsSpy).toHaveBeenNthCalledWith(1, { allowFallback: false });
    expect(gridsSpy).toHaveBeenNthCalledWith(2, { allowFallback: false });
    expect(exact).toMatchObject({ status: 'ready', selectedGridId: 'grid-2', options: GRIDS });
    expect(nameOnly).toMatchObject({ status: 'ready', selectedGridId: undefined, options: GRIDS });
  });

  it('makes loading, error, and empty grid states non-submittable with retry contracts', async () => {
    const loading = createConflictGridOptionsLoadingState();
    const idleResidents = createConflictResidentsIdleState();
    expect(canSubmitConflictGridParty({
      gridOptions: loading,
      residents: idleResidents,
      selectedGridId: undefined,
      parties: [ORGANIZATION],
      location: '海梦苑',
    })).toBe(false);

    vi.spyOn(personRepository, 'getGrids').mockRejectedValueOnce(new Error('grid API down'));
    const failed = await loadConflictGridOptions();
    expect(failed).toMatchObject({ status: 'error', retryable: true, message: 'grid API down' });
    expect(canSubmitConflictGridParty({
      gridOptions: failed,
      residents: idleResidents,
      selectedGridId: undefined,
      parties: [ORGANIZATION],
      location: '海梦苑',
    })).toBe(false);

    vi.spyOn(personRepository, 'getGrids').mockResolvedValueOnce([]);
    const empty = await loadConflictGridOptions();
    expect(empty).toMatchObject({ status: 'empty', retryable: true, options: [] });
    expect(canSubmitConflictGridParty({
      gridOptions: empty,
      residents: idleResidents,
      selectedGridId: undefined,
      parties: [ORGANIZATION],
      location: '海梦苑',
    })).toBe(false);
  });

  it('loads residents through the selected grid and never exposes cross-grid people', async () => {
    const listSpy = vi.spyOn(personVisitFacade, 'listPeople').mockResolvedValue({
      items: [resident(), resident({ id: 'person-2', gridId: 'grid-2', name: '居民乙' })],
      total: 2,
    });

    const state = await loadConflictResidents('grid-1');

    expect(listSpy).toHaveBeenCalledWith({ gridId: 'grid-1' });
    expect(state).toMatchObject({
      status: 'ready',
      gridId: 'grid-1',
      residents: [{ id: 'person-1', gridId: 'grid-1' }],
    });
  });

  it('clears resident parties on a grid switch while preserving organizations', async () => {
    vi.spyOn(personRepository, 'getGrids').mockResolvedValue(GRIDS);
    const options = await loadConflictGridOptions('grid-1');
    const residentParty: MobileConflictParty = {
      type: 'resident',
      id: 'person-1',
      name: '居民甲',
    };

    const next = selectConflictGrid(options, 'grid-2', [residentParty, ORGANIZATION]);

    expect(next.selectedGridId).toBe('grid-2');
    expect(next.parties).toEqual([ORGANIZATION]);
    expect(next.residents).toEqual({
      status: 'loading',
      gridId: 'grid-2',
      residents: [],
      retryable: false,
    });
    expect(() => selectConflictGrid(options, 'missing-grid', [ORGANIZATION])).toThrow('not an available option');
  });

  it('allows an organization-only subject and rejects silent resident/grid fallbacks', async () => {
    vi.spyOn(personRepository, 'getGrids').mockResolvedValue(GRIDS);
    const options = await loadConflictGridOptions('grid-1');
    const idleResidents = createConflictResidentsIdleState();

    expect(validateConflictGridParty({
      gridOptions: options,
      residents: idleResidents,
      selectedGridId: 'grid-1',
      parties: [ORGANIZATION],
      location: '海梦苑物业中心',
    })).toEqual({ valid: true });

    expect(validateConflictGridParty({
      gridOptions: options,
      residents: idleResidents,
      selectedGridId: undefined,
      parties: [ORGANIZATION],
      location: '海梦苑物业中心',
    })).toMatchObject({ valid: false, code: 'grid-required' });
    expect(validateConflictGridParty({
      gridOptions: options,
      residents: idleResidents,
      selectedGridId: 'grid-1',
      parties: [],
      location: '海梦苑物业中心',
    })).toMatchObject({ valid: false, code: 'party-required' });
    expect(validateConflictGridParty({
      gridOptions: options,
      residents: idleResidents,
      selectedGridId: 'grid-1',
      parties: [ORGANIZATION],
      location: '   ',
    })).toMatchObject({ valid: false, code: 'location-required' });
    expect(validateConflictGridParty({
      gridOptions: options,
      residents: idleResidents,
      selectedGridId: 'grid-1',
      parties: [{ type: 'resident', id: 'person-1', name: '居民甲' }],
      location: '海梦苑',
    })).toMatchObject({ valid: false, code: 'residents-unavailable' });
  });

  it('accepts resident parties only when they exist in the ready selected-grid result', async () => {
    vi.spyOn(personRepository, 'getGrids').mockResolvedValue(GRIDS);
    vi.spyOn(personVisitFacade, 'listPeople').mockResolvedValue({ items: [resident()], total: 1 });
    const options = await loadConflictGridOptions('grid-1');
    const residents = await loadConflictResidents('grid-1');

    expect(validateConflictGridParty({
      gridOptions: options,
      residents,
      selectedGridId: 'grid-1',
      parties: [{ type: 'resident', id: 'person-1', name: '居民甲' }],
      location: '海梦苑一号楼',
    })).toEqual({ valid: true });
    expect(validateConflictGridParty({
      gridOptions: options,
      residents,
      selectedGridId: 'grid-1',
      parties: [{ type: 'resident', id: 'person-missing', name: '搜索首项' }],
      location: '海梦苑一号楼',
    })).toMatchObject({ valid: false, code: 'resident-outside-grid' });
  });
});
