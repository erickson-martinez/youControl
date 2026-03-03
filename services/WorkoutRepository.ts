import { WorkoutCycle } from '../types';

export interface WorkoutRepository {
  getCycle(userId: string): Promise<WorkoutCycle | null>;
  saveCycle(cycle: WorkoutCycle): Promise<void>;
}
