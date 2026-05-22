import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../constants';
import { useBarbeariaConfig } from './useBarbeariaConfig';
import { useBarbeiros } from './useBarbeiros';

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
  status: 'pendente' | 'atendendo' | 'finalizado' | 'pago' | 'cancelado';
}

const promiseCache = new Map<string, Promise<any>>();

export const useBarbeariaAgendamentos = (empresaId?: string) => {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const key = empresaId ? `barbearia_agendamentos_${empresaId}` : 'barbearia_agendamentos';

  const loadAgendamentos = useCallback(async () => {
    if (!empresaId) {
      setAgendamentos([]);
      return;
    }
    const url = `${API_BASE_URL}/api/appointment-barbers?linkId=${empresaId}`;
    try {
      if (!promiseCache.has(url)) {
        promiseCache.set(url, fetch(url).then(async (r) => {
          if (!r.ok) throw new Error('Erro ao buscar agendamentos');
          return r.json();
        }).finally(() => {
          setTimeout(() => promiseCache.delete(url), 100);
        }));
      }
      const data = await promiseCache.get(url);
      const mapped = data.map((a: any) => ({ 
        ...a, 
        id: a.id || a._id,
        cliente: a.clienteNome || a.cliente,
        telefone: a.clienteTelefone || a.telefone,
      }));
      setAgendamentos(mapped);
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
        const data = await response.json();
        loadAgendamentos();
        return data;
      } else {
        console.error('Erro ao adicionar agendamento via API');
        return null;
      }
    } catch (e) {
      console.error('Erro de conexão ao adicionar agendamento:', e);
      return null;
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
export const useBarbeariaRegistros = (empresaId?: string) => {
  const { agendamentos, loadAgendamentos, updateAgendamento } = useBarbeariaAgendamentos(empresaId);
  const { servicos, produtos } = useBarbeariaConfig(empresaId);
  const { barbeiros } = useBarbeiros(empresaId);

  const [registros, setRegistros] = useState<RegistroBarbearia[]>([]);

  const loadRegistros = useCallback(() => {
    loadAgendamentos();
  }, [loadAgendamentos]);

  useEffect(() => {
    if (agendamentos.length === 0 && servicos.length === 0) return;
    
    const pagos = agendamentos.filter(a => a.status === 'pago');
    const logs = pagos.map(a => {
      const itens: RegistroItem[] = [];
      let total = 0;
      
      if (a.servicosIds && a.servicosIds.length > 0) {
        a.servicosIds.forEach(id => {
          const s = servicos.find(x => x.id === id);
          if (s) {
            itens.push({ idItem: s.id, nome: s.nome, tipo: 'servico', valor: s.valor });
            total += s.valor;
          }
        });
      } else if (a.servicoId) {
        const s = servicos.find(x => x.id === a.servicoId);
        if (s) {
          itens.push({ idItem: s.id, nome: s.nome, tipo: 'servico', valor: s.valor });
          total += s.valor;
        }
      }

      if (a.produtosIds) {
        a.produtosIds.forEach(id => {
          const p = produtos.find(x => x.id === id);
          if (p) {
            itens.push({ idItem: p.id, nome: p.nome, tipo: 'produto', valor: p.precoVenda });
            total += p.precoVenda;
          }
        });
      }
      
      // Se não achou na config (pode ter sido apagado), usa fallback se houver valorTotalPrevisto
      if (itens.length === 0 && a.valorTotalPrevisto) {
        total = a.valorTotalPrevisto;
      }

      const barbeiro = barbeiros.find(b => b.id === a.barbeiroId);

      return {
        id: a.id,
        data: a.dataAgendada,
        cliente: a.cliente,
        telefone: a.telefone,
        barbeiroId: a.barbeiroId,
        barbeiroNome: barbeiro ? barbeiro.nome : 'Qualquer um',
        itens,
        total
      };
    });

    setRegistros(logs);
  }, [agendamentos, servicos, produtos, barbeiros]);

  // addRegistro agora é obsoleto para chamadas diretas como era antes se usarmos 'updateStatus' no agendamento.
  // Mantendo a interface se precisarmos forçar adicionar algo manual (não recomendado agora).
  const addRegistro = async (registro: Omit<RegistroBarbearia, 'id' | 'data'>) => {
    // Não faremos isso via essa rota mais, deve-se gerar/usar um agendamento.
    return null; 
  };

  const removeRegistro = async (id: string) => {
    // Deletar ou cancelar no agendamento
    await fetch(`${API_BASE_URL}/api/appointment-barbers/${id}`, { method: 'DELETE' });
    loadAgendamentos();
  };

  return { registros, addRegistro, removeRegistro, loadRegistros };
};

