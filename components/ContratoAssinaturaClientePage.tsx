import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../constants';
import { CheckCircleIcon, DocumentTextIcon, ClockIcon, ShieldCheckIcon, UsersIcon } from './icons';

interface ContratoAssinaturaClientePageProps {
  planId?: string;
  linkId?: string;
  initialPlan?: any;
  initialClient?: { nome?: string; email?: string; telefone?: string };
  onClose?: () => void;
  onSuccess?: () => void;
}

export const ContratoAssinaturaClientePage: React.FC<ContratoAssinaturaClientePageProps> = ({
  planId,
  linkId,
  initialPlan,
  initialClient,
  onClose,
  onSuccess
}) => {
  const urlParams = new URLSearchParams(window.location.search);
  const resolvedPlanId = planId || urlParams.get('planId') || urlParams.get('planoId') || '';
  const resolvedLinkId = linkId || urlParams.get('linkId') || urlParams.get('empresaId') || 'barbearia-default';

  const [plan, setPlan] = useState<any>(initialPlan || null);
  const [loading, setLoading] = useState(!initialPlan);
  const [error, setError] = useState<string | null>(null);

  // Client form data
  const [nome, setNome] = useState(initialClient?.nome || '');
  const [email, setEmail] = useState(initialClient?.email || '');
  const [telefone, setTelefone] = useState(initialClient?.telefone || '');

  useEffect(() => {
    if (initialClient) {
      if (initialClient.nome) setNome(initialClient.nome);
      if (initialClient.email) setEmail(initialClient.email);
      if (initialClient.telefone) setTelefone(initialClient.telefone);
    } else {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const urlNome = searchParams.get('nome') || searchParams.get('clienteNome');
        const urlEmail = searchParams.get('email') || searchParams.get('clienteEmail');
        const urlTel = searchParams.get('telefone') || searchParams.get('clienteTelefone');
        if (urlNome) setNome(urlNome);
        if (urlEmail) setEmail(urlEmail);
        if (urlTel) setTelefone(urlTel);
      } catch (e) {}
    }
  }, [initialClient]);
  const [observacao, setObservacao] = useState('');
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [contratadoComSucesso, setContratadoComSucesso] = useState(false);

  useEffect(() => {
    if (initialPlan) {
      setPlan(initialPlan);
      setLoading(false);
      return;
    }

    const fetchPlan = async () => {
      try {
        setLoading(true);
        let urlPrimary = `${API_BASE_URL}/subscription-plans?linkId=${resolvedLinkId}`;
        let res = await fetch(urlPrimary).catch(() => null);
        if (!res || !res.ok) {
          res = await fetch(`/api/v1/subscription-plans?linkId=${resolvedLinkId}`).catch(() => null);
        }

        if (res && res.ok) {
          const data = await res.json();
          const plansList = Array.isArray(data) ? data : (data.plans || data.data || []);
          const found = plansList.find((p: any) => (p.id || p._id) === resolvedPlanId) || plansList[0];
          if (found) {
            setPlan(found);
          } else {
            setError('Plano de assinatura não encontrado.');
          }
        } else {
          setError('Não foi possível carregar os detalhes do plano.');
        }
      } catch (err) {
        console.error('Erro ao buscar plano:', err);
        setError('Erro de conexão ao carregar o contrato.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [resolvedPlanId, resolvedLinkId, initialPlan]);

  const handleContratar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return alert('Por favor, informe seu nome completo.');
    if (!telefone.trim() && !email.trim()) return alert('Informe seu telefone ou e-mail de contato.');
    if (!aceitouTermos) return alert('Você precisa ler e aceitar os termos do contrato para prosseguir.');

    setSubmitting(true);
    try {
      const payload = {
        nome: nome.trim(),
        telefone: telefone.trim(),
        email: email.trim().toLowerCase(),
        planoId: plan?.id || plan?._id || resolvedPlanId,
        planoNome: plan?.nome || 'Plano de Assinatura',
        observacao: observacao.trim() ? `[Contrato Aceito] ${observacao.trim()}` : '[Contrato Aceito via Link]',
        linkId: resolvedLinkId,
        ativo: true,
        status: 'pendente'
      };

      let res = await fetch(`${API_BASE_URL}/subscription-clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => null);

      if (!res || !res.ok) {
        res = await fetch(`/api/v1/subscription-clients`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(() => null);
      }

      if (res && res.ok) {
        setContratadoComSucesso(true);
        if (onSuccess) onSuccess();
      } else {
        alert('Ocorreu um erro ao registrar sua assinatura. Entre em contato com a barbearia.');
      }
    } catch (err) {
      console.error('Erro ao contratar assinatura:', err);
      alert('Erro de conexão ao processar a contratação.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyContractLink = () => {
    const link = `${window.location.origin}/?contratoAssinatura=1&planId=${plan?.id || plan?._id || resolvedPlanId}&linkId=${resolvedLinkId}`;
    navigator.clipboard.writeText(link);
    alert('✓ Link do contrato copiado com sucesso!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400">Carregando Termos do Contrato de Assinatura...</p>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <DocumentTextIcon className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Contrato Indisponível</h1>
        <p className="text-gray-400 text-sm mb-6">{error || 'O plano solicitado não existe ou foi alterado.'}</p>
        {onClose ? (
          <button onClick={onClose} className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold">
            Voltar
          </button>
        ) : (
          <a href="/" className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold">
            Ir para Início
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 py-8 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-3xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900/80 via-indigo-900/80 to-purple-900/80 p-6 sm:p-8 border-b border-gray-800 relative">
          <div className="flex items-center justify-between gap-4 mb-3">
            <span className="inline-flex items-center gap-1.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              <ShieldCheckIcon className="w-4 h-4 text-blue-400" />
              Contrato de Adesão de Assinatura
            </span>
            <button
              type="button"
              onClick={copyContractLink}
              className="text-xs bg-gray-800/80 hover:bg-gray-700 text-gray-200 px-3 py-1.5 rounded-lg border border-gray-700 transition-colors flex items-center gap-1.5"
            >
              📋 Copiar Link
            </button>
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {plan.nome}
          </h1>
          <p className="text-gray-300 text-sm mt-1 max-w-xl">
            {plan.descricao || 'Assinatura recorrente exclusiva para cortes e cuidados masculinos.'}
          </p>

          <div className="mt-6 flex flex-wrap items-baseline gap-2 bg-black/30 p-4 rounded-xl border border-white/10 w-fit">
            <span className="text-gray-400 text-xs uppercase font-bold">Valor Mensal:</span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">
              R$ {Number(plan.valorMensal || 0).toFixed(2)}
            </span>
            <span className="text-xs text-gray-400 font-medium">/ mês (Cobrança recorrente)</span>
          </div>
        </div>

        {contratadoComSucesso ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircleIcon className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-white">Assinatura Solicitada com Sucesso!</h2>
            <p className="text-gray-300 max-w-md mx-auto text-sm">
              Sua solicitação do plano <strong className="text-white">{plan.nome}</strong> foi registrada. Apresente seus dados na recepção ou realize o agendamento de seus cortes diretamente pela plataforma.
            </p>
            <div className="pt-4 flex justify-center gap-4">
              <a
                href={`/?empresaId=${resolvedLinkId}`}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg"
              >
                Agendar Meu Corte Agora
              </a>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-8 space-y-8">
            {/* Cláusulas do Contrato */}
            <div className="space-y-6 text-sm text-gray-300 leading-relaxed bg-gray-950/60 p-5 sm:p-6 rounded-xl border border-gray-800">
              <h3 className="text-base font-bold text-white border-b border-gray-800 pb-2 flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5 text-blue-400" />
                Termos e Regras da Assinatura
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-900/80 p-4 rounded-lg border border-gray-800 space-y-1">
                  <span className="text-xs uppercase font-bold text-blue-400 block">Atendimentos Mensais:</span>
                  <span className="text-white font-bold text-base">
                    {plan.limiteMensal ? `${plan.limiteMensal} cortes/mês` : 'Cortes Ilimitados'}
                  </span>
                  <p className="text-xs text-gray-400">Renovação de ciclo a cada 30 dias após confirmação do pagamento.</p>
                </div>

                <div className="bg-gray-900/80 p-4 rounded-lg border border-gray-800 space-y-1">
                  <span className="text-xs uppercase font-bold text-blue-400 block">Dias de Atendimento & Regras:</span>
                  <span className="text-white font-bold text-base">
                    Segunda a Quinta (Sem taxa)
                  </span>
                  <p className="text-xs text-gray-400">Atendimentos inclusos 100% de segunda a quinta</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-2.5 bg-yellow-950/30 border border-yellow-700/40 p-4 rounded-xl text-yellow-200">
                  <ClockIcon className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-bold text-sm mb-0.5">
                      Cláusula de Reagendamento e Ajustes (Até 2 Dias Antes):
                    </strong>
                    <p className="text-xs text-yellow-200/90 leading-normal">
                      Ajustes no horário ou data do agendamento do corte são permitidos com até <strong>2 dias (48 horas) de antecedência</strong> mediante agendamento prévio na plataforma. Cancelamentos fora desse prazo contam como atendimento realizado do ciclo mensal.
                    </p>
                  </div>
                </div>

                <ul className="list-disc list-inside space-y-2 text-xs text-gray-400 pl-1">
                  <li>A assinatura é de uso pessoal e intransferível.</li>
                  <li>Agendamentos de <strong>Segunda a Quinta-feira</strong> estão inclusos sem nenhum custo adicional.</li>
                  <li>Casos urgentes para agendamentos de assinantes às <strong>Sextas, Sábados e Domingos</strong>, incide uma taxa de conveniência de <strong>R$ 10,00 por serviço</strong> selecionado.</li>
                  <li>O pagamento do valor mensal dá direito ao uso dos serviços inclusos no plano contratado.</li>
                  <li>Você pode solicitar o cancelamento ou pausa do plano com a gerência a qualquer momento.</li>
                </ul>
              </div>
            </div>

            {/* Formulário de Aceite/Contratação */}
            <form onSubmit={handleContratar} className="space-y-5 bg-gray-900/90 p-5 sm:p-6 rounded-xl border border-gray-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UsersIcon className="w-5 h-5 text-emerald-400" />
                Dados do Assinante para Contratação
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Nome Completo *</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Ex: Carlos Eduardo"
                      className="w-full bg-gray-950 text-white px-3 py-2.5 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Telefone / WhatsApp *</label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      placeholder="(67) 99999-9999"
                      className="w-full bg-gray-950 text-white px-3 py-2.5 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">E-mail</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="carlos@email.com"
                    className="w-full bg-gray-950 text-white px-3 py-2.5 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Observação (Opcional)</label>
                <input
                  type="text"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Ex: Prefiro horários no período da tarde"
                  className="w-full bg-gray-950 text-white px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={aceitouTermos}
                    onChange={(e) => setAceitouTermos(e.target.checked)}
                    className="mt-1 w-4 h-4 text-emerald-600 bg-gray-950 border-gray-700 rounded focus:ring-emerald-500"
                  />
                  <span className="text-xs text-gray-300">
                    Li e concordo com os termos de adesão da assinatura, limite mensal de atendimentos e a política de reagendamento prévio com até 2 dias de antecedência.
                  </span>
                </label>
              </div>

              <div className="pt-4 border-t border-gray-800 flex items-center justify-between gap-4 flex-wrap">
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
                  >
                    Voltar
                  </button>
                )}
                
                <button
                  type="submit"
                  disabled={submitting || !aceitouTermos}
                  className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                    submitting || !aceitouTermos
                      ? 'bg-gray-700 opacity-60 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-500 active:scale-95'
                  }`}
                >
                  {submitting ? (
                    'Processando...'
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5 text-emerald-200" />
                      Contratar Assinatura (R$ {Number(plan.valorMensal || 0).toFixed(2)})
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
