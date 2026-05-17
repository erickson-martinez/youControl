import React, { useState, useMemo, useEffect } from "react";
import { useBarbeiros } from "../hooks/useBarbeiros";
import { useBarbeariaConfig } from "../hooks/useBarbeariaConfig";
import { useBarbeariaAgendamentos } from "../hooks/useBarbeariaRegistros";

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

export default function AgendamentoPage({ empresa, empresas = [] }: { empresa?: Empresa, empresas?: Empresa[] }) {
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string | undefined>();
  const [hasInitialized, setHasInitialized] = useState(false);

  const { barbeiros, reloadBarbeiros } = useBarbeiros(selectedEmpresaId);
  const { servicos, produtos, loadConfig } = useBarbeariaConfig(selectedEmpresaId);
  const { agendamentos, addAgendamento, loadAgendamentos } =
    useBarbeariaAgendamentos(selectedEmpresaId);

  const [telefone, setTelefone] = useState("");
  const [nome, setNome] = useState("");
  const [barbeiroId, setBarbeiroId] = useState("");
  const [servicosSelecionados, setServicosSelecionados] = useState<string[]>(
    [],
  );
  const [produtosSelecionados, setProdutosSelecionados] = useState<string[]>(
    [],
  );
  const [data, setData] = useState("");
  const [horariosSelecionados, setHorariosSelecionados] = useState<string[]>(
    [],
  );
  const [quantidadePessoas, setQuantidadePessoas] = useState(1);
  const [nomesAcompanhantes, setNomesAcompanhantes] = useState("");
  const [agendado, setAgendado] = useState(false);

  useEffect(() => {
    if (!hasInitialized) {
      if (empresas.length === 1) {
          setSelectedEmpresaId(empresas[0].linkId || empresas[0].id);
          setHasInitialized(true);
      } else if (empresa && empresas.length > 1) {
          // If the user has a default company but there are more than 1, we don't auto-force it, 
          // or we can auto-force it once. Let's not force it if they have multiple, or we can initialize
          // to default but allow them to go back.
          setSelectedEmpresaId(empresa.linkId || empresa.id);
          setHasInitialized(true);
      } else if (empresas.length > 0) {
          setHasInitialized(true);
      }
    }
  }, [empresas, empresa, hasInitialized]);

  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const bId = urlParams.get('barbeiroId');
      if (bId) setBarbeiroId(bId);

      const uStr = localStorage.getItem("currentUser");
      if (uStr) {
        const u = JSON.parse(uStr);
        if (u.phone && !telefone) setTelefone(u.phone);
        if (u.name && !nome) setNome(u.name);
      }
    } catch (e) {}
  }, []);

  const totalServicos = useMemo(() => {
    return servicosSelecionados.reduce((acc, id) => {
      const s = servicos.find((x) => x.id === id);
      return acc + (s ? s.valor : 0);
    }, 0);
  }, [servicosSelecionados, servicos]);

  const totalProdutos = useMemo(() => {
    return produtosSelecionados.reduce((acc, id) => {
      const p = produtos.find((x) => x.id === id);
      return acc + (p ? p.precoVenda : 0);
    }, 0);
  }, [produtosSelecionados, produtos]);

  const totalGeral = totalServicos + totalProdutos;

  const handleReload = () => {
    reloadBarbeiros();
    loadConfig();
    loadAgendamentos();
  };

  const handleTelefoneBlur = () => {
    if (!telefone) return;
    const existente = agendamentos.find((a) => a.telefone === telefone);
    if (existente && !nome) {
      setNome(existente.cliente);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // ... rest of submit
    if (
      !telefone.trim() ||
      !nome.trim() ||
      !data ||
      horariosSelecionados.length === 0
    ) {
      alert(
        "Preencha todos os campos obrigatórios e selecione o(s) horário(s).",
      );
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

    const clienteFinal =
      quantidadePessoas > 1
        ? `${nome} (+ ${quantidadePessoas - 1}: ${nomesAcompanhantes})`
        : nome;

    horariosSelecionados.forEach((horario, index) => {
      const dataAgendada = `${data}T${horario}:00`;

      addAgendamento({
        telefone,
        cliente: index === 0 ? clienteFinal : `${nome} (Acompanhante ${index})`,
        barbeiroId: barbeiroId || undefined,
        servicosIds:
          index === 0 && servicosSelecionados.length > 0
            ? servicosSelecionados
            : undefined,
        produtosIds:
          index === 0 && produtosSelecionados.length > 0
            ? produtosSelecionados
            : undefined,
        dataAgendada,
      });
    });

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
    produtos.forEach((p) => {
      const cat = p.categoria || "Geral";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(p);
    });
    return acc;
  }, [produtos]);

  const todayDate = new Date().toISOString().split("T")[0];

  const availableHorarios = useMemo(() => {
    if (!data) return HORARIOS;
    if (data > todayDate) return HORARIOS;

    // If data == todayDate, filter out past hours
    const nowHour = new Date().getHours();
    const nowMinute = new Date().getMinutes();

    return HORARIOS.filter((h) => {
      const [hHour, hMinute] = h.split(":").map(Number);
      if (hHour > nowHour) return true;
      if (hHour === nowHour && hMinute > nowMinute) return true;
      return false;
    });
  }, [data, todayDate]);

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
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 pb-20">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            Boas vindas!
          </h1>
          <p className="text-gray-400 mb-8">
            Para iniciar o agendamento, por favor escolha uma de nossas unidades:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {empresas.map((e) => (
              <button
                key={e.id}
                onClick={() => setSelectedEmpresaId(e.linkId || e.id)}
                className="bg-gray-800 hover:bg-gray-700 hover:border-blue-500/50 transition-all border border-gray-700 p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-3 group"
              >
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center group-hover:bg-blue-500/20 group-hover:scale-110 transition-all">
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
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-6">
        <div className="bg-green-600/20 text-green-400 p-8 rounded-xl border border-green-500/30">
          <h2 className="text-2xl font-bold mb-4">Agendamento Confirmado!</h2>
          <p>Seu horário foi reservado com sucesso.</p>
          <button
            onClick={() => {
              setAgendado(false);
              setTelefone("");
              setNome("");
              setData("");
              setHorariosSelecionados([]);
              setBarbeiroId("");
              setServicosSelecionados([]);
              setProdutosSelecionados([]);
              setQuantidadePessoas(1);
              setNomesAcompanhantes("");
            }}
            className="mt-6 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition"
          >
            Fazer Novo Agendamento
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 pb-20">
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
        <h1 className="text-3xl font-bold text-white mb-2 pt-10 sm:pt-0">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário de Agendamento */}
        <div className="lg:col-span-2 bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg relative h-fit">
          <h2 className="text-xl font-bold text-white mb-6 border-b border-gray-700 pb-2">
            Seu Horário
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Telefone (Obrigatório) *
                </label>
                <input
                  type="tel"
                  required
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  onBlur={handleTelefoneBlur}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                  placeholder="(DDD) 99999-9999"
                />
              </div>
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Serviços (Opcionais)
                </label>
                <div className="bg-gray-700 border border-gray-600 rounded p-3 max-h-40 overflow-y-auto w-full custom-scrollbar">
                  {servicos.length === 0 && (
                    <p className="text-gray-500 text-sm">
                      Nenhum serviço disponível.
                    </p>
                  )}
                  {servicos.map((s) => (
                    <label
                      key={s.id}
                      className="flex items-center space-x-3 mb-2 cursor-pointer pb-2 border-b border-gray-600/50 last:mb-0 last:pb-0 last:border-0"
                    >
                      <input
                        type="checkbox"
                        className="rounded text-blue-500 bg-gray-600 border-gray-500 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        checked={servicosSelecionados.includes(s.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setServicosSelecionados((prev) => [...prev, s.id]);
                          } else {
                            setServicosSelecionados((prev) =>
                              prev.filter((id) => id !== s.id),
                            );
                          }
                        }}
                      />
                      <span className="text-sm text-gray-200 font-medium">
                        {s.nome}{" "}
                        <span className="text-green-400 ml-1">
                          R$ {s.valor.toFixed(2)}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Produtos (Opcionais)
                </label>
                <div className="bg-gray-700 border border-gray-600 rounded p-3 max-h-40 overflow-y-auto w-full custom-scrollbar">
                  {produtos.length === 0 && (
                    <p className="text-gray-500 text-sm">
                      Nenhum produto disponível.
                    </p>
                  )}
                  {produtos.map((p) => (
                    <label
                      key={p.id}
                      className="flex items-center space-x-3 mb-2 cursor-pointer pb-2 border-b border-gray-600/50 last:mb-0 last:pb-0 last:border-0"
                    >
                      <input
                        type="checkbox"
                        className="rounded text-blue-500 bg-gray-600 border-gray-500 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        checked={produtosSelecionados.includes(p.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setProdutosSelecionados((prev) => [...prev, p.id]);
                          } else {
                            setProdutosSelecionados((prev) =>
                              prev.filter((id) => id !== p.id),
                            );
                          }
                        }}
                      />
                      <span className="text-sm text-gray-200 font-medium">
                        {p.nome}{" "}
                        <span className="text-blue-300 ml-1">
                          R$ {p.precoVenda.toFixed(2)}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Data *
                </label>
                <input
                  type="date"
                  required
                  value={data}
                  onChange={(e) => {
                    setData(e.target.value);
                    setHorariosSelecionados([]); // Reset time when date changes
                  }}
                  min={todayDate}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                />
                {data && availableHorarios.length === 0 && (
                  <p className="text-red-400 text-xs mt-2">
                    Nenhum horário disponível para esta data hoje.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Horários *{" "}
                  <span className="text-xs font-normal text-gray-500">
                    (Selecione {quantidadePessoas})
                  </span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {availableHorarios.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => toggleHorario(h)}
                      className={`py-1 px-2 rounded text-sm text-center border transition-colors ${
                        horariosSelecionados.includes(h)
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
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

        {/* Catálogo de Serviços e Produtos */}
        <div className="space-y-6">
          {(servicosSelecionados.length > 0 ||
            produtosSelecionados.length > 0) && (
            <div className="bg-gray-800 p-6 rounded-xl border border-blue-500/30 shadow-lg">
              <h3 className="text-xl font-bold text-white mb-4">
                Resumo do Agendamento
              </h3>
              <div className="space-y-2 mb-4">
                {servicosSelecionados.map((id) => {
                  const s = servicos.find((x) => x.id === id);
                  if (!s) return null;
                  return (
                    <div
                      key={id}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="text-gray-300">{s.nome}</span>
                      <span className="text-green-400 font-medium">
                        R$ {s.valor.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
                {produtosSelecionados.map((id) => {
                  const p = produtos.find((x) => x.id === id);
                  if (!p) return null;
                  return (
                    <div
                      key={id}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="text-gray-300">
                        <span className="text-xs px-1 text-blue-400 bg-blue-500/10 rounded mr-1 leading-none inline-block pb-0.5">
                          Prod
                        </span>{" "}
                        {p.nome}
                      </span>
                      <span className="text-blue-300 font-medium">
                        R$ {p.precoVenda.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-700 font-bold">
                <span className="text-white">Total</span>
                <span className="text-green-400 text-lg">
                  R$ {totalGeral.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}