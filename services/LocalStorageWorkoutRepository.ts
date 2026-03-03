import { WorkoutCycle } from '../types';
import { WorkoutRepository } from './WorkoutRepository';

export class LocalStorageWorkoutRepository implements WorkoutRepository {
  private getStorageKey(userId: string) {
    return `workout_cycle_${userId}`;
  }

  async getCycle(userId: string): Promise<WorkoutCycle | null> {
    const data = localStorage.getItem(this.getStorageKey(userId));
    if (!data) return null;
    try {
      return JSON.parse(data) as WorkoutCycle;
    } catch (e) {
      console.error('Failed to parse workout cycle from local storage', e);
      return null;
    }
  }

  async saveCycle(cycle: WorkoutCycle): Promise<void> {
    localStorage.setItem(this.getStorageKey(cycle.userId), JSON.stringify(cycle));
  }
}
