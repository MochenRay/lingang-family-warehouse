import { Grid, House, Notification, Person, VisitRecord, HousingHistory, ConflictRecord } from '../types/core';
import { SEED_GRIDS, SEED_HOUSES, SEED_NOTIFICATIONS, SEED_PEOPLE, SEED_VISITS, SEED_HOUSING_HISTORY, SEED_CONFLICTS } from '../data/seeds';

const STORAGE_KEYS = {
  PEOPLE: 'app_data_people',
  HOUSES: 'app_data_houses',
  GRIDS: 'app_data_grids',
  VISITS: 'app_data_visits',
  NOTIFICATIONS: 'app_data_notifications',
  HOUSING_HISTORY: 'app_data_housing_history',
  CONFLICTS: 'app_data_conflicts',
  INIT: 'app_data_v14_initialized' // 更新版本号以重新加载数据
};

class DBService {
  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    const isInitialized = localStorage.getItem(STORAGE_KEYS.INIT);
    if (!isInitialized) {
      console.log('Initializing DB with seed data...');
      localStorage.setItem(STORAGE_KEYS.PEOPLE, JSON.stringify(SEED_PEOPLE));
      localStorage.setItem(STORAGE_KEYS.HOUSES, JSON.stringify(SEED_HOUSES));
      localStorage.setItem(STORAGE_KEYS.GRIDS, JSON.stringify(SEED_GRIDS));
      localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(SEED_VISITS));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(SEED_NOTIFICATIONS));
      localStorage.setItem(STORAGE_KEYS.HOUSING_HISTORY, JSON.stringify(SEED_HOUSING_HISTORY));
      localStorage.setItem(STORAGE_KEYS.CONFLICTS, JSON.stringify(SEED_CONFLICTS));
      localStorage.setItem(STORAGE_KEYS.INIT, 'true');
    }
  }

  // --- Helpers ---
  private getItem<T>(key: string): T[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private setItem<T>(key: string, data: T[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(data));
    // Trigger a custom event for reactivity across components in the same window
    window.dispatchEvent(new Event('db-change'));
  }

  // --- Reset ---
  reset() {
    localStorage.removeItem(STORAGE_KEYS.INIT);
    this.init();
    window.dispatchEvent(new Event('db-change'));
  }

  // --- People ---
  getPeople(filter?: (p: Person) => boolean): Person[] {
    const people = this.getItem<Person>(STORAGE_KEYS.PEOPLE);
    return filter ? people.filter(filter) : people;
  }

  getPerson(id: string): Person | undefined {
    return this.getPeople().find(p => p.id === id);
  }

  addPerson(person: Person) {
    const people = this.getPeople();
    people.push(person);
    this.setItem(STORAGE_KEYS.PEOPLE, people);
  }

  deletePerson(id: string) {
    const people = this.getPeople().filter(p => p.id !== id);
    this.setItem(STORAGE_KEYS.PEOPLE, people);
  }

  updatePerson(id: string, updates: Partial<Person>) {
    const people = this.getPeople();
    const index = people.findIndex(p => p.id === id);
    if (index !== -1) {
      people[index] = { ...people[index], ...updates };
      this.setItem(STORAGE_KEYS.PEOPLE, people);
    }
  }

  // --- Houses ---
  getHouses(filter?: (h: House) => boolean): House[] {
    const houses = this.getItem<House>(STORAGE_KEYS.HOUSES);
    return filter ? houses.filter(filter) : houses;
  }

  getHouse(id: string): House | undefined {
    return this.getHouses().find(h => h.id === id);
  }

  addHouse(house: House) {
    const houses = this.getHouses();
    houses.push(house);
    this.setItem(STORAGE_KEYS.HOUSES, houses);
  }

  updateHouse(id: string, updates: Partial<House>) {
    const houses = this.getHouses();
    const index = houses.findIndex(h => h.id === id);
    if (index !== -1) {
      houses[index] = { ...houses[index], ...updates };
      this.setItem(STORAGE_KEYS.HOUSES, houses);
    }
  }

  // --- Housing History ---
  getHousingHistory(filter?: (h: HousingHistory) => boolean): HousingHistory[] {
    const history = this.getItem<HousingHistory>(STORAGE_KEYS.HOUSING_HISTORY);
    return filter ? history.filter(filter) : history;
  }

  // --- Grids ---
  getGrids(): Grid[] {
    return this.getItem<Grid>(STORAGE_KEYS.GRIDS);
  }

  // --- Visits ---
  getVisits(filter?: (v: VisitRecord) => boolean): VisitRecord[] {
    const visits = this.getItem<VisitRecord>(STORAGE_KEYS.VISITS);
    return filter ? visits.filter(filter) : visits;
  }

  addVisit(visit: VisitRecord) {
    const visits = this.getVisits();
    visits.unshift(visit); // Add to top
    this.setItem(STORAGE_KEYS.VISITS, visits);
  }

  // --- Notifications ---
  getNotifications(): Notification[] {
    return this.getItem<Notification>(STORAGE_KEYS.NOTIFICATIONS);
  }

  addNotification(notification: Notification) {
    const notifications = this.getNotifications();
    notifications.unshift(notification);
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, notifications);
  }

  deleteNotification(id: string) {
    const notifications = this.getNotifications().filter((notice) => notice.id !== id);
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, notifications);
  }

  // --- Conflicts ---
  getConflicts(filter?: (c: ConflictRecord) => boolean): ConflictRecord[] {
    const conflicts = this.getItem<ConflictRecord>(STORAGE_KEYS.CONFLICTS);
    return filter ? conflicts.filter(filter) : conflicts;
  }

  addConflict(conflict: ConflictRecord) {
    const conflicts = this.getConflicts();
    conflicts.unshift(conflict);
    this.setItem(STORAGE_KEYS.CONFLICTS, conflicts);
  }

  updateConflict(id: string, updates: Partial<ConflictRecord>) {
    const conflicts = this.getConflicts();
    const index = conflicts.findIndex(c => c.id === id);
    if (index !== -1) {
      conflicts[index] = { ...conflicts[index], ...updates };
      this.setItem(STORAGE_KEYS.CONFLICTS, conflicts);
    }
  }
}

export const db = new DBService();
export type { Grid, House, Notification, Person, VisitRecord, HousingHistory, ConflictRecord } from '../types/core';
