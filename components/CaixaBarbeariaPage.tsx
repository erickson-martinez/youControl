import React, { useState } from 'react';
import { useBarbeariaRegistros, useBarbeariaAgendamentos } from '../hooks/useBarbeariaRegistros';
import { useBarbeiros } from '../hooks/useBarbeiros';
import { useBarbeariaConfig } from '../hooks/useBarbeariaConfig';
import { CheckCircleIcon, XCircleIcon, ClipboardListIcon } from './icons';
import { Empresa, User } from '../types';
import MonthNavigator from './MonthNavigator';
import { CustomDatePicker } from './CustomDatePicker';

export default function CaixaBarbeariaPage({ empresa, user }: { empresa?: Empresa; user?: User }) {
  const empresaId = empresa?.linkId || empresa?.id;
  const { agendamentos, updateStatus, loadAgendamentos } = useBarbeariaAgendamentos(empresaId);
  const { registros, addRegistro } = useBarbeariaRegistros(empresaId);
  const { barbeiros, reloadBarbeiros } = useBarbeiros(empresaId);
  const { servicos, loadConfig, produtos, updateProduto } = useBarbeariaConfig(empresaId);

  const pendentes = agendamentos.filter(a => a.status === 'finalizado').sort((a, b) => new Date(a.dataAgendada).getTime() - new Date(b.dataAgendada).getTime());

  const [dataFiltro, setDataFiltro] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
  });

  const [activeSubTab, setActiveSubTab] = useState<'aguardando' | 'diario' | 'mensal' | 'historico'>('aguardando');

  const handleReload = () => {
    loadAgendamentos();
    reloadBarbeiros();
    loadConfig();
  };

  const handleConcluir = async (a: any) => {
    await updateStatus(a.id, 'pago');
    
    let total = 0;
    const itens = [];
    
    // Suporte para múltiplos serviços
    if (a.servicosIds && a.servicosIds.length > 0) {
      a.servicosIds.forEach((sId: string) => {
        const servico = servicos.find(s => s.id === sId);
        if (servico) {
          itens.push({ idItem: servico.id, nome: servico.nome, tipo: 'servico', valor: servico.valor });
          total += servico.valor;
        }
      });
    } else if (a.servicoId) {
      // Fallback retrocompatibilidade
      const servico = servicos.find(s => s.id === a.servicoId);
      if (servico) {
        itens.push({ idItem: servico.id, nome: servico.nome, tipo: 'servico', valor: servico.valor });
        total += servico.valor;
      }
    }
    
    if (a.produtosIds && a.produtosIds.length > 0) {
      a.produtosIds.forEach((pId: string) => {
        const prod = produtos.find(p => p.id === pId);
        if (prod) {
          itens.push({ idItem: prod.id, nome: prod.nome, tipo: 'produto', valor: prod.precoVenda });
          total += prod.precoVenda;
          if (prod.estoque !== undefined) {
            updateProduto(prod.id, { estoque: Math.max(0, prod.estoque - 1) });
          }
        }
      });
    }

    if (itens.length > 0) {
      await addRegistro({
        cliente: a.cliente,
        telefone: a.telefone,
        barbeiroId: a.barbeiroId,
        barbeiroNome: barbeiros.find(b => b.id === a.barbeiroId)?.nome || 'Qualquer um',
        itens,
        total
      });
    }
  };

  const registrosFiltradosDia = registros.filter(r => r.data.startsWith(dataFiltro));
  const registrosFiltradosMes = registros.filter(r => r.data.startsWith(dataFiltro.substring(0, 7)));

  const calcularComissoes = (registrosBase: any[]) => {
    return barbeiros.map(barbeiro => {
      const registrosBarbeiro = registrosBase.filter(r => r.barbeiroId === barbeiro.id);
      let totalServicos = 0;
      let totalProdutos = 0;
      let faturamentoTotal = 0;
      let comissaoServicos = 0;
      let comissaoProdutos = 0;

      registrosBarbeiro.forEach(r => {
        r.itens.forEach((item: any) => {
          faturamentoTotal += item.valor;
          if (item.tipo === 'servico') {
            totalServicos += item.valor;
            comissaoServicos += item.valor * (barbeiro.corte / 100);
          } else if (item.tipo === 'produto') {
            totalProdutos += item.valor;
            const produtoObj = produtos.find(p => p.id === item.idItem);
            const override = produtoObj && Number(produtoObj.comissao) > 0 ? Number(produtoObj.comissao) : Number(barbeiro.comissao);
            comissaoProdutos += item.valor * ((override || 0) / 100);
          }
        });
      });

      return {
        barbeiro,
        totalServicos,
        totalProdutos,
        faturamentoTotal,
        comissaoServicos,
        comissaoProdutos,
        totalComissao: comissaoServicos + comissaoProdutos,
        caixaBarbearia: faturamentoTotal - (comissaoServicos + comissaoProdutos)
      };
    }).filter(c => c.faturamentoTotal > 0);
  };

  const comissoesDia = calcularComissoes(registrosFiltradosDia);
  const comissoesMes = calcularComissoes(registrosFiltradosMes);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight">Caixa Barbearia</h1>
      </div>

      <div className="bg-gray-800/80 p-2 md:p-3 rounded-2xl border border-gray-700/50 shadow-md">
        <nav className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setActiveSubTab('aguardando')}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeSubTab === 'aguardando' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Aguardando Pagamento
          </button>
          
          <button
            onClick={() => setActiveSubTab('historico')}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeSubTab === 'historico' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <ClipboardListIcon className="w-4 h-4" />
            Histórico (Fechados)
          </button>

          <button
            onClick={() => setActiveSubTab('diario')}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeSubTab === 'diario' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            Comissões Hoje
          </button>
          
          <button
            onClick={() => setActiveSubTab('mensal')}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeSubTab === 'mensal' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            Comissões Mês
          </button>
        </nav>
      </div>

      {activeSubTab === 'aguardando' && (
      <div className="bg-gray-800/80 p-6 sm:p-8 rounded-2xl border border-gray-700/50 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Aguardando Pagamento
            <span className="bg-gray-900 border border-gray-700 text-sm font-bold text-blue-400 py-0.5 px-2 rounded-lg">
              {pendentes.length}
            </span>
          </h2>
          <button
            onClick={handleReload}
            className="px-3 py-1 bg-gray-700 text-xs text-gray-300 rounded hover:bg-gray-600 transition border border-gray-600 inline-flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            Recarregar
          </button>
        </div>
        
        {pendentes.length === 0 ? (
          <div className="w-full bg-gray-900/50 p-5 md:p-8 rounded-2xl border border-gray-800 text-center text-gray-500 flex flex-col items-center justify-center">
            <svg className="w-12 h-12 mb-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            <p>Nenhum atendimento aguardando pagamento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <div key={a.id} className="bg-gray-800/90 p-5 rounded-2xl border border-gray-700 flex flex-col gap-3 shadow-md hover:border-blue-500/30 transition-all group relative">
                  <button 
                    onClick={() => updateStatus(a.id, 'cancelado')}
                    className="absolute top-4 right-4 text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 bg-gray-900 p-1.5 rounded-lg"
                    title="Cancelar agendamento"
                  >
                    <XCircleIcon className="w-4 h-4" />
                  </button>
                  <div className="flex justify-between items-start pr-8">
                    <div>
                      <h3 className="font-bold text-white text-lg leading-tight">{a.cliente}</h3>
                      <p className="text-sm text-gray-400 mt-1">{a.telefone}</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-900/50 p-3 rounded-xl border border-gray-800 flex justify-between items-center mt-2">
                    <div>
                      <p className="text-blue-400 font-bold text-sm">{dataStr}</p>
                      <p className="text-gray-300 text-xs font-bold">{horaStr}</p>
                    </div>
                    <div className="text-right">
                       <span className="text-[10px] uppercase font-bold text-gray-500 block">Barbeiro</span>
                       <p className="text-xs text-gray-300 font-medium">{barbeiro}</p>
                    </div>
                  </div>

                  {servicosDoAgendamento.length > 0 && (
                    <div className="flex flex-col gap-2 mt-1">
                      {servicosDoAgendamento.map((s, idx) => (
                        <div key={`s-${idx}`} className="text-sm text-gray-300 bg-gray-800 px-3 py-1.5 rounded-lg inline-flex justify-between w-full shadow-inner border border-gray-700/50">
                          <span className="font-medium">{s.nome}</span>
                          <span className="text-green-400 font-bold">R$ {s.valor.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {produtosDoAgendamento.length > 0 && (
                    <div className="flex flex-col gap-2 mt-1">
                      {produtosDoAgendamento.map((p, idx) => (
                        <div key={`p-${idx}`} className="text-sm text-gray-300 bg-gray-800 px-3 py-1.5 rounded-lg inline-flex justify-between w-full shadow-inner border border-gray-700/50">
                          <span className="font-medium">{p.nome} (Produto)</span>
                          <span className="text-blue-400 font-bold">R$ {p.precoVenda.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center mt-2 mb-1 px-1">
                     <span className="text-sm font-bold text-gray-400">Total a Pagar</span>
                     <span className="text-lg font-black text-white">R$ {valorTotal.toFixed(2)}</span>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-gray-700/50">
                    <button 
                      onClick={() => handleConcluir(a)}
                      className="w-full flex items-center justify-center gap-2 bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white border border-green-500/30 font-medium text-sm py-2 rounded-xl transition-all"
                    >
                      <CheckCircleIcon className="w-4 h-4" /> Marcar como Pago
                    </button>
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
          <div className="w-full bg-gray-900/50 p-5 md:p-8 rounded-2xl border border-gray-800 text-center text-gray-500 flex flex-col items-center justify-center">
            <ClipboardListIcon className="w-12 h-12 mb-3 text-gray-700" />
            <p>Nenhum registro encontrado no histórico.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {[...registros].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).map(r => {
              const dataObj = new Date(r.data);
              return (
                <div key={r.id} className="bg-gray-900/40 p-4 rounded-xl border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-gray-600 transition-all">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-fit bg-emerald-500/10 text-emerald-400 font-bold text-[10px] px-2 py-0.5 rounded-md border border-emerald-500/20 uppercase tracking-widest flex items-center gap-1 shadow-sm">
                        <CheckCircleIcon className="w-3 h-3" />
                         PAGO
                      </div>
                      <h3 className="font-bold text-white text-lg">{r.cliente}</h3>
                    </div>
                    <div className="text-sm text-gray-400 flex items-center gap-2 mt-1">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      {dataObj.toLocaleDateString()} {dataObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    {/* Lista de itens do registro */}
                    <div className="mt-3 flex gap-2 flex-wrap">
                      {r.itens && r.itens.map((i: any, index: number) => (
                        <div key={index} className={`text-xs px-2 py-1 rounded-md border ${i.tipo === 'servico' ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-blue-900/30 border-blue-800/50 text-blue-300'}`}>
                          {i.nome}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-left md:text-right flex flex-row md:flex-col justify-between items-center md:items-end mt-2 md:mt-0 pt-3 md:pt-0 border-t border-gray-800 md:border-t-0">
                    <span className="text-[10px] uppercase font-bold text-gray-500 mr-2 md:mr-0 mb-1">Barbeiro: <span className="text-gray-300">{r.barbeiroNome}</span></span>
                    <span className="font-black text-green-400 text-xl tracking-tight">R$ {r.total.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}

      {activeSubTab === 'diario' && (
        <div className="grid grid-cols-1 gap-4 md:gap-6">
          <div className="bg-gray-800/80 p-6 sm:p-8 rounded-2xl border border-gray-700/50 shadow-xl">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4 border-b border-gray-700/50 pb-4">
              <div>
                 <h2 className="text-xl font-bold text-white flex items-center gap-2">
                   Resumo Diário de Comissões
                 </h2>
                 <p className="text-gray-400 text-sm mt-1">Valores agrupados por barbeiro referentes à data selecionada.</p>
              </div>
            </div>
            
            <div>
                <div className="w-full">
                  <CustomDatePicker 
                    selectedDate={dataFiltro} 
                    onChange={(d) => setDataFiltro(d)} 
                    allowPast={true} 
                  />
              </div>
                {comissoesDia.length === 0 ? (
                  <div className="w-full bg-gray-900/50 p-6 rounded-2xl border border-gray-800 text-center text-gray-500">
                    <p>Nenhuma venda ou serviço registrado para esta data.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
                    {/* Barbearia Card */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4 bg-blue-900/30 p-5 rounded-2xl border border-blue-800/50 flex flex-col md:flex-row justify-between gap-4 items-center relative overflow-hidden">
                        <div>
                          <h3 className="font-bold text-blue-100 text-lg z-10 flex items-center gap-2 pt-1 mb-1">
                             <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                             Resumo Diário Barbearia
                          </h3>
                          <div className="text-xs text-blue-300/70">
                            Fat. Bruto Geral: <span className="font-bold text-white">R$ {comissoesDia.reduce((sum, c) => sum + c.faturamentoTotal, 0).toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-4 sm:gap-6 bg-gray-900/50 p-3 rounded-xl border border-blue-800/50 w-full md:w-auto overflow-x-auto">
                          <div>
                            <div className="text-[10px] text-blue-300 uppercase font-bold">Comissões Pagas</div>
                            <div className="text-red-400 font-bold">- R$ {comissoesDia.reduce((sum, c) => sum + c.totalComissao, 0).toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-blue-300 uppercase font-bold">Lucro Barbearia</div>
                            <div className="text-blue-400 font-black text-xl tracking-tight">R$ {comissoesDia.reduce((sum, c) => sum + c.caixaBarbearia, 0).toFixed(2)}</div>
                          </div>
                        </div>
                    </div>
                    {/* Fim Barbearia Card */}
                    {comissoesDia.map((c, idx) => (
                      <div key={idx} className="bg-gray-900/60 p-5 rounded-2xl border border-gray-700 flex flex-col gap-2 relative overflow-hidden">
                        <h3 className="font-bold text-white text-lg z-10">{c.barbeiro.nome}</h3>
                        <div className="text-xs text-gray-400 mb-2 border-b border-gray-800 pb-2">Fat. Bruto: <span className="font-bold text-white">R$ {c.faturamentoTotal.toFixed(2)}</span></div>
                        
                        <div className="flex justify-between items-center text-sm border-b border-gray-800 pb-2">
                          <span className="text-gray-400">Serviços ({c.barbeiro.corte}%)</span>
                          <span className="text-green-400 font-medium">R$ {c.comissaoServicos.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm border-b border-gray-800 pb-2">
                          <span className="text-gray-400">Produtos ({c.barbeiro.comissao}%)</span>
                          <span className="text-blue-400 font-medium">R$ {c.comissaoProdutos.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-1 border-t border-gray-800">
                          <span className="text-gray-200 font-bold text-sm">Comissão a Pagar</span>
                          <span className="text-green-400 font-black text-lg">R$ {c.totalComissao.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'mensal' && (
        <div className="grid grid-cols-1 gap-4 md:gap-6">
          <div className="bg-gray-800/80 p-6 sm:p-8 rounded-2xl border border-gray-700/50 shadow-xl">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4 border-b border-gray-700/50 pb-4">
              <div>
                 <h2 className="text-xl font-bold text-white flex items-center gap-2">
                   Resumo Mensal de Comissões
                 </h2>
                 <p className="text-gray-400 text-sm mt-1">Valores acumulados para o mês selecionado ({dataFiltro.split('-').slice(0,2).reverse().join('/')}).</p>
              </div>
            </div>

            <div>
                <div className="w-full">
                <MonthNavigator
                  currentDate={new Date(parseInt(dataFiltro.split('-')[0]), parseInt(dataFiltro.split('-')[1]) - 1, 1)}
                  setCurrentDate={(d) => {
                    const yyyy = d.getFullYear();
                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                    setDataFiltro(`${yyyy}-${mm}-01`);
                  }}
                />
                </div>
                {comissoesMes.length === 0 ? (
                  <div className="w-full bg-gray-900/50 p-6 rounded-2xl border border-gray-800 text-center text-gray-500 mt-4">
                    <p>Nenhuma venda ou serviço registrado para este mês.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4 bg-blue-900/30 p-5 rounded-2xl border border-blue-800/50 flex flex-col md:flex-row justify-between gap-4 items-center relative overflow-hidden">
                        <div>
                          <h3 className="font-bold text-blue-100 text-lg z-10 flex items-center gap-2 pt-1 mb-1">
                             <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                             Resumo Mensal Barbearia
                          </h3>
                          <div className="text-xs text-blue-300/70">
                            Fat. Bruto Geral Mensal: <span className="font-bold text-white">R$ {comissoesMes.reduce((sum, c) => sum + c.faturamentoTotal, 0).toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="flex gap-4 sm:gap-6 bg-gray-900/50 p-3 rounded-xl border border-blue-800/50 w-full md:w-auto overflow-x-auto">
                          <div>
                            <div className="text-[10px] text-blue-300 uppercase font-bold">Comissões Pagas Mensal</div>
                            <div className="text-red-400 font-bold">- R$ {comissoesMes.reduce((sum, c) => sum + c.totalComissao, 0).toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-blue-300 uppercase font-bold">Lucro Barbearia Mensal</div>
                            <div className="text-blue-400 font-black text-xl tracking-tight">R$ {comissoesMes.reduce((sum, c) => sum + c.caixaBarbearia, 0).toFixed(2)}</div>
                          </div>
                        </div>
                    </div>
                    {comissoesMes.map((c, idx) => (
                      <div key={idx} className="bg-gray-900/40 p-5 rounded-2xl border border-gray-700 flex flex-col gap-2 relative overflow-hidden">
                        <h3 className="font-bold text-white text-lg z-10">{c.barbeiro.nome}</h3>
                        <div className="text-xs text-gray-400 mb-2 border-b border-gray-800 pb-2">Fat. Bruto Mensal: <span className="font-bold text-white">R$ {c.faturamentoTotal.toFixed(2)}</span></div>
                        
                        <div className="flex justify-between items-center text-sm border-b border-gray-800 pb-2">
                          <span className="text-gray-400">Serviços Mensal ({c.barbeiro.corte}%)</span>
                          <span className="text-green-400 font-medium">R$ {c.comissaoServicos.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm border-b border-gray-800 pb-2">
                          <span className="text-gray-400">Produtos Mensal ({c.barbeiro.comissao}%)</span>
                          <span className="text-blue-400 font-medium">R$ {c.comissaoProdutos.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-1 border-t border-gray-800">
                          <span className="text-gray-200 font-bold text-sm">Comissão Total no Mês</span>
                          <span className="text-green-400 font-black text-xl tracking-tight">R$ {c.totalComissao.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

