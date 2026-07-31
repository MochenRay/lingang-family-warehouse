import type { Grid, Person } from '../../types/core';
import { personRepository } from '../repositories/personRepository';
import type { MobileConflictParty } from './conflictPayloads';
import { personVisitFacade } from './personVisitFacade';

export type ConflictGridOptionsState =
  | {
      status: 'loading';
      options: Grid[];
      selectedGridId: undefined;
      retryable: false;
    }
  | {
      status: 'error';
      options: Grid[];
      selectedGridId: undefined;
      retryable: true;
      message: string;
    }
  | {
      status: 'empty';
      options: Grid[];
      selectedGridId: undefined;
      retryable: true;
    }
  | {
      status: 'ready';
      options: Grid[];
      selectedGridId: string | undefined;
      retryable: false;
    };

export type ConflictResidentsState =
  | {
      status: 'idle';
      gridId: undefined;
      residents: Person[];
      retryable: false;
    }
  | {
      status: 'loading';
      gridId: string;
      residents: Person[];
      retryable: false;
    }
  | {
      status: 'error';
      gridId: string;
      residents: Person[];
      retryable: true;
      message: string;
    }
  | {
      status: 'empty';
      gridId: string;
      residents: Person[];
      retryable: true;
    }
  | {
      status: 'ready';
      gridId: string;
      residents: Person[];
      retryable: false;
    };

export interface ConflictGridSelectionResult {
  selectedGridId: string;
  parties: MobileConflictParty[];
  residents: Extract<ConflictResidentsState, { status: 'loading' }>;
}

export type ConflictGridPartyValidationCode =
  | 'grid-unavailable'
  | 'grid-required'
  | 'location-required'
  | 'party-required'
  | 'duplicate-party'
  | 'residents-unavailable'
  | 'resident-outside-grid';

export type ConflictGridPartyValidationResult =
  | { valid: true }
  | { valid: false; code: ConflictGridPartyValidationCode; message: string };

export interface ConflictGridPartySubmissionState {
  gridOptions: ConflictGridOptionsState;
  residents: ConflictResidentsState;
  selectedGridId: string | undefined;
  parties: readonly MobileConflictParty[];
  location: string;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function hasValidGridShape(grid: Grid): boolean {
  return typeof grid.id === 'string'
    && grid.id.trim() === grid.id
    && grid.id.length > 0
    && typeof grid.name === 'string'
    && grid.name.trim() === grid.name
    && grid.name.length > 0;
}

export function createConflictGridOptionsLoadingState(): ConflictGridOptionsState {
  return {
    status: 'loading',
    options: [],
    selectedGridId: undefined,
    retryable: false,
  };
}

export function createConflictResidentsIdleState(): ConflictResidentsState {
  return {
    status: 'idle',
    gridId: undefined,
    residents: [],
    retryable: false,
  };
}

export async function loadConflictGridOptions(
  currentGridId?: string,
): Promise<ConflictGridOptionsState> {
  try {
    const options = await personRepository.getGrids({ allowFallback: false });
    const gridIds = options.map((grid) => grid.id);
    if (!options.every(hasValidGridShape) || new Set(gridIds).size !== gridIds.length) {
      throw new Error('Grid options contain invalid or duplicate IDs');
    }
    if (options.length === 0) {
      return {
        status: 'empty',
        options: [],
        selectedGridId: undefined,
        retryable: true,
      };
    }
    return {
      status: 'ready',
      options: [...options],
      selectedGridId: currentGridId && options.some((grid) => grid.id === currentGridId)
        ? currentGridId
        : undefined,
      retryable: false,
    };
  } catch (error) {
    return {
      status: 'error',
      options: [],
      selectedGridId: undefined,
      retryable: true,
      message: errorMessage(error, 'Unable to load conflict grid options'),
    };
  }
}

export function createConflictResidentsLoadingState(
  gridId: string,
): Extract<ConflictResidentsState, { status: 'loading' }> {
  return {
    status: 'loading',
    gridId,
    residents: [],
    retryable: false,
  };
}

export async function loadConflictResidents(gridId: string): Promise<ConflictResidentsState> {
  if (!gridId || gridId.trim() !== gridId) {
    return {
      status: 'error',
      gridId,
      residents: [],
      retryable: true,
      message: 'A selected grid ID is required before loading residents',
    };
  }
  try {
    const response = await personVisitFacade.listPeople({ gridId });
    const residents = response.items.filter((resident) => resident.gridId === gridId);
    if (residents.length === 0) {
      return {
        status: 'empty',
        gridId,
        residents: [],
        retryable: true,
      };
    }
    return {
      status: 'ready',
      gridId,
      residents,
      retryable: false,
    };
  } catch (error) {
    return {
      status: 'error',
      gridId,
      residents: [],
      retryable: true,
      message: errorMessage(error, 'Unable to load residents for the selected grid'),
    };
  }
}

export function selectConflictGrid(
  gridOptions: ConflictGridOptionsState,
  nextGridId: string,
  parties: readonly MobileConflictParty[],
): ConflictGridSelectionResult {
  if (gridOptions.status !== 'ready' || !gridOptions.options.some((grid) => grid.id === nextGridId)) {
    throw new Error(`Conflict grid '${nextGridId}' is not an available option`);
  }
  const switched = gridOptions.selectedGridId !== nextGridId;
  return {
    selectedGridId: nextGridId,
    parties: switched
      ? parties.filter((party) => party.type === 'organization').map((party) => ({ ...party }))
      : parties.map((party) => ({ ...party })),
    residents: createConflictResidentsLoadingState(nextGridId),
  };
}

function invalid(
  code: ConflictGridPartyValidationCode,
  message: string,
): ConflictGridPartyValidationResult {
  return { valid: false, code, message };
}

export function validateConflictGridParty(
  state: ConflictGridPartySubmissionState,
): ConflictGridPartyValidationResult {
  if (state.gridOptions.status !== 'ready') {
    return invalid('grid-unavailable', 'Grid options must be ready before submission');
  }
  if (!state.selectedGridId) {
    return invalid('grid-required', 'A grid must be selected');
  }
  if (!state.gridOptions.options.some((grid) => grid.id === state.selectedGridId)) {
    return invalid('grid-unavailable', 'The selected grid is not an available option');
  }
  if (!state.location || state.location.trim() !== state.location) {
    return invalid('location-required', 'A non-empty location is required');
  }
  if (state.parties.length === 0) {
    return invalid('party-required', 'At least one involved party is required');
  }

  const identities = state.parties.map((party) => `${party.type}:${party.id}`);
  if (new Set(identities).size !== identities.length) {
    return invalid('duplicate-party', 'Duplicate involved parties are not allowed');
  }

  const residentParties = state.parties.filter((party) => party.type === 'resident');
  if (residentParties.length === 0) {
    return { valid: true };
  }
  if (
    state.residents.status !== 'ready'
    || state.residents.gridId !== state.selectedGridId
  ) {
    return invalid('residents-unavailable', 'Residents must be ready for the selected grid');
  }
  const residentIds = new Set(
    state.residents.residents
      .filter((resident) => resident.gridId === state.selectedGridId)
      .map((resident) => resident.id),
  );
  if (residentParties.some((party) => !residentIds.has(party.id))) {
    return invalid('resident-outside-grid', 'Every resident party must belong to the selected grid');
  }
  return { valid: true };
}

export function canSubmitConflictGridParty(state: ConflictGridPartySubmissionState): boolean {
  return validateConflictGridParty(state).valid;
}
