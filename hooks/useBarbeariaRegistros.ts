import { useState, useEffect } from 'react';

export interface RegistroItem {
  idItem: string; // id do produto ou servico
  nome: string;
  tipo: 'servico' | 'produto';
  valor: number;
}

export interface RegistroBarbearia {
  id: string;
  data: string; // ISO string
  cliente: string;
  telefone: string;
  barbeiroId?: string;
  barbeiroNome?: string;
  itens: RegistroItem[];
  total: number;
}

export const useBarbeariaRegistros = (empresaId?: string) => {
  const [registros, setRegistros] = useState<RegistroBarbearia[]>([]);
  const key = empresaId ? `barbearia_registros_${empresaId}` : 'barbearia_registros';

  const loadRegistros = () => {
    const data = localStorage.getItem(key);
    if (data) {
      setRegistros(JSON.parse(data));
    }
  };

  useEffect(() => {
    loadRegistros();
  }, []);

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(registros));
  }, [registros, key]);

  const addRegistro = (registro: Omit<RegistroBarbearia, 'id' | 'data'>) => {
    const novo = {
      ...registro,
      id: Date.now().toString(),
      data: new Date().toISOString()
    };
    setRegistros(prev => [novo, ...prev]);
  };

  const removeRegistro = (id: string) => {
    setRegistros(prev => prev.filter(r => r.id !== id));
  };

  return { registros, addRegistro, removeRegistro, loadRegistros };
};

export interface Agendamento {
  id: string;
  dataCadastro: string;
  dataAgendada: string; // ISO string para o horario
  telefone: string;
  cliente: string;
  barbeiroId?: string;
  servicoId?: string;
  servicosIds?: string[];
  produtosIds?: string[];
  status: 'pendente' | 'concluido' | 'cancelado';
}

export const useBarbeariaAgendamentos = (empresaId?: string) => {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const key = empresaId ? `barbearia_agendamentos_${empresaId}` : 'barbearia_agendamentos';

  const loadAgendamentos = () => {
    const data = localStorage.getItem(key);
    if (data) {
      setAgendamentos(JSON.parse(data));
    }
  };

  useEffect(() => {
    loadAgendamentos();
  }, []);

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(agendamentos));
  }, [agendamentos, key]);

  const addAgendamento = (agendamento: Omit<Agendamento, 'id' | 'dataCadastro' | 'status'>) => {
    const novo: Agendamento = {
      ...agendamento,
      id: Date.now().toString(),
      dataCadastro: new Date().toISOString(),
      status: 'pendente'
    };
    setAgendamentos(prev => [...prev, novo]);
  };

  const updateStatus = (id: string, status: Agendamento['status']) => {
    setAgendamentos(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  return { agendamentos, addAgendamento, updateStatus, loadAgendamentos };
};
