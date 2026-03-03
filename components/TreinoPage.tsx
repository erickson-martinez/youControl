import React, { useState, useEffect } from 'react';
import { useWorkoutCycle } from '../hooks/useWorkoutCycle';
import { User } from '../types';
import { PlusIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';

const WORKOUT_GROUPS = [
  {
    id: 'perna_posterior',
    name: 'Perna posterior e panturrilha',
    exercises: [
      { name: 'Mesa Flexora', sets: 3, reps: '10-12', notes: 'Máquina' },
      { name: 'Cadeira Flexora', sets: 3, reps: '10-12', notes: 'Máquina' },
      { name: 'Stiff com halteres', sets: 3, reps: '10-12', notes: 'Peso livre' },
      { name: 'Elevação de panturrilha em pé', sets: 3, reps: '15-20', notes: 'Máquina' },
    ]
  },
  {
    id: 'biceps_triceps',
    name: 'Bíceps e tríceps + antebraço',
    exercises: [
      { name: 'Rosca direta', sets: 3, reps: '10-12', notes: 'Barra W' },
      { name: 'Rosca alternada', sets: 3, reps: '10-12', notes: 'Halteres' },
      { name: 'Tríceps corda', sets: 3, reps: '10-12', notes: 'Polia Alta' },
      { name: 'Tríceps testa', sets: 3, reps: '10-12', notes: 'Halteres' },
      { name: 'Rosca inversa', sets: 3, reps: '12-15', notes: 'Barra Reta' },
    ]
  },
  {
    id: 'perna',
    name: 'Perna',
    exercises: [
      { name: 'Leg Press 45°', sets: 3, reps: '10-12', notes: 'Máquina' },
      { name: 'Cadeira Extensora', sets: 3, reps: '10-12', notes: 'Máquina' },
      { name: 'Agachamento no Smith', sets: 3, reps: '10-12', notes: 'Máquina guiada' },
      { name: 'Goblet squat', sets: 3, reps: '10-12', notes: 'Halteres' },
    ]
  },
  {
    id: 'costas_peito_ombro',
    name: 'Costas e peito + ombro e trapézio',
    exercises: [
      { name: 'Puxada Alta', sets: 3, reps: '10-12', notes: 'Máquina' },
      { name: 'Remada Baixa', sets: 3, reps: '10-12', notes: 'Máquina' },
      { name: 'Supino máquina', sets: 3, reps: '10-12', notes: 'Máquina' },
      { name: 'Crucifixo com halteres', sets: 3, reps: '10-12', notes: 'Peso livre' },
      { name: 'Desenvolvimento com halteres', sets: 3, reps: '10-12', notes: 'Peso livre' },
      { name: 'Elevação lateral', sets: 3, reps: '10-12', notes: 'Halteres' },
    ]
  },
  {
    id: 'perna_gluteo',
    name: 'Perna glúteo',
    exercises: [
      { name: 'Elevação pélvica', sets: 3, reps: '10-12', notes: 'Barra/Máquina' },
      { name: 'Agachamento búlgaro', sets: 3, reps: '10-12', notes: 'Halteres' },
      { name: 'Cadeira abdutora', sets: 3, reps: '10-12', notes: 'Máquina' },
      { name: 'Glúteo na polia', sets: 3, reps: '10-12', notes: 'Polia Baixa' },
    ]
  },
  {
    id: 'descanso',
    name: 'Descanso',
    exercises: []
  }
];

interface TreinoPageProps {
  user: User;
}

const TreinoPage: React.FC<TreinoPageProps> = ({ user }) => {
  const {
    cycle,
    loading,
    addWorkoutDayWithExercises,
    deleteWorkoutDay,
    removeExercise,
    addExercise,
    updateExercise,
    completeWorkout
  } = useWorkoutCycle(user.phone);

  const [viewOffset, setViewOffset] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newExercise, setNewExercise] = useState({ name: '', sets: 3, reps: '10-12', notes: '' });

  // Reset viewOffset when cycle changes to ensure we stay on today if needed
  useEffect(() => {
    // Optional: we can keep viewOffset as is, or reset it.
    // Let's keep it as is so the user doesn't lose their place unless they complete a workout.
  }, [cycle?.currentDayId]);

  if (loading) {
    return <div className="p-6 text-white">Carregando treinos...</div>;
  }

  const days = cycle?.days || [];
  const activeDayIndex = days.findIndex(d => d.id === cycle?.currentDayId);
  const baseIndex = activeDayIndex >= 0 ? activeDayIndex : 0;
  
  const getActualDayIndex = (offset: number) => {
    if (!days.length) return 0;
    const index = (baseIndex + offset) % days.length;
    return index < 0 ? index + days.length : index;
  };

  const actualDayIndex = getActualDayIndex(viewOffset);
  const currentDay = days.length > 0 ? days[actualDayIndex] : undefined;
  
  // Validation: cannot select the same group as the last added day
  const lastDayName = days.length > 0 ? days[days.length - 1].name : null;

  const handleAddTreino = async (group: typeof WORKOUT_GROUPS[0]) => {
    await addWorkoutDayWithExercises(group.name, group.exercises);
    setShowAddModal(false);
    setViewOffset(0); // Go back to today
  };

  const handleDeleteCurrentDay = async () => {
    if (currentDay) {
      await deleteWorkoutDay(currentDay.id);
      setViewOffset(0);
    }
  };

  const handleAddExerciseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentDay && newExercise.name.trim()) {
      await addExercise(currentDay.id, newExercise);
      setNewExercise({ name: '', sets: 3, reps: '10-12', notes: '' });
      setShowAddExercise(false);
    }
  };

  const handleCompleteWorkout = async () => {
    if (currentDay) {
      await completeWorkout(currentDay.id);
      // viewOffset stays 0, which will now automatically point to the next day
    }
  };

  // Calculate the date for the currently viewed day
  const viewedDate = new Date();
  viewedDate.setDate(viewedDate.getDate() + viewOffset);
  
  const formattedDate = viewedDate.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit'
  }).replace('.', ''); // e.g., "seg, 02/03"

  const workoutNumber = (cycle?.history.length || 0) + 1 + viewOffset;
  
  const isToday = viewOffset === 0;
  const isPast = viewOffset < 0;
  const isFuture = viewOffset > 0;

  return (
    <div className="p-6 max-w-md mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Treino</h1>
        <button
          onClick={() => {
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors font-medium shadow-md"
        >
          <PlusIcon className="w-5 h-5" />
          Treino
        </button>
      </div>

      {/* Day Selector */}
      <div className="flex items-center justify-between bg-gray-800 p-4 rounded-xl shadow-md border border-gray-700">
        <button 
          onClick={() => {
            setViewOffset(prev => prev - 1);
            setShowAddExercise(false);
          }}
          disabled={days.length === 0 || workoutNumber <= 1}
          className="p-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        
        <div className="text-center flex flex-col items-center">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-white">
              Treino {workoutNumber > 0 ? workoutNumber : 1}
            </span>
            <span className="text-xs font-medium text-gray-400 uppercase">
              {formattedDate} • Ciclo Dia {actualDayIndex + 1}
            </span>
          </div>
          {currentDay ? (
            <p className="text-sm text-blue-400 font-medium mt-1">{currentDay.name}</p>
          ) : (
            <p className="text-sm text-gray-500 font-medium mt-1">Não definido</p>
          )}
        </div>

        <button 
          onClick={() => {
            setViewOffset(prev => prev + 1);
            setShowAddExercise(false);
          }}
          disabled={days.length === 0 || viewOffset >= 30}
          className="p-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
        >
          <ChevronRightIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Current Day Content */}
      {currentDay ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-lg font-semibold text-white">Exercícios</h2>
            <button 
              onClick={handleDeleteCurrentDay}
              className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1"
            >
              <TrashIcon className="w-4 h-4" />
              Excluir Dia
            </button>
          </div>
          
          <div className="space-y-3">
            {currentDay.exercises.map((exercise) => (
              <div 
                key={exercise.id} 
                className={`p-4 rounded-xl border flex justify-between items-center shadow-sm transition-colors ${
                  exercise.completed 
                    ? 'bg-green-900/20 border-green-500/30' 
                    : 'bg-gray-800 border-gray-700'
                }`}
              >
                <div className="flex items-center gap-4">
                  {isToday && (
                    <button
                      onClick={() => updateExercise(currentDay.id, exercise.id, { completed: !exercise.completed })}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        exercise.completed
                          ? 'bg-green-500 border-green-500'
                          : 'border-gray-500 hover:border-gray-400'
                      }`}
                    >
                      {exercise.completed && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  )}
                  {isPast && (
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <p className={`font-bold text-lg ${(exercise.completed && isToday) || isPast ? 'text-green-400 line-through opacity-70' : 'text-white'}`}>
                      {exercise.name}
                    </p>
                    <p className={`text-sm mt-1 ${(exercise.completed && isToday) || isPast ? 'text-green-500/70' : 'text-gray-400'}`}>
                      {exercise.sets} séries de {exercise.reps}
                    </p>
                    {exercise.notes && (
                      <p className={`text-xs mt-1 ${(exercise.completed && isToday) || isPast ? 'text-green-500/50' : 'text-gray-500'}`}>
                        {exercise.notes}
                      </p>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => removeExercise(currentDay.id, exercise.id)}
                  className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
            {currentDay.exercises.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                {currentDay.name === 'Descanso' ? 'Dia de descanso. Aproveite para recuperar!' : 'Nenhum exercício neste dia.'}
              </p>
            )}

            {/* Add Exercise Form */}
            {showAddExercise ? (
              <form 
                onSubmit={handleAddExerciseSubmit} 
                className="bg-gray-700 p-4 rounded-xl border border-gray-600 space-y-3 mt-4"
              >
                <h4 className="text-sm font-medium text-white">Novo Exercício</h4>
                <input
                  type="text"
                  placeholder="Nome do exercício"
                  value={newExercise.name}
                  onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                  className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                  required
                />
                <div className="flex gap-3">
                  <input
                    type="number"
                    placeholder="Séries"
                    value={newExercise.sets}
                    onChange={(e) => setNewExercise({ ...newExercise, sets: parseInt(e.target.value) || 0 })}
                    className="w-24 bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                    min="1"
                  />
                  <input
                    type="text"
                    placeholder="Repetições"
                    value={newExercise.reps}
                    onChange={(e) => setNewExercise({ ...newExercise, reps: e.target.value })}
                    className="flex-1 bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Observações (opcional)"
                  value={newExercise.notes}
                  onChange={(e) => setNewExercise({ ...newExercise, notes: e.target.value })}
                  className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                />
                <div className="flex gap-2 justify-end pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowAddExercise(false)}
                    className="px-4 py-2 text-sm text-gray-300 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={!newExercise.name.trim()}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowAddExercise(true)}
                className="w-full py-3 mt-2 border-2 border-dashed border-gray-600 text-gray-400 rounded-xl hover:border-gray-500 hover:text-gray-300 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <PlusIcon className="w-5 h-5" />
                Adicionar Exercício
              </button>
            )}

            {(currentDay.exercises.length > 0 || currentDay.name === 'Descanso') && (
              <button
                onClick={handleCompleteWorkout}
                className="w-full mt-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-500 transition-colors flex items-center justify-center gap-2 font-bold shadow-lg shadow-green-900/20"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {currentDay.name === 'Descanso' ? 'Concluir Descanso' : 'Concluir Treino'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700 shadow-md">
          <p className="text-gray-400">Nenhum treino definido para o Dia {currentDayIndex + 1}.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors font-medium shadow-md"
          >
            <PlusIcon className="w-5 h-5" />
            Definir Treino
          </button>
        </div>
      )}

      {/* Add Treino Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-2xl w-full max-w-md border border-gray-700 overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
              <h2 className="text-xl font-bold text-white">Escolha o Grupo Muscular</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
            </div>
            
            <div className="p-4 overflow-y-auto space-y-3">
              {WORKOUT_GROUPS.map(group => {
                const isDisabled = lastDayName === group.name;
                return (
                  <button
                    key={group.id}
                    onClick={() => handleAddTreino(group)}
                    disabled={isDisabled}
                    className={`w-full text-left p-4 rounded-xl border transition-colors ${
                      isDisabled 
                        ? 'bg-gray-800/50 border-gray-800 opacity-50 cursor-not-allowed' 
                        : 'bg-gray-800 border-gray-700 hover:border-blue-500 hover:bg-gray-750'
                    }`}
                  >
                    <p className="font-bold text-white">{group.name}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {group.exercises.length} exercícios
                    </p>
                    {isDisabled && (
                      <p className="text-xs text-red-400 mt-2">
                        Não é possível selecionar o mesmo grupo dois dias seguidos.
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TreinoPage;
