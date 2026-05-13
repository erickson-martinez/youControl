import React, { useState } from 'react';
import { useBarbeiros } from '../hooks/useBarbeiros';
import { useBarbeariaRegistros, useBarbeariaAgendamentos } from '../hooks/useBarbeariaRegistros';
import { useBarbeariaConfig } from '../hooks/useBarbeariaConfig';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from './icons';
import { User, Empresa } from '../types';

interface BarbeiroAgendaPageProps {
  user: User;
  empresa?: Empresa;
  isAdmin?: boolean;
}

const BarbeiroAgendaPage: React.FC<BarbeiroAgendaPageProps> = ({ user, empresa, isAdmin }) => {
  const { barbeiros } = useBarbeiros(empresa?.id);
  const { agendamentos, updateStatus } = useBarbeariaAgendamentos(empresa?.id);
  const { registros, addRegistro } = useBarbeariaRegistros(empresa?.id);
  const { servicos, produtos, updateProduto } = useBarbeariaConfig(empresa?.id);

  // Vamos assumir que o barbeiro pode escolher quem ele é na tela, ou se o número de telefone 
  // dele bater com algum cadastro, pegar automaticamente.
  const [selectedBarbeiroId, setSelectedBarbeiroId] = useState<string>('');

  React.useEffect(() => {
    if (user && user.phone && barbeiros.length > 0 && !selectedBarbeiroId) {
      const userPhoneNumbers = user.phone.replace(/\D/g, '');
      const barbeiroLogado = barbeiros.find(b => b.telefone && b.telefone.replace(/\D/g, '') === userPhoneNumbers);
      if (barbeiroLogado) {
        setSelectedBarbeiroId(barbeiroLogado.id);
      }
    }
  }, [user, barbeiros, selectedBarbeiroId]);

  const barbeiro = selectedBarbeiroId === 'todos' ? { id: 'todos', nome: 'Todos os Barbeiros' } : barbeiros.find(b => b.id === selectedBarbeiroId);
  const meusAgendamentos = selectedBarbeiroId === 'todos' ? agendamentos : agendamentos.filter(a => a.barbeiroId === selectedBarbeiroId);
  
  const pendentes = meusAgendamentos.filter(a => a.status === 'pendente').sort((a, b) => new Date(a.dataAgendada).getTime() - new Date(b.dataAgendada).getTime());
  const concluidos = meusAgendamentos.filter(a => a.status === 'concluido').sort((a, b) => new Date(b.dataAgendada).getTime() - new Date(a.dataAgendada).getTime());

  const handleConcluir = (a: any) => {
    updateStatus(a.id, 'concluido');
    const servico = servicos.find(s => s.id === a.servicoId);
    const barbeiroDoAgendamento = barbeiros.find(b => b.id === a.barbeiroId);

    const agendamentoProdutos: any[] = [];
    if (a.produtosIds && a.produtosIds.length > 0) {
      a.produtosIds.forEach((pId: string) => {
        const prod = produtos.find(p => p.id === pId);
        if (prod) {
          agendamentoProdutos.push(prod);
          // Reduzir estoque
          if (prod.estoque > 0) {
            updateProduto(prod.id, { estoque: prod.estoque - 1 });
          }
        }
      });
    }

    if (barbeiroDoAgendamento && (servico || agendamentoProdutos.length > 0)) {
      const itens: any[] = [];
      let total = 0;

      if (servico) {
        itens.push({ idItem: servico.id, nome: servico.nome, tipo: 'servico', valor: servico.valor });
        total += servico.valor;
      }

      agendamentoProdutos.forEach(p => {
        itens.push({ idItem: p.id, nome: p.nome, tipo: 'produto', valor: p.precoVenda });
        total += p.precoVenda;
      });

      addRegistro({
        cliente: a.cliente,
        telefone: a.telefone,
        barbeiroId: barbeiroDoAgendamento.id,
        barbeiroNome: barbeiroDoAgendamento.nome,
        itens,
        total
      });
    }
  };

  const [isVendaModalOpen, setIsVendaModalOpen] = useState(false);
  const [vendaProdutoId, setVendaProdutoId] = useState('');
  const [vendaCliente, setVendaCliente] = useState('');

  const handleVendaAvulsa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendaProdutoId) return alert('Selecione um produto.');
    const p = produtos.find(prod => prod.id === vendaProdutoId);
    if (!p) return;
    
    if (barbeiro && p) {
      addRegistro({
        cliente: vendaCliente || 'Cliente Balcão',
        telefone: '',
        barbeiroId: barbeiro.id,
        barbeiroNome: barbeiro.nome,
        itens: [{ idItem: p.id, nome: p.nome, tipo: 'produto', valor: p.precoVenda }],
        total: p.precoVenda
      });
      if (p.estoque > 0) {
        updateProduto(p.id, { estoque: p.estoque - 1 });
      }
      setIsVendaModalOpen(false);
      setVendaProdutoId('');
      setVendaCliente('');
      alert('Venda registrada com sucesso!');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-gray-800 pb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600/20 p-3 rounded-2xl border border-blue-500/30">
            <ClockIcon className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Minha Agenda</h1>
            <p className="text-gray-400 mt-1 text-sm font-medium">Acompanhe seus clientes e tarefas com facilidade</p>
          </div>
        </div>
      </div>

      {!selectedBarbeiroId ? (
        <div className="bg-gray-800/80 p-8 rounded-2xl border border-gray-700/50 shadow-xl max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-8">Quem é você?</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {isAdmin && (
              <button
                onClick={() => setSelectedBarbeiroId('todos')}
                className="bg-purple-900/40 hover:bg-purple-800/60 border border-purple-700/50 rounded-2xl p-6 text-center transition-all hover:scale-105 shadow-md group"
              >
                <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center text-2xl font-black text-white mx-auto mb-4 shadow-inner group-hover:scale-110 transition-transform">
                  TD
                </div>
                <h3 className="font-bold text-white text-lg tracking-wide">Todos (Admin)</h3>
              </button>
            )}
            {barbeiros.map(b => (
              <button
                key={b.id}
                onClick={() => setSelectedBarbeiroId(b.id)}
                className="bg-gray-900/50 hover:bg-gray-800 border border-gray-700/50 hover:border-blue-500/50 rounded-2xl p-6 text-center transition-all hover:scale-105 shadow-md group"
              >
                <div className="w-20 h-20 bg-blue-600/20 border border-blue-500/30 rounded-full flex items-center justify-center text-2xl font-black text-blue-400 mx-auto mb-4 group-hover:scale-110 transition-transform">
                  {b.nome.substring(0, 2).toUpperCase()}
                </div>
                <h3 className="font-bold text-white text-lg tracking-wide">{b.nome}</h3>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center bg-gray-900/50 p-6 rounded-2xl border border-gray-800 shadow-md gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600/20 border border-blue-500/30 rounded-full flex items-center justify-center text-lg font-black text-blue-400">
                {barbeiro?.nome === 'Todos os Barbeiros' ? 'TD' : barbeiro?.nome?.substring(0, 2).toUpperCase()}
              </div>
              <h2 className="text-2xl font-bold text-white">Agenda de {barbeiro?.nome}</h2>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {barbeiro?.id !== 'todos' && (
                <button onClick={() => setIsVendaModalOpen(true)} className="flex-1 sm:flex-none text-sm font-bold text-green-400 hover:text-green-300 bg-green-500/10 hover:bg-green-500/20 px-4 py-2.5 rounded-xl transition-all border border-green-500/20 whitespace-nowrap">
                  💰 Vender Produto
                </button>
              )}
              <button onClick={() => setSelectedBarbeiroId('')} className="flex-1 sm:flex-none text-sm font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-4 py-2.5 rounded-xl transition-all border border-blue-500/20 whitespace-nowrap">
                Trocar Perfil
              </button>
            </div>
          </div>

          {isVendaModalOpen && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8 w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white">Venda Avulsa (Balcão)</h3>
                  <button onClick={() => setIsVendaModalOpen(false)} className="text-gray-500 hover:text-gray-300">
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>
                <form onSubmit={handleVendaAvulsa} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Produto</label>
                    <select 
                      required value={vendaProdutoId} onChange={e => setVendaProdutoId(e.target.value)}
                      className="w-full bg-gray-800 text-white border border-gray-700 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">Selecione um produto...</option>
                      {produtos.map(p => (
                        <option key={p.id} value={p.id}>{p.nome} - R$ {p.precoVenda.toFixed(2)} (Estoque: {p.estoque})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Nome do Cliente (Opcional)</label>
                    <input 
                      type="text" value={vendaCliente} onChange={e => setVendaCliente(e.target.value)}
                      className="w-full bg-gray-800 text-white border border-gray-700 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                      placeholder="Ex: João da Silva"
                    />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 mt-4 rounded-xl transition-colors">
                    Confirmar Venda
                  </button>
                </form>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-800/80 p-6 md:p-8 rounded-2xl border border-gray-700/50 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-6 border-b border-gray-700/50 pb-3 flex justify-between items-center">
                <span>Próximos Agendamentos</span>
                <span className="bg-blue-600 font-bold text-white text-xs px-2 py-1 rounded-lg">{pendentes.length}</span>
              </h2>
              {pendentes.length === 0 ? (
                <div className="w-full bg-gray-900/50 p-8 rounded-2xl border border-gray-800 text-center text-gray-500 flex flex-col items-center justify-center">
                  <svg className="w-12 h-12 mb-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  <p>Bom trabalho! Nenhum agendamento pendente.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                  {pendentes.map(a => {
                    const dataObj = new Date(a.dataAgendada);
                    const servico = servicos.find(s => s.id === a.servicoId);
                    return (
                      <div key={a.id} className="bg-gray-900/60 p-5 rounded-2xl border border-gray-700 flex flex-col gap-3 shadow-md hover:border-gray-500 transition-all group relative">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-white text-lg tracking-wide">{a.cliente}</h3>
                            <p className="text-sm text-gray-400 mt-1 font-medium bg-gray-800/50 inline-flex px-2 py-0.5 rounded-lg border border-gray-700">{a.telefone}</p>
                            {selectedBarbeiroId === 'todos' && (
                                <p className="text-xs text-purple-400 font-bold mt-2 bg-purple-500/10 px-2 py-1 rounded-md w-fit border border-purple-500/20">
                                    💈 Barbeiro: {barbeiros.find(b => b.id === a.barbeiroId)?.nome || 'Desconhecido'}
                                </p>
                            )}
                          </div>
                          <div className="text-right bg-blue-900/20 p-2 rounded-xl border border-blue-800/30">
                            <p className="text-blue-400 font-black">{dataObj.toLocaleDateString()}</p>
                            <p className="text-gray-300 font-bold">{dataObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                          </div>
                        </div>
                        <div className="mt-2 space-x-2 flex flex-wrap gap-y-2">
                          {servico && <div className="text-xs font-bold tracking-wide text-gray-300 bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700 inline-flex shadow-inner">
                            {servico.nome} <span className="text-gray-500 mx-2">|</span> <span className="text-green-400">R$ {servico.valor.toFixed(2)}</span>
                          </div>}
                          {a.produtosIds && a.produtosIds.map((pId: string) => {
                            const p = produtos.find(prod => prod.id === pId);
                            if (!p) return null;
                            return (
                              <div key={pId} className="text-xs font-bold tracking-wide text-blue-300 bg-blue-900/30 px-3 py-1.5 rounded-lg border border-blue-800/50 inline-flex shadow-inner">
                                {p.nome} <span className="text-blue-500/50 mx-2">|</span> <span className="text-blue-400">R$ {p.precoVenda.toFixed(2)}</span>
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="flex gap-3 pt-4 mt-2 border-t border-gray-800">
                          <button 
                            onClick={() => handleConcluir(a)}
                            className="flex-1 flex items-center justify-center gap-2 bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white border border-green-500/30 font-bold text-sm py-2.5 rounded-xl transition-all shadow-sm focus:ring-2 focus:ring-green-500"
                          >
                            <CheckCircleIcon className="w-5 h-5" /> Concluir Serviço
                          </button>
                          <button 
                            onClick={() => updateStatus(a.id, 'cancelado')}
                            className="flex items-center justify-center gap-1 bg-gray-800 hover:bg-red-600 text-gray-400 hover:text-white px-4 py-2.5 rounded-xl transition-all border border-gray-700 hover:border-red-500 focus:ring-2 focus:ring-red-500"
                            title="Cancelar Agendamento"
                          >
                            <XCircleIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-gray-800/50 p-6 md:p-8 rounded-2xl border border-gray-700/50 shadow-xl opacity-90 h-fit">
              <h2 className="text-xl font-bold text-white mb-6 border-b border-gray-700/50 pb-3">Histórico Recente</h2>
              {concluidos.length === 0 ? (
                <div className="w-full bg-gray-900/50 p-8 rounded-2xl border border-gray-800 text-center text-gray-500 flex flex-col items-center justify-center">
                  <CheckCircleIcon className="w-12 h-12 mb-3 text-gray-700" />
                  <p>Nenhum serviço concluído.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {concluidos.map(a => {
                    const dataObj = new Date(a.dataAgendada);
                    const servico = servicos.find(s => s.id === a.servicoId);
                    return (
                      <div key={a.id} className="bg-gray-900/40 border border-gray-800 p-4 rounded-xl flex flex-col gap-2 group hover:border-gray-600 transition-all">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-white">{a.cliente}</h3>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {servico && <span className="text-[10px] font-bold text-gray-400 bg-gray-800 border border-gray-700 px-2 py-0.5 rounded-md uppercase tracking-wider">{servico.nome}</span>}
                              {a.produtosIds && a.produtosIds.map((pId: string) => {
                                const p = produtos.find(prod => prod.id === pId);
                                if (!p) return null;
                                return <span key={pId} className="text-[10px] font-bold text-blue-300 bg-blue-900/30 border border-blue-800/50 px-2 py-0.5 rounded-md uppercase tracking-wider">{p.nome}</span>;
                              })}
                            </div>
                            {selectedBarbeiroId === 'todos' && (
                                <p className="text-[10px] uppercase font-bold text-gray-500 mt-2">
                                    ✂️ {barbeiros.find(b => b.id === a.barbeiroId)?.nome || 'Desconhecido'}
                                </p>
                            )}
                          </div>
                          <div className="text-right flex flex-col items-end gap-1">
                            <span className="text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-md tracking-wider uppercase">Concluído</span>
                            <p className="text-xs text-gray-500 font-medium">{dataObj.toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarbeiroAgendaPage;
