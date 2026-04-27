import { Grid } from '../../types/core';
import { DEMO_GRID_OPTIONS } from '../../config/regions';

export const SEED_GRIDS: Grid[] = DEMO_GRID_OPTIONS.map((grid) => ({
  id: grid.id,
  name: grid.name,
  managerName: grid.managerName,
}));
