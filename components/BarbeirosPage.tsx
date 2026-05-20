import React, { useState, useEffect, useRef } from 'react';
import { useBarbeiros } from '../hooks/useBarbeiros';
import { useBarbeariaConfig, Produto, Servico, Custo } from '../hooks/useBarbeariaConfig';
import { useBarbeariaRegistros, useBarbeariaAgendamentos } from '../hooks/useBarbeariaRegistros';
import { UsersIcon, TrashIcon, PencilIcon, PlusIcon, TagIcon, CogIcon, CashIcon, DocumentTextIcon, ChartBarIcon, ClipboardListIcon, CheckCircleIcon, XCircleIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';
import { Empresa, User } from '../types';
import { API_BASE_URL } from '../constants';
import { CustomDatePicker } from './CustomDatePicker';
import MonthNavigator from './MonthNavigator';

const DIAS_SEMANA = [
  'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'
];

interface BarbeirosPageProps {
  user: User;
  empresa?: Empresa;
}

const BarbeirosPage: React.FC<BarbeirosPageProps> = ({ user, empresa }) => {
  const [activeTab, setActiveTab] = useState<'barbeiros' | 'produtos' | 'servicos' | 'custos' | 'metas' | 'registros'>('barbeiros');
  const tabsRef = useRef<HTMLDivElement>(null);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' });
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-gray-800 pb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600/20 p-3 rounded-2xl border border-blue-500/30">
            <UsersIcon className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Barbearia Admin</h1>
            <p className="text-gray-400 mt-1 text-sm font-medium">Gestão completa {empresa?.name ? `da ${empresa.name}` : ''}</p>
            {empresa?.linkId && (
              <p className="mt-2 text-sm font-bold bg-blue-500/10 text-blue-400 px-2 py-1 rounded inline-flex border border-blue-500/20">
                Código da Empresa: {empresa.linkId}
              </p>
            )}
          </div>
        </div>
        {empresa && (
          <div className="bg-gray-800 border border-gray-700 p-3 rounded-xl flex flex-col gap-2 mt-4">
            <span className="text-sm font-medium text-gray-300">Link de Agendamento:</span>
            <div className="flex items-center gap-3">
              <input 
                type="text" 
                readOnly 
                value={`${window.location.origin}/agendamento?empresaId=${empresa.linkId || empresa.id}`} 
                className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-gray-400 w-64 focus:outline-none"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/agendamento?empresaId=${empresa.linkId || empresa.id}`);
                  alert("Link copiado!");
                }}
                className="text-white hover:text-blue-300 transition-colors bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded-lg text-sm font-medium"
                title="Copiar Link"
              >
                Copiar 
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="relative group">
        <button 
          onClick={() => scrollTabs('left')}
          className="absolute -left-6 md:-left-8 top-1/2 -translate-y-1/2 bg-gray-800 text-white rounded-full p-2 z-10 shadow-lg border border-gray-700 hover:bg-gray-700 hover:text-blue-400 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 hidden md:block"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>

        <div 
          ref={tabsRef}
          className="flex overflow-x-auto gap-2 bg-gray-900 border border-gray-800 p-2 rounded-2xl scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          <button
            onClick={() => setActiveTab('barbeiros')}
            className={`flex items-center justify-center gap-2 py-3 px-6 text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'barbeiros' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <UsersIcon className="w-4 h-4" /> Barbeiros
          </button>
          <button
            onClick={() => setActiveTab('produtos')}
            className={`flex items-center justify-center gap-2 py-3 px-6 text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'produtos' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <TagIcon className="w-4 h-4" /> Produtos
          </button>
          <button
            onClick={() => setActiveTab('servicos')}
            className={`flex items-center justify-center gap-2 py-3 px-6 text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'servicos' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <DocumentTextIcon className="w-4 h-4" /> Serviços
          </button>
          <button
            onClick={() => setActiveTab('custos')}
            className={`flex items-center justify-center gap-2 py-3 px-6 text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'custos' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <CashIcon className="w-4 h-4" /> Custos
          </button>
          <button
            onClick={() => setActiveTab('metas')}
            className={`flex items-center justify-center gap-2 py-3 px-6 text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'metas' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <ChartBarIcon className="w-4 h-4" /> Metas
          </button>
          <button
            onClick={() => setActiveTab('registros')}
            className={`flex items-center justify-center gap-2 py-3 px-6 text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'registros' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <ClipboardListIcon className="w-4 h-4" /> Registros & Atendimentos
          </button>
        </div>

        <button 
          onClick={() => scrollTabs('right')}
          className="absolute -right-6 md:-right-8 top-1/2 -translate-y-1/2 bg-gray-800 text-white rounded-full p-2 z-10 shadow-lg border border-gray-700 hover:bg-gray-700 hover:text-blue-400 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 hidden md:block"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>

      {activeTab === 'barbeiros' && <TabBarbeiros empresa={empresa} user={user} empresaId={empresa?.linkId || empresa?.id} />}
      {activeTab === 'produtos' && <TabProdutos empresaId={empresa?.linkId || empresa?.id} />}
      {activeTab === 'servicos' && <TabServicos empresaId={empresa?.linkId || empresa?.id} />}
      {activeTab === 'custos' && <TabCustos empresaId={empresa?.linkId || empresa?.id} />}
      {activeTab === 'metas' && <TabMetas empresaId={empresa?.linkId || empresa?.id} />}
      {activeTab === 'registros' && <TabRegistros empresaId={empresa?.linkId} />}
      
    </div>
  );
};

// --- TABS COMPONENTS ---

const TabBarbeiros = ({ empresaId, empresa, user }: { empresaId?: string, empresa?: Empresa, user?: User }) => {
  const { barbeiros, addBarbeiro, removeBarbeiro, updateBarbeiro, reloadBarbeiros } = useBarbeiros(empresaId);
  const { addCusto } = useBarbeariaConfig(empresaId);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [comissao, setComissao] = useState('');
  const [corte, setCorte] = useState('');
  const [custoDiario, setCustoDiario] = useState('');
  const [dias, setDias] = useState<string[]>([]);

  const toggleDia = (dia: string) => {
    setDias(prev => prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]);
  };

  const handleEdit = (barbeiro: any) => {
    setEditingId(barbeiro.id);
    setNome(barbeiro.nome);
    setTelefone(barbeiro.telefone || '');
    setComissao(barbeiro.comissao?.toString() || '');
    setCorte(barbeiro.corte?.toString() || '');
    setDias(barbeiro.diasTrabalhados || []);
    setCustoDiario(''); // Maybe later keep track of this, but not in barbeiro directly
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNome('');
    setTelefone('');
    setComissao('');
    setCorte('');
    setCustoDiario('');
    setDias([]);
  };

  const [loading, setLoading] = useState(false);

  const handleCadastrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return alert("Nome é obrigatório");
    
    setLoading(true);

    const payload = {
        nome,
        telefone,
        comissao: Number(comissao) || 0,
        corte: Number(corte) || 0,
        diasTrabalhados: dias,
        linkId: empresaId
    };

    if (editingId) {
      // Editar
      if (updateBarbeiro) {
        await updateBarbeiro(editingId, payload);
      }
      cancelEdit();
      setLoading(false);
      return;
    }

    if (telefone.trim()) {
      const cleanPhone = telefone.replace(/\D/g, '');
      try {
        await fetch(`${API_BASE_URL}/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: nome.trim(),
            phone: cleanPhone,
            pass: 'Teste@1212@1212'
          })
        });
        
        // Atribui a permissão "minha agenda" (barbeiroAgenda) independentemente de ter criado agora ou já existir
        await fetch(`${API_BASE_URL}/permissions?userPhone=${cleanPhone}&add=true`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            permissions: ['barbeiroAgenda']
          })
        });

      } catch (err) {
        console.warn("Erro ao tentar cadastrar/vincular barbeiro na base de usuários:", err);
      }
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/barbers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (response.ok) {
            await reloadBarbeiros();
        } else {
            console.error("Erro ao salvar barbeiro via API", await response.text());
        }
    } catch (e) {
        console.error("Erro ao comunicar com /api/barbers", e);
    }

    const numCusto = Number(custoDiario) || 0;
    if (numCusto > 0 && dias.length > 0) {
      // Cálculo aproximado do custo variável mensal desse barbeiro (custo diário * n dias na semana * 4.33 semanas no mês)
      const custoMensal = numCusto * dias.length * 4.33; 
      addCusto({
        nome: `Diária/Variável - ${nome}`,
        tipo: 'variavel',
        valor: custoMensal
      });
    }

    cancelEdit();
    setLoading(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Formulário de Cadastro */}
      <div className="bg-gray-800/80 p-6 md:p-8 rounded-2xl border border-gray-700/50 shadow-xl h-fit">
        <h2 className="text-xl font-bold text-white mb-6 border-b border-gray-700/50 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {editingId ? <PencilIcon className="w-5 h-5 text-yellow-500" /> : <PlusIcon className="w-5 h-5 text-blue-500" />}
            {editingId ? 'Editar Barbeiro' : 'Cadastrar Barbeiro'}
          </div>
          {editingId && (
            <button onClick={cancelEdit} className="text-sm text-gray-400 hover:text-white underline">
              Cancelar
            </button>
          )}
        </h2>
        
        <form onSubmit={handleCadastrar} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nome *</label>
            <input 
              type="text" required
              value={nome} onChange={e => setNome(e.target.value)}
              className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              placeholder="Ex: João Silva"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Telefone</label>
            <input 
              type="text" 
              value={telefone} onChange={e => setTelefone(e.target.value)}
              className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              placeholder="Ex: 67999999999"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Comissão Produtos (%)</label>
              <input 
                type="number" step="0.1" min="0" max="100"
                value={comissao} onChange={e => setComissao(e.target.value)}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                placeholder="Ex: 10"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Comissão Serviços (%)</label>
              <input 
                type="number" step="0.1" min="0" max="100"
                value={corte} onChange={e => setCorte(e.target.value)}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                placeholder="Ex: 50"
              />
            </div>
          </div>

          {!editingId && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">Custo Variável por Dia de Trabalho</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">R$</span>
                <input 
                  type="number" step="0.01" min="0"
                  value={custoDiario} onChange={e => setCustoDiario(e.target.value)}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Ex: 20.00"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Será adicionado aos Custos Variáveis nas datas de trabalho.</p>
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-2">Dias Trabalhados</label>
            <div className="flex flex-wrap gap-2">
              {DIAS_SEMANA.map(dia => (
                <button
                  key={dia}
                  type="button"
                  onClick={() => toggleDia(dia)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    dias.includes(dia) 
                      ? 'bg-blue-600 border-blue-500 text-white' 
                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {dia}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-700">
            <button 
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 font-semibold py-2 px-4 rounded-lg transition-colors ${loading ? 'bg-blue-400 cursor-not-allowed' : (editingId ? 'bg-yellow-600 hover:bg-yellow-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white')}`}
            >
              {editingId ? <PencilIcon className="w-5 h-5" /> : <PlusIcon className="w-5 h-5" />}
              {loading ? 'Salvando...' : (editingId ? 'Salvar Alterações' : 'Salvar Barbeiro')}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white mb-2">Barbeiros Cadastrados</h2>
        
        {/* Proprietário Card */}
        {user && user.phone && !barbeiros.find(b => b.telefone && b.telefone.replace(/\D/g, '') === user.phone!.replace(/\D/g, '')) && (
          <div className="bg-gray-800/90 p-5 rounded-2xl border border-gray-700/50 flex flex-col gap-4 relative group hover:border-blue-500/30 transition-all shadow-md opacity-70">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-600/20 text-purple-400 flex items-center justify-center text-sm font-bold border border-purple-500/20">
                    {user.name && user.name.length > 1 ? user.name.substring(0, 2).toUpperCase() : 'PR'}
                  </div>
                  {user.name || 'Proprietário'} <span className="text-xs bg-purple-900/30 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/20">Proprietário</span>
                </h3>
                <p className="text-sm text-gray-400 ml-10">{user.phone}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Inativo</span>
                <button 
                  onClick={() => {
                    setNome(user.name || '');
                    setTelefone(user.phone || '');
                    // Scroll up to the form
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-10 h-6 bg-gray-700 rounded-full relative transition-colors duration-200 focus:outline-none"
                >
                  <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 transform translate-x-0" />
                </button>
              </div>
            </div>
            <div className="ml-10 text-xs text-gray-500">
              Para atuar como barbeiro na sua própria barbearia, ative a chave acima para preencher suas comissões e ser listado na agenda.
            </div>
          </div>
        )}

        {barbeiros.length === 0 ? (
          <div className="w-full bg-gray-900/50 p-8 rounded-2xl border border-gray-800 text-center text-gray-500 flex flex-col items-center justify-center mt-4">
            <UsersIcon className="w-12 h-12 mb-3 text-gray-700" />
            <p>Nenhum barbeiro cadastrado ainda.</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {barbeiros.map(barbeiro => {
              const isOwner = user && user.phone && barbeiro.telefone && barbeiro.telefone.replace(/\D/g, '') === user.phone.replace(/\D/g, '');
              
              return (
              <div key={barbeiro.id} className="bg-gray-800/90 p-5 rounded-2xl border border-gray-700/50 flex flex-col gap-4 relative group hover:border-blue-500/30 transition-all shadow-md">
                <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button 
                    onClick={() => handleEdit(barbeiro)}
                    className="text-gray-500 hover:text-yellow-400 bg-gray-900 p-2 rounded-lg"
                    title="Editar Barbeiro"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => removeBarbeiro(barbeiro.id)}
                    className="text-gray-500 hover:text-red-400 bg-gray-900 p-2 rounded-lg"
                    title="Excluir Barbeiro"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full ${isOwner ? 'bg-purple-600/20 text-purple-400 border border-purple-500/20' : 'bg-blue-600/20 text-blue-400 border border-blue-500/20'} flex items-center justify-center text-sm font-bold`}>
                      {barbeiro.nome.substring(0, 2).toUpperCase()}
                    </div>
                    {barbeiro.nome}
                    {isOwner && <span className="text-xs bg-purple-900/30 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/20">Proprietário</span>}
                  </h3>
                  {barbeiro.telefone && <p className="text-sm text-gray-400 ml-10">{barbeiro.telefone}</p>}
                </div>
                
                <div className="flex gap-4 p-3 bg-gray-900/50 rounded-xl border border-gray-800/50 ml-10">
                  <div className="flex-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Comissão Prod.</span>
                    <span className="text-blue-400 font-medium">{barbeiro.comissao}%</span>
                  </div>
                  <div className="flex-1 border-l border-gray-800/80 pl-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Comissão Serv.</span>
                    <span className="text-green-400 font-medium">{barbeiro.corte}%</span>
                  </div>
                </div>
                
                {barbeiro.diasTrabalhados.length > 0 && (
                  <div className="flex gap-1 ml-10 mt-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mr-2 flex items-center">Dias:</span>
                    <div className="flex flex-wrap gap-1">
                      {barbeiro.diasTrabalhados.map(dia => (
                        <span key={dia} className="text-xs bg-gray-700/50 text-gray-300 px-2 py-0.5 rounded-md border border-gray-600/50 font-medium">
                          {dia.slice(0, 3)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {empresaId && (
                  <div className="flex flex-col gap-1 ml-10 mt-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">Link de Agendamento (Barbeiro):</span>
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        readOnly 
                        value={`${window.location.origin}/agendamento?empresaId=${empresaId}&barbeiroId=${barbeiro.id}`} 
                        className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-gray-400 w-full focus:outline-none"
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                      />
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/agendamento?empresaId=${empresaId}&barbeiroId=${barbeiro.id}`);
                          alert("Link do barbeiro copiado!");
                        }}
                        className="text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 hover:bg-blue-500/20 px-2 py-1 flex items-center justify-center rounded border border-blue-500/20"
                        title="Copiar Link"
                      >
                       <ClipboardListIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const TabProdutos = ({ empresaId }: { empresaId?: string }) => {
  const { produtos, addProduto, removeProduto, updateProduto } = useBarbeariaConfig(empresaId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [custo, setCusto] = useState('');
  const [margemLucro, setMargemLucro] = useState('');
  const [comissao, setComissao] = useState('');
  const [precoVenda, setPrecoVenda] = useState('');
  const [estoque, setEstoque] = useState('');

  const numCusto = Number(custo) || 0;
  const numMargem = Number(margemLucro) || 0;
  const numComissao = Number(comissao) || 0;
  const semComissao = numCusto + (numCusto * (numMargem / 100));
  const precoIdeal = numComissao > 0 && numComissao < 100 ? semComissao / (1 - numComissao / 100) : semComissao;
  const numVenda = Number(precoVenda) || 0;
  const numEstoque = Number(estoque) || 0;
  const isAbaixoDoIdeal = numVenda > 0 && numVenda < precoIdeal;

  const handleEdit = (p: any) => {
    setEditingId(p.id);
    setNome(p.nome);
    setCategoria(p.categoria || '');
    setCusto(p.custo?.toString() || '');
    setMargemLucro(p.margemLucro?.toString() || '');
    setComissao(p.comissao?.toString() || '');
    setPrecoVenda(p.precoVenda?.toString() || '');
    setEstoque(p.estoque?.toString() || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNome(''); setCategoria(''); setCusto(''); setMargemLucro(''); setComissao(''); setPrecoVenda(''); setEstoque('');
  };

  const handleCadastrar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return alert("Nome é obrigatório");

    const payload = { 
      nome, 
      categoria: categoria || 'Geral', 
      custo: numCusto, 
      comissao: numComissao, 
      margemLucro: numMargem, 
      precoVenda: numVenda, 
      estoque: numEstoque, 
      linkId: empresaId 
    };

    if (editingId) {
      updateProduto(editingId, payload);
    } else {
      addProduto(payload);
    }
    
    cancelEdit();
  };

  const handleRestock = (p: any) => {
    const qty = window.prompt(`Quantos itens de ${p.nome} deseja adicionar ao estoque?`);
    if (qty && !isNaN(Number(qty))) {
      updateProduto(p.id, { estoque: (p.estoque || 0) + Number(qty) });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-gray-800/80 p-6 md:p-8 rounded-2xl border border-gray-700/50 shadow-xl h-fit">
        <h2 className="text-xl font-bold text-white mb-6 border-b border-gray-700/50 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {editingId ? <PencilIcon className="w-5 h-5 text-yellow-500" /> : <PlusIcon className="w-5 h-5 text-blue-500" />}
            {editingId ? 'Editar Produto' : 'Cadastrar Produto'}
          </div>
          {editingId && (
            <button onClick={cancelEdit} className="text-sm text-gray-400 hover:text-white underline">
              Cancelar
            </button>
          )}
        </h2>
        <form onSubmit={handleCadastrar} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nome do Produto</label>
              <input 
                type="text" required value={nome} onChange={e => setNome(e.target.value)}
                className="w-full bg-gray-900 text-white border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 shadow-inner"
                placeholder="Ex: Pomada Modeladora"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Categoria</label>
              <input 
                type="text" value={categoria} onChange={e => setCategoria(e.target.value)}
                className="w-full bg-gray-900 text-white border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 shadow-inner"
                placeholder="Ex: Cabelo"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Custo (R$)</label>
              <input 
                type="number" step="0.01" required value={custo} onChange={e => setCusto(e.target.value)}
                className="w-full bg-gray-900 text-white border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 shadow-inner"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Lucro (%)</label>
              <input 
                type="number" step="0.1" required value={margemLucro} onChange={e => setMargemLucro(e.target.value)}
                className="w-full bg-gray-900 text-white border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 shadow-inner"
                placeholder="Ex: 50"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Comissão Exclusiva (%) - Opcional</label>
              <input 
                type="number" step="0.1" value={comissao} onChange={e => setComissao(e.target.value)}
                className="w-full bg-gray-900 text-white border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 shadow-inner"
                placeholder="Deixe em branco para usar a comissão do barbeiro"
              />
            </div>
          </div>
          <div className="bg-blue-900/40 p-4 rounded-xl border border-blue-500/30 text-sm">
            <p className="text-blue-300">Preço Ideal Calculado: <strong className="text-white text-lg">R$ {precoIdeal.toFixed(2)}</strong></p>
            <p className="text-blue-200/60 text-xs mt-1">Cobre o custo de compra + {numMargem}% de margem. (A comissão do barbeiro é calculada na venda)</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Preço de Venda (R$)</label>
              <input 
                type="number" step="0.01" required value={precoVenda} onChange={e => setPrecoVenda(e.target.value)}
                className={`w-full bg-gray-900 text-white border rounded-xl px-4 py-3 text-sm focus:outline-none shadow-inner ${isAbaixoDoIdeal ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-blue-500'}`}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Estoque Atual</label>
              <input 
                type="number" required value={estoque} onChange={e => setEstoque(e.target.value)}
                className="w-full bg-gray-900 text-white border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 shadow-inner"
                placeholder="Ex: 10"
              />
            </div>
          </div>
          {isAbaixoDoIdeal && (
            <p className="text-red-400 text-xs mt-1 font-medium bg-red-500/10 p-2 rounded-lg border border-red-500/20">Aviso: O preço de venda está abaixo do valor ideal sugerido.</p>
          )}
          <div className="pt-4 border-t border-gray-700/50">
            <button type="submit" className={`w-full flex items-center justify-center gap-2 font-semibold py-3 px-4 rounded-xl transition-all shadow-md ${editingId ? 'bg-yellow-600 hover:bg-yellow-500 text-white hover:shadow-yellow-500/20' : 'bg-blue-600 hover:bg-blue-500 text-white hover:shadow-blue-500/20'}`}>
              {editingId ? <PencilIcon className="w-5 h-5" /> : <PlusIcon className="w-5 h-5" />}
              {editingId ? 'Salvar Alterações' : 'Salvar Produto'}
            </button>
          </div>
        </form>
      </div>
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white mb-4">Produtos Cadastrados</h2>
        {produtos.length === 0 ? (
          <div className="w-full bg-gray-900/50 p-8 rounded-2xl border border-gray-800 text-center text-gray-500 flex flex-col items-center justify-center mt-4">
            <TagIcon className="w-12 h-12 mb-3 text-gray-700" />
            <p>Nenhum produto cadastrado.</p>
          </div>
        ) : (
          <div className="grid gap-6 max-h-[650px] overflow-y-auto pr-2 custom-scrollbar" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {produtos.map(p => {
              const semComissao = p.custo + (p.custo * (p.margemLucro / 100));
              const ideal = p.comissao && p.comissao > 0 && p.comissao < 100 ? semComissao / (1 - p.comissao / 100) : semComissao;
              const isBelow = p.precoVenda < ideal;
              return (
                <div key={p.id} className={`bg-gray-800/90 p-5 rounded-2xl border flex flex-col gap-2 relative group flex-1 transition-all shadow-md hover:border-blue-500/30 ${isBelow ? 'border-yellow-600/50' : 'border-gray-700/50'}`}>
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => handleEdit(p)}
                      className="text-gray-500 hover:text-yellow-400 bg-gray-900 p-2 rounded-lg"
                      title="Editar Produto"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => removeProduto(p.id)} 
                      className="text-gray-500 hover:text-red-400 bg-gray-900 p-2 rounded-lg"
                      title="Excluir Produto"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="text-lg font-bold text-white pr-[72px] flex items-center gap-2">
                    {p.nome}
                  </h3>
                  {p.categoria && <span className="text-xs text-blue-400 font-medium tracking-wide uppercase bg-blue-500/10 w-fit px-2 py-0.5 rounded-md border border-blue-500/20">{p.categoria}</span>}
                  
                  <div className="grid grid-cols-3 gap-2 text-sm mt-3">
                    <div className="bg-gray-900/50 p-2 rounded-xl border border-gray-800/50 flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] uppercase tracking-wider text-gray-500 block">Custo</span>
                      <span className="font-medium text-gray-300">R$ {p.custo.toFixed(2)}</span>
                    </div>
                    <div className="bg-gray-900/50 p-2 rounded-xl border border-gray-800/50 flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] uppercase tracking-wider text-gray-500 block">Ideal</span>
                      <span className="font-medium text-blue-400">R$ {ideal.toFixed(2)}</span>
                    </div>
                    <div className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center ${isBelow ? 'bg-yellow-900/20 border-yellow-500/30' : 'bg-green-900/20 border-green-500/30'}`}>
                      <span className="text-[10px] uppercase tracking-wider text-gray-500 block">Venda</span>
                      <span className={`font-bold ${isBelow ? 'text-yellow-400' : 'text-green-400'}`}>R$ {p.precoVenda.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 text-xs mt-2 items-center flex-wrap">
                     <span className="bg-gray-900 px-2 py-1 rounded-md text-gray-400 border border-gray-800">Lucro: {p.margemLucro}%</span>
                     {p.comissao > 0 && <span className="bg-blue-900/20 px-2 py-1 rounded-md text-blue-400 border border-blue-800/50 font-medium tracking-wide">Comissão: {p.comissao}%</span>}
                     <span className="bg-gray-900 px-2 py-1 rounded-md text-gray-400 border border-gray-800 font-medium">Estoque: {p.estoque ?? 0}</span>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-700/50 flex gap-2">
                    <button 
                      onClick={() => handleRestock(p)}
                      className="w-full flex items-center justify-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 font-medium py-1.5 rounded-lg transition-all text-xs"
                    >
                      <PlusIcon className="w-3.5 h-3.5" /> Adicionar Estoque
                    </button>
                  </div>
                  
                  {isBelow && <div className="text-[11px] font-medium text-yellow-500 mt-2 flex items-center justify-center bg-yellow-500/10 py-1 rounded border border-yellow-500/20">Aviso: Preço de venda abaixo do ideal</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const TabServicos = ({ empresaId }: { empresaId?: string }) => {
  const { servicos, addServico, removeServico, updateServico } = useBarbeariaConfig(empresaId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<'cabelo' | 'barba' | string>('cabelo');
  const [valor, setValor] = useState('');

  const handleEdit = (s: any) => {
    setEditingId(s.id);
    setNome(s.nome);
    setCategoria(s.categoria || 'cabelo');
    setValor(s.valor?.toString() || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNome(''); setValor(''); setCategoria('cabelo');
  };

  const handleCadastrar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return alert("Nome é obrigatório");
    
    const payload = { nome, categoria, valor: Number(valor) || 0, linkId: empresaId };
    if (editingId) {
      updateServico(editingId, payload);
    } else {
      addServico(payload);
    }
    cancelEdit();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-gray-800/80 p-6 md:p-8 rounded-2xl border border-gray-700/50 shadow-xl h-fit">
        <h2 className="text-xl font-bold text-white mb-6 border-b border-gray-700/50 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {editingId ? <PencilIcon className="w-5 h-5 text-yellow-500" /> : <PlusIcon className="w-5 h-5 text-blue-500" />}
            {editingId ? 'Editar Serviço' : 'Cadastrar Serviço'}
          </div>
          {editingId && (
            <button onClick={cancelEdit} className="text-sm text-gray-400 hover:text-white underline">
              Cancelar
            </button>
          )}
        </h2>
        <form onSubmit={handleCadastrar} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nome do Serviço</label>
            <input 
              type="text" required value={nome} onChange={e => setNome(e.target.value)}
              className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              placeholder="Ex: Corte Degradê"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Categoria do Serviço</label>
            <select
              value={categoria} onChange={e => setCategoria(e.target.value)}
              className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="cabelo">Cabelo</option>
              <option value="barba">Barba</option>
              <option value="cabelo_e_barba">Cabelo e Barba</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Valor do Serviço (R$)</label>
            <input 
              type="number" step="0.01" required value={valor} onChange={e => setValor(e.target.value)}
              className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              placeholder="0.00"
            />
          </div>
          <div className="pt-4 border-t border-gray-700/50">
            <button type="submit" className={`w-full flex items-center justify-center gap-2 font-semibold py-2.5 px-4 rounded-xl transition-all shadow-md ${editingId ? 'bg-yellow-600 hover:bg-yellow-500 text-white hover:shadow-yellow-500/20' : 'bg-blue-600 hover:bg-blue-500 text-white hover:shadow-blue-500/20'}`}>
              {editingId ? <PencilIcon className="w-5 h-5" /> : <PlusIcon className="w-5 h-5" />}
              {editingId ? 'Salvar Alterações' : 'Salvar Serviço'}
            </button>
          </div>
        </form>
      </div>
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white mb-4">Serviços Cadastrados</h2>
        {servicos.length === 0 ? (
          <div className="w-full bg-gray-900/50 p-8 rounded-2xl border border-gray-800 text-center text-gray-500 flex flex-col items-center justify-center mt-4">
            <DocumentTextIcon className="w-12 h-12 mb-3 text-gray-700" />
            <p>Nenhum serviço cadastrado.</p>
          </div>
        ) : (
          <div className="grid gap-6 max-h-[650px] overflow-y-auto pr-2 custom-scrollbar" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {servicos.map(s => (
              <div key={s.id} className="bg-gray-800/90 p-5 rounded-2xl border border-gray-700/50 flex flex-col gap-2 group hover:border-blue-500/30 transition-all shadow-md relative">
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button 
                    onClick={() => handleEdit(s)}
                    className="text-gray-500 hover:text-yellow-400 bg-gray-900 p-2 rounded-lg"
                    title="Editar Serviço"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => removeServico(s.id)}
                    className="text-gray-500 hover:text-red-400 bg-gray-900 p-2 rounded-lg"
                    title="Excluir Serviço"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
                <div className="pr-[72px]">
                  <h3 className="font-bold text-white text-lg">{s.nome}</h3>
                  <div className="flex gap-2 mt-1">
                    <span className="text-blue-400 text-[11px] font-medium tracking-wide uppercase px-2 py-0.5 mt-1 bg-blue-500/10 border border-blue-500/20 rounded-md">{s.categoria}</span>
                  </div>
                  <div className="mt-4 bg-gray-900/50 p-3 rounded-xl border border-gray-800/50 flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Valor</span>
                    <p className="text-green-400 font-bold text-lg">R$ {s.valor.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const TabCustos = ({ empresaId }: { empresaId?: string }) => {
  const { custos, addCusto, removeCusto } = useBarbeariaConfig(empresaId);
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState('');
  const [tipo, setTipo] = useState<'fixo'|'variavel'>('fixo');

  const handleCadastrar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return alert("Nome é obrigatório");
    addCusto({ nome, valor: Number(valor) || 0, tipo, linkId: empresaId });
    setNome(''); setValor(''); setTipo('fixo');
  };

  const fixos = custos.filter(c => c.tipo === 'fixo');
  const variaveis = custos.filter(c => c.tipo === 'variavel');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-gray-800/80 p-6 md:p-8 rounded-2xl border border-gray-700/50 shadow-xl h-fit">
        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <PlusIcon className="w-5 h-5 text-blue-500" /> Cadastrar Custo Diário
        </h2>
        <p className="text-sm text-gray-400 mb-6 border-b border-gray-700/50 pb-4">
          Custos fixos não variam (ex: Aluguel). Custos variáveis dependem do volume de vendas (ex: Produtos de bancada).
        </p>

        <form onSubmit={handleCadastrar} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nome / Descrição</label>
            <input 
              type="text" required value={nome} onChange={e => setNome(e.target.value)}
              className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              placeholder="Ex: Aluguel"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Valor Mensal Estimado (R$)</label>
            <input 
              type="number" step="0.01" required value={valor} onChange={e => setValor(e.target.value)}
              className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Classificação (Tipo de Custo)</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input type="radio" checked={tipo === 'fixo'} onChange={() => setTipo('fixo')} className="text-blue-500 focus:ring-blue-500 bg-gray-700 border-gray-600" /> Custo Fixo
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input type="radio" checked={tipo === 'variavel'} onChange={() => setTipo('variavel')} className="text-blue-500 focus:ring-blue-500 bg-gray-700 border-gray-600" /> Custo Variável
              </label>
            </div>
          </div>
          <div className="pt-4 border-t border-gray-700/50">
            <button type="submit" className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-md hover:shadow-blue-500/20">
              <PlusIcon className="w-5 h-5" /> Salvar Custo
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Custos Fixos <span className="bg-gray-800 text-gray-400 font-medium text-xs py-1 px-2 rounded-lg ml-2">{fixos.length}</span></h2>
          {fixos.length === 0 ? <p className="text-sm text-gray-500 italic bg-gray-900/50 p-4 rounded-lg border border-gray-800">Nenhum registrado</p> : (
            <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {fixos.map(c => (
                <div key={c.id} className="bg-gray-800/80 p-4 rounded-2xl border border-gray-700/50 flex justify-between items-center group shadow-sm hover:border-orange-500/30 transition-all">
                  <span className="text-gray-200 font-medium">{c.nome}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-orange-400 text-sm font-bold bg-orange-500/10 px-2 py-1 rounded-lg">R$ {c.valor.toFixed(2)}</span>
                    <button onClick={() => removeCusto(c.id)} className="text-gray-500 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all p-1 bg-gray-900 rounded-md">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-2">
          <h2 className="text-xl font-bold text-white mb-4">Custos Variáveis <span className="bg-gray-800 text-gray-400 font-medium text-xs py-1 px-2 rounded-lg ml-2">{variaveis.length}</span></h2>
          {variaveis.length === 0 ? <p className="text-sm text-gray-500 italic bg-gray-900/50 p-4 rounded-lg border border-gray-800">Nenhum registrado</p> : (
            <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {variaveis.map(c => (
                <div key={c.id} className="bg-gray-800/80 p-4 rounded-2xl border border-gray-700/50 flex justify-between items-center group shadow-sm hover:border-blue-500/30 transition-all">
                  <span className="text-gray-200 font-medium">{c.nome}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-blue-400 text-sm font-bold bg-blue-500/10 px-2 py-1 rounded-lg">R$ {c.valor.toFixed(2)}</span>
                    <button onClick={() => removeCusto(c.id)} className="text-gray-500 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all p-1 bg-gray-900 rounded-md">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TabMetas = ({ empresaId }: { empresaId?: string }) => {
  const { servicos, custos, loadConfig } = useBarbeariaConfig(empresaId);
  const { barbeiros, reloadBarbeiros } = useBarbeiros(empresaId);
  const { registros } = useBarbeariaRegistros(empresaId);
  const metaKey = empresaId ? `barbearia_meta_${empresaId}` : 'barbearia_meta';
  
  const [metaLucro, setMetaLucro] = useState(() => {
    const saved = localStorage.getItem(metaKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.valor ? String(parsed.valor) : saved;
      } catch (e) {
        return saved;
      }
    }
    return '1000';
  });
  
  const [impostoAcima5k, setImpostoAcima5k] = useState('6'); // 6% padrao

  useEffect(() => {
    const metaObj = {
      valor: metaLucro,
      linkId: empresaId
    };
    localStorage.setItem(metaKey, JSON.stringify(metaObj));
  }, [metaLucro, metaKey, empresaId]);

  const handleReload = () => {
    loadConfig();
    reloadBarbeiros();
  };

  const numMeta = Number(metaLucro) || 0;
  const numImposto = Number(impostoAcima5k) || 0;

  const custoFixoTotal = custos.filter(c => c.tipo === 'fixo').reduce((acc, c) => acc + c.valor, 0);
  const custoVarTotal = custos.filter(c => c.tipo === 'variavel').reduce((acc, c) => acc + c.valor, 0);
  const custosTotais = custoFixoTotal + custoVarTotal;

  // Calculo de Medias (Ticket e Comissao)
  const ticketMedioServico = servicos.length > 0 ? servicos.reduce((acc, s) => acc + s.valor, 0) / servicos.length : 0;
  const comissaoMediaPerc = barbeiros.length > 0 ? barbeiros.reduce((acc, b) => acc + b.corte, 0) / barbeiros.length : 0;
  
  const custoComissaoMedia = ticketMedioServico * (comissaoMediaPerc / 100);
  const lucroBrutoMedioPorServico = ticketMedioServico - custoComissaoMedia;

  // Meta de Servicos (ignora imposto inicialmente para o calculo base)
  let qtdServicosMes = 0;
  let faturamentoNecessario = 0;

  if (lucroBrutoMedioPorServico > 0) {
    qtdServicosMes = (numMeta + custosTotais) / lucroBrutoMedioPorServico;
    faturamentoNecessario = qtdServicosMes * ticketMedioServico;

    // Se o faturamento passar de 5000, precisamos compensar o imposto
    if (faturamentoNecessario > 5000 && numImposto > 0) {
        // lucro_liquido = Faturamento - Custos - Comissoes - Imposto
        // Imposto = Faturamento * (numImposto/100)
        // lucro_liquido = Qtd * TicketMedio - Custos - Qtd * CustoComissao - Qtd * TicketMedio * (Imposto/100)
        // Qtd = (lucro_liquido + Custos) / (TicketMedio - CustoComissao - TicketMedio * (Imposto/100))
        const lucroPorServicoPosImposto = ticketMedioServico - custoComissaoMedia - (ticketMedioServico * (numImposto/100));
        if (lucroPorServicoPosImposto > 0) {
           qtdServicosMes = (numMeta + custosTotais) / lucroPorServicoPosImposto;
           faturamentoNecessario = qtdServicosMes * ticketMedioServico;
        }
    }
  }

  // Calculando o progresso atual com as regrinhas: subtrair comissões e impostos
  const faturamentoAtual = registros.reduce((acc, r) => acc + r.total, 0);
  
  // Calcular comissoes pagas nos registros para subtrair
  let totalComissoesPagas = 0;
  registros.forEach(r => {
      const barbeiro = barbeiros.find(b => b.id === r.barbeiroId);
      r.itens.forEach((item: any) => {
         if (item.tipo === 'servico') {
             const comissao = barbeiro ? barbeiro.corte : comissaoMediaPerc;
             totalComissoesPagas += item.valor * (comissao / 100);
         } else if (item.tipo === 'produto') {
             let comissaoProd = barbeiro ? barbeiro.comissao : 0; // fallback pra geral
             totalComissoesPagas += item.valor * (comissaoProd / 100);
         }
      });
  });

  let impostosAtuais = 0;
  if (faturamentoAtual > 5000) {
      impostosAtuais = faturamentoAtual * (numImposto / 100);
  }

  const lucroAtual = faturamentoAtual - custosTotais - totalComissoesPagas - impostosAtuais;
  
  // Quanto de faturamento da meta foi alcançado (%)
  const porcentagemFaturamento = faturamentoNecessario > 0 ? (faturamentoAtual / faturamentoNecessario) * 100 : 0;
  const porcentagemLucro = numMeta > 0 ? (Math.max(0, lucroAtual) / numMeta) * 100 : 0;

  const qtdServicosSemana = qtdServicosMes / 4.33; // Média de semanas num mês
  const qtdServicosDia = qtdServicosMes / 26; // Considerando 26 dias úteis

  return (
    <div className="space-y-8">
      {/* Settings da Meta */}
      <div className="bg-gray-800/80 p-6 md:p-8 rounded-2xl border border-gray-700/50 shadow-xl">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">Simulador de Metas e Ponto de Equilíbrio</h2>
          <button
            onClick={handleReload}
            className="px-4 py-2 bg-gray-900 text-sm font-medium text-gray-300 rounded-xl hover:bg-gray-700 transition-all border border-gray-700 inline-flex items-center gap-2 hover:text-white"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            Recarregar
          </button>
        </div>
        <p className="text-gray-400 mb-8 border-b border-gray-700/50 pb-6 text-sm">
          Descubra quantos serviços você precisa realizar para cobrir todos os seus custos e atingir a sua meta de lucro líquido desejado. Neste resumo, você confere o progresso atual.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 max-w-2xl">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Qual a sua Meta de Lucro Líquido mensal?</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">R$</span>
              <input 
                type="number" step="0.01" value={metaLucro} onChange={e => setMetaLucro(e.target.value)}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded pl-9 pr-3 py-2 text-lg font-bold focus:outline-none focus:border-blue-500"
                placeholder="1000.00"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Este é o valor livre que você deseja que a barbearia lucre, já pagando todos os custos e comissões.</p>
          </div>
          <div>
             <label className="block text-sm text-gray-400 mb-1">Taxa de Imposto (%)</label>
            <div className="relative">
              <input 
                type="number" step="1" value={impostoAcima5k} onChange={e => setImpostoAcima5k(e.target.value)}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 text-lg font-bold focus:outline-none focus:border-blue-500"
                placeholder="6"
              />
              <span className="absolute right-3 top-2 text-gray-500">%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Aplicável somente quando o faturamento mensal exceder R$ 5.000,00.</p>
          </div>
        </div>

        {/* Progresso das Metas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-700/50 pt-8">
          {/* Progresso de Faturamento */}
          <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
            <h3 className="text-xs text-gray-400 mb-3 font-bold uppercase tracking-widest">Faturamento (Ponto de Equilíbrio)</h3>
            <div className="flex justify-between items-end mb-4">
              <span className="text-3xl font-black text-white">R$ {faturamentoAtual.toFixed(2)}</span>
              <span className="text-sm font-medium text-gray-500">/ R$ {faturamentoNecessario.toFixed(2)}</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${porcentagemFaturamento >= 100 ? 'bg-green-500' : 'bg-blue-500'}`} 
                style={{ width: `${Math.min(100, porcentagemFaturamento)}%` }}
              ></div>
            </div>
            <p className="text-right text-xs mt-2 font-bold text-gray-500">{porcentagemFaturamento.toFixed(1)}%</p>
          </div>

          {/* Progresso de Lucro Líquido */}
          <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
            <h3 className="text-xs text-gray-400 mb-3 font-bold uppercase tracking-widest">Lucro Líquido</h3>
            <div className="flex justify-between items-end mb-4">
              <span className={`text-3xl font-black ${lucroAtual >= 0 ? 'text-green-400' : 'text-red-400'}`}>R$ {lucroAtual.toFixed(2)}</span>
              <span className="text-sm font-medium text-gray-500">/ R$ {numMeta.toFixed(2)}</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${porcentagemLucro >= 100 ? 'bg-green-500' : 'bg-green-400'}`} 
                style={{ width: `${Math.min(100, porcentagemLucro)}%` }}
              ></div>
            </div>
            <p className="text-right text-xs mt-2 font-bold text-gray-500">{porcentagemLucro.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Resumo Financeiro */}
        <div className="bg-gray-800/80 p-8 rounded-2xl border border-gray-700/50 shadow-xl h-fit">
          <h3 className="text-xl font-bold text-white mb-6">Resumo Financeiro Mensal</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-gray-900/50 p-4 rounded-xl border border-gray-800">
              <span className="text-gray-300 font-medium">Custos Fixos Estimados</span>
              <span className="text-orange-400 font-bold bg-orange-500/10 px-2 py-1 rounded-lg">R$ {custoFixoTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center bg-gray-900/50 p-4 rounded-xl border border-gray-800">
              <span className="text-gray-300 font-medium">Custos Variáveis Estimados</span>
              <span className="text-blue-400 font-bold bg-blue-500/10 px-2 py-1 rounded-lg">R$ {custoVarTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center bg-gray-900/50 p-4 rounded-xl border border-gray-800">
              <span className="text-gray-300 font-medium">Meta de Lucro Líquido</span>
              <span className="text-green-400 font-bold bg-green-500/10 px-2 py-1 rounded-lg">R$ {numMeta.toFixed(2)}</span>
            </div>
            <div className="mt-6 flex justify-between items-center p-5 rounded-2xl bg-blue-600/10 border border-blue-500/30">
              <span className="text-blue-100 font-semibold tracking-wide">Faturamento Necessário</span>
              <span className="text-blue-400 font-black text-2xl">R$ {faturamentoNecessario.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Projeção de Serviços */}
        <div className="bg-gray-800/80 p-8 rounded-2xl border border-gray-700/50 shadow-xl relative overflow-hidden h-fit">
          <div className="absolute -top-10 -right-10 p-4 opacity-[0.03] pointer-events-none">
            <ChartBarIcon className="w-64 h-64" />
          </div>
          
          <h3 className="text-xl font-bold text-white mb-6 relative z-10">Projeção de Serviços Adicionais</h3>

          {servicos.length === 0 || barbeiros.length === 0 ? (
            <div className="text-sm text-yellow-500 bg-yellow-500/10 p-5 rounded-xl border border-yellow-500/30 font-medium">
              Cadastre pelo menos 1 barbeiro e 1 serviço para ver a projeção.
            </div>
          ) : (
            <div className="space-y-6 relative z-10">
              <div className="text-sm text-gray-300 bg-gray-900/50 p-5 rounded-xl border border-gray-800 leading-relaxed">
                <div className="flex justify-between mb-2"><span>Ticket Médio de Serviço:</span> <strong className="text-white">R$ {ticketMedioServico.toFixed(2)}</strong></div>
                <div className="flex justify-between mb-2"><span>Média de Comissão:</span> <strong className="text-white">{comissaoMediaPerc.toFixed(1)}%</strong></div>
                <div className="flex justify-between pt-2 border-t border-gray-800 mt-2"><span>Lucro Médio por Serviço:</span> <strong className="text-green-400">R$ {lucroBrutoMedioPorServico.toFixed(2)}</strong></div>
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-4 font-medium">Meta de serviços para atingir o Ponto de Equilíbrio e Lucro Livre:</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-900/80 p-4 rounded-xl text-center border-b-2 border-blue-500 shadow-inner">
                    <div className="text-3xl font-black text-white">{Math.ceil(qtdServicosMes)}</div>
                    <div className="text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-widest">Mês</div>
                  </div>
                  <div className="bg-gray-900/80 p-4 rounded-xl text-center border-b-2 border-green-500 shadow-inner">
                    <div className="text-3xl font-black text-white">{Math.ceil(qtdServicosSemana)}</div>
                    <div className="text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-widest">Semana</div>
                  </div>
                  <div className="bg-gray-900/80 p-4 rounded-xl text-center border-b-2 border-purple-500 shadow-inner">
                    <div className="text-3xl font-black text-white">{Math.ceil(qtdServicosDia)}</div>
                    <div className="text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-widest">Dia</div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4 text-center">*(Considerando 26 dias úteis/mês)*</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TabRegistros = ({ empresaId }: { empresaId?: string }) => {
  const { registros, addRegistro, removeRegistro, loadRegistros } = useBarbeariaRegistros(empresaId);
  const { agendamentos, updateStatus, loadAgendamentos } = useBarbeariaAgendamentos(empresaId);
  const { barbeiros, reloadBarbeiros } = useBarbeiros(empresaId);
  const { servicos, loadConfig, produtos, updateProduto } = useBarbeariaConfig(empresaId);
  
  const [dataFiltro, setDataFiltro] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
  });

  const [activeSubTab, setActiveSubTab] = useState<'aguardando' | 'diario' | 'mensal' | 'historico'>('aguardando');

  const handleReload = () => {
    loadRegistros();
    loadAgendamentos();
    reloadBarbeiros();
    loadConfig();
  };

  const pendentes = agendamentos.filter(a => a.status === 'finalizado').sort((a, b) => new Date(a.dataAgendada).getTime() - new Date(b.dataAgendada).getTime());
  
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

  // Calculando comissões do dia selecionado
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
    <div className="space-y-6">
      {/* Tabs Nav for Sub-sections */}
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

      {activeSubTab === 'diario' && (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-gray-800/80 p-6 md:p-8 rounded-2xl border border-gray-700/50 shadow-xl">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4 border-b border-gray-700/50 pb-4">
              <div>
                 <h2 className="text-xl font-bold text-white flex items-center gap-2">
                   Resumo Diário de Comissões
                 </h2>
                 <p className="text-gray-400 text-sm mt-1">Valores agrupados por barbeiro referentes à data selecionada.</p>
              </div>
              <div className="w-full md:w-96">
                <CustomDatePicker 
                  selectedDate={dataFiltro} 
                  onChange={(d) => setDataFiltro(d)} 
                  allowPast={true} 
                />
              </div>
            </div>
            
            <div>
                <h3 className="text-lg font-bold text-gray-300 mb-4 tracking-wide">Hoje ({dataFiltro.split('-').reverse().join('/')})</h3>
                {comissoesDia.length === 0 ? (
                  <div className="w-full bg-gray-900/50 p-6 rounded-2xl border border-gray-800 text-center text-gray-500">
                    <p>Nenhuma venda ou serviço registrado para esta data.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {comissoesDia.map((c, idx) => (
                      <div key={idx} className="bg-gray-900/60 p-5 rounded-2xl border border-gray-700 flex flex-col gap-2 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                            <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
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
                          <span className="text-gray-300 font-bold text-sm">Comissão a Pagar</span>
                          <span className="text-green-400 font-black text-xl">R$ {c.totalComissao.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center mt-1 bg-blue-900/10 p-2 rounded-lg border border-blue-500/20">
                          <span className="text-blue-200 font-bold text-xs uppercase">Liquidez (Barbearia)</span>
                          <span className="text-blue-400 font-black text-sm">R$ {c.caixaBarbearia.toFixed(2)}</span>
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
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-gray-800/80 p-6 md:p-8 rounded-2xl border border-gray-700/50 shadow-xl">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4 border-b border-gray-700/50 pb-4">
              <div>
                 <h2 className="text-xl font-bold text-white flex items-center gap-2">
                   Resumo Mensal de Comissões
                 </h2>
                 <p className="text-gray-400 text-sm mt-1">Valores acumulados para o mês selecionado ({dataFiltro.split('-').slice(0,2).reverse().join('/')}).</p>
              </div>
              <div className="w-full md:w-96">
                <MonthNavigator
                  currentDate={new Date(parseInt(dataFiltro.split('-')[0]), parseInt(dataFiltro.split('-')[1]) - 1, 1)}
                  setCurrentDate={(d) => {
                    const yyyy = d.getFullYear();
                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                    setDataFiltro(`${yyyy}-${mm}-01`);
                  }}
                />
              </div>
            </div>

            <div>
                <h3 className="text-lg font-bold text-gray-300 mb-4 tracking-wide">Mês de {dataFiltro.split('-').slice(0,2).reverse().join('/')}</h3>
                {comissoesMes.length === 0 ? (
                  <div className="w-full bg-gray-900/50 p-6 rounded-2xl border border-gray-800 text-center text-gray-500">
                    <p>Nenhum registro encontrado para este mês.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {comissoesMes.map((c, idx) => (
                      <div key={idx} className="bg-gray-900/40 p-5 rounded-2xl border border-gray-700 flex flex-col gap-2 relative overflow-hidden">
                        <h3 className="font-bold text-white text-lg z-10">{c.barbeiro.nome}</h3>
                        <div className="text-xs text-gray-400 mb-2 border-b border-gray-800 pb-2">Fat. Bruto Mensal: <span className="font-bold text-white">R$ {c.faturamentoTotal.toFixed(2)}</span></div>
                        
                        <div className="flex justify-between items-center text-sm border-b border-gray-800 pb-2">
                          <span className="text-gray-400">Serviços</span>
                          <span className="text-green-400 font-medium">R$ {c.comissaoServicos.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm border-b border-gray-800 pb-2">
                          <span className="text-gray-400">Produtos</span>
                          <span className="text-blue-400 font-medium">R$ {c.comissaoProdutos.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-1 border-t border-gray-800">
                          <span className="text-gray-300 font-bold text-sm">Comissão Mensal</span>
                          <span className="text-emerald-400 font-black text-lg">R$ {c.totalComissao.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center mt-1 bg-blue-900/10 p-2 rounded-lg border border-blue-500/20">
                          <span className="text-blue-200 font-bold text-xs uppercase">Liquidez (Barbearia)</span>
                          <span className="text-blue-400 font-black text-sm">R$ {c.caixaBarbearia.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'aguardando' && (
        <div className="bg-gray-800/80 p-6 md:p-8 rounded-2xl border border-gray-700/50 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">Aguardando Pagamento <span className="bg-gray-900 border border-gray-700 text-sm font-bold text-blue-400 py-0.5 px-2 rounded-lg">{pendentes.length}</span></h2>
          <button
            onClick={handleReload}
            className="px-3 py-1 bg-gray-700 text-xs text-gray-300 rounded hover:bg-gray-600 transition border border-gray-600 inline-flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            Recarregar
          </button>
        </div>
        
        {pendentes.length === 0 ? (
          <div className="w-full bg-gray-900/50 p-8 rounded-2xl border border-gray-800 text-center text-gray-500 flex flex-col items-center justify-center">
            <svg className="w-12 h-12 mb-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            <p>Nenhum atendimento aguardando pagamento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendentes.map(a => {
              const dataAgendada = new Date(a.dataAgendada);
              const dataStr = dataAgendada.toLocaleDateString();
              const horaStr = dataAgendada.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
              const barbeiro = barbeiros.find(b => b.id === a.barbeiroId)?.nome || 'Qualquer um';
              
              const servicosDoAgendamento: any[] = [];
              if (a.servicosIds && a.servicosIds.length > 0) {
                a.servicosIds.forEach((sId: string) => {
                  const s = servicos.find(x => x.id === sId);
                  if (s) servicosDoAgendamento.push(s);
                });
              } else if (a.servicoId) {
                const s = servicos.find(x => x.id === a.servicoId);
                if (s) servicosDoAgendamento.push(s);
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
                        <div key={idx} className="text-sm text-gray-300 bg-gray-800 px-3 py-1.5 rounded-lg inline-flex justify-between w-full shadow-inner border border-gray-700/50">
                          <span className="font-medium">{s.nome}</span>
                          <span className="text-green-400 font-bold">R$ {s.valor.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex gap-2 mt-2 pt-3 border-t border-gray-700/50">
                    <button 
                      onClick={() => handleConcluir(a)}
                      className="w-full flex items-center justify-center gap-2 bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white border border-green-500/30 font-medium text-sm py-2 rounded-xl transition-all"
                    >
                      <CheckCircleIcon className="w-4 h-4" /> Marcar como Pago
                    </button>
                    {a.produtosIds && a.produtosIds.length > 0 && (
                      <div className="absolute top-4 right-12 text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-md font-bold uppercase">
                        + {a.produtosIds.length} Prod
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}

      {activeSubTab === 'historico' && (
      <div className="bg-gray-800/80 p-6 md:p-8 rounded-2xl border border-gray-700/50 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-6">Histórico de Registros <span className="text-gray-500 text-sm font-normal ml-2">(Vendas/Cortes)</span></h2>
        {registros.length === 0 ? (
          <div className="w-full bg-gray-900/50 p-8 rounded-2xl border border-gray-800 text-center text-gray-500 flex flex-col items-center justify-center">
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
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs font-medium text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">{dataObj.toLocaleDateString()} {dataObj.toLocaleTimeString()}</p>
                      <p className="text-xs text-gray-400 font-medium">Barbeiro: <span className="text-gray-300">{r.barbeiroNome || 'N/A'}</span></p>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {r.itens.map((item, idx) => (
                        <span key={idx} className="bg-gray-800 border border-gray-700 text-gray-300 text-xs px-2.5 py-1 rounded-lg">
                          <span className="text-gray-400 mr-1">{item.tipo === 'servico' ? '✂️' : '🧴'}</span>
                          {item.nome} <span className="text-gray-500 ml-1">R$ {item.valor.toFixed(2)}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between md:flex-col md:items-end gap-2 border-t md:border-t-0 md:border-l border-gray-800 pt-3 md:pt-0 md:pl-4">
                    <span className="text-green-400 font-black text-xl bg-green-500/10 px-3 py-1 rounded-lg border border-green-500/20">R$ {r.total.toFixed(2)}</span>
                    <button onClick={() => removeRegistro(r.id)} className="text-gray-500 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all bg-gray-800 p-1.5 rounded-md mt-2">
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
    </div>
  );
};

export default BarbeirosPage;