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
  horarios?: string[];
  cliente: string;
  telefone: string;
  barbeiroId?: string;
  barbeiroNome?: string;
  itens: RegistroItem[];
  total: number;
  tipoPagamento?: string[];
  pagamento?: PagamentoAgendamento;
  desconto?: number;
  valorOriginal?: number;
  temAssinatura?: boolean;
  isSubscription?: boolean;
  assinatura?: AssinaturaAgendamento;
}

export const formatarDataHora = (isoStr: string | undefined, horarios?: string[]) => {
  if (!isoStr) return { dataStr: '', horaStr: '', dataHoraStr: '' };

  let dataStr = '';
  let horaStr = '';

  if (horarios && Array.isArray(horarios) && horarios.length > 0) {
    horaStr = horarios.join(', ');
  }

  if (typeof isoStr === 'string' && isoStr.includes('T')) {
    const [datePart, timePart] = isoStr.split('T');
    if (datePart && datePart.includes('-')) {
      const [y, m, d] = datePart.split('-');
      if (y && m && d) {
        dataStr = `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
      }
    }
    if (!horaStr && timePart) {
      const cleanTime = timePart.replace('Z', '').split('.')[0];
      const timeComponents = cleanTime.split(':');
      if (timeComponents.length >= 2) {
        horaStr = `${timeComponents[0].padStart(2, '0')}:${timeComponents[1].padStart(2, '0')}`;
      }
    }
  }

  if (!dataStr || !horaStr) {
    try {
      const d = new Date(isoStr);
      if (!isNaN(d.getTime())) {
        if (!dataStr) {
          dataStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        }
        if (!horaStr) {
          horaStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }
      }
    } catch (e) {}
  }

  const dataHoraStr = `${dataStr} ${horaStr}`.trim();
  return { dataStr, horaStr, dataHoraStr };
};

export interface PagamentoAgendamento {
  status?: string;
  formas?: string[];
  desconto?: number;
  subtotalServicos?: number;
  subtotalProdutos?: number;
  valorOriginal?: number;
  valorCobrado?: number;
}

export interface AssinaturaAgendamento {
  possui?: boolean;
  planoNome?: string;
  atendimentoNumero?: number;
  codigoAtendimento?: string;
}

export interface Agendamento {
  id: string;
  dataCadastro: string;
  dataAgendada: string; // ISO string para o horario
  telefone: string;
  cliente: string;
  email?: string;
  barbeiroId?: string;
  servicoId?: string;
  servicosIds?: string[];
  produtosIds?: string[];
  horarios?: string[];
  quantidadePessoas?: number;
  nomesAcompanhantes?: string;
  valorTotalPrevisto?: number;
  status: 'pendente' | 'atendendo' | 'finalizado' | 'pago' | 'cancelado';
  tipoPagamento?: string[];
  pagamento?: PagamentoAgendamento;
  assinatura?: AssinaturaAgendamento;
}

export const formatarMoeda = (valor: number = 0): string => {
  const safeVal = isNaN(Number(valor)) ? 0 : Number(valor);
  return safeVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const NOMES_DIAS_SEMANA = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

export const obterDiaSemanaApartirDeData = (dataStr: string | undefined): number => {
  if (!dataStr) return new Date().getDay();
  const datePart = dataStr.split('T')[0];
  const parts = datePart.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m, d, 12, 0, 0).getDay();
    }
  }
  const dateObj = new Date(dataStr);
  return isNaN(dateObj.getTime()) ? new Date().getDay() : dateObj.getDay();
};

export interface ResumoPagamentoAgendamento {
  subtotalServicos: number;
  subtotalProdutos: number;
  valorOriginal: number;
  desconto: number;
  valorCobrado: number;
  temAssinatura: boolean;
  isSegundaAQuarta: boolean;
  isSegundaAQuinta: boolean;
  nomeDiaSemana: string;
  mensagemDestaque?: string;
  formasPagamento: string[];
  planoNome?: string;
  atendimentoNumero?: number;
  codigoAtendimento?: string;
}

export const calcularResumoPagamento = (
  dataAgendada: string,
  subtotalServicosCalc: number = 0,
  subtotalProdutosCalc: number = 0,
  pagamentoBackend?: PagamentoAgendamento,
  assinaturaBackend?: AssinaturaAgendamento,
  possuirAssinaturaOverride?: boolean,
  planoNomeOverride?: string,
  qtdServicosCalc: number = 1
): ResumoPagamentoAgendamento => {
  const dayOfWeek = obterDiaSemanaApartirDeData(dataAgendada);
  const isSegundaAQuinta = dayOfWeek >= 1 && dayOfWeek <= 4;
  const isSegundaAQuarta = isSegundaAQuinta; // Mantém compatibilidade, cobrindo de segunda a quinta
  const nomeDiaSemana = NOMES_DIAS_SEMANA[dayOfWeek] || '';

  const temAssinatura = Boolean(
    assinaturaBackend?.possui ?? possuirAssinaturaOverride
  );
  const planoNome =
    assinaturaBackend?.planoNome ||
    planoNomeOverride ||
    (temAssinatura ? 'Plano VIP Assinatura' : undefined);
  const atendimentoNumero = assinaturaBackend?.atendimentoNumero;
  const codigoAtendimento = assinaturaBackend?.codigoAtendimento;

  // Prioritize backend fields
  const subtotalServicos =
    pagamentoBackend?.subtotalServicos !== undefined
      ? pagamentoBackend.subtotalServicos
      : subtotalServicosCalc;

  const subtotalProdutos =
    pagamentoBackend?.subtotalProdutos !== undefined
      ? pagamentoBackend.subtotalProdutos
      : subtotalProdutosCalc;

  const valorOriginal =
    pagamentoBackend?.valorOriginal !== undefined
      ? pagamentoBackend.valorOriginal
      : subtotalServicos + subtotalProdutos;

  let desconto = 0;
  let valorCobrado = 0;
  let mensagemDestaque: string | undefined = undefined;
  let formasPagamento: string[] = pagamentoBackend?.formas || [];

  if (temAssinatura) {
    const qtdSvc = Math.max(1, qtdServicosCalc);
    const taxaFimDeSemana = !isSegundaAQuinta ? (qtdSvc * 10) : 0;

    if (pagamentoBackend?.desconto !== undefined && pagamentoBackend.desconto > 0) {
      desconto = pagamentoBackend.desconto;
    } else {
      desconto = Math.max(0, subtotalServicos - taxaFimDeSemana);
    }

    if (pagamentoBackend?.valorRecebido !== undefined && pagamentoBackend.valorRecebido > 0) {
      valorCobrado = pagamentoBackend.valorRecebido;
    } else {
      valorCobrado = Math.max(0, subtotalProdutos + taxaFimDeSemana);
    }

    if (!formasPagamento.includes('Assinatura')) {
      formasPagamento = ['Assinatura', ...formasPagamento];
    }

    if (!isSegundaAQuinta) {
      mensagemDestaque = `Taxa de R$ ${taxaFimDeSemana.toFixed(2)} (${qtdSvc} serviço(s) x R$ 10,00) aplicada para agendamento em ${nomeDiaSemana}`;
    } else {
      mensagemDestaque = 'Serviços cobertos 100% pela assinatura (Segunda a Quinta)';
    }
  } else {
    if (pagamentoBackend?.desconto !== undefined) {
      desconto = pagamentoBackend.desconto;
    } else if (isSegundaAQuinta && subtotalServicos > 0) {
      desconto = Math.min(5, subtotalServicos);
    } else {
      desconto = 0;
    }

    if (pagamentoBackend?.valorCobrado !== undefined) {
      valorCobrado = pagamentoBackend.valorCobrado;
    } else {
      valorCobrado = Math.max(0, valorOriginal - desconto);
    }

    if (isSegundaAQuinta) {
      mensagemDestaque = 'Desconto de R$ 5,00 aplicado (Segunda a Quinta: dias promocionais)';
    }
  }

  return {
    subtotalServicos,
    subtotalProdutos,
    valorOriginal,
    desconto,
    valorCobrado,
    temAssinatura,
    isSegundaAQuarta,
    isSegundaAQuinta,
    nomeDiaSemana,
    mensagemDestaque,
    formasPagamento,
    planoNome,
    atendimentoNumero,
    codigoAtendimento,
  };
};

const promiseCache = new Map<string, Promise<any>>();

export const useBarbeariaAgendamentos = (empresaId?: string) => {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const key = empresaId ? `barbearia_agendamentos_${empresaId}` : 'barbearia_agendamentos';

  const loadAgendamentos = useCallback(async (bypassCache = false) => {
    if (!empresaId) {
      setAgendamentos([]);
      return;
    }
    const url = `${API_BASE_URL}/appointment-barbers?linkId=${empresaId}`;
    const subUrl = `${API_BASE_URL}/subscription-clients?linkId=${empresaId}`;

    if (bypassCache) {
      promiseCache.delete(url);
      promiseCache.delete(subUrl);
    }
    try {
      if (!promiseCache.has(url)) {
        promiseCache.set(url, fetch(url).then(async (r) => {
          if (!r.ok) {
            const fallbackRes = await fetch(`/api/v1/appointment-barbers?linkId=${empresaId}`).catch(() => null);
            if (fallbackRes && fallbackRes.ok) return fallbackRes.json();
            throw new Error('Erro ao buscar agendamentos');
          }
          return r.json();
        }).finally(() => {
          setTimeout(() => promiseCache.delete(url), 100);
        }));
      }

      if (!promiseCache.has(subUrl)) {
        promiseCache.set(subUrl, fetch(subUrl).then(async (r) => {
          if (!r.ok) {
            const fallbackRes = await fetch(`/api/v1/subscription-clients?linkId=${empresaId}`).catch(() => null);
            if (fallbackRes && fallbackRes.ok) return fallbackRes.json();
            return [];
          }
          return r.json();
        }).catch(() => []).finally(() => {
          setTimeout(() => promiseCache.delete(subUrl), 100);
        }));
      }

      const [data, subData] = await Promise.all([
        promiseCache.get(url).catch(() => []),
        promiseCache.get(subUrl).catch(() => []),
      ]);

      let mappedAppts: Agendamento[] = [];
      if (Array.isArray(data)) {
        mappedAppts = data.map((a: any) => ({ 
          ...a, 
          id: a.id || a._id,
          cliente: a.clienteNome || a.cliente,
          telefone: a.clienteTelefone || a.telefone,
        }));
      }

      let mappedSubscribers: Agendamento[] = [];
      if (Array.isArray(subData)) {
        mappedSubscribers = subData.map((sub: any) => {
          const subId = sub.id || sub._id;
          const isPago = (sub.status === 'ativo' || sub.status === 'pago') && sub.pagamento?.status === 'pago';
          const isCancelado = sub.status === 'cancelado' || sub.ativo === false;
          const isPendente = sub.status === 'pendente';

          let statusFinal: Agendamento['status'] = 'finalizado';
          if (isCancelado) {
            statusFinal = 'cancelado';
          } else if (isPago) {
            statusFinal = 'pago';
          } else if (isPendente) {
            statusFinal = 'pendente';
          } else if (sub.status === 'ativo') {
            statusFinal = 'pago';
          } else {
            statusFinal = 'finalizado';
          }

          const valorRecebido = sub.pagamento?.valorRecebido || 0;
          const valorOriginal = sub.pagamento?.valorOriginal || sub.valorOriginal || sub.valor || 0;
          const valorCobrado = sub.pagamento?.valorCobrado || 0;
          const valorFinal = valorRecebido > 0 ? valorRecebido : (valorOriginal > 0 ? valorOriginal : (valorCobrado > 0 ? valorCobrado : 0));

          return {
            id: `sub_${subId}`,
            isSubscription: true,
            subscriptionClientId: subId,
            dataCadastro: sub.createdAt || sub.dataInicio || new Date().toISOString(),
            dataAgendada: sub.createdAt || sub.dataInicio || new Date().toISOString(),
            telefone: sub.telefone || sub.clienteTelefone || '',
            cliente: sub.nome || sub.clienteNome || 'Cliente Assinante',
            email: sub.email || '',
            barbeiroId: sub.barbeiroId || '',
            servicoId: 'assinatura',
            servicoNome: `Assinatura: ${sub.planoNome || 'Plano Assinatura'}`,
            valorTotalPrevisto: valorFinal,
            valorAssinatura: valorFinal,
            valorOriginal: valorFinal,
            status: statusFinal,
            pagamento: sub.pagamento ? {
              ...sub.pagamento,
              valorRecebido: sub.pagamento.valorRecebido || valorFinal,
              valorOriginal: sub.pagamento.valorOriginal || valorFinal,
              valorCobrado: sub.pagamento.valorCobrado || (isPendente ? 0 : valorFinal)
            } : {
              status: isPendente ? 'pendente' : 'pago',
              valorOriginal: valorFinal,
              valorCobrado: isPendente ? 0 : valorFinal,
              valorRecebido: valorFinal
            },
            assinatura: {
              possui: true,
              planoNome: sub.planoNome || 'Assinatura',
            },
            rawSub: sub,
          } as any;
        });
      }

      setAgendamentos([...mappedAppts, ...mappedSubscribers]);
    } catch (e) {
      console.error('Erro ao carregar agendamentos:', e);
    }
  }, [empresaId]);

  useEffect(() => {
    loadAgendamentos();
    const handleSync = () => {
      promiseCache.clear();
      loadAgendamentos(true);
    };
    window.addEventListener('agendamentos_sync', handleSync);
    return () => window.removeEventListener('agendamentos_sync', handleSync);
  }, [loadAgendamentos]);

  const addAgendamento = async (agendamentoData: any) => {
    try {
      promiseCache.clear();
      let response = await fetch(`${API_BASE_URL}/appointment-barbers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agendamentoData),
      }).catch(() => null);

      if (!response || !response.ok) {
        response = await fetch(`/api/v1/appointment-barbers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(agendamentoData),
        }).catch(() => null);
      }

      if (response && response.ok) {
        const data = await response.json();
        loadAgendamentos(true);
        window.dispatchEvent(new Event('agendamentos_sync'));
        return data;
      } else {
        console.warn('API de agendamentos indisponível. Criando registro em estado local.');
        const fallbackAgendamento = {
          id: agendamentoData.id || `ag_${Date.now()}`,
          createdAt: new Date().toISOString(),
          status: agendamentoData.status || 'agendado',
          ...agendamentoData,
        };
        setAgendamentos((prev) => [fallbackAgendamento, ...prev]);
        window.dispatchEvent(new Event('agendamentos_sync'));
        return fallbackAgendamento;
      }
    } catch (e) {
      console.warn('Erro de conexão com API. Criando agendamento em estado local:', e);
      const fallbackAgendamento = {
        id: agendamentoData.id || `ag_${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: agendamentoData.status || 'agendado',
        ...agendamentoData,
      };
      setAgendamentos((prev) => [fallbackAgendamento, ...prev]);
      window.dispatchEvent(new Event('agendamentos_sync'));
      return fallbackAgendamento;
    }
  };

  const updateStatus = async (id: string, status: Agendamento['status'], barbeiroId?: string, extraData?: any) => {
    if (id && id.toString().startsWith('sub_')) {
      const realSubId = id.toString().replace('sub_', '');
      const isPago = status === 'pago';
      const isCancel = status === 'cancelado';

      const payload: any = {
        status: isPago ? 'ativo' : (isCancel ? 'cancelado' : status),
        ativo: !isCancel,
      };
      if (barbeiroId) payload.barbeiroId = barbeiroId;
      if (isPago) {
        payload.pagamento = {
          status: 'pago',
          dataPagamento: new Date().toISOString(),
          ...(extraData || {}),
        };
      }

      setAgendamentos((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                status: status,
                barbeiroId: barbeiroId || a.barbeiroId,
                pagamento: { ...(a.pagamento || {}), status: isPago ? 'pago' : 'pendente', ...(extraData || {}) },
              }
            : a
        )
      );

      let response = await fetch(`${API_BASE_URL}/subscription-clients/${realSubId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => null);

      if (!response || !response.ok) {
        response = await fetch(`/api/v1/subscription-clients/${realSubId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(() => null);
      }

      promiseCache.clear();
      loadAgendamentos(true);
      window.dispatchEvent(new Event('agendamentos_sync'));
      return;
    }

    setAgendamentos((prev) =>
      prev.map((a) =>
        (a.id === id || (a as any)._id === id)
          ? { ...a, status, ...(barbeiroId ? { barbeiroId } : {}), ...(extraData || {}) }
          : a
      )
    );
    try {
      promiseCache.clear();
      const body: any = { status, ...(extraData || {}) };
      if (barbeiroId) body.barbeiroId = barbeiroId;
      
      const isCancel = status === 'cancelado';
      const url = isCancel 
        ? `${API_BASE_URL}/appointment-barbers/${id}/cancel`
        : `${API_BASE_URL}/appointment-barbers/${id}/status`;

      let response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).catch(() => null);

      if (!response || !response.ok) {
        const fallbackUrl = isCancel 
          ? `/api/v1/appointment-barbers/${id}/cancel`
          : `/api/v1/appointment-barbers/${id}/status`;
        response = await fetch(fallbackUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }).catch(() => null);
      }

      loadAgendamentos(true);
      window.dispatchEvent(new Event('agendamentos_sync'));
    } catch (e) {
      console.error('Erro de conexão ao atualizar status:', e);
    }
  };

  const updateAgendamento = async (id: string, updates: Partial<Agendamento>) => {
    if (id && id.toString().startsWith('sub_')) {
      const realSubId = id.toString().replace('sub_', '');
      let response = await fetch(`${API_BASE_URL}/subscription-clients/${realSubId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }).catch(() => null);

      if (!response || !response.ok) {
        response = await fetch(`/api/v1/subscription-clients/${realSubId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        }).catch(() => null);
      }

      promiseCache.clear();
      loadAgendamentos(true);
      window.dispatchEvent(new Event('agendamentos_sync'));
      return;
    }

    setAgendamentos((prev) =>
      prev.map((a) =>
        (a.id === id || (a as any)._id === id)
          ? { ...a, ...updates }
          : a
      )
    );
    try {
      promiseCache.clear();
      let response = await fetch(`${API_BASE_URL}/appointment-barbers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }).catch(() => null);

      if (!response || !response.ok) {
        response = await fetch(`/api/v1/appointment-barbers/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        }).catch(() => null);
      }

      loadAgendamentos(true);
      window.dispatchEvent(new Event('agendamentos_sync'));
    } catch (e) {
      console.error('Erro de conexão ao atualizar:', e);
    }
  };

  return { agendamentos, addAgendamento, updateStatus, updateAgendamento, loadAgendamentos };
};
export const useBarbeariaRegistros = (empresaId?: string) => {
  const { agendamentos, loadAgendamentos } = useBarbeariaAgendamentos(empresaId);
  const { servicos, produtos } = useBarbeariaConfig(empresaId);
  const { barbeiros } = useBarbeiros(empresaId);

  const [registros, setRegistros] = useState<RegistroBarbearia[]>([]);

  const loadRegistros = useCallback(() => {
    loadAgendamentos();
  }, [loadAgendamentos]);

  useEffect(() => {
    if (agendamentos.length === 0 && servicos.length === 0) return;
    
    const pagos = agendamentos.filter(a => a.status === 'pago' || a.pagamento?.status === 'pago');
    const logs = pagos.map(a => {
      const itens: RegistroItem[] = [];
      let subtotalServicos = 0;
      let subtotalProdutos = 0;
      
      const isAssinatura = Boolean(a.assinatura?.possui || a.assinaturaAplicada || (a as any).isSubscription);

      if (a.servicosIds && a.servicosIds.length > 0) {
        a.servicosIds.forEach(id => {
          const s = servicos.find(x => x.id === id);
          if (s) {
            itens.push({ idItem: s.id, nome: s.nome, tipo: 'servico', valor: s.valor });
            subtotalServicos += s.valor;
          }
        });
      } else if (a.servicoId && a.servicoId !== 'assinatura') {
        const s = servicos.find(x => x.id === a.servicoId);
        if (s) {
          itens.push({ idItem: s.id, nome: s.nome, tipo: 'servico', valor: s.valor });
          subtotalServicos += s.valor;
        }
      }

      if (a.produtosIds) {
        a.produtosIds.forEach(id => {
          const p = produtos.find(x => x.id === id);
          if (p) {
            itens.push({ idItem: p.id, nome: p.nome, tipo: 'produto', valor: p.precoVenda });
            subtotalProdutos += p.precoVenda;
          }
        });
      }

      const resumo = calcularResumoPagamento(
        a.dataAgendada,
        subtotalServicos,
        subtotalProdutos,
        a.pagamento ? { ...a.pagamento, desconto: a.pagamento.desconto ?? (a as any).desconto } : ({ desconto: (a as any).desconto } as any),
        a.assinatura,
        a.assinaturaAplicada
      );

      let total = 0;
      if (a.pagamento?.valorRecebido !== undefined && a.pagamento.valorRecebido >= 0) {
        total = a.pagamento.valorRecebido;
      } else if (a.pagamento?.valorCobrado !== undefined && a.pagamento.valorCobrado >= 0) {
        total = a.pagamento.valorCobrado;
      } else if (isAssinatura) {
        total = Math.max(0, subtotalProdutos);
      } else if (resumo.valorCobrado !== undefined && resumo.valorCobrado >= 0) {
        total = resumo.valorCobrado;
      } else {
        total = Math.max(0, (a.pagamento?.valorOriginal || 0) - (a.pagamento?.desconto || 0));
      }

      if (itens.length === 0) {
        itens.push({
          idItem: 'assinatura',
          nome: (a as any).servicoNome || a.assinatura?.planoNome || 'Plano Assinatura',
          tipo: 'servico',
          valor: total,
        });
        subtotalServicos = total;
      }

      const barbeiro = barbeiros.find(b => b.id === a.barbeiroId);

      return {
        id: a.id,
        data: a.dataAgendada,
        horarios: a.horarios,
        cliente: a.cliente,
        telefone: a.telefone,
        email: a.email,
        barbeiroId: a.barbeiroId,
        barbeiroNome: barbeiro ? barbeiro.nome : 'Qualquer um',
        itens,
        total,
        desconto: resumo.desconto,
        valorOriginal: resumo.valorOriginal,
        temAssinatura: resumo.temAssinatura || Boolean(a.assinatura?.possui) || Boolean(a.assinaturaAplicada) || Boolean((a as any).isSubscription),
        isSubscription: Boolean((a as any).isSubscription || resumo.temAssinatura || a.assinatura?.possui),
        assinatura: a.assinatura,
        pagamento: a.pagamento,
        tipoPagamento: a.tipoPagamento
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
    await fetch(`${API_BASE_URL}/appointment-barbers/${id}`, { method: 'DELETE' });
    loadAgendamentos();
  };

  return { registros, addRegistro, removeRegistro, loadRegistros };
};

