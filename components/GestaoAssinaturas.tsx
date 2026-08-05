import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE_URL } from '../constants';
import { useBarbeariaConfig, Servico } from '../hooks/useBarbeariaConfig';
import { PlusIcon, PencilIcon, TrashIcon, XCircleIcon, CheckCircleIcon } from './icons';
import ConfirmationModal from './ConfirmationModal';

export interface SubscriptionPlan {
  id?: string;
  _id?: string;
  nome: string;
  descricao?: string;
  valorMensal: number;
  servicosIds: string[];
  limiteMensal: number | null;
  linkId: string;
  ativo?: boolean;
  createdAt?: string;
}

export interface SubscriptionClient {
  id?: string;
  _id?: string;
  codigo?: string;
  codigoAtendimento?: string;
  nome: string;
  telefone: string;
  email: string;
  planoId: string;
  planoNome?: string;
  observacao?: string;
  linkId: string;
  ativo?: boolean;
  dataInicio?: string;
  dataFim?: string;
  createdAt?: string;
}

interface GestaoAssinaturasProps {
  linkId: string;
  initialCliente?: { nome?: string; telefone?: string; email?: string };
  onCancel?: () => void;
  onSuccess?: () => void;
}

export const GestaoAssinaturas: React.FC<GestaoAssinaturasProps> = ({
  linkId,
  initialCliente,
  onCancel,
  onSuccess,
}) => {
  const { servicos } = useBarbeariaConfig(linkId);

  const [mainTab, setMainTab] = useState<'assinantes' | 'planos'>('assinantes');

  // Subscription Clients State
  const [subscribers, setSubscribers] = useState<SubscriptionClient[]>([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(true);

  // Subscription Plans State
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  // Search & Filters for Subscribers
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativos' | 'cancelados'>('todos');

  // Subscriber Form State
  const [editingSubscriberId, setEditingSubscriberId] = useState<string | null>(null);
  const [subNome, setSubNome] = useState(initialCliente?.nome || '');
  const [subTelefone, setSubTelefone] = useState(initialCliente?.telefone || '');
  const [subEmail, setSubEmail] = useState(initialCliente?.email || '');
  const [subPlanoId, setSubPlanoId] = useState('');
  const [subObservacao, setSubObservacao] = useState('');
  const [subFormOpen, setSubFormOpen] = useState(Boolean(initialCliente?.nome || initialCliente?.email));

  // Plan Form State
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planNome, setPlanNome] = useState('');
  const [planDescricao, setPlanDescricao] = useState('');
  const [planValorMensal, setPlanValorMensal] = useState('');
  const [planServicosIds, setPlanServicosIds] = useState<string[]>([]);
  const [planIlimitado, setPlanIlimitado] = useState(true);
  const [planLimiteMensal, setPlanLimiteMensal] = useState('4');
  const [planFormOpen, setPlanFormOpen] = useState(false);

  // Feedback Messages
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Confirmation Modal State
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: async () => {},
  });

  // Fetch Plans
  const fetchPlans = async () => {
    setLoadingPlans(true);
    const resolvedLinkId = linkId || 'barbearia-default';
    try {
      let res = await fetch(`${API_BASE_URL}/subscription-plans?linkId=${resolvedLinkId}`).catch(() => null);
      if (!res || !res.ok || !(res.headers.get('content-type') || '').includes('application/json')) {
        res = await fetch(`/api/v1/subscription-plans?linkId=${resolvedLinkId}`);
      }
      if (res && res.ok && (res.headers.get('content-type') || '').includes('application/json')) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.plans || data.data || [];
        setPlans(list);
      }
    } catch (err) {
      console.error("Erro ao carregar planos de assinatura:", err);
    } finally {
      setLoadingPlans(false);
    }
  };

  // Fetch Subscribers
  const fetchSubscribers = async () => {
    setLoadingSubscribers(true);
    const resolvedLinkId = linkId || 'barbearia-default';
    try {
      let res = await fetch(`${API_BASE_URL}/subscription-clients?linkId=${resolvedLinkId}`).catch(() => null);
      if (!res || !res.ok || !(res.headers.get('content-type') || '').includes('application/json')) {
        res = await fetch(`/api/v1/subscription-clients?linkId=${resolvedLinkId}`);
      }
      if (res && res.ok && (res.headers.get('content-type') || '').includes('application/json')) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.clients || data.subscribers || data.data || [];
        setSubscribers(list);
      }
    } catch (err) {
      console.error("Erro ao carregar clientes assinantes:", err);
    } finally {
      setLoadingSubscribers(false);
    }
  };

  useEffect(() => {
    fetchPlans();
    fetchSubscribers();
  }, [linkId]);

  useEffect(() => {
    if (initialCliente?.nome) setSubNome(initialCliente.nome);
    if (initialCliente?.telefone) setSubTelefone(initialCliente.telefone);
    if (initialCliente?.email) setSubEmail(initialCliente.email);
  }, [initialCliente]);

  // Helper clear alerts
  const clearAlerts = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // --- PLAN FORM HANDLERS ---
  const handleOpenNewPlan = () => {
    clearAlerts();
    setEditingPlanId(null);
    setPlanNome('');
    setPlanDescricao('');
    setPlanValorMensal('');
    setPlanServicosIds([]);
    setPlanIlimitado(true);
    setPlanLimiteMensal('4');
    setPlanFormOpen(true);
  };

  const handleOpenEditPlan = (plan: SubscriptionPlan) => {
    clearAlerts();
    setEditingPlanId(plan.id || plan._id || null);
    setPlanNome(plan.nome);
    setPlanDescricao(plan.descricao || '');
    setPlanValorMensal(plan.valorMensal?.toString() || (plan as any).valor?.toString() || '');
    setPlanServicosIds(plan.servicosIds || []);
    setPlanIlimitado(plan.limiteMensal === null || plan.limiteMensal === undefined);
    setPlanLimiteMensal(plan.limiteMensal ? String(plan.limiteMensal) : '4');
    setPlanFormOpen(true);
  };

  const togglePlanServico = (servicoId: string) => {
    setPlanServicosIds((prev) =>
      prev.includes(servicoId) ? prev.filter((id) => id !== servicoId) : [...prev, servicoId]
    );
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();

    const cleanNome = planNome.trim();
    const cleanValor = parseFloat(planValorMensal);
    const resolvedLinkId = linkId || 'barbearia-default';

    if (!cleanNome) {
      setErrorMsg('Informe o nome do plano.');
      return;
    }
    if (isNaN(cleanValor) || cleanValor <= 0) {
      setErrorMsg('Informe um valor mensal válido.');
      return;
    }

    const payload = {
      nome: cleanNome,
      descricao: planDescricao.trim(),
      valorMensal: cleanValor,
      servicosIds: planServicosIds,
      limiteMensal: planIlimitado ? null : parseInt(planLimiteMensal) || null,
      linkId: resolvedLinkId,
    };

    setSubmitting(true);
    try {
      const isEdit = Boolean(editingPlanId);
      const urlPrimary = isEdit
        ? `${API_BASE_URL}/subscription-plans/${editingPlanId}`
        : `${API_BASE_URL}/subscription-plans`;
      const urlFallback = isEdit
        ? `/api/v1/subscription-plans/${editingPlanId}`
        : `/api/v1/subscription-plans`;
      const method = isEdit ? 'PUT' : 'POST';

      let res = await fetch(urlPrimary, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => null);

      if (!res || (!res.ok && res.status !== 409)) {
        res = await fetch(urlFallback, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res && res.status === 409) {
        setErrorMsg('Este plano de assinatura já existe.');
        return;
      }

      if (res && (res.ok || res.status === 201 || res.status === 200)) {
        setSuccessMsg(isEdit ? 'Plano atualizado com sucesso!' : 'Plano criado com sucesso!');
        setPlanFormOpen(false);
        fetchPlans();
      } else {
        const data = res ? await res.json().catch(() => ({})) : {};
        setErrorMsg(data.message || 'Erro ao salvar plano de assinatura.');
      }
    } catch (err) {
      console.error("Erro ao salvar plano:", err);
      setErrorMsg('Erro ao se conectar ao servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  const executeDeletePlan = async (planId: string) => {
    clearAlerts();
    try {
      let res = await fetch(`${API_BASE_URL}/subscription-plans/${planId}`, { method: 'DELETE' }).catch(() => null);
      if (!res || !res.ok || (res.headers.get('content-type') || '').includes('text/html')) {
        let resFallback = await fetch(`/api/v1/subscription-plans/${planId}`, { method: 'DELETE' }).catch(() => null);
        if (resFallback && (resFallback.ok || resFallback.status === 204) && !(resFallback.headers.get('content-type') || '').includes('text/html')) {
          res = resFallback;
        }
      }
      if (res && (res.ok || res.status === 200 || res.status === 204) && !(res.headers.get('content-type') || '').includes('text/html')) {
        setSuccessMsg('Plano removido com sucesso!');
        setPlans((prev) => prev.filter((p) => (p.id || p._id || (p as any).planId) !== planId));
        fetchPlans();
      } else {
        const data = res ? await res.json().catch(() => ({})) : {};
        setErrorMsg(data.message || 'Não foi possível remover o plano.');
      }
    } catch (err) {
      setErrorMsg('Erro ao conectar ao servidor para remover o plano.');
    }
  };

  const handleDeletePlan = (planId: string, planName: string) => {
    if (!planId) {
      setErrorMsg('ID do plano não encontrado.');
      return;
    }
    setConfirmModalState({
      isOpen: true,
      title: 'Remover Plano',
      message: `Tem certeza que deseja remover o plano "${planName}"?`,
      onConfirm: async () => {
        await executeDeletePlan(planId);
        setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // --- SUBSCRIBER FORM HANDLERS ---
  const handleOpenNewSubscriber = () => {
    clearAlerts();
    setEditingSubscriberId(null);
    setSubNome('');
    setSubTelefone('');
    setSubEmail('');
    setSubPlanoId(plans.length > 0 ? (plans[0].id || plans[0]._id || '') : '');
    setSubObservacao('');
    setSubFormOpen(true);
  };

  const handleOpenEditSubscriber = (sub: SubscriptionClient) => {
    clearAlerts();
    setEditingSubscriberId(sub.id || sub._id || null);
    setSubNome(sub.nome);
    setSubTelefone(sub.telefone);
    setSubEmail(sub.email || '');
    setSubPlanoId(sub.planoId);
    setSubObservacao(sub.observacao || '');
    setSubFormOpen(true);
  };

  const handleSaveSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();

    const cleanNome = subNome.trim();
    const cleanTelefone = subTelefone.trim();
    const cleanEmail = subEmail.trim().toLowerCase();
    const resolvedLinkId = linkId || 'barbearia-default';

    if (!cleanNome) {
      setErrorMsg('Informe o nome do assinante.');
      return;
    }
    if (!cleanTelefone) {
      setErrorMsg('Informe o telefone do assinante.');
      return;
    }
    if (!subPlanoId) {
      setErrorMsg('Selecione um plano de assinatura.');
      return;
    }

    const isEdit = Boolean(editingSubscriberId);

    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const matchedPlan = plans.find((p) => (p.id || p._id) === subPlanoId);
    const planValor = matchedPlan?.valor || 0;

    const payload: any = {
      nome: cleanNome,
      telefone: cleanTelefone,
      email: cleanEmail,
      planoId: subPlanoId,
      observacao: subObservacao.trim(),
      linkId: resolvedLinkId,
    };

    if (!isEdit) {
      payload.status = 'pendente';
      payload.dataFim = nextMonth.toISOString();
      payload.pagamento = {
        status: 'pago',
        formas: [],
        desconto: 0,
        subtotalServicos: 0,
        subtotalProdutos: 0,
        valorOriginal: planValor,
        valorCobrado: planValor,
        dataPagamento: now.toISOString(),
      };
    }

    setSubmitting(true);
    try {
      const urlPrimary = isEdit
        ? `${API_BASE_URL}/subscription-clients/${editingSubscriberId}`
        : `${API_BASE_URL}/subscription-clients`;
      const urlFallback = isEdit
        ? `/api/v1/subscription-clients/${editingSubscriberId}`
        : `/api/v1/subscription-clients`;
      const method = isEdit ? 'PUT' : 'POST';

      let res = await fetch(urlPrimary, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => null);

      if (!res || (!res.ok && res.status !== 409)) {
        res = await fetch(urlFallback, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res && res.status === 409) {
        setErrorMsg('Este cliente já possui uma assinatura ativa.');
        return;
      }

      if (res && (res.ok || res.status === 201 || res.status === 200)) {
        setSuccessMsg(isEdit ? 'Assinatura atualizada com sucesso!' : 'Assinatura cadastrada com sucesso!');
        setSubFormOpen(false);
        fetchSubscribers();
        if (onSuccess) onSuccess();
      } else {
        const data = res ? await res.json().catch(() => ({})) : {};
        setErrorMsg(data.message || 'Erro ao salvar assinatura do cliente.');
      }
    } catch (err) {
      console.error("Erro ao salvar assinante:", err);
      setErrorMsg('Erro de conexão ao salvar assinatura.');
    } finally {
      setSubmitting(false);
    }
  };

  const executeCancelSubscriber = async (subId: string) => {
    clearAlerts();
    try {
      let res = await fetch(`${API_BASE_URL}/subscription-clients/${subId}/cancel`, { method: 'PATCH' }).catch(() => null);
      if (!res || !res.ok || (res.headers.get('content-type') || '').includes('text/html')) {
        let resFallback = await fetch(`/api/v1/subscription-clients/${subId}/cancel`, { method: 'PATCH' }).catch(() => null);
        if (resFallback && (resFallback.ok || resFallback.status === 204) && !(resFallback.headers.get('content-type') || '').includes('text/html')) {
          res = resFallback;
        }
      }
      if (res && (res.ok || res.status === 200 || res.status === 204) && !(res.headers.get('content-type') || '').includes('text/html')) {
        setSuccessMsg('Assinatura cancelada com sucesso!');
        setSubscribers((prev) =>
          prev.map((s) => {
            const sId = s.id || s._id || (s as any).clientId || (s as any).subscriptionClientId;
            if (sId === subId) {
              return { ...s, ativo: false };
            }
            return s;
          })
        );
        fetchSubscribers();
      } else {
        const data = res ? await res.json().catch(() => ({})) : {};
        setErrorMsg(data.message || 'Erro ao cancelar assinatura.');
      }
    } catch (err) {
      setErrorMsg('Erro ao se conectar ao servidor para cancelar assinatura.');
    }
  };

  const handleCancelSubscriber = (subId: string, subName: string) => {
    if (!subId) {
      setErrorMsg('ID do assinante não encontrado.');
      return;
    }
    setConfirmModalState({
      isOpen: true,
      title: 'Cancelar Assinatura',
      message: `Tem certeza que deseja cancelar a assinatura de "${subName}"?`,
      onConfirm: async () => {
        await executeCancelSubscriber(subId);
        setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const executeDeleteSubscriber = async (subId: string) => {
    clearAlerts();
    try {
      let res = await fetch(`${API_BASE_URL}/subscription-clients/${subId}`, { method: 'DELETE' }).catch(() => null);
      if (!res || !res.ok || (res.headers.get('content-type') || '').includes('text/html')) {
        let resFallback = await fetch(`/api/v1/subscription-clients/${subId}`, { method: 'DELETE' }).catch(() => null);
        if (resFallback && (resFallback.ok || resFallback.status === 204) && !(resFallback.headers.get('content-type') || '').includes('text/html')) {
          res = resFallback;
        }
      }
      if (res && (res.ok || res.status === 200 || res.status === 204) && !(res.headers.get('content-type') || '').includes('text/html')) {
        setSuccessMsg('Assinante removido com sucesso!');
        setSubscribers((prev) =>
          prev.filter(
            (s) => (s.id || s._id || (s as any).clientId || (s as any).subscriptionClientId) !== subId
          )
        );
        fetchSubscribers();
      } else {
        const data = res ? await res.json().catch(() => ({})) : {};
        setErrorMsg(data.message || 'Erro ao remover assinante.');
      }
    } catch (err) {
      setErrorMsg('Erro de conexão ao remover assinante.');
    }
  };

  const handleDeleteSubscriber = (subId: string, subName: string) => {
    if (!subId) {
      setErrorMsg('ID do assinante não encontrado.');
      return;
    }
    setConfirmModalState({
      isOpen: true,
      title: 'Remover Assinante',
      message: `Tem certeza que deseja remover o assinante "${subName}" permanentemente?`,
      onConfirm: async () => {
        await executeDeleteSubscriber(subId);
        setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Filtered Subscribers
  const filteredSubscribers = useMemo(() => {
    return subscribers.filter((sub) => {
      // Status filter
      const isAtivo = sub.ativo !== false;
      if (statusFilter === 'ativos' && !isAtivo) return false;
      if (statusFilter === 'cancelados' && isAtivo) return false;

      // Search term
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const n = (sub.nome || '').toLowerCase();
      const t = (sub.telefone || '').toLowerCase();
      const e = (sub.email || '').toLowerCase();
      const cod = (sub.codigoAtendimento || sub.codigo || sub.id || '').toLowerCase();
      return n.includes(term) || t.includes(term) || e.includes(term) || cod.includes(term);
    });
  }, [subscribers, statusFilter, searchTerm]);

  const formatDateBR = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('pt-BR');
    } catch (_) {
      return dateStr;
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-6 space-y-6 text-white shadow-xl">
      {/* Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <span>⭐</span> Gestão de Assinaturas & Planos
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Cadastre planos recorrentes e gerencie clientes assinantes da barbearia.
          </p>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold self-start sm:self-auto"
          >
            Fechar
          </button>
        )}
      </div>

      {/* Main Tab Navigation */}
      <div className="flex gap-2 bg-gray-800/80 p-1.5 rounded-xl border border-gray-700/60 w-fit">
        <button
          onClick={() => { setMainTab('assinantes'); clearAlerts(); }}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            mainTab === 'assinantes'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
          }`}
        >
          Clientes Assinantes ({subscribers.length})
        </button>
        <button
          onClick={() => { setMainTab('planos'); clearAlerts(); }}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            mainTab === 'planos'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
          }`}
        >
          Planos de Assinatura ({plans.length})
        </button>
      </div>

      {/* Alert Messages */}
      {errorMsg && (
        <div className="p-3 bg-red-500/15 border border-red-500/40 rounded-xl text-red-300 text-sm font-medium flex items-center justify-between gap-2">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-200">
            <XCircleIcon className="w-5 h-5" />
          </button>
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-300 text-sm font-medium flex items-center justify-between gap-2">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-200">
            <CheckCircleIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* --- TAB 1: CLIENTES ASSINANTES --- */}
      {mainTab === 'assinantes' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-2 flex-1">
              <input
                type="text"
                placeholder="Buscar por nome, telefone, e-mail ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2 text-sm focus:border-purple-500 focus:outline-none flex-1"
              />
              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
              >
                <option value="todos">Todos os Status</option>
                <option value="ativos">Apenas Ativos</option>
                <option value="cancelados">Cancelados / Inativos</option>
              </select>
            </div>

            <button
              onClick={handleOpenNewSubscriber}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition shadow-md"
            >
              <PlusIcon className="w-4 h-4" /> Novo Assinante
            </button>
          </div>

          {/* Form Modal / Collapsible for Subscribers */}
          {subFormOpen && (
            <form onSubmit={handleSaveSubscriber} className="bg-gray-800/90 border border-purple-500/40 rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg animate-fadeIn">
              <div className="flex justify-between items-center border-b border-gray-700 pb-3">
                <h3 className="font-bold text-lg text-purple-300">
                  {editingSubscriberId ? 'Editar Assinante' : 'Cadastrar Novo Assinante'}
                </h3>
                <button
                  type="button"
                  onClick={() => setSubFormOpen(false)}
                  className="text-gray-400 hover:text-white text-sm"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Nome do Cliente *</label>
                  <input
                    type="text"
                    required
                    value={subNome}
                    onChange={(e) => setSubNome(e.target.value)}
                    placeholder="Nome completo"
                    className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Telefone / Celular *</label>
                  <input
                    type="tel"
                    required
                    value={subTelefone}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, "");
                      if (val.length > 11) val = val.substring(0, 11);
                      if (val.length > 2) val = `(${val.substring(0, 2)}) ${val.substring(2)}`;
                      if (val.length > 9) val = `${val.substring(0, 10)}-${val.substring(10)}`;
                      setSubTelefone(val);
                    }}
                    placeholder="(11) 99999-9999"
                    className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">E-mail (Opcional)</label>
                  <input
                    type="email"
                    value={subEmail}
                    onChange={(e) => setSubEmail(e.target.value)}
                    placeholder="cliente@email.com"
                    className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Plano de Assinatura *</label>
                  <select
                    required
                    value={subPlanoId}
                    onChange={(e) => setSubPlanoId(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-purple-500 focus:outline-none"
                  >
                    <option value="">Selecione um plano...</option>
                    {plans.map((p) => (
                      <option key={p.id || p._id} value={p.id || p._id}>
                        {p.nome} - R$ {(p.valorMensal || (p as any).valor || 0).toFixed(2)} /mês
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Observações (Opcional)</label>
                <textarea
                  rows={2}
                  value={subObservacao}
                  onChange={(e) => setSubObservacao(e.target.value)}
                  placeholder="Ex: Cliente prefere atendimento aos sábados..."
                  className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl px-3.5 py-2 text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSubFormOpen(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-xl shadow-md transition"
                >
                  {submitting ? 'Salvando...' : editingSubscriberId ? 'Atualizar Assinante' : 'Cadastrar Assinante'}
                </button>
              </div>
            </form>
          )}

          {/* List of Subscribers */}
          {loadingSubscribers ? (
            <div className="py-8 text-center text-gray-400 text-sm animate-pulse">
              Carregando lista de assinantes...
            </div>
          ) : filteredSubscribers.length === 0 ? (
            <div className="bg-gray-800/40 p-8 rounded-2xl border border-gray-800 text-center text-gray-400 space-y-2">
              <p className="font-semibold text-base">Nenhum assinante encontrado.</p>
              <p className="text-xs text-gray-500">
                {searchTerm || statusFilter !== 'todos'
                  ? 'Tente ajustar os filtros ou o termo de busca.'
                  : 'Cadastre os clientes assinantes da sua barbearia para que sejam identificados no agendamento.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredSubscribers.map((sub) => {
                const subId = sub.id || sub._id || (sub as any).subscriptionClientId || (sub as any).clientId || '';
                const isAtivo = sub.ativo !== false;
                const matchedPlan = plans.find((p) => (p.id || p._id) === sub.planoId);
                const planName = sub.planoNome || matchedPlan?.nome || 'Plano Personalizado';
                const codigo = sub.codigoAtendimento || sub.codigo || (subId ? subId.slice(-6).toUpperCase() : 'N/A');

                return (
                  <div
                    key={subId || sub.telefone}
                    className={`bg-gray-800/60 p-4 sm:p-5 rounded-2xl border ${
                      isAtivo ? 'border-purple-500/30 hover:border-purple-500/60' : 'border-gray-700/60 opacity-75'
                    } flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all shadow-sm`}
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-lg text-white">{sub.nome}</span>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                            isAtivo
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-red-500/20 text-red-300 border-red-500/40'
                          }`}
                        >
                          {isAtivo ? 'ATIVO' : 'CANCELADO / INATIVO'}
                        </span>
                        <span className="text-xs font-mono bg-purple-950/80 text-purple-300 border border-purple-700/40 px-2 py-0.5 rounded-lg">
                          Cód: {codigo}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-300">
                        <div>📞 <span className="font-medium">{sub.telefone || 'Sem telefone'}</span></div>
                        {sub.email && <div>✉️ <span className="text-gray-400">{sub.email}</span></div>}
                        <div>⭐ Plano: <strong className="text-purple-300">{planName}</strong></div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 pt-1">
                        <div>Início: <span className="text-gray-300">{formatDateBR(sub.dataInicio || sub.createdAt)}</span></div>
                        {sub.dataFim && <div>Término: <span className="text-red-400">{formatDateBR(sub.dataFim)}</span></div>}
                        {sub.observacao && (
                          <div className="italic text-gray-400 bg-gray-900/60 px-2.5 py-1 rounded-lg border border-gray-700/50">
                            Obs: "{sub.observacao}"
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 md:border-l border-gray-700/60 pt-3 md:pt-0 md:pl-4 justify-end">
                      <button
                        onClick={() => handleOpenEditSubscriber(sub)}
                        title="Editar Assinante"
                        className="p-2 bg-gray-700 hover:bg-gray-600 text-blue-300 rounded-xl transition text-xs font-semibold flex items-center gap-1"
                      >
                        <PencilIcon className="w-4 h-4" /> Editar
                      </button>

                      {isAtivo && (
                        <button
                          onClick={() => handleCancelSubscriber(subId, sub.nome)}
                          title="Cancelar Assinatura"
                          className="p-2 bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl transition text-xs font-semibold"
                        >
                          Cancelar Assinatura
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteSubscriber(subId, sub.nome)}
                        title="Remover Registros"
                        className="p-2 bg-red-500/15 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xl transition"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: PLANOS DE ASSINATURA --- */}
      {mainTab === 'planos' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-white">Planos Cadastrados</h3>
            <button
              onClick={handleOpenNewPlan}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-md"
            >
              <PlusIcon className="w-4 h-4" /> Criar Novo Plano
            </button>
          </div>

          {/* Form Modal / Collapsible for Plans */}
          {planFormOpen && (
            <form onSubmit={handleSavePlan} className="bg-gray-800/90 border border-purple-500/40 rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg animate-fadeIn">
              <div className="flex justify-between items-center border-b border-gray-700 pb-3">
                <h3 className="font-bold text-lg text-purple-300">
                  {editingPlanId ? 'Editar Plano de Assinatura' : 'Criar Plano de Assinatura'}
                </h3>
                <button
                  type="button"
                  onClick={() => setPlanFormOpen(false)}
                  className="text-gray-400 hover:text-white text-sm"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Nome do Plano *</label>
                  <input
                    type="text"
                    required
                    value={planNome}
                    onChange={(e) => setPlanNome(e.target.value)}
                    placeholder="Ex: Plano VIP Cabelo & Barba"
                    className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Valor Mensal (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={planValorMensal}
                    onChange={(e) => setPlanValorMensal(e.target.value)}
                    placeholder="89.90"
                    className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Descrição do Plano</label>
                <input
                  type="text"
                  value={planDescricao}
                  onChange={(e) => setPlanDescricao(e.target.value)}
                  placeholder="Ex: Inclui cortes ilimitados durante o mês."
                  className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>

              {/* Serviços Inclusos */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2">
                  Serviços Cobertos pelo Plano
                </label>
                {servicos.length === 0 ? (
                  <p className="text-xs text-amber-400 bg-amber-500/10 p-3 rounded-xl border border-amber-500/30">
                    Nenhum serviço cadastrado na barbearia. Cadastre serviços na aba Serviços para vincular ao plano.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-3 bg-gray-900 rounded-xl border border-gray-700">
                    {servicos.map((s) => {
                      const isSelected = planServicosIds.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => togglePlanServico(s.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                            isSelected
                              ? 'bg-purple-600 text-white border-purple-400'
                              : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '} {s.nome} (R$ {s.valor.toFixed(2)})
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Limite Mensal */}
              <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-700/60 space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="chkIlimitado"
                    checked={planIlimitado}
                    onChange={(e) => setPlanIlimitado(e.target.checked)}
                    className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-600 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="chkIlimitado" className="text-sm font-semibold text-gray-200 cursor-pointer">
                    Atendimentos Ilimitados no Mês
                  </label>
                </div>

                {!planIlimitado && (
                  <div className="max-w-xs pt-1">
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Limite Máximo Mensal de Atendimentos</label>
                    <input
                      type="number"
                      min="1"
                      value={planLimiteMensal}
                      onChange={(e) => setPlanLimiteMensal(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPlanFormOpen(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-xl shadow-md transition"
                >
                  {submitting ? 'Salvando...' : editingPlanId ? 'Atualizar Plano' : 'Criar Plano'}
                </button>
              </div>
            </form>
          )}

          {/* List of Plans */}
          {loadingPlans ? (
            <div className="py-8 text-center text-gray-400 text-sm animate-pulse">
              Carregando planos de assinatura...
            </div>
          ) : plans.length === 0 ? (
            <div className="bg-gray-800/40 p-8 rounded-2xl border border-gray-800 text-center text-gray-400 space-y-2">
              <p className="font-semibold text-base">Nenhum plano cadastrado.</p>
              <p className="text-xs text-gray-500">
                Clique no botão "Criar Novo Plano" para cadastrar modalidades de assinatura para seus clientes.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plans.map((plan) => {
                const planId = plan.id || plan._id || '';
                const valor = plan.valorMensal || (plan as any).valor || 0;
                const servicosNomes = (plan.servicosIds || [])
                  .map((sId) => servicos.find((s) => s.id === sId)?.nome)
                  .filter(Boolean);

                return (
                  <div
                    key={planId || plan.nome}
                    className="bg-gray-800/60 p-5 rounded-2xl border border-purple-500/30 flex flex-col justify-between gap-4 hover:border-purple-500/60 transition shadow-sm"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2 border-b border-gray-700/60 pb-3">
                        <div>
                          <h4 className="font-bold text-lg text-white">{plan.nome}</h4>
                          <p className="text-xs text-gray-400 mt-0.5">{plan.descricao || 'Sem descrição'}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xl font-black text-emerald-400">R$ {valor.toFixed(2)}</div>
                          <div className="text-[10px] text-gray-400 uppercase font-bold">por mês</div>
                        </div>
                      </div>

                      <div className="text-xs space-y-1.5 text-gray-300">
                        <div>
                          Limitação:{' '}
                          <strong className="text-purple-300">
                            {plan.limiteMensal ? `${plan.limiteMensal} atendimentos/mês` : 'Atendimentos Ilimitados'}
                          </strong>
                        </div>

                        <div>
                          Serviços inclusos ({servicosNomes.length}):{' '}
                          {servicosNomes.length > 0 ? (
                            <span className="text-gray-200 font-medium">{servicosNomes.join(', ')}</span>
                          ) : (
                            <span className="text-gray-500 italic">Todos ou conforme cadastro</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end items-center gap-2 pt-3 border-t border-gray-700/60">
                      <button
                        onClick={() => handleOpenEditPlan(plan)}
                        className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-blue-300 rounded-xl text-xs font-semibold flex items-center gap-1"
                      >
                        <PencilIcon className="w-4 h-4" /> Editar
                      </button>
                      <button
                        onClick={() => handleDeletePlan(planId, plan.nome)}
                        className="px-3 py-1.5 bg-red-500/15 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xl text-xs font-semibold flex items-center gap-1"
                      >
                        <TrashIcon className="w-4 h-4" /> Remover
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmModalState.isOpen}
        title={confirmModalState.title}
        message={confirmModalState.message}
        onClose={() => setConfirmModalState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModalState.onConfirm}
      />
    </div>
  );
};
