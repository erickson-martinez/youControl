import { useState, useEffect } from 'react';

export interface Habit {
  id: string;
  label: string;
}

export interface JornadaGoal {
  id: string;
  title: string;
  timeframe: 'dias' | 'semanas' | '5_meses' | '6_meses' | '1_ano' | '2_anos' | '5_anos' | 'conquistas';
  completed: boolean;
  createdAt: string;
}

export interface PrayerRequest {
  id: string;
  request: string;
  answered: boolean;
  createdAt: string;
}

export interface JornadaContext {
  nome: string;
  idade: string;
  profissao: string;
  familia: string;
  rotinaFilho: string;
  empreendimento: string;
  veiculo: string;
}

export interface JornadaData {
  dailyLogs: Record<string, Record<string, boolean>>; // date (YYYY-MM-DD) -> habitId -> boolean
  goals: JornadaGoal[];
  prayers: PrayerRequest[];
  points: number;
  lastFastFoodDate: string | null;
  customHabits: Habit[];
  context: JornadaContext;
}

const STORAGE_KEY = 'jornada_erickson_data';

const DEFAULT_CONTEXT: JornadaContext = {
  nome: '',
  idade: '',
  profissao: '',
  familia: '',
  rotinaFilho: '',
  empreendimento: '',
  veiculo: ''
};

const DEFAULT_HABITS: Habit[] = [
  { id: 'h1', label: '1. Acordar antes das 6 horas' },
  { id: 'h12', label: '12. Uma oração de gratidão ao acordar' },
  { id: 'h16', label: '16. Meditar por 5 minutos depois da oração' },
  { id: 'h15', label: '15. Beber 3 litros de água no mínimo' },
  { id: 'h9', label: '9. Só comida de verdade (Carne, verduras e fibras)' },
  { id: 'h2', label: '2. Treinar 5 vezes por semana' },
  { id: 'h5', label: '5. Ler 5 páginas por dia de um livro' },
  { id: 'h_biblia', label: 'Extra: Ler a Bíblia' },
  { id: 'h11', label: '11. Uma hora estudando habilidade nova (Vendas)' },
  { id: 'h17', label: '17. Dedicar uma hora por dia para melhorar alguma área da minha vida' },
  { id: 'h7', label: '7. Planejar o Dia antes de começar a trabalhar' },
  { id: 'h6', label: '6. Planejar metas da semana' },
  { id: 'h14', label: '14. Guardar 20% do que eu ganhar' },
  { id: 'h3', label: '3. Nada de álcool' },
  { id: 'h4', label: '4. Nada de balada' },
  { id: 'h8', label: '8. Dormir no máximo 23 horas' },
];

const getInitialData = (): JornadaData => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (!parsed.customHabits) {
        parsed.customHabits = DEFAULT_HABITS;
      }
      if (!parsed.context) {
        parsed.context = DEFAULT_CONTEXT;
      }
      return parsed;
    } catch (e) {
      console.error("Failed to parse jornada data", e);
    }
  }
  return {
    dailyLogs: {},
    goals: [],
    prayers: [],
    points: 0,
    lastFastFoodDate: null,
    customHabits: DEFAULT_HABITS,
    context: DEFAULT_CONTEXT,
  };
};

export const useJornada = () => {
  const [data, setData] = useState<JornadaData>(getInitialData);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const updateContext = (newContext: Partial<JornadaContext>) => {
    setData(prev => ({
      ...prev,
      context: { ...prev.context, ...newContext }
    }));
  };

  const toggleHabit = (date: string, habitId: string) => {
    setData(prev => {
      const dayLog = prev.dailyLogs[date] || {};
      const isCompleted = !dayLog[habitId];
      
      // Calculate points: +10 for completing, -10 for unchecking
      const pointDiff = isCompleted ? 10 : -10;

      return {
        ...prev,
        points: Math.max(0, prev.points + pointDiff),
        dailyLogs: {
          ...prev.dailyLogs,
          [date]: {
            ...dayLog,
            [habitId]: isCompleted
          }
        }
      };
    });
  };

  const addHabit = (label: string) => {
    setData(prev => ({
      ...prev,
      customHabits: [...prev.customHabits, { id: crypto.randomUUID(), label }]
    }));
  };

  const deleteHabit = (id: string) => {
    setData(prev => ({
      ...prev,
      customHabits: prev.customHabits.filter(h => h.id !== id)
    }));
  };

  const addGoal = (title: string, timeframe: JornadaGoal['timeframe']) => {
    const newGoal: JornadaGoal = {
      id: crypto.randomUUID(),
      title,
      timeframe,
      completed: false,
      createdAt: new Date().toISOString()
    };
    setData(prev => ({ ...prev, goals: [...prev.goals, newGoal] }));
  };

  const toggleGoal = (id: string) => {
    setData(prev => ({
      ...prev,
      goals: prev.goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g)
    }));
  };

  const deleteGoal = (id: string) => {
    setData(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== id) }));
  };

  const addPrayer = (request: string) => {
    const newPrayer: PrayerRequest = {
      id: crypto.randomUUID(),
      request,
      answered: false,
      createdAt: new Date().toISOString()
    };
    setData(prev => ({ ...prev, prayers: [...prev.prayers, newPrayer] }));
  };

  const togglePrayer = (id: string) => {
    setData(prev => ({
      ...prev,
      prayers: prev.prayers.map(p => p.id === id ? { ...p, answered: !p.answered } : p)
    }));
  };

  const deletePrayer = (id: string) => {
    setData(prev => ({ ...prev, prayers: prev.prayers.filter(p => p.id !== id) }));
  };

  const registerFastFood = (date: string) => {
    setData(prev => ({ ...prev, lastFastFoodDate: date }));
  };

  return {
    data,
    updateContext,
    toggleHabit,
    addHabit,
    deleteHabit,
    addGoal,
    toggleGoal,
    deleteGoal,
    addPrayer,
    togglePrayer,
    deletePrayer,
    registerFastFood
  };
};
