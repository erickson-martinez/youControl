import React, { useState } from 'react';
import { useBarbeariaRegistros, useBarbeariaAgendamentos } from '../hooks/useBarbeariaRegistros';
import { useBarbeiros } from '../hooks/useBarbeiros';
import { useBarbeariaConfig } from '../hooks/useBarbeariaConfig';
import { CheckCircleIcon, XCircleIcon, ClipboardListIcon } from './icons';
import { Empresa, User } from '../types';
import MonthNavigator from './MonthNavigator';
import { CustomDatePicker } from './CustomDatePicker';

export default function CaixaBarbeariaPage({ empresa, user }: { empresa?: Empresa; user?: User }) {
  const empresaId = empresa?.id || empresa?.linkId;
  const { agendamentos, updateAgendamento, loadAgendamentos } = useBarbeariaAgendamentos(empresaId);
  const { registros, addRegistro } = useBarbeariaRegistros(empresaId);
  const { barbeiros, reloadBarbeiros } = useBarbeiros(empresaId);
  const { servicos, loadConfig, produtos, updateProduto, taxas } = useBarbeariaConfig(empresaId);

  const pendentes = agendamentos
    .filter(a => a.status === 'finalizado')
    .sort((a, b) => new Date(a.dataAgendada).getTime() - new Date(b.dataAgendada).getTime());

  const [activeSubTab, setActiveSubTab] = useState<'aguardando' | 'historico'>('aguardando');

  const [pagamentoAgendamento, setPagamentoAgendamento] = useState<any>(null);
  const [pagamentoModalOpen, setPagamentoModalOpen] = useState(false);
  const [pagamentosParciais, setPagamentosParciais] = useState<{ tipo: string, valor: number }[]>([
    { tipo: 'Dinheiro', valor: 0 },
    { tipo: 'Pix', valor: 0 },
    { tipo: 'Crédito', valor: 0 },
    { tipo: 'Débito', valor: 0 }
  ]);

  const handleReload = () => {
    loadAgendamentos();
    reloadBarbeiros();
    loadConfig();
  };

  const calcularValorTotal = (a: any) => {
    let valorTotal = 0;
    if (a.servicosIds && Array.isArray(a.servicosIds)) {
      a.servicosIds.forEach((sId: string) => {
        const serv = servicos.find(s => s.id === sId);
        if (serv) valorTotal += serv.valor;
      });
    } else if (a.servicoId) {
      const serv = servicos.find(s => s.id === a.servicoId);
      if (serv) valorTotal += serv.valor;
    }
    if (a.produtosIds && Array.isArray(a.produtosIds)) {
      a.produtosIds.forEach((pId: string) => {
        const prod = produtos.find(p => p.id === pId);
        if (prod) valorTotal += prod.precoVenda;
      });
    }
    return valorTotal;
  };

  const handleOpenPagamento = (a: any) => {
    const total = calcularValorTotal(a);
    setPagamentosParciais([
      { tipo: 'Dinheiro', valor: total },
      { tipo: 'Pix', valor: 0 },
      { tipo: 'Crédito', valor: 0 },
      { tipo: 'Débito', valor: 0 }
    ]);
    setPagamentoAgendamento(a);
    setPagamentoModalOpen(true);
  };

  const handlePagamentoChange = (index: number, val: string) => {
    let newVal;
    if (val === '') {
       newVal = 0;
    } else {
       newVal = Number(val) || 0;
    }
    
    const newPagamentos = [...pagamentosParciais];
    let diff = newVal - newPagamentos[index].valor;
    
    newPagamentos[index].valor = newVal;
    
    if (diff !== 0) {
        // Tenta descontar a diferença dos outros campos, começando pelo 'Dinheiro' (0) ou o com maior valor
        const orderToAdjust = [0, 1, 2, 3].filter(i => i !== index).sort((a, b) => {
            // Prioriza Dinheiro (index 0)
            if (a === 0) return -1;
            if (b === 0) return 1;
            return newPagamentos[b].valor - newPagamentos[a].valor;
        });

        for (const adjIdx of orderToAdjust) {
            if (diff === 0) break;
            
            const currentVal = newPagamentos[adjIdx].valor;
            if (diff > 0) {
                // Aumentou o valor do index atual, diminuir os outros
                const toSubtract = Math.min(currentVal, diff);
                newPagamentos[adjIdx].valor = Number((newPagamentos[adjIdx].valor - toSubtract).toFixed(2));
                diff -= toSubtract;
            } else {
                // Diminuiu o valor, voltar para o principal
                const toAdd = Math.abs(diff);
                newPagamentos[orderToAdjust[0]].valor = Number((newPagamentos[orderToAdjust[0]].valor + toAdd).toFixed(2));
                diff = 0;
            }
        }
    }
    
    setPagamentosParciais(newPagamentos);
  };

  const handleConcluir = async (a: any, pagamentosFinalizados: {tipo:string, valor:number}[]) => {
    // Save types inside the agendamento update as stringified JSON format
    const tipos = pagamentosFinalizados
      .filter(p => p.valor > 0)
      .map(p => {
         let key = '';
         if (p.tipo === 'Dinheiro') key = 'dinheiro';
         else if (p.tipo === 'Pix') key = 'pix';
         else if (p.tipo === 'Crédito') key = 'credito';
         else if (p.tipo === 'Débito') key = 'debito';

         const taxa = key && taxas && taxas[key] ? taxas[key] : 0;
         const valorDescontado = p.valor - (p.valor * taxa / 100);

         return JSON.stringify({ ...p, valorOriginal: p.valor, taxaAplicada: taxa, valor: Number(valorDescontado.toFixed(2)) });
      });

    await updateAgendamento(a.id, { ...a, status: 'pago', tipoPagamento: tipos });
    
    // Atualiza o estoque do produto se houver
    if (a.produtosIds && a.produtosIds.length > 0) {
      a.produtosIds.forEach((pId: string) => {
        const prod = produtos.find(p => p.id === pId);
        if (prod && prod.estoque !== undefined) {
          updateProduto(prod.id, { estoque: Math.max(0, prod.estoque - 1) });
        }
      });
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight">Caixa Barbearia</h1>
      </div>

      <div className="bg-gray-800/80 p-2 md:p-3 rounded-2xl border border-gray-700/50 shadow-md">
        <nav className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setActiveSubTab('aguardando')}
            className={`px-6 py-2.5 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeSubTab === 'aguardando' ? 'bg-blue-600 text-white shadow-md w-full sm:w-auto' : 'text-gray-400 hover:text-white hover:bg-gray-700 w-full sm:w-auto'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Aguardando Pagamento
          </button>
          
          <button
            onClick={() => setActiveSubTab('historico')}
            className={`px-6 py-2.5 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeSubTab === 'historico' ? 'bg-blue-600 text-white shadow-md w-full sm:w-auto' : 'text-gray-400 hover:text-white hover:bg-gray-700 w-full sm:w-auto'
            }`}
          >
            <ClipboardListIcon className="w-4 h-4" />
            Histórico (Fechados)
          </button>
        </nav>
      </div>

      {activeSubTab === 'aguardando' && (
      <div className="bg-gray-800/80 p-6 sm:p-8 rounded-2xl border border-gray-700/50 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 w-full sm:w-auto">
            Aguardando Pagamento
            <span className="bg-gray-900 border border-gray-700 text-sm font-bold text-blue-400 py-0.5 px-2 rounded-lg">
              {pendentes.length}
            </span>
          </h2>
          <button
            onClick={handleReload}
            className="w-full sm:w-auto px-4 py-2 bg-gray-700 text-sm font-medium text-gray-200 rounded-xl hover:bg-gray-600 transition border border-gray-600 inline-flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            Recarregar
          </button>
        </div>
        
        {pendentes.length === 0 ? (
          <div className="w-full bg-gray-900/50 p-8 rounded-2xl border border-gray-800 text-center text-gray-500 flex flex-col items-center justify-center">
            <svg className="w-16 h-16 mb-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            <p className="text-lg">Nenhum atendimento aguardando pagamento.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
            {pendentes.map(a => {
              const dataAgendada = new Date(a.dataAgendada);
              const dataStr = dataAgendada.toLocaleDateString();
              const horaStr = dataAgendada.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
              const barbeiro = barbeiros.find(b => b.id === a.barbeiroId)?.nome || 'Qualquer um';
              
              const servicosDoAgendamento: any[] = [];
              let valorTotal = 0;
              if (a.servicosIds && a.servicosIds.length > 0) {
                a.servicosIds.forEach((sId: string) => {
                  const s = servicos.find(x => x.id === sId);
                  if (s) {
                    servicosDoAgendamento.push(s);
                    valorTotal += s.valor;
                  }
                });
              } else if (a.servicoId) {
                const s = servicos.find(x => x.id === a.servicoId);
                if (s) {
                  servicosDoAgendamento.push(s);
                  valorTotal += s.valor;
                }
              }

              const produtosDoAgendamento: any[] = [];
              if (a.produtosIds && a.produtosIds.length > 0) {
                a.produtosIds.forEach((pId: string) => {
                  const p = produtos.find(x => x.id === pId);
                  if (p) {
                    produtosDoAgendamento.push(p);
                    valorTotal += p.precoVenda;
                  }
                });
              }
              
              return (
                <div key={a.id} className="bg-gray-800/90 p-5 lg:p-6 rounded-2xl border border-gray-700 flex flex-col gap-5 lg:gap-6 shadow-sm hover:border-blue-500/50 transition-all group overflow-hidden">
                  
                  {/* Topo: Info do Cliente e Data */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-700/50 pb-4 lg:pb-5">
                    <div className="flex flex-col">
                      <h3 className="font-bold text-white text-xl lg:text-2xl leading-tight truncate">{a.cliente}</h3>
                      <p className="text-sm font-medium text-gray-400 mt-1">{a.email}</p>
                    </div>
                    
                    <div className="bg-gray-900/60 p-3 rounded-xl border border-gray-800 flex items-center gap-4 shrink-0 sm:self-auto self-stretch">
                      <div className="flex flex-col sm:items-end w-full">
                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full">
                          <span className="text-blue-400 font-bold text-sm bg-blue-500/10 px-2.5 py-0.5 rounded border border-blue-500/20">{dataStr}</span>
                          <span className="text-gray-300 text-sm font-bold">{horaStr}</span>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-2 mt-2 w-full">
                           <span className="text-[10px] uppercase font-bold text-gray-500">Barbeiro:</span>
                           <span className="text-sm text-gray-200 font-bold max-w-[150px] truncate" title={barbeiro}>{barbeiro}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Meio: Itens do Agendamento */}
                  <div className="flex flex-wrap items-center gap-3">
                     {servicosDoAgendamento.map((s, idx) => (
                        <div key={`s-${idx}`} className="text-sm text-gray-200 bg-gray-900/40 px-4 py-2.5 rounded-xl flex items-center justify-between gap-4 shadow-inner border border-gray-700/50 shrink-0">
                          <span className="font-semibold">{s.nome}</span>
                          <span className="text-green-400 font-bold whitespace-nowrap">R$ {s.valor.toFixed(2)}</span>
                        </div>
                      ))}
                      {produtosDoAgendamento.map((p, idx) => (
                        <div key={`p-${idx}`} className="text-sm text-gray-200 bg-gray-900/40 px-4 py-2.5 rounded-xl flex items-center justify-between gap-4 shadow-inner border border-gray-700/50 shrink-0">
                          <span className="font-semibold">{p.nome} <span className="text-gray-500 font-normal text-xs ml-1">(Prod)</span></span>
                          <span className="text-blue-400 font-bold whitespace-nowrap">R$ {p.precoVenda.toFixed(2)}</span>
                        </div>
                      ))}
                  </div>

                  {/* Rodapé: Total e Ações */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-5 lg:pt-6 border-t border-gray-700/50 bg-gray-800/30 -mx-5 -mb-5 px-5 pb-5 lg:-mx-6 lg:-mb-6 lg:px-6 lg:pb-6 rounded-b-2xl mt-1">
                    <div className="flex flex-col items-center sm:items-start w-full sm:w-auto">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Total a Pagar</span>
                      <span className="text-3xl lg:text-4xl font-black text-white">R$ {valorTotal.toFixed(2)}</span>
                    </div>

                    <div className="flex items-center justify-center gap-3 w-full sm:w-auto">
                      <button 
                        onClick={() => handleOpenPagamento(a)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-green-500/10 hover:bg-green-500 text-green-400 hover:text-white border border-green-500/30 font-bold py-3.5 px-8 rounded-xl transition-all shadow-sm text-lg"
                      >
                        <CheckCircleIcon className="w-5 h-5 shrink-0" /> Receber Pago
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}

      {activeSubTab === 'historico' && (
      <div className="bg-gray-800/80 p-6 sm:p-8 rounded-2xl border border-gray-700/50 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-6">Histórico de Registros <span className="text-gray-500 text-sm font-normal ml-2">(Vendas/Cortes)</span></h2>
        {registros.length === 0 ? (
          <div className="w-full bg-gray-900/50 p-8 rounded-2xl border border-gray-800 text-center text-gray-500 flex flex-col items-center justify-center">
            <ClipboardListIcon className="w-16 h-16 mb-4 text-gray-700" />
            <p className="text-lg">Nenhum registro encontrado no histórico.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
            {[...registros].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).map(r => {
              const dataObj = new Date(r.data);
              return (
                <div key={r.id} className="bg-gray-900/40 p-5 rounded-2xl border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-5 group hover:border-gray-600 transition-all shadow-sm">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-emerald-500/10 text-emerald-400 font-bold text-xs px-2.5 py-1 rounded-md border border-emerald-500/20 uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                        <CheckCircleIcon className="w-3.5 h-3.5" />
                         PAGO
                      </div>
                      <h3 className="font-bold text-white text-xl">{r.cliente}</h3>
                    </div>
                    <div className="text-sm font-medium text-gray-400 flex items-center gap-2 mt-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      {dataObj.toLocaleDateString()} {dataObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    {/* Lista de itens do registro */}
                    <div className="mt-4 flex flex-col gap-2">
                      <div className="flex gap-2 flex-wrap">
                        {r.itens && r.itens.map((i: any, index: number) => (
                          <div key={index} className={`font-medium text-xs px-3 py-1.5 rounded-lg border ${i.tipo === 'servico' ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-blue-900/30 border-blue-800/50 text-blue-300'}`}>
                            {i.nome}
                          </div>
                        ))}
                      </div>
                      {r.tipoPagamento && r.tipoPagamento.length > 0 && (
                        <div className="flex gap-2 flex-wrap items-center mt-1">
                          <span className="text-[10px] uppercase font-bold text-gray-500 mr-1">Pagamento:</span>
                          {r.tipoPagamento.map((pStr: string, index: number) => {
                            try {
                               const p = JSON.parse(pStr);
                               return (
                                 <div 
                                    key={`p-${index}`} 
                                    title={p.valorOriginal ? `Cobrado: R$ ${p.valorOriginal.toFixed(2)} | Taxa: R$ ${(p.valorOriginal - p.valor).toFixed(2)}` : ''}
                                    className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded border border-green-500/20 shadow-sm flex gap-1.5 cursor-help"
                                 >
                                   <span>{p.tipo}</span>
                                   <span className="font-bold">R$ {p.valor.toFixed(2)}</span>
                                 </div>
                               );
                            } catch (e) {
                               return null;
                            }
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-left md:text-right flex flex-row md:flex-col justify-between items-center md:items-end mt-2 md:mt-0 pt-4 md:pt-0 border-t border-gray-800 md:border-t-0 min-w-40">
                    <span className="text-xs uppercase font-bold text-gray-500 mr-2 md:mr-0 mb-2">Barbeiro: <span className="text-gray-300 ml-1">{r.barbeiroNome}</span></span>
                    <span className="font-black text-green-400 text-2xl tracking-tight">R$ {r.total.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}

      {pagamentoModalOpen && pagamentoAgendamento && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Receber Pagamento</h2>
              <button 
                onClick={() => setPagamentoModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-gray-800/80 p-4 rounded-xl flex justify-between items-center">
                <span className="text-gray-400 font-medium tracking-wide text-sm uppercase">Total Cobrado</span>
                <span className="text-white font-black text-2xl">R$ {calcularValorTotal(pagamentoAgendamento).toFixed(2)}</span>
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-sm text-gray-500 font-medium mb-3">Distribuir parcelas do pagamento:</p>
                {pagamentosParciais.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <span className="text-gray-300 font-medium w-24 shrink-0">{p.tipo}</span>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">R$</span>
                      <input
                        type="number" step="0.01" min="0" value={p.valor || ''} 
                        onChange={(e) => handlePagamentoChange(idx, e.target.value)}
                        className="w-full bg-gray-800 border-2 border-gray-700 text-white font-bold rounded-xl py-2.5 pl-10 pr-3 focus:outline-none focus:border-green-500/50 focus:bg-gray-800 transition-colors"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {(() => {
              const pago = pagamentosParciais.reduce((acc, curr) => acc + curr.valor, 0);
              const pendente = calcularValorTotal(pagamentoAgendamento) - pago;
              const hasError = pendente !== 0;
              return (
                <div className="border-t border-gray-800 pt-5 mt-2">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-gray-400 text-sm">Falta Pagar</span>
                    <span className={`font-bold text-lg ${pendente < 0 ? 'text-red-400' : pendente === 0 ? 'text-green-400' : 'text-orange-400'}`}>
                      R$ {Math.abs(pendente).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => setPagamentoModalOpen(false)}
                      className="flex-1 py-3.5 px-4 bg-gray-800 text-gray-300 font-bold rounded-xl hover:bg-gray-700 transition-all text-center"
                    >
                      Cancelar
                    </button>
                    <button 
                      disabled={hasError}
                      onClick={() => {
                        handleConcluir(pagamentoAgendamento, pagamentosParciais);
                        setPagamentoModalOpen(false);
                      }}
                      className={`flex-1 py-3.5 px-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-center
                        ${hasError 
                          ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700/50' 
                          : 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/50 border border-green-500/50'
                        }`}
                    >
                      <CheckCircleIcon className="w-5 h-5 shrink-0" /> Confirmar
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

