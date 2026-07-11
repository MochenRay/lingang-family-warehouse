import type { House, HousingHistory, Person } from '../../types/core';
import { houseRepository } from './houseRepository';
import { personRepository } from './personRepository';

export interface RelationshipLedgerSnapshot {
  people: Person[];
  houses: House[];
  history: HousingHistory[];
}

export const relationshipLedgerRepository = {
  async getSnapshot(): Promise<RelationshipLedgerSnapshot> {
    const [people, houses, history] = await Promise.all([
      personRepository.getPeople(),
      houseRepository.getHouses(),
      houseRepository.getHousingHistoryRecords(),
    ]);

    return { people, houses, history };
  },
};
