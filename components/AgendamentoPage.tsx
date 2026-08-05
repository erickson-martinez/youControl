import React, { useState, useMemo, useEffect } from "react";
import { useBarbeiros } from "../hooks/useBarbeiros";
import { useBarbeariaConfig } from "../hooks/useBarbeariaConfig";
import { useBarbeariaAgendamentos, formatarMoeda, calcularResumoPagamento } from "../hooks/useBarbeariaRegistros";
import { API_BASE_URL } from "../constants";

const HORARIOS = [
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
];

import { Empresa } from "../types";
import { CustomDatePicker } from "./CustomDatePicker";

export default function AgendamentoPage({ empresa, empresas = [] }: { empresa?: Empresa, empresas?: Empresa[] }) {
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string | undefined>(() => {
    if (empresas?.length === 1) return empresas[0].id;
    if (empresa) return empresa.id;
    return undefined;
  });
  const [hasInitialized, setHasInitialized] = useState(false);

  const { barbeiros, reloadBarbeiros } = useBarbeiros(selectedEmpresaId);
  const { servicos, produtos, loadConfig } = useBarbeariaConfig(selectedEmpresaId);
  const { agendamentos, addAgendamento, loadAgendamentos } =
    useBarbeariaAgendamentos(selectedEmpresaId);

  const [clienteEmail, setClienteEmail] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");
  const [nome, setNome] = useState("");
  const [barbeiroId, setBarbeiroId] = useState("");
  const [servicosSelecionados, setServicosSelecionados] = useState<string[]>(
    [],
  );
  const [produtosSelecionados, setProdutosSelecionados] = useState<string[]>(
    [],
  );
  const [data, setData] = useState(() => {
    const d = new Date();
    if (d.getHours() >= 19) {
      d.setDate(d.getDate() + 1);
    }
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [horariosSelecionados, setHorariosSelecionados] = useState<string[]>(
    [],
  );
  const [quantidadePessoas, setQuantidadePessoas] = useState(1);
  const [nomesAcompanhantes, setNomesAcompanhantes] = useState("");
  const [agendado, setAgendado] = useState(false);
  const [createdResult, setCreatedResult] = useState<any>(null);

  // Subscriptions & Plans State for checking subscriber
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    const fetchSubscribersAndPlans = async () => {
      if (!selectedEmpresaId) return;
      try {
        let resSub = await fetch(`${API_BASE_URL}/subscription-clients?linkId=${selectedEmpresaId}`).catch(() => null);
        if (!resSub || !resSub.ok || !(resSub.headers.get('content-type') || '').includes('application/json')) {
          resSub = await fetch(`/api/v1/subscription-clients?linkId=${selectedEmpresaId}`);
        }
        if (resSub && resSub.ok && (resSub.headers.get('content-type') || '').includes('application/json')) {
          const dataSub = await resSub.json();
          const listSub = Array.isArray(dataSub) ? dataSub : dataSub.clients || dataSub.subscribers || dataSub.data || [];
          setSubscribers(listSub.filter((s: any) => s.ativo !== false));
        }

        let resPlan = await fetch(`${API_BASE_URL}/subscription-plans?linkId=${selectedEmpresaId}`).catch(() => null);
        if (!resPlan || !resPlan.ok || !(resPlan.headers.get('content-type') || '').includes('application/json')) {
          resPlan = await fetch(`/api/v1/subscription-plans?linkId=${selectedEmpresaId}`);
        }
        if (resPlan && resPlan.ok && (resPlan.headers.get('content-type') || '').includes('application/json')) {
          const dataPlan = await resPlan.json();
          const listPlan = Array.isArray(dataPlan) ? dataPlan : dataPlan.plans || dataPlan.data || [];
          setPlans(listPlan);
        }
      } catch (e) {
        console.warn("Erro ao buscar assinantes na tela de agendamento:", e);
      }
    };
    fetchSubscribersAndPlans();
  }, [selectedEmpresaId]);

  // Identify Active Subscriber by Phone
  const matchedSubscriber = useMemo(() => {
    const cleanTel = (clienteTelefone || '').replace(/\D/g, '');
    if (!cleanTel || cleanTel.length < 8) return null;
    return subscribers.find((s: any) => {
      const subTel = (s.telefone || '').replace(/\D/g, '');
      return subTel === cleanTel && s.ativo !== false;
    });
  }, [clienteTelefone, subscribers]);

  const matchedPlanName = useMemo(() => {
    if (!matchedSubscriber) return null;
    if (matchedSubscriber.planoNome) return matchedSubscriber.planoNome;
    const p = plans.find((p: any) => (p.id || p._id) === matchedSubscriber.planoId);
    return p?.nome || 'Plano de Assinatura';
  }, [matchedSubscriber, plans]);

  useEffect(() => {
    if (!hasInitialized) {
      if (empresas.length === 1) {
          setSelectedEmpresaId(empresas[0].id);
          setHasInitialized(true);
      } else if (empresa && empresas.length > 1) {
          setSelectedEmpresaId(empresa.id);
          setHasInitialized(true);
      } else if (empresas.length > 0) {
          setHasInitialized(true);
      } else {
          setHasInitialized(true);
      }
    }
  }, [empresas, empresa, hasInitialized]);

  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const bId = urlParams.get('barbeiroId');
      if (bId) setBarbeiroId(bId);

      const storedUser = localStorage.getItem("currentUser");
      if (storedUser) {
        try {
          const currentUser = JSON.parse(storedUser);
          if (currentUser?.email) {
            setClienteEmail((emailAtual) => emailAtual || currentUser.email);
          }
          if (currentUser?.name) {
            setNome((nomeAtual) => nomeAtual || currentUser.name);
          }
          if (currentUser?.phone || currentUser?.telefone) {
            setClienteTelefone((telAtual) => telAtual || currentUser.phone || currentUser.telefone || "");
          }
        } catch (error) {
          console.warn("currentUser inválido no localStorage");
        }
      }
    } catch (e) {}
  }, []);

  const totalServicos = useMemo(() => {
    return servicosSelecionados.reduce((acc, id) => {
      const s = servicos.find((x) => x.id === id);
      return acc + (s ? Number(s.valor || 0) : 0);
    }, 0);
  }, [servicosSelecionados, servicos]);

  const totalProdutos = useMemo(() => {
    return produtosSelecionados.reduce((acc, id) => {
      const p = produtos.find((x) => x.id === id);
      return acc + (p ? Number(p.precoVenda || 0) : 0);
    }, 0);
  }, [produtosSelecionados, produtos]);

  const resumo = useMemo(() => {
    return calcularResumoPagamento(
      data,
      totalServicos,
      totalProdutos
    );
  }, [data, totalServicos, totalProdutos]);

  const handleReload = () => {
    reloadBarbeiros();
    loadConfig();
    loadAgendamentos();
  };

  const handleEmailBlur = () => {
    if (!clienteEmail) return;
    const existente = agendamentos.find((a) => a.email === clienteEmail || a.clienteEmail === clienteEmail);
    if (existente && !nome) {
      setNome(existente.cliente || existente.clienteNome || "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !nome.trim() ||
      !data ||
      horariosSelecionados.length === 0
    ) {
      alert(
        "Preencha todos os campos obrigatórios e selecione o(s) horário(s).",
      );
      return;
    }

    if (!clienteEmail.trim() && !clienteTelefone.trim()) {
      alert("Preencha pelo menos o E-mail ou o Telefone do cliente para realizar o agendamento.");
      return;
    }

    if (
      quantidadePessoas > 1 &&
      horariosSelecionados.length < quantidadePessoas
    ) {
      alert(
        `Você indicou ${quantidadePessoas} pessoas, por favor selecione pelo menos ${quantidadePessoas} horários.`,
      );
      return;
    }

    // Validar conflitos
    if (barbeiroId) {
      const conflitos = agendamentos.filter(
        (a) =>
          a.barbeiroId === barbeiroId &&
          a.dataAgendada.startsWith(data) &&
          horariosSelecionados.some((h) => a.dataAgendada.includes(h)) &&
          a.status === "pendente",
      );
      if (conflitos.length > 0) {
        alert(
          "Já existe um agendamento para este barbeiro em um dos horários selecionados. Por favor, escolha outro.",
        );
        return;
      }
    }

    const payload = {
      clienteNome: nome,
      clienteEmail: clienteEmail || "",
      clienteTelefone: clienteTelefone || "",
      barbeiroId: barbeiroId || (barbeiros.length > 0 ? barbeiros[0].id : ""),
      servicosIds: servicosSelecionados,
      produtosIds: produtosSelecionados,
      dataAgendada: `${data}T${horariosSelecionados[0]}:00`,
      horarios: horariosSelecionados,
      status: "pendente",
      quantidadePessoas,
      nomesAcompanhantes: quantidadePessoas > 1 ? nomesAcompanhantes : "",
      valorTotalPrevisto: resumo.valorCobrado,
      linkId: selectedEmpresaId,
      pagamento: {
        status: "pendente",
        formas: resumo.formasPagamento,
        desconto: resumo.desconto,
        subtotalServicos: resumo.subtotalServicos,
        subtotalProdutos: resumo.subtotalProdutos,
        valorOriginal: resumo.valorOriginal,
        valorCobrado: resumo.valorCobrado,
      }
    };

    const result = await addAgendamento(payload);
    setCreatedResult(result);
    setAgendado(true);
  };

  const servicosPorCategoria = useMemo(() => {
    const acc: Record<string, typeof servicos> = {};
    servicos.forEach((s) => {
      const cat = s.categoria || "Geral";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(s);
    });
    return acc;
  }, [servicos]);

  const produtosPorCategoria = useMemo(() => {
    const acc: Record<string, typeof produtos> = {};
    produtos
      .filter((p) => (p.estoque ?? 0) > 0)
      .forEach((p) => {
        const cat = p.categoria || "Geral";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(p);
      });
    return acc;
  }, [produtos]);

  const todayDate = new Date().toISOString().split("T")[0];

  const capacityPerSlot = barbeiros.length || 1;

  const availableHorarios = useMemo(() => {
    if (!data) return HORARIOS;
    if (data < todayDate) return [];

    const DIAS_SEMANA_MAP = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const selectedDayOfWeekName = DIAS_SEMANA_MAP[new Date(data + "T12:00:00Z").getDay()];

    const hasBarberForDay = barbeiros.some(b => {
      if (barbeiroId && b.id !== barbeiroId) return false;
      if (!b.diasTrabalhados || b.diasTrabalhados.length === 0) return true; 
      return b.diasTrabalhados.includes(selectedDayOfWeekName);
    });

    if (!hasBarberForDay && barbeiros.length > 0) return [];

    let validHorarios = HORARIOS;

    if (data === todayDate) {
      const nowHour = new Date().getHours();
      const nowMinute = new Date().getMinutes();
      validHorarios = validHorarios.filter((h) => {
        const [hHour, hMinute] = h.split(":").map(Number);
        if (hHour > nowHour) return true;
        if (hHour === nowHour && hMinute > nowMinute) return true;
        return false;
      });
    }

    const appointmentsOnDate = agendamentos.filter(
      (a) => a.dataAgendada.startsWith(data) && a.status !== "cancelado"
    );

    return validHorarios.filter((h) => {
      let currentCount = 0;
      appointmentsOnDate.forEach((a) => {
        if (a.horarios && a.horarios.includes(h)) {
          if (barbeiroId && a.barbeiroId === barbeiroId) {
            currentCount += 999;
          } else {
            currentCount += a.quantidadePessoas || 1;
          }
        }
      });
      return currentCount + quantidadePessoas <= capacityPerSlot;
    });
  }, [data, todayDate, agendamentos, barbeiros, barbeiroId, quantidadePessoas]);

  const toggleHorario = (h: string) => {
    setHorariosSelecionados((prev) => {
      if (prev.includes(h)) return prev.filter((x) => x !== h);
      if (prev.length >= quantidadePessoas) {
        // Can optionally remove the first selected OR just alert
        // Let's just remove the oldest and add the new one
        return [...prev.slice(1), h];
      }
      return [...prev, h];
    });
  };

  if (!selectedEmpresaId && empresas.length > 1) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-20">
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Boas vindas!
          </h1>
          <p className="text-gray-400 mb-8">
            Para iniciar o agendamento, por favor escolha uma de nossas unidades:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 max-w-2xl mx-auto">
            {empresas.map((e) => (
              <button
                key={e.id}
                onClick={() => setSelectedEmpresaId(e.id)}
                className="bg-gray-800 hover:bg-gray-700 hover:border-blue-500/50 transition-all border border-gray-700 p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-3 group"
              >
                <div className="w-12 md:w-16 h-12 md:h-16 bg-blue-500/10 rounded-full flex items-center justify-center group-hover:bg-blue-500/20 group-hover:scale-110 transition-all">
                  <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1v1H9V7zm5 0h1v1h-1V7zm-5 4h1v1H9v-1zm5 0h1v1h-1v-1zm-3 4H2v-1h7v1z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">{e.name}</h3>
                {e.city && <p className="text-sm text-gray-400">{e.city}{e.state ? ` - ${e.state}` : ''}</p>}
                <span className="mt-2 text-sm text-blue-400 font-medium group-hover:underline">Acessar unidade &rarr;</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (agendado) {
    const hasAssinatura = createdResult?.assinatura?.possui || (createdResult as any)?.possuiAssinatura || Boolean(matchedSubscriber);
    const planoAssinaturaNome = createdResult?.assinatura?.planoNome || matchedPlanName;
    const codigoAtendimentoAssinatura = createdResult?.assinatura?.codigoAtendimento || matchedSubscriber?.codigoAtendimento || matchedSubscriber?.codigo;

    return (
      <div className="p-5 md:p-8 max-w-lg mx-auto text-center space-y-6">
        <div className="bg-green-600/20 text-green-400 p-5 md:p-8 rounded-xl border border-green-500/30 space-y-4">
          <h2 className="text-2xl font-bold">Agendamento Confirmado!</h2>
          <p className="text-gray-200">Seu horário foi reservado com sucesso.</p>

          {hasAssinatura && (
            <div className="p-4 bg-purple-900/40 border border-purple-500/40 rounded-xl text-purple-200 text-left text-xs space-y-1.5 mt-4">
              <div className="font-bold text-sm text-purple-300 flex items-center gap-1.5">
                <span>⭐</span> Serviços cobertos pela assinatura
              </div>
              {planoAssinaturaNome && <div>Plano: <strong className="text-white">{planoAssinaturaNome}</strong></div>}
              {codigoAtendimentoAssinatura && <div>Código de Atendimento: <span className="font-mono bg-purple-950 px-2 py-0.5 rounded border border-purple-700/50 text-purple-200">{codigoAtendimentoAssinatura}</span></div>}
              {produtosSelecionados.length > 0 && (
                <div className="text-amber-300 pt-1 border-t border-purple-700/40 font-semibold">
                  ⚠️ Produtos não são cobertos pela assinatura.
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => {
              setAgendado(false);
              setCreatedResult(null);
              setClienteEmail("");
              setClienteTelefone("");
              setNome("");
              setData("");
              setHorariosSelecionados([]);
              setBarbeiroId("");
              setServicosSelecionados([]);
              setProdutosSelecionados([]);
              setQuantidadePessoas(1);
              setNomesAcompanhantes("");
            }}
            className="mt-6 px-6 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-500 transition shadow-md"
          >
            Fazer Novo Agendamento
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-20">
      <div className="text-center relative">
        {empresas.length > 1 && (
          <button
            onClick={() => setSelectedEmpresaId(undefined)}
            className="absolute left-0 top-0 mt-2 px-3 py-1.5 flex items-center gap-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded-lg transition-colors"
          >
            Voc&ecirc; est&aacute; em: <span className="font-bold text-blue-400">{empresas.find(e => e.id === selectedEmpresaId)?.name || 'Outra Unidade'}</span>
            <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 pt-10 sm:pt-0">
          Barbearia VIP - Agendamento
        </h1>
        <p className="text-gray-400">
          Agende seu horário, veja nossos serviços e produtos.
        </p>
        <button
          onClick={handleReload}
          className="mt-4 px-4 py-2 bg-gray-800 text-sm text-gray-300 rounded hover:bg-gray-700 transition border border-gray-600 inline-flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            ></path>
          </svg>
          Recarregar Dados
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 md:p-8">
        {/* Formulário de Agendamento */}
        <div className="lg:col-span-2 bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg relative h-fit">
          <h2 className="text-xl font-bold text-white mb-6 border-b border-gray-700 pb-2">
            Seu Horário
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Seu Nome *
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                  placeholder="Como gostaria de ser chamado?"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Barbeiro (Opcional)
                </label>
                <select
                  value={barbeiroId}
                  onChange={(e) => setBarbeiroId(e.target.value)}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Qualquer Barbeiro</option>
                  {barbeiros.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={clienteEmail}
                  onChange={(e) => setClienteEmail(e.target.value)}
                  onBlur={handleEmailBlur}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                  placeholder="seu.email@exemplo.com"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Informe o Email ou o Telefone do cliente
                </span>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Telefone / Celular
                </label>
                <input
                  type="tel"
                  value={clienteTelefone}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, "");
                    if (val.length > 11) val = val.substring(0, 11);
                    if (val.length > 2) val = `(${val.substring(0, 2)}) ${val.substring(2)}`;
                    if (val.length > 9) val = `${val.substring(0, 10)}-${val.substring(10)}`;
                    setClienteTelefone(val);
                  }}
                  className={`w-full bg-gray-700 text-white border rounded px-3 py-2 focus:outline-none ${
                    matchedSubscriber ? 'border-purple-500 ring-1 ring-purple-500' : 'border-gray-600 focus:border-blue-500'
                  }`}
                  placeholder="(DDD) 99999-9999"
                />
                {matchedSubscriber ? (
                  <span className="text-[11px] font-bold text-purple-400 mt-1 block">
                    ⭐ Assinante ativo identificado!
                  </span>
                ) : clienteTelefone.trim() ? (
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    Opcional, mas necessário para identificar assinatura
                  </span>
                ) : (
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    Sem telefone, a assinatura não será identificada automaticamente.
                  </span>
                )}
              </div>
            </div>

            {/* Banner de Assinante Ativo */}
            {matchedSubscriber && (
              <div className="p-4 bg-purple-900/30 border border-purple-500/40 rounded-xl text-purple-200 shadow-lg animate-fadeIn">
                <div className="flex items-center gap-2 text-purple-300 font-bold text-sm mb-1">
                  <span>⭐</span> Cliente possui assinatura ativa
                </div>
                <div className="text-xs space-y-1 text-gray-300">
                  <div>Assinante: <strong className="text-white">{matchedSubscriber.nome}</strong></div>
                  <div>Plano: <strong className="text-purple-300">{matchedPlanName}</strong></div>
                  <div>
                    Código: <span className="font-mono bg-purple-950 px-2 py-0.5 rounded border border-purple-700/50 text-purple-200 text-xs">
                      {matchedSubscriber.codigoAtendimento || matchedSubscriber.codigo || matchedSubscriber.id}
                    </span>
                  </div>
                  {matchedSubscriber.email && <div>E-mail: <span className="text-gray-400">{matchedSubscriber.email}</span></div>}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Pessoas p/ Atendimento
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  required
                  value={quantidadePessoas}
                  onChange={(e) => {
                    setQuantidadePessoas(Number(e.target.value));
                    setHorariosSelecionados([]); // Reset h on change quantity
                  }}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>
              {quantidadePessoas > 1 && (
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Nome dos Acompanhantes
                  </label>
                  <input
                    type="text"
                    required
                    value={nomesAcompanhantes}
                    onChange={(e) => setNomesAcompanhantes(e.target.value)}
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                    placeholder="Ex: Maria, Carlos"
                  />
                </div>
              )}
            </div>

            <div className="space-y-6 pt-4 border-t border-gray-700">
              <div>
                <label className="block text-sm text-gray-400 mb-3 font-medium">Produtos Disponíveis (Opcionais)</label>
                <div className="space-y-4">
                  {Object.entries(produtosPorCategoria).length === 0 && (
                    <p className="text-gray-500 text-sm p-3 bg-gray-900/30 rounded-xl border border-gray-800 text-center">Nenhum produto disponível.</p>
                  )}
                  {Object.entries(produtosPorCategoria).map(([cat, prods]) => (
                    <div key={cat}>
                       <h4 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">{cat}</h4>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                         {prods.map(p => (
                            <label key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${produtosSelecionados.includes(p.id) ? 'bg-blue-900/20 border-blue-500/50' : 'bg-gray-900/50 border-gray-800 hover:border-gray-700'}`}>
                              <input 
                                type="checkbox" 
                                checked={produtosSelecionados.includes(p.id)} 
                                onChange={(e) => {
                                  if (e.target.checked) setProdutosSelecionados(prev => [...prev, p.id]);
                                  else setProdutosSelecionados(prev => prev.filter(i => i !== p.id));
                                }} 
                                className="w-5 h-5 rounded border-gray-700 text-blue-600 focus:ring-blue-500 bg-gray-800 shrink-0" 
                              />
                              <div className="flex-1 flex justify-between items-center min-w-0">
                                <div className="truncate pr-2">
                                  <div className="text-gray-200 font-medium truncate">{p.nome}</div>
                                  <div className="text-gray-500 text-xs mt-0.5">Estoque: {p.estoque}</div>
                                </div>
                                <span className="text-blue-400 font-bold ml-2 whitespace-nowrap shrink-0">R$ {p.precoVenda.toFixed(2)}</span>
                              </div>
                            </label>
                         ))}
                       </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-3 font-medium">Serviços Disponíveis (Opcionais)</label>
                <div className="space-y-4">
                  {Object.entries(servicosPorCategoria).length === 0 && (
                    <p className="text-gray-500 text-sm p-3 bg-gray-900/30 rounded-xl border border-gray-800 text-center">Nenhum serviço disponível.</p>
                  )}
                  {Object.entries(servicosPorCategoria).map(([cat, servs]) => (
                    <div key={cat}>
                       <h4 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">{cat}</h4>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                         {servs.map(s => (
                            <label key={s.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${servicosSelecionados.includes(s.id) ? 'bg-blue-900/20 border-blue-500/50' : 'bg-gray-900/50 border-gray-800 hover:border-gray-700'}`}>
                              <input 
                                type="checkbox" 
                                checked={servicosSelecionados.includes(s.id)} 
                                onChange={(e) => {
                                  if (e.target.checked) setServicosSelecionados(prev => [...prev, s.id]);
                                  else setServicosSelecionados(prev => prev.filter(i => i !== s.id));
                                }} 
                                className="w-5 h-5 rounded border-gray-700 text-blue-600 focus:ring-blue-500 bg-gray-800 shrink-0" 
                              />
                              <div className="flex-1 flex justify-between items-center min-w-0">
                                <span className="text-gray-200 font-medium truncate pr-2">{s.nome}</span>
                                <span className="text-emerald-400 font-bold ml-2 whitespace-nowrap shrink-0">R$ {s.valor.toFixed(2)}</span>
                              </div>
                            </label>
                         ))}
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm text-gray-400 mb-2">
                  Selecione a Data *
                </label>
                <CustomDatePicker
                  selectedDate={data}
                  onChange={(d) => {
                    setData(d);
                    setHorariosSelecionados([]); // Reset time when date changes
                  }}
                  onMonthChange={() => {
                    setHorariosSelecionados([]); // Reset on month change if needed
                  }}
                />
                {data && availableHorarios.length === 0 && (
                  <p className="text-red-400 text-xs mt-2">
                    Nenhum horário ou barbeiro disponível nesta data.
                  </p>
                )}
              </div>
              <div className="col-span-1 md:col-span-2 mt-4">
                <label className="block text-sm text-gray-400 mb-2">
                  Horários *{" "}
                  <span className="text-xs font-normal text-gray-500">
                    (Selecione {quantidadePessoas})
                  </span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3">
                  {availableHorarios.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => toggleHorario(h)}
                      className={`py-2.5 px-2 sm:px-3 rounded-lg text-sm font-medium text-center border transition-colors ${
                        horariosSelecionados.includes(h)
                          ? "bg-blue-600 border-blue-500 text-white shadow-md"
                          : "bg-gray-900/50 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-500"
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-700">
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg transition-transform active:scale-[0.98]"
              >
                Confirmar Agendamento
              </button>
            </div>
          </form>
        </div>

        {/* Resumo do Agendamento */}
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-xl border border-blue-500/30 shadow-lg space-y-4">
            <div className="flex justify-between items-center border-b border-gray-700/80 pb-3">
              <h3 className="text-xl font-bold text-white">
                Resumo do Agendamento
              </h3>
              <span className="text-xs px-2.5 py-1 bg-gray-900 text-indigo-300 rounded-lg border border-indigo-500/30 font-medium">
                📅 {resumo.nomeDiaSemana}
              </span>
            </div>

            {/* Listagem de itens */}
            <div className="space-y-2 pb-3 border-b border-gray-700/60 text-sm">
              {servicosSelecionados.length === 0 && produtosSelecionados.length === 0 && (
                <p className="text-gray-400 text-xs italic">Nenhum serviço ou produto selecionado.</p>
              )}
              {servicosSelecionados.map((id) => {
                const s = servicos.find((x) => x.id === id);
                if (!s) return null;
                return (
                  <div key={id} className="flex justify-between items-center">
                    <span className="text-gray-300 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                      {s.nome}
                    </span>
                    <span className={`font-medium ${resumo.temAssinatura ? 'text-purple-400 line-through text-xs' : 'text-emerald-400'}`}>
                      {formatarMoeda(s.valor)}
                    </span>
                  </div>
                );
              })}
              {produtosSelecionados.map((id) => {
                const p = produtos.find((x) => x.id === id);
                if (!p) return null;
                return (
                  <div key={id} className="flex justify-between items-center">
                    <span className="text-gray-300 flex items-center gap-1.5">
                      <span className="text-[10px] px-1 text-blue-400 bg-blue-500/10 rounded border border-blue-500/20">
                        Prod
                      </span>
                      {p.nome}
                    </span>
                    <span className="text-blue-300 font-medium">
                      {formatarMoeda(p.precoVenda)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Detalhamento financeiro */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center text-gray-400">
                <span>Subtotal de serviços</span>
                <span className="font-medium text-gray-200">{formatarMoeda(resumo.subtotalServicos)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-400">
                <span>Subtotal de produtos</span>
                <span className="font-medium text-gray-200">{formatarMoeda(resumo.subtotalProdutos)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-400">
                <span>Valor original</span>
                <span className="font-medium text-gray-200">{formatarMoeda(resumo.valorOriginal)}</span>
              </div>

              {resumo.desconto > 0 && (
                <div className="flex justify-between items-center text-emerald-400 font-medium">
                  <span>Desconto</span>
                  <span>- {formatarMoeda(resumo.desconto)}</span>
                </div>
              )}

              {resumo.temAssinatura && (
                <div className="flex justify-between items-center text-purple-300 font-medium">
                  <span>Forma de Pagamento</span>
                  <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/40 rounded text-xs font-bold text-purple-200">
                    Assinatura
                  </span>
                </div>
              )}

              {/* Mensagens de destaque */}
              {resumo.temAssinatura ? (
                <div className="p-3 bg-purple-500/15 border border-purple-500/30 rounded-xl text-purple-300 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-purple-200">
                    <span>⭐ Serviços cobertos pela assinatura</span>
                  </div>
                  {resumo.subtotalProdutos > 0 && (
                    <p className="text-[11px] text-purple-300/80">
                      Produtos mantêm cobrança normal ({formatarMoeda(resumo.subtotalProdutos)}).
                    </p>
                  )}
                </div>
              ) : resumo.isSegundaAQuarta ? (
                <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Desconto de R$ 5,00 aplicado (Segunda a Quarta: dias promocionais)
                </div>
              ) : null}

              {/* Valor final */}
              <div className="flex justify-between items-center pt-3 border-t border-gray-700 font-bold text-base">
                <span className="text-white">Valor final</span>
                <span className="text-emerald-400 text-xl font-black">
                  {formatarMoeda(resumo.valorCobrado)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}