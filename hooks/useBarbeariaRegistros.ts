import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../constants';

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
    } else {
      setRegistros([]);
    }
  };

  useEffect(() => {
    loadRegistros();
  }, [empresaId]);

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
  horarios?: string[];
  quantidadePessoas?: number;
  nomesAcompanhantes?: string;
  valorTotalPrevisto?: number;
  status: 'pendente' | 'atendendo' | 'concluido' | 'cancelado';
}

export const useBarbeariaAgendamentos = (empresaId?: string) => {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const key = empresaId ? `barbearia_agendamentos_${empresaId}` : 'barbearia_agendamentos';

  const loadAgendamentos = useCallback(async () => {
    try {
      const url = empresaId 
        ? `${API_BASE_URL}/api/appointment-barbers?linkId=${empresaId}`
        : `${API_BASE_URL}/api/appointment-barbers`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const mapped = data.map((a: any) => ({ 
          ...a, 
          id: a.id || a._id,
          cliente: a.clienteNome || a.cliente,
          telefone: a.clienteTelefone || a.telefone,
        }));
        setAgendamentos(mapped);
      }
    } catch (e) {
      console.error('Erro ao carregar agendamentos:', e);
    }
  }, [empresaId]);

  useEffect(() => {
    loadAgendamentos();
  }, [loadAgendamentos]);

  const addAgendamento = async (agendamentoData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/appointment-barbers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agendamentoData),
      });
      if (response.ok) {
        loadAgendamentos();
      } else {
        console.error('Erro ao adicionar agendamento via API');
      }
    } catch (e) {
      console.error('Erro de conexão ao adicionar agendamento:', e);
    }
  };

  const updateStatus = async (id: string, status: Agendamento['status'], barbeiroId?: string) => {
    try {
      const body: any = { status };
      if (barbeiroId) body.barbeiroId = barbeiroId;
      
      const isCancel = status === 'cancelado';
      const url = isCancel 
        ? `${API_BASE_URL}/api/appointment-barbers/${id}/cancel`
        : `${API_BASE_URL}/api/appointment-barbers/${id}/status`;

      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (response.ok) {
        loadAgendamentos();
      } else {
        console.error('Erro ao atualizar status do agendamento via API');
      }
    } catch (e) {
      console.error('Erro de conexão ao atualizar status:', e);
    }
  };

  const updateAgendamento = async (id: string, updates: Partial<Agendamento>) => {
    try {
      // Tenta fazer o PUT completo
      const response = await fetch(`${API_BASE_URL}/api/appointment-barbers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        loadAgendamentos();
      } else {
        console.error('Erro ao atualizar agendamento via API');
      }
    } catch (e) {
      console.error('Erro de conexão ao atualizar:', e);
    }
  };

  return { agendamentos, addAgendamento, updateStatus, updateAgendamento, loadAgendamentos };
};
