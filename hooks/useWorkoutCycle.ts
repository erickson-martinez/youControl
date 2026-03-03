import { useState, useEffect, useCallback } from 'react';
import { WorkoutCycle, WorkoutDay, WorkoutExercise, WorkoutHistoryEntry } from '../types';
import { LocalStorageWorkoutRepository } from '../services/LocalStorageWorkoutRepository';
import { WorkoutRepository } from '../services/WorkoutRepository';

// In the future, this can be swapped with ApiWorkoutRepository
const repository: WorkoutRepository = new LocalStorageWorkoutRepository();

export const useWorkoutCycle = (userId: string) => {
  const [cycle, setCycle] = useState<WorkoutCycle | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCycle = useCallback(async () => {
    setLoading(true);
    let data = await repository.getCycle(userId);
    if (!data) {
      data = {
        id: crypto.randomUUID(),
        userId,
        days: [],
        currentDayId: null,
        history: []
      };
      await repository.saveCycle(data);
    }
    setCycle(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadCycle();
    }
  }, [userId, loadCycle]);

  const saveAndSetCycle = async (newCycle: WorkoutCycle) => {
    await repository.saveCycle(newCycle);
    setCycle(newCycle);
  };

  const setWorkoutCycle = async (daysData: { name: string, exercises: Omit<WorkoutExercise, 'id'>[] }[]) => {
    if (!cycle) return;
    
    const newDays: WorkoutDay[] = daysData.map((dayData, index) => ({
      id: crypto.randomUUID(),
      name: dayData.name,
      order: index,
      exercises: dayData.exercises.map(ex => ({ ...ex, id: crypto.randomUUID() }))
    }));

    const newCycle = {
      ...cycle,
      days: newDays,
      currentDayId: newDays.length > 0 ? newDays[0].id : null
    };

    await saveAndSetCycle(newCycle);
  };

  const addWorkoutDay = async (name: string) => {
    if (!cycle) return;
    const newDay: WorkoutDay = {
      id: crypto.randomUUID(),
      name,
      exercises: [],
      order: cycle.days.length
    };
    const newDays = [...cycle.days, newDay];
    const newCycle = { 
      ...cycle, 
      days: newDays,
      currentDayId: cycle.currentDayId || newDay.id 
    };
    await saveAndSetCycle(newCycle);
  };

  const addWorkoutDayWithExercises = async (name: string, exercisesData: Omit<WorkoutExercise, 'id'>[]) => {
    if (!cycle) return;
    const newDay: WorkoutDay = {
      id: crypto.randomUUID(),
      name,
      exercises: exercisesData.map(ex => ({ ...ex, id: crypto.randomUUID() })),
      order: cycle.days.length
    };
    const newDays = [...cycle.days, newDay];
    const newCycle = { 
      ...cycle, 
      days: newDays,
      currentDayId: cycle.currentDayId || newDay.id 
    };
    await saveAndSetCycle(newCycle);
  };

  const updateWorkoutDay = async (dayId: string, name: string) => {
    if (!cycle) return;
    const newDays = cycle.days.map(d => d.id === dayId ? { ...d, name } : d);
    await saveAndSetCycle({ ...cycle, days: newDays });
  };

  const deleteWorkoutDay = async (dayId: string) => {
    if (!cycle) return;
    const newDays = cycle.days.filter(d => d.id !== dayId).map((d, i) => ({ ...d, order: i }));
    
    let newCurrentDayId = cycle.currentDayId;
    if (newCurrentDayId === dayId) {
      newCurrentDayId = newDays.length > 0 ? newDays[0].id : null;
    }

    await saveAndSetCycle({ ...cycle, days: newDays, currentDayId: newCurrentDayId });
  };

  const duplicateWorkoutDay = async (dayId: string) => {
    if (!cycle) return;
    const dayToDuplicate = cycle.days.find(d => d.id === dayId);
    if (!dayToDuplicate) return;

    const newDay: WorkoutDay = {
      ...dayToDuplicate,
      id: crypto.randomUUID(),
      name: `${dayToDuplicate.name} (Cópia)`,
      order: cycle.days.length,
      exercises: dayToDuplicate.exercises.map(e => ({ ...e, id: crypto.randomUUID() }))
    };

    const newDays = [...cycle.days, newDay];
    await saveAndSetCycle({ ...cycle, days: newDays });
  };

  const reorderWorkoutDays = async (startIndex: number, endIndex: number) => {
    if (!cycle) return;
    const result = Array.from(cycle.days);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    
    const newDays = result.map((d, i) => ({ ...d, order: i }));
    await saveAndSetCycle({ ...cycle, days: newDays });
  };

  const addExercise = async (dayId: string, exercise: Omit<WorkoutExercise, 'id'>) => {
    if (!cycle) return;
    const newDays = cycle.days.map(d => {
      if (d.id === dayId) {
        return {
          ...d,
          exercises: [...d.exercises, { ...exercise, id: crypto.randomUUID() }]
        };
      }
      return d;
    });
    await saveAndSetCycle({ ...cycle, days: newDays });
  };

  const updateExercise = async (dayId: string, exerciseId: string, updates: Partial<WorkoutExercise>) => {
    if (!cycle) return;
    const newDays = cycle.days.map(d => {
      if (d.id === dayId) {
        return {
          ...d,
          exercises: d.exercises.map(e => e.id === exerciseId ? { ...e, ...updates } : e)
        };
      }
      return d;
    });
    await saveAndSetCycle({ ...cycle, days: newDays });
  };

  const removeExercise = async (dayId: string, exerciseId: string) => {
    if (!cycle) return;
    const newDays = cycle.days.map(d => {
      if (d.id === dayId) {
        return {
          ...d,
          exercises: d.exercises.filter(e => e.id !== exerciseId)
        };
      }
      return d;
    });
    await saveAndSetCycle({ ...cycle, days: newDays });
  };

  const reorderExercises = async (dayId: string, startIndex: number, endIndex: number) => {
    if (!cycle) return;
    const newDays = cycle.days.map(d => {
      if (d.id === dayId) {
        const result = Array.from(d.exercises);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        return { ...d, exercises: result };
      }
      return d;
    });
    await saveAndSetCycle({ ...cycle, days: newDays });
  };

  const completeWorkout = async (dayId: string) => {
    if (!cycle || cycle.days.length === 0) return;
    
    const currentDayIndex = cycle.days.findIndex(d => d.id === dayId);
    if (currentDayIndex === -1) return;

    const currentDay = cycle.days[currentDayIndex];
    
    const historyEntry: WorkoutHistoryEntry = {
      id: crypto.randomUUID(),
      dayId: currentDay.id,
      dayName: currentDay.name,
      completedAt: new Date().toISOString()
    };

    // Clear completed status for exercises in the completed day
    const newDays = cycle.days.map((d, idx) => {
      if (idx === currentDayIndex) {
        return {
          ...d,
          exercises: d.exercises.map(e => ({ ...e, completed: false }))
        };
      }
      return d;
    });

    const nextDayIndex = (currentDayIndex + 1) % cycle.days.length;
    const nextDayId = cycle.days[nextDayIndex].id;

    await saveAndSetCycle({
      ...cycle,
      days: newDays,
      currentDayId: nextDayId,
      history: [historyEntry, ...cycle.history]
    });
  };

  const resetCycle = async () => {
    if (!cycle || cycle.days.length === 0) return;
    await saveAndSetCycle({
      ...cycle,
      currentDayId: cycle.days[0].id
    });
  };

  const getNextWorkout = () => {
    if (!cycle || !cycle.currentDayId) return null;
    const currentDayIndex = cycle.days.findIndex(d => d.id === cycle.currentDayId);
    if (currentDayIndex === -1) return null;
    
    return {
      day: cycle.days[currentDayIndex],
      index: currentDayIndex,
      total: cycle.days.length
    };
  };

  const generateFromTemplate = async (template: any) => {
    if (!cycle) return;
    
    const newDays: WorkoutDay[] = template.grupos_musculares.map((grupo: any, index: number) => {
      const dayId = crypto.randomUUID();
      const exercises: WorkoutExercise[] = [];
      
      grupo.equipamentos.forEach((equip: any) => {
        equip.exercicios.forEach((exName: string) => {
          exercises.push({
            id: crypto.randomUUID(),
            name: exName,
            sets: 3,
            reps: '10-12',
            notes: `${equip.nome} (${equip.tipo})`
          });
        });
      });

      return {
        id: dayId,
        name: grupo.grupo,
        exercises,
        order: index
      };
    });

    // Add a rest day to make it 7 days
    newDays.push({
      id: crypto.randomUUID(),
      name: 'Descanso',
      exercises: [],
      order: newDays.length
    });

    const newCycle: WorkoutCycle = {
      ...cycle,
      days: newDays,
      currentDayId: newDays[0].id
    };

    await saveAndSetCycle(newCycle);
  };

  return {
    cycle,
    loading,
    setWorkoutCycle,
    addWorkoutDay,
    addWorkoutDayWithExercises,
    updateWorkoutDay,
    deleteWorkoutDay,
    duplicateWorkoutDay,
    reorderWorkoutDays,
    addExercise,
    updateExercise,
    removeExercise,
    reorderExercises,
    completeWorkout,
    resetCycle,
    getNextWorkout,
    generateFromTemplate
  };
};
