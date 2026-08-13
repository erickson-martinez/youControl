import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useBarbeiros } from '../hooks/useBarbeiros';
import { useBarbeariaConfig, Produto, Servico, Custo } from '../hooks/useBarbeariaConfig';
import { useBarbeariaRegistros, useBarbeariaAgendamentos, formatarDataHora, calcularResumoPagamento } from '../hooks/useBarbeariaRegistros';
import { UsersIcon, TrashIcon, PencilIcon, PlusIcon, TagIcon, CogIcon, CashIcon, DocumentTextIcon, ChartBarIcon, ClipboardListIcon, CheckCircleIcon, XCircleIcon, ChevronLeftIcon, ChevronRightIcon, InformationCircleIcon, XIcon } from './icons';
import { Empresa, User } from '../types';
import { API_BASE_URL } from '../constants';
import { CustomDatePicker } from './CustomDatePicker';
import MonthNavigator from './MonthNavigator';
import ConfirmationModal from './ConfirmationModal';
import BarbeiroAgendaPage from './BarbeiroAgendaPage';
import { CadastrarAssinaturaForm, SubscriptionPlan, SubscriptionClient } from './CadastrarAssinaturaForm';
import { commissionsService, Commission, extractValidEmail } from '../services/commissionsService';

const DIAS_SEMANA = [
  'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'
];

interface BarbeirosPageProps {
  user: User;
  empresa?: Empresa;
}

const BarbeirosPage: React.FC<BarbeirosPageProps> = ({ user, empresa }) => {
  const [activeTab, setActiveTab] = useState<'agenda' | 'barbeiros' | 'produtos' | 'servicos' | 'custos' | 'metas' | 'registros' | 'assinaturas'>('agenda');
  const tabsRef = useRef<HTMLDivElement>(null);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' });
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-start justify-between border-b border-gray-800 pb-6 gap-4">
        <div className="flex items-start gap-4">
          <div className="bg-blue-600/20 p-3 rounded-2xl border border-blue-500/30 mt-1">
            <UsersIcon className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Barbearia Admin</h1>
            <p className="text-gray-400 mt-1 text-sm font-medium">Gestão completa {empresa?.name ? `da ${empresa.name}` : ''}</p>
            {empresa?.linkId && (
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/agendamento?empresaId=${empresa.id}`);
                    alert("Link de agendamento copiado para a área de transferência!");
                  }}
                  className="flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-bold text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-all border border-gray-700 shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                  Compartilhar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="relative group mb-4">
        <button 
          onClick={() => scrollTabs('left')}
          className="absolute -left-3 md:-left-4 top-1/2 -translate-y-1/2 bg-gray-800 text-white rounded-full p-2 z-10 shadow-lg border border-gray-700 hover:bg-gray-700 hover:text-blue-400 transition-all flex items-center justify-center"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>

        <div 
          ref={tabsRef}
          className="flex overflow-x-auto gap-2 bg-gray-900 border border-gray-800 p-2 rounded-2xl scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] mx-4 md:mx-6"
        >
          <button
            onClick={() => setActiveTab('agenda')}
            className={`flex items-center justify-center gap-2 py-3 px-6 text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'agenda' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <ClipboardListIcon className="w-4 h-4" /> Agenda Geral
          </button>
          <button
            onClick={() => setActiveTab('assinaturas')}
            className={`flex items-center justify-center gap-2 py-3 px-6 text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'assinaturas' ? 'bg-purple-600 text-white shadow-md' : 'text-purple-400 hover:text-white hover:bg-purple-900/40'
            }`}
          >
            <span>⭐</span> Cadastrar Assinatura
          </button>
          <button
            onClick={() => setActiveTab('barbeiros')}
            className={`flex items-center justify-center gap-2 py-3 px-6 text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'barbeiros' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <UsersIcon className="w-4 h-4" /> Equipe
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
          className="absolute -right-3 md:-right-4 top-1/2 -translate-y-1/2 bg-gray-800 text-white rounded-full p-2 z-10 shadow-lg border border-gray-700 hover:bg-gray-700 hover:text-blue-400 transition-all flex items-center justify-center"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>

      {activeTab === 'agenda' && (
        <div className="-mx-4 md:-mx-8 -mt-4">
          <BarbeiroAgendaPage user={user} empresa={empresa} isAdmin={true} linkId={empresa?.id} />
        </div>
      )}
      {activeTab === 'assinaturas' && (
        <CadastrarAssinaturaForm
          linkId={empresa?.id || empresa?.linkId || ''}
          onSuccess={() => {
            alert('Assinatura cadastrada com sucesso!');
          }}
        />
      )}
      {activeTab === 'barbeiros' && <TabBarbeiros empresa={empresa} user={user} empresaId={empresa?.id} />}
      {activeTab === 'produtos' && <TabProdutos empresaId={empresa?.id} />}
      {activeTab === 'servicos' && <TabServicos empresaId={empresa?.id} />}
      {activeTab === 'custos' && <TabCustos empresaId={empresa?.id} user={user} />}
      {activeTab === 'metas' && <TabMetas empresaId={empresa?.id} />}
      {activeTab === 'registros' && <TabRegistros empresaId={empresa?.id} user={user} />}
      
    </div>
  );
};

// --- TABS COMPONENTS ---

const TabBarbeiros = ({ empresaId, empresa, user }: { empresaId?: string, empresa?: Empresa, user?: User }) => {
  const { barbeiros, addBarbeiro, removeBarbeiro, updateBarbeiro, reloadBarbeiros } = useBarbeiros(empresaId);
  const { addCusto } = useBarbeariaConfig(empresaId);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [comissao, setComissao] = useState('');
  const [corte, setCorte] = useState('');
  const [custoDiario, setCustoDiario] = useState('');
  const [dias, setDias] = useState<string[]>([]);
  const [cargo, setCargo] = useState<'barbeiro' | 'caixa'>('barbeiro');

  const toggleDia = (dia: string) => {
    setDias(prev => prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]);
  };

  const handleEdit = (barbeiro: any) => {
    setEditingId(barbeiro.id);
    setNome(barbeiro.nome);
    setEmail(barbeiro.idEmail || barbeiro.email || barbeiro.telefone || '');
    setComissao(barbeiro.comissao?.toString() || '');
    setCorte(barbeiro.corte?.toString() || '');
    setDias(barbeiro.diasTrabalhados || []);
    setCargo(barbeiro.cargo || 'barbeiro');
    setCustoDiario(''); // Maybe later keep track of this, but not in barbeiro directly
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNome('');
    setEmail('');
    setComissao('');
    setCorte('');
    setCustoDiario('');
    setCargo('barbeiro');
    setDias([]);
  };

  const handleExcluirBarbeiro = async (barbeiro: any) => {
    alert("A exclusão de membros deve ser feita diretamente na tela de Recursos Humanos (RH).");
  };

  const [loading, setLoading] = useState(false);

  const handleCadastrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return alert("Nome é obrigatório");
    if (!editingId) return alert("Criação de novos membros deve ser feita no RH.");
    
    setLoading(true);

    const payload = {
        nome,
        email,
        telefone: email,
        idEmail: email,
        comissao: cargo === 'caixa' ? 0 : (Number(comissao) || 0),
        corte: cargo === 'caixa' ? 0 : (Number(corte) || 0),
        diasTrabalhados: dias,
        linkId: empresaId,
        cargo
    };

    if (editingId && editingId !== 'new_owner') {
        const success = updateBarbeiro ? await updateBarbeiro(editingId, payload) : false;
        if (success) {
            alert("Configurações do membro atualizadas com sucesso!");
            cancelEdit();
        }
    } else if (editingId === 'new_owner') {
        const success = addBarbeiro ? await addBarbeiro(payload) : false;
        if (success) {
            alert("Proprietário configurado como barbeiro!");
            cancelEdit();
        }
    }
    
    setLoading(false);
  };

  return (
    <div className="flex flex-col md:p-8">
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-800 p-6 sm:p-8 rounded-2xl border border-gray-700/50 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-6 border-b border-gray-700/50 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PencilIcon className="w-5 h-5 text-yellow-500" />
                Editar Membro
              </div>
              <button type="button" onClick={cancelEdit} className="text-gray-400 hover:text-white transition-colors">
                 <XIcon className="w-6 h-6" />
              </button>
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
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <input 
                  type="text" 
                  value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
                  placeholder="Ex: 67999999999"
                  disabled
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Cargo</label>
                <select
                  value={cargo} onChange={e => setCargo(e.target.value as 'barbeiro'|'caixa')}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="barbeiro">Barbeiro</option>
                  <option value="caixa">Caixa</option>
                </select>
              </div>

              {cargo === 'barbeiro' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div className="pt-4 mt-6 border-t border-gray-700 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className={`flex items-center justify-center gap-2 font-semibold py-2 px-6 rounded-lg transition-colors ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                >
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-4 w-full mx-auto max-w-4xl">
        <div className="flex items-center mb-2">
            <h2 className="text-xl font-bold text-white">Equipe Cadastrada</h2>
            <div className="relative group flex items-center">
                <InformationCircleIcon className="w-5 h-5 text-gray-400 hover:text-white cursor-help transition-colors" />
                <div className="absolute hidden group-hover:block bg-gray-900 border border-gray-700 text-gray-300 text-xs p-4 rounded-xl shadow-2xl w-72 z-50 left-1/2 -translate-x-1/2 top-full mt-2 pointer-events-none">
                    <p className="mb-2">A criação e exclusão de novos membros deve ser feita pela aba de <strong className="text-white">RH</strong> da plataforma, bem como atribuição da função.</p>
                    <p>Neste local, você pode <strong className="text-white">editar</strong> as configurações internas (como comissões e dias de trabalho) da equipe ativa.</p>
                </div>
            </div>
        </div>
        
        {/* Proprietário Card */}
        {user && user.email && !barbeiros.filter(b => b.linkId === empresaId).find(b => {
          const uStr = user.email!.trim().toLowerCase();
          const bStr = (b.email || '').trim().toLowerCase();
          return uStr === bStr || (uStr.replace(/\D/g, '') && uStr.replace(/\D/g, '') === bStr.replace(/\D/g, ''));
        }) && (
          <div className="bg-gray-800/90 p-5 rounded-2xl border border-gray-700/50 flex flex-col gap-4 relative group hover:border-blue-500/30 transition-all shadow-md opacity-70">
            <div className="flex justify-between items-start gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 flex-wrap">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600/20 text-purple-400 flex items-center justify-center text-sm font-bold border border-purple-500/20">
                    {user.name && user.name.length > 1 ? user.name.substring(0, 2).toUpperCase() : 'PR'}
                  </div>
                  <span className="truncate">{user.name || 'Proprietário'}</span> 
                  <span className="flex-shrink-0 text-xs bg-purple-900/30 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/20 whitespace-nowrap">Proprietário</span>
                </h3>
                <p className="text-sm text-gray-400 ml-10 truncate">{user.email}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Inativo</span>
                <button 
                  onClick={() => {
                    setNome(user.name || '');
                    setEmail(user.idEmail || user.email || user.id || '');
                    setEditingId('new_owner');
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

        {barbeiros.filter(b => b.linkId === empresaId).length === 0 ? (
          <div className="w-full bg-gray-900/50 p-5 md:p-8 rounded-2xl border border-gray-800 text-center text-gray-500 flex flex-col items-center justify-center mt-4">
            <UsersIcon className="w-12 h-12 mb-3 text-gray-700" />
            <p>Nenhum barbeiro cadastrado ainda.</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {barbeiros.filter(b => b.linkId === empresaId).map(barbeiro => {
              const isOwner = user && user.email && barbeiro.email && (
                user.email.trim().toLowerCase() === barbeiro.email.trim().toLowerCase() ||
                (user.email.replace(/\D/g, '') && user.email.replace(/\D/g, '') === barbeiro.email.replace(/\D/g, ''))
              );
              
              return (
              <div key={barbeiro.id} className="bg-gray-800/90 p-5 rounded-2xl border border-gray-700/50 flex flex-col gap-4 relative group hover:border-blue-500/30 transition-all shadow-md">
                <div className="absolute top-4 right-4 flex items-center gap-3">
                  <span className={`flex-shrink-0 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${barbeiro.cargo === 'caixa' ? 'bg-orange-900/30 text-orange-400 border-orange-500/20' : 'bg-blue-900/30 text-blue-400 border-blue-500/20'}`}>
                    {barbeiro.cargo === 'caixa' ? 'Caixa' : 'Barbeiro'}
                  </span>
                  <div className="flex items-center gap-2 transition-all">
                    <button 
                      onClick={() => handleEdit(barbeiro)}
                      className="text-gray-500 hover:text-yellow-400 bg-gray-900 p-2 rounded-lg"
                      title="Editar Barbeiro"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleExcluirBarbeiro(barbeiro)}
                      className="text-gray-500 hover:text-red-400 bg-gray-900 p-2 rounded-lg"
                      title="Excluir Barbeiro"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="pr-[160px] min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 flex-wrap">
                    <span className="truncate">{barbeiro.nome}</span>
                    {isOwner && <span className="flex-shrink-0 text-xs bg-purple-900/30 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/20 whitespace-nowrap">Proprietário</span>}
                  </h3>
                  {barbeiro.email && <p className="text-sm text-gray-400 truncate">{barbeiro.email}</p>}
                </div>
                
                {barbeiro.cargo !== 'caixa' ? (
                  <div className="flex gap-4 p-3 bg-gray-900/50 rounded-xl border border-gray-800/50">
                    <div className="flex-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Comissão Prod.</span>
                      <span className="text-blue-400 font-medium">{barbeiro.comissao}%</span>
                    </div>
                    <div className="flex-1 border-l border-gray-800/80 pl-4">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Comissão Serv.</span>
                      <span className="text-green-400 font-medium">{barbeiro.corte}%</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4 p-3 bg-gray-900/50 rounded-xl border border-gray-800/50">
                    <div className="flex-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Função</span>
                      <span className="text-orange-400 font-medium">Recepção / Caixa</span>
                    </div>
                  </div>
                )}
                
                {barbeiro.diasTrabalhados.length > 0 && (
                  <div className="flex gap-1 mt-1">
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
    <div className="grid grid-cols-1 lg:grid-cols-1 sm:grid-cols-2 gap-5 md:p-8">
      <div className="bg-gray-800/80 p-6 sm:p-8 rounded-2xl border border-gray-700/50 shadow-xl h-fit">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div className="w-full bg-gray-900/50 p-5 md:p-8 rounded-2xl border border-gray-800 text-center text-gray-500 flex flex-col items-center justify-center mt-4">
            <TagIcon className="w-12 h-12 mb-3 text-gray-700" />
            <p>Nenhum produto cadastrado.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:gap-6 max-h-[650px] overflow-y-auto pr-2 custom-scrollbar" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
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
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-sm mt-3">
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
    <div className="grid grid-cols-1 lg:grid-cols-1 sm:grid-cols-2 gap-5 md:p-8">
      <div className="bg-gray-800/80 p-6 sm:p-8 rounded-2xl border border-gray-700/50 shadow-xl h-fit">
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
          <div className="w-full bg-gray-900/50 p-5 md:p-8 rounded-2xl border border-gray-800 text-center text-gray-500 flex flex-col items-center justify-center mt-4">
            <DocumentTextIcon className="w-12 h-12 mb-3 text-gray-700" />
            <p>Nenhum serviço cadastrado.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:gap-6 max-h-[650px] overflow-y-auto pr-2 custom-scrollbar" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
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

const TabCustos = ({ empresaId, user }: { empresaId?: string; user?: User }) => {
  const { custos, addCusto, removeCusto, updateCusto, fetchCustos, taxas, updateTaxas } = useBarbeariaConfig(empresaId);

  // Form states
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState('');
  const [tipo, setTipo] = useState<'fixo' | 'variavel'>('fixo');
  const [dateInicial, setDateInicial] = useState('');
  const [dateFinal, setDateFinal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Month & Year selection
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());
  const selectedMes = currentMonthDate.getMonth() + 1;
  const selectedAno = currentMonthDate.getFullYear();
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

  // Local state for payment tracking
  const [paidCostsState, setPaidCostsState] = useState<Record<string, { status: 'pago'; idTransacao?: string; paidAt?: string }>>({});

  // Taxas local state
  const [taxasLocal, setTaxasLocal] = useState({ 
    pix: taxas?.pix || 0, 
    dinheiro: taxas?.dinheiro || 0, 
    credito: taxas?.credito || 0, 
    debito: taxas?.debito || 0 
  });

  const mesFormatted = String(selectedMes).padStart(2, '0');
  const mesAnoReferencia = `${mesFormatted}/${selectedAno}`; // e.g. "08/2026"

  // Load paid costs state from localStorage
  useEffect(() => {
    try {
      const empKey = empresaId || 'default';
      const saved = localStorage.getItem(`barbearia_paid_costs_${empKey}`);
      if (saved) {
        setPaidCostsState(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  }, [empresaId]);

  // Sync taxas from config
  useEffect(() => {
    if (taxas) {
      setTaxasLocal({
        pix: taxas.pix || 0,
        dinheiro: taxas.dinheiro || 0,
        credito: taxas.credito || 0,
        debito: taxas.debito || 0
      });
    }
  }, [taxas]);

  // Fetch costs whenever month, year or empresaId changes
  useEffect(() => {
    fetchCustos(selectedMes, selectedAno);
  }, [selectedMes, selectedAno, empresaId, fetchCustos]);

  const handleCadastrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return alert("Nome é obrigatório");
    if (!valor || Number(valor) <= 0) return alert("Informe um valor válido");

    if (tipo === 'variavel') {
      if (!dateInicial) return alert("Para custo variável, a Data Inicial é obrigatória.");
      if (!dateFinal) return alert("Para custo variável, a Data Final é obrigatória.");
      if (new Date(dateInicial) > new Date(dateFinal)) {
        return alert("A Data Inicial não pode ser posterior à Data Final.");
      }
    }

    setIsSubmitting(true);
    try {
      const ok = await addCusto({
        nome: nome.trim(),
        valor: Number(valor) || 0,
        tipo,
        linkId: empresaId,
        ...(tipo === 'variavel' ? { dateInicial, dateFinal } : {})
      });

      if (ok !== false) {
        setNome('');
        setValor('');
        setTipo('fixo');
        setDateInicial('');
        setDateFinal('');
        await fetchCustos(selectedMes, selectedAno);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao cadastrar custo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSalvarTaxas = () => {
    updateTaxas(taxasLocal);
    alert('Taxas de pagamento atualizadas!');
  };

  const getTransacaoMesAtual = (c: Custo, mesAnoRef: string) => {
    if (!c) return null;

    if (Array.isArray(c.idTransacao)) {
      const item = c.idTransacao.find((t: any) => typeof t === 'object' && t !== null && t.mesAnoReferencia === mesAnoRef);
      if (item) {
        return {
          id: item.id || item._id || item.idTransacao || '',
          mesAnoReferencia: item.mesAnoReferencia || mesAnoRef,
          status: item.status === 'pago' ? ('pago' as const) : ('pendente' as const),
          idEmail: item.idEmail || ''
        };
      }
    }

    if (Array.isArray(c.transacoes)) {
      const item = c.transacoes.find((t: any) => t.mesAnoReferencia === mesAnoRef);
      if (item) {
        return {
          id: item.id || item.idTransacao || (item as any)._id || '',
          mesAnoReferencia: item.mesAnoReferencia || mesAnoRef,
          status: item.status === 'pago' ? ('pago' as const) : ('pendente' as const),
          idEmail: item.idEmail || ''
        };
      }
    }

    if (c.mesAnoReferencia === mesAnoRef && c.idTransacao) {
      let txId = '';
      let email = (c as any).idEmail || '';
      if (typeof c.idTransacao === 'string') {
        txId = c.idTransacao;
      } else if (typeof c.idTransacao === 'object' && !Array.isArray(c.idTransacao)) {
        txId = c.idTransacao.id || c.idTransacao._id || '';
        if (c.idTransacao.idEmail) email = c.idTransacao.idEmail;
      }
      if (txId) {
        return {
          id: txId,
          mesAnoReferencia: mesAnoRef,
          status: (c as any).statusTransacao === 'pago' || (c.status as any) === 'pago' ? ('pago' as const) : ('pendente' as const),
          idEmail: email
        };
      }
    }

    const key = `${c.id}_${mesAnoRef}`;
    if (paidCostsState[key]?.idTransacao) {
      return {
        id: paidCostsState[key].idTransacao,
        mesAnoReferencia: mesAnoRef,
        status: paidCostsState[key].status === 'pago' ? ('pago' as const) : ('pendente' as const),
        idEmail: paidCostsState[key].idEmail || ''
      };
    }

    return null;
  };

  const handleCriarTransacao = async (c: Custo) => {
    const transExist = getTransacaoMesAtual(c, mesAnoReferencia);
    if (transExist && transExist.id) {
      alert(`Já existe uma transação para o mês ${mesAnoReferencia}. ID: ${transExist.id}`);
      return;
    }

    setLoadingActionId(c.id);
    try {
      const dateIso = `${selectedAno}-${mesFormatted}-01T00:00:00.000Z`;
      const userEmail = user?.idEmail || user?.id || 'JSU1qxME41a4A00lYFPb7Azp0Nk1';
      const payloadExpense = {
        idEmail: userEmail,
        type: 'expense',
        name: `Despesa Custo (${c.nome}) - ${mesAnoReferencia}`,
        amount: c.valor,
        date: dateIso,
        status: 'nao_pago',
        category: 'Custos Barbearia',
        linkId: empresaId,
        mesAnoReferencia: mesAnoReferencia
      };

      let txId = '';
      let emailResp = userEmail;

      const endpoints = [
        'https://stok-5ytv.onrender.com/api/v1/transactions/simple',
        `${API_BASE_URL}/transactions/simple`,
        `${API_BASE_URL}/transactions`
      ];

      for (const ep of endpoints) {
        if (txId) break;
        try {
          const res = await fetch(ep, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadExpense)
          });
          if (res.ok) {
            const data = await res.json();
            const txObj = data.transaction || data;
            txId = txObj._id || txObj.id || txObj.transactionId || '';
            if (txObj.idEmail) emailResp = txObj.idEmail;
          }
        } catch (e) {
          console.error(`Erro ao enviar POST em ${ep}:`, e);
        }
      }

      if (!txId) {
        alert('Erro ao criar a transação de despesa no servidor.');
        return;
      }

      const costPayload = {
        idTransacao: txId,
        mesAnoReferencia: mesAnoReferencia,
        statusTransacao: 'pendente',
        idEmail: emailResp
      };

      const updated = await updateCusto(c.id, costPayload);
      if (!updated) {
        console.warn('Aviso: falha no PUT /costs para salvar idTransacao');
      }

      const key = `${c.id}_${mesAnoReferencia}`;
      const newPaidState = {
        ...paidCostsState,
        [key]: { status: 'pendente' as const, idTransacao: txId, idEmail: emailResp, createdAt: new Date().toISOString() }
      };
      setPaidCostsState(newPaidState);
      try {
        const empKey = empresaId || 'default';
        localStorage.setItem(`barbearia_paid_costs_${empKey}`, JSON.stringify(newPaidState));
      } catch (e) {
        console.error(e);
      }

      await fetchCustos(selectedMes, selectedAno);
    } catch (err) {
      console.error('Erro ao criar transação:', err);
      alert('Erro ao criar transação de despesa.');
    } finally {
      setLoadingActionId(null);
    }
  };

  const handlePagarTransacao = async (c: Custo) => {
    const trans = getTransacaoMesAtual(c, mesAnoReferencia);
    const txId = trans?.id || (typeof c.idTransacao === 'string' ? c.idTransacao : '');
    const emailResp = trans?.idEmail || user?.idEmail || user?.id || 'JSU1qxME41a4A00lYFPb7Azp0Nk1';

    if (!txId) {
      alert('Transação não encontrada para este custo.');
      return;
    }

    setLoadingActionId(c.id);
    try {
      const patchPayload = {
        transactionId: txId,
        status: 'pago',
        idEmail: emailResp
      };

      const statusEndpoints = [
        'https://stok-5ytv.onrender.com/api/v1/transactions/status',
        `${API_BASE_URL}/transactions/status`
      ];

      for (const ep of statusEndpoints) {
        try {
          await fetch(ep, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patchPayload)
          });
        } catch (e) {
          console.error(`Erro ao PATCH em ${ep}:`, e);
        }
      }

      const costPayload = {
        idTransacao: txId,
        mesAnoReferencia: mesAnoReferencia,
        statusTransacao: 'pago',
        idEmail: emailResp
      };

      await updateCusto(c.id, costPayload);

      const key = `${c.id}_${mesAnoReferencia}`;
      const newPaidState = {
        ...paidCostsState,
        [key]: { status: 'pago' as const, idTransacao: txId, idEmail: emailResp, paidAt: new Date().toISOString() }
      };
      setPaidCostsState(newPaidState);
      try {
        const empKey = empresaId || 'default';
        localStorage.setItem(`barbearia_paid_costs_${empKey}`, JSON.stringify(newPaidState));
      } catch (e) {
        console.error(e);
      }

      await fetchCustos(selectedMes, selectedAno);
    } catch (err) {
      console.error('Erro ao pagar transação:', err);
      alert('Erro ao pagar transação.');
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleConcluirCustoFixo = async (c: Custo) => {
    if (c.tipo !== 'fixo') return;
    const confirmConcluir = window.confirm(
      `Tem certeza que deseja concluir o custo fixo "${c.nome}"? Ao concluir, este custo não aparecerá nos próximos meses.`
    );
    if (!confirmConcluir) return;

    setLoadingActionId(c.id);
    try {
      await updateCusto(c.id, { status: 'concluido' });
      await fetchCustos(selectedMes, selectedAno);
    } catch (err) {
      console.error('Erro ao concluir custo fixo:', err);
      alert('Erro ao concluir custo fixo.');
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleRemoverCusto = async (id: string) => {
    if (!confirm("Deseja realmente excluir este custo?")) return;
    await removeCusto(id);
    await fetchCustos(selectedMes, selectedAno);
  };

  const isCustoVigenteNoMes = (c: Custo, mes: number, ano: number): boolean => {
    if (c.status === 'concluido') return false;
    if (c.tipo === 'fixo') return true;

    if (c.tipo === 'variavel') {
      if (!c.dateInicial || !c.dateFinal) return true;
      const refStart = `${ano}-${String(mes).padStart(2, '0')}-01`;
      const refEnd = `${ano}-${String(mes).padStart(2, '0')}-31`;

      const ini = String(c.dateInicial).substring(0, 10);
      const fim = String(c.dateFinal).substring(0, 10);

      return ini <= refEnd && fim >= refStart;
    }
    return true;
  };

  const custosPendentes = custos.filter(c => c.status !== 'concluido');
  const fixos = custosPendentes.filter(c => c.tipo === 'fixo');
  const variaveis = custosPendentes.filter(c => c.tipo === 'variavel' && isCustoVigenteNoMes(c, selectedMes, selectedAno));

  return (
    <div className="flex flex-col gap-6 md:p-8">
      {/* Seletor de Mês e Ano */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-900/90 p-5 rounded-2xl border border-gray-800 shadow-xl">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5 text-blue-400" />
            Gestão Mensal de Custos & Despesas
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Navegue pelos meses para consultar custos fixos e variáveis vigentes e realizar a quitação no fluxo financeiro.
          </p>
        </div>
        <div className="w-full sm:w-auto shrink-0">
          <MonthNavigator
            currentDate={currentMonthDate}
            setCurrentDate={setCurrentMonthDate}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário de Cadastro + Taxas */}
        <div className="flex flex-col gap-6">
          <div className="bg-gray-800/80 p-6 sm:p-8 rounded-2xl border border-gray-700/50 shadow-xl h-fit">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <PlusIcon className="w-5 h-5 text-blue-500" /> Cadastrar Novo Custo
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 mb-6 border-b border-gray-700/50 pb-4">
              Custos fixos aparecem em todos os meses. Custos variáveis exigem intervalo de datas inicial e final.
            </p>

            <form onSubmit={handleCadastrar} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm text-gray-400 mb-1 font-medium">Nome / Descrição *</label>
                <input 
                  type="text" required value={nome} onChange={e => setNome(e.target.value)}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 placeholder-gray-500"
                  placeholder="Ex: Aluguel, Conta de Luz, Produtos"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm text-gray-400 mb-1 font-medium">Valor Mensal (R$) *</label>
                <input 
                  type="number" step="0.01" required value={valor} onChange={e => setValor(e.target.value)}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 placeholder-gray-500 font-semibold"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm text-gray-400 mb-2 font-medium">Tipo de Custo *</label>
                <div className="flex gap-4">
                  <label className={`flex items-center gap-2 text-xs sm:text-sm font-semibold px-3 py-2 rounded-xl border cursor-pointer transition-all ${
                    tipo === 'fixo' ? 'bg-blue-600/30 text-blue-300 border-blue-500' : 'bg-gray-700/50 text-gray-400 border-gray-600 hover:text-gray-200'
                  }`}>
                    <input 
                      type="radio" name="tipoCusto" checked={tipo === 'fixo'} 
                      onChange={() => setTipo('fixo')} className="hidden" 
                    /> 
                    📌 Custo Fixo
                  </label>

                  <label className={`flex items-center gap-2 text-xs sm:text-sm font-semibold px-3 py-2 rounded-xl border cursor-pointer transition-all ${
                    tipo === 'variavel' ? 'bg-purple-600/30 text-purple-300 border-purple-500' : 'bg-gray-700/50 text-gray-400 border-gray-600 hover:text-gray-200'
                  }`}>
                    <input 
                      type="radio" name="tipoCusto" checked={tipo === 'variavel'} 
                      onChange={() => setTipo('variavel')} className="hidden" 
                    /> 
                    📊 Custo Variável
                  </label>
                </div>
              </div>

              {/* Campos condicionais para Custo Variável */}
              {tipo === 'variavel' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-purple-950/20 border border-purple-500/30 rounded-2xl animate-in fade-in duration-200">
                  <div>
                    <label className="block text-xs text-purple-300 mb-1 font-semibold">Data Inicial *</label>
                    <input 
                      type="date" required={tipo === 'variavel'} value={dateInicial} onChange={e => setDateInicial(e.target.value)}
                      className="w-full bg-gray-900 text-white border border-purple-500/40 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-purple-300 mb-1 font-semibold">Data Final *</label>
                    <input 
                      type="date" required={tipo === 'variavel'} value={dateFinal} onChange={e => setDateFinal(e.target.value)}
                      className="w-full bg-gray-900 text-white border border-purple-500/40 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-gray-700/50">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-md hover:shadow-blue-500/20 disabled:opacity-50"
                >
                  <PlusIcon className="w-5 h-5" /> 
                  {isSubmitting ? 'Salvando...' : 'Salvar Custo'}
                </button>
              </div>
            </form>
          </div>

          {/* Taxas de Pagamento */}
          <div className="bg-gray-800/80 p-6 sm:p-8 rounded-2xl border border-gray-700/50 shadow-xl h-fit">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <CashIcon className="w-5 h-5 text-emerald-400" />
              Taxas de Pagamento (%)
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 mb-6 border-b border-gray-700/50 pb-4">
              Porcentagem descontada pela maquininha ou banco para apuração das receitas líquidas.
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">PIX (%)</label>
                  <input 
                    type="number" step="0.01" value={taxasLocal.pix} onChange={e => setTaxasLocal({...taxasLocal, pix: Number(e.target.value)})}
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Dinheiro (%)</label>
                  <input 
                    type="number" step="0.01" value={taxasLocal.dinheiro} onChange={e => setTaxasLocal({...taxasLocal, dinheiro: Number(e.target.value)})}
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Cartão Crédito (%)</label>
                  <input 
                    type="number" step="0.01" value={taxasLocal.credito} onChange={e => setTaxasLocal({...taxasLocal, credito: Number(e.target.value)})}
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Cartão Débito (%)</label>
                  <input 
                    type="number" step="0.01" value={taxasLocal.debito} onChange={e => setTaxasLocal({...taxasLocal, debito: Number(e.target.value)})}
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              
              <div className="pt-3 border-t border-gray-700/50">
                <button onClick={handleSalvarTaxas} className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-md hover:shadow-emerald-500/20">
                  <CheckCircleIcon className="w-5 h-5" /> Salvar Taxas
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Listagem de Custos para o Mês Selecionado */}
        <div className="space-y-6">
          {/* Custos Fixos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                📌 Custos Fixos 
                <span className="bg-gray-800 text-gray-300 font-bold text-xs py-0.5 px-2 rounded-lg border border-gray-700">{fixos.length}</span>
              </h3>
              <span className="text-xs text-gray-400 font-medium">Exibidos em todos os meses</span>
            </div>

            {fixos.length === 0 ? (
              <p className="text-xs text-gray-500 italic bg-gray-900/50 p-4 rounded-xl border border-gray-800 text-center">Nenhum custo fixo pendente</p>
            ) : (
              <div className="grid gap-3 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
                {fixos.map(c => {
                  const trans = getTransacaoMesAtual(c, mesAnoReferencia);
                  const hasTx = Boolean(trans && trans.id);
                  const isPaidTx = Boolean(trans && trans.status === 'pago');
                  const isLoading = loadingActionId === c.id;

                  return (
                    <div key={c.id} className="bg-gray-900/80 p-4 rounded-2xl border border-gray-800 flex flex-col justify-between gap-3 shadow-md hover:border-gray-700 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white font-bold text-sm sm:text-base">{c.nome}</span>
                          <span className="text-[10px] bg-blue-500/20 text-blue-400 font-bold px-2 py-0.5 rounded-full border border-blue-500/30">
                            FIXO
                          </span>
                          <span className="text-[10px] bg-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                            PENDENTE
                          </span>
                          {isPaidTx ? (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                              ✓ TRANSAÇÃO PAGA
                            </span>
                          ) : hasTx ? (
                            <span className="text-[10px] bg-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                              ● TRANSAÇÃO PENDENTE
                            </span>
                          ) : (
                            <span className="text-[10px] bg-gray-700/60 text-gray-300 font-bold px-2 py-0.5 rounded-full border border-gray-600">
                              SEM TRANSAÇÃO
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-emerald-400">R$ {c.valor.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="text-xs text-gray-400 flex items-center gap-3 flex-wrap border-t border-gray-800/80 pt-2">
                        <span>Mês: <strong className="text-gray-200">{mesAnoReferencia}</strong></span>
                        {hasTx && (
                          <>
                            <span className="text-gray-600">•</span>
                            <span className="text-gray-300 font-mono text-[11px]">ID Transação: {trans.id}</span>
                          </>
                        )}
                        {trans?.idEmail && (
                          <>
                            <span className="text-gray-600">•</span>
                            <span className="text-gray-400 text-[11px]">Dono: {trans.idEmail}</span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-800/60 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          {!hasTx ? (
                            <button
                              onClick={() => handleCriarTransacao(c)}
                              disabled={isLoading}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md hover:shadow-blue-500/20 disabled:opacity-50"
                              title="Criar transação para este mês"
                            >
                              <PlusIcon className="w-4 h-4" />
                              <span>{isLoading ? 'Criando...' : 'Criar Transação'}</span>
                            </button>
                          ) : !isPaidTx ? (
                            <button
                              onClick={() => handlePagarTransacao(c)}
                              disabled={isLoading}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md hover:shadow-emerald-500/20 disabled:opacity-50"
                              title="Pagar transação do mês"
                            >
                              <CashIcon className="w-4 h-4" />
                              <span>{isLoading ? 'Pagando...' : 'Pagar Transação'}</span>
                            </button>
                          ) : (
                            <span className="text-xs text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-1 rounded-xl border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircleIcon className="w-3.5 h-3.5" /> Transação Paga
                            </span>
                          )}

                          <button
                            onClick={() => handleConcluirCustoFixo(c)}
                            disabled={isLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-900/60 hover:bg-purple-800/80 text-purple-200 border border-purple-500/40 text-xs font-semibold rounded-xl transition-all disabled:opacity-50"
                            title="Encerrar este custo fixo para os próximos meses"
                          >
                            <CheckCircleIcon className="w-3.5 h-3.5 text-purple-400" />
                            <span>Concluir Custo Fixo</span>
                          </button>
                        </div>

                        <button 
                          onClick={() => handleRemoverCusto(c.id)} 
                          className="text-gray-500 hover:text-red-400 transition-all p-1.5 bg-gray-800 hover:bg-gray-700 rounded-xl"
                          title="Excluir Custo"
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

          {/* Custos Variáveis */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                📊 Custos Variáveis 
                <span className="bg-gray-800 text-gray-300 font-bold text-xs py-0.5 px-2 rounded-lg border border-gray-700">{variaveis.length}</span>
              </h3>
              <span className="text-xs text-purple-400 font-medium">Filtrados por vigência</span>
            </div>

            {variaveis.length === 0 ? (
              <p className="text-xs text-gray-500 italic bg-gray-900/50 p-4 rounded-xl border border-gray-800 text-center">
                Nenhum custo variável vigente em {mesAnoReferencia}
              </p>
            ) : (
              <div className="grid gap-3 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
                {variaveis.map(c => {
                  const trans = getTransacaoMesAtual(c, mesAnoReferencia);
                  const hasTx = Boolean(trans && trans.id);
                  const isPaidTx = Boolean(trans && trans.status === 'pago');
                  const isLoading = loadingActionId === c.id;

                  const dataIniFmt = c.dateInicial ? String(c.dateInicial).substring(0, 10).split('-').reverse().join('/') : '';
                  const dataFimFmt = c.dateFinal ? String(c.dateFinal).substring(0, 10).split('-').reverse().join('/') : '';

                  return (
                    <div key={c.id} className="bg-gray-900/80 p-4 rounded-2xl border border-gray-800 flex flex-col justify-between gap-3 shadow-md hover:border-gray-700 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white font-bold text-sm sm:text-base">{c.nome}</span>
                          <span className="text-[10px] bg-purple-500/20 text-purple-400 font-bold px-2 py-0.5 rounded-full border border-purple-500/30">
                            VARIÁVEL
                          </span>
                          <span className="text-[10px] bg-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                            PENDENTE
                          </span>
                          {isPaidTx ? (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                              ✓ TRANSAÇÃO PAGA
                            </span>
                          ) : hasTx ? (
                            <span className="text-[10px] bg-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                              ● TRANSAÇÃO PENDENTE
                            </span>
                          ) : (
                            <span className="text-[10px] bg-gray-700/60 text-gray-300 font-bold px-2 py-0.5 rounded-full border border-gray-600">
                              SEM TRANSAÇÃO
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-purple-300">R$ {c.valor.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="text-xs text-gray-400 flex items-center gap-3 flex-wrap border-t border-gray-800/80 pt-2">
                        {dataIniFmt && dataFimFmt && (
                          <span>Vigência: <strong className="text-gray-300">{dataIniFmt} até {dataFimFmt}</strong></span>
                        )}
                        {hasTx && (
                          <>
                            <span className="text-gray-600">•</span>
                            <span className="text-gray-300 font-mono text-[11px]">ID Transação: {trans.id}</span>
                          </>
                        )}
                        {trans?.idEmail && (
                          <>
                            <span className="text-gray-600">•</span>
                            <span className="text-gray-400 text-[11px]">Dono: {trans.idEmail}</span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-800/60 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          {!hasTx ? (
                            <button
                              onClick={() => handleCriarTransacao(c)}
                              disabled={isLoading}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md hover:shadow-blue-500/20 disabled:opacity-50"
                              title="Criar transação para este mês"
                            >
                              <PlusIcon className="w-4 h-4" />
                              <span>{isLoading ? 'Criando...' : 'Criar Transação'}</span>
                            </button>
                          ) : !isPaidTx ? (
                            <button
                              onClick={() => handlePagarTransacao(c)}
                              disabled={isLoading}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md hover:shadow-emerald-500/20 disabled:opacity-50"
                              title="Pagar transação do mês"
                            >
                              <CashIcon className="w-4 h-4" />
                              <span>{isLoading ? 'Pagando...' : 'Pagar Transação'}</span>
                            </button>
                          ) : (
                            <span className="text-xs text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-1 rounded-xl border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircleIcon className="w-3.5 h-3.5" /> Transação Paga
                            </span>
                          )}
                        </div>

                        <button 
                          onClick={() => handleRemoverCusto(c.id)} 
                          className="text-gray-500 hover:text-red-400 transition-all p-1.5 bg-gray-800 hover:bg-gray-700 rounded-xl"
                          title="Excluir Custo"
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
        </div>
      </div>
    </div>
  );
};

const TabMetas = ({ empresaId }: { empresaId?: string }) => {
  const { servicos, custos, loadConfig, metaLucro, imposto, updateCompanyConfig } = useBarbeariaConfig(empresaId);
  const { barbeiros, reloadBarbeiros } = useBarbeiros(empresaId);
  const { registros } = useBarbeariaRegistros(empresaId);
  
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscribers, setSubscribers] = useState<SubscriptionClient[]>([]);
  const [simAssinantes, setSimAssinantes] = useState<number>(5);

  const [localMetaLucro, setLocalMetaLucro] = useState(String(metaLucro));
  const [localImposto, setLocalImposto] = useState(String(imposto));

  useEffect(() => {
    setLocalMetaLucro(String(metaLucro));
    setLocalImposto(String(imposto));
  }, [metaLucro, imposto]);

  useEffect(() => {
    const ativas = subscribers.filter(s => s.status === 'ativo' || s.ativo === true).length;
    if (ativas > 0) {
      setSimAssinantes(ativas);
    }
  }, [subscribers]);

  const loadPlansAndSubscribers = useCallback(async () => {
    const resolvedLinkId = empresaId || 'barbearia-default';
    try {
      // Fetch Plans
      let resP = await fetch(`${API_BASE_URL}/subscription-plans?linkId=${resolvedLinkId}`).catch(() => null);
      if (!resP || !resP.ok || !(resP.headers.get('content-type') || '').includes('application/json')) {
        resP = await fetch(`/api/v1/subscription-plans?linkId=${resolvedLinkId}`);
      }
      if (resP && resP.ok && (resP.headers.get('content-type') || '').includes('application/json')) {
        const dataP = await resP.json();
        const listP = Array.isArray(dataP) ? dataP : dataP.plans || dataP.data || [];
        setPlans(listP);
      }

      // Fetch Subscribers
      let resS = await fetch(`${API_BASE_URL}/subscription-clients?linkId=${resolvedLinkId}`).catch(() => null);
      if (!resS || !resS.ok || !(resS.headers.get('content-type') || '').includes('application/json')) {
        resS = await fetch(`/api/v1/subscription-clients?linkId=${resolvedLinkId}`);
      }
      if (resS && resS.ok && (resS.headers.get('content-type') || '').includes('application/json')) {
        const dataS = await resS.json();
        const listS = Array.isArray(dataS) ? dataS : dataS.clients || dataS.subscribers || dataS.data || [];
        setSubscribers(listS);
      }
    } catch (err) {
      console.error("Erro ao carregar assinaturas na Meta:", err);
    }
  }, [empresaId]);

  useEffect(() => {
    loadPlansAndSubscribers();
  }, [loadPlansAndSubscribers]);

  const saveConfig = () => {
    updateCompanyConfig({
      metaLucro: Number(localMetaLucro) || 0,
      imposto: Number(localImposto) || 0
    });
  };

  const handleReload = () => {
    loadConfig();
    reloadBarbeiros();
    loadPlansAndSubscribers();
  };

  const numMeta = Number(localMetaLucro) || 0;
  const numImposto = Number(localImposto) || 0;

  const custoFixoTotal = custos.filter(c => c.tipo === 'fixo').reduce((acc, c) => acc + c.valor, 0);
  const custoVarTotal = custos.filter(c => c.tipo === 'variavel').reduce((acc, c) => acc + c.valor, 0);
  const custosTotais = custoFixoTotal + custoVarTotal;

  // Calculo de Medias considerando Servicos E Planos de Assinatura
  const valoresServicos = servicos.map(s => Number(s.valor) || 0);
  const valoresPlanos = plans.map(p => Number(p.valorMensal) || 0);
  const todosValores = [...valoresServicos, ...valoresPlanos];

  const ticketMedioServicoApenas = valoresServicos.length > 0 ? valoresServicos.reduce((acc, v) => acc + v, 0) / valoresServicos.length : 0;
  const ticketMedioPlanosApenas = valoresPlanos.length > 0 ? valoresPlanos.reduce((acc, v) => acc + v, 0) / valoresPlanos.length : 0;
  
  // Ticket Medio Geral (servicos + planos)
  const ticketMedioGeral = todosValores.length > 0 ? todosValores.reduce((acc, v) => acc + v, 0) / todosValores.length : ticketMedioServicoApenas;
  const ticketMedioServico = ticketMedioGeral > 0 ? ticketMedioGeral : ticketMedioServicoApenas;

  const comissaoMediaPerc = barbeiros.length > 0 ? barbeiros.reduce((acc, b) => acc + b.corte, 0) / barbeiros.length : 0;
  
  const custoComissaoMedia = ticketMedioServico * (comissaoMediaPerc / 100);
  const lucroBrutoMedioPorServico = ticketMedioServico - custoComissaoMedia;

  // Assinantes Ativos & Receita Recorrente
  const assinantesAtivos = subscribers.filter(s => s.status === 'ativo' || s.ativo === true);
  const receitaAssinaturasRecorrente = assinantesAtivos.reduce((acc, sub) => {
    const plan = plans.find(p => (p.id === sub.planoId || p._id === sub.planoId));
    const val = sub.pagamento?.valor || plan?.valorMensal || 0;
    return acc + Number(val);
  }, 0);

  // Meta de Faturamento Necessario
  let faturamentoNecessario = 0;

  if (lucroBrutoMedioPorServico > 0) {
    const totalMetaECustos = numMeta + custosTotais;
    let qtdServicosTemp = totalMetaECustos / lucroBrutoMedioPorServico;
    faturamentoNecessario = qtdServicosTemp * ticketMedioServico;

    // Se o faturamento passar de 5000, precisamos compensar o imposto
    if (faturamentoNecessario > 5000 && numImposto > 0) {
        const lucroPorServicoPosImposto = ticketMedioServico - custoComissaoMedia - (ticketMedioServico * (numImposto/100));
        if (lucroPorServicoPosImposto > 0) {
           qtdServicosTemp = totalMetaECustos / lucroPorServicoPosImposto;
           faturamentoNecessario = qtdServicosTemp * ticketMedioServico;
        }
    }
  }

  // Meta de Servicos Restantes Abatendo Assinaturas Recorrentes
  let faturamentoRestanteParaServicos = Math.max(0, faturamentoNecessario - receitaAssinaturasRecorrente);
  let qtdServicosMes = 0;
  if (lucroBrutoMedioPorServico > 0) {
    qtdServicosMes = faturamentoRestanteParaServicos / lucroBrutoMedioPorServico;
  }

  // Calculando o progresso atual com as regrinhas: subtrair comissões e impostos
  const faturamentoRegistros = registros.reduce((acc, r) => acc + r.total, 0);
  const temRegistroAssinatura = registros.some(r => r.servicoId === 'assinatura' || r.itens?.some(i => i.tipo === 'assinatura' || i.nome?.toLowerCase().includes('assinatura')));
  const faturamentoAtual = faturamentoRegistros + (temRegistroAssinatura ? 0 : receitaAssinaturasRecorrente);
  
  // Calcular comissoes pagas nos registros para subtrair
  let totalComissoesPagas = 0;
  registros.forEach(r => {
      const barbeiro = barbeiros.find(b => b.id === r.barbeiroId);
      const subtotalServicos = r.itens.filter(i => i.tipo === 'servico').reduce((acc, i) => acc + (i.valor || 0), 0);
      const desconto = r.desconto ?? r.pagamento?.desconto ?? 0;
      const servicosValorCobrado = Math.max(0, subtotalServicos - Math.min(desconto, subtotalServicos));
      const factorServico = subtotalServicos > 0 ? servicosValorCobrado / subtotalServicos : 0;

      r.itens.forEach((item: any) => {
         if (item.tipo === 'servico') {
             const comissao = barbeiro ? barbeiro.corte : comissaoMediaPerc;
             const valComDesconto = item.valor * factorServico;
             totalComissoesPagas += valComDesconto * (comissao / 100);
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

  // Projeções de Cortes e Assinaturas para Atingir a Meta
  const ticketCorteRef = ticketMedioServicoApenas > 0 ? ticketMedioServicoApenas : (ticketMedioServico > 0 ? ticketMedioServico : 35);
  const ticketPlanoRef = ticketMedioPlanosApenas > 0 ? ticketMedioPlanosApenas : 80;
  
  const taxRateDecimal = (faturamentoNecessario > 5000 && numImposto > 0) ? (numImposto / 100) : 0;
  const lucroPorCorte = Math.max(1, ticketCorteRef * (1 - (comissaoMediaPerc / 100) - taxRateDecimal));
  const lucroPorPlano = Math.max(1, ticketPlanoRef * (1 - taxRateDecimal));

  const totalNecessarioMetaEImp = numMeta + custosTotais;

  // Cenário 1: 100% Cortes
  const cortesCenarioApenasCorte = Math.ceil(totalNecessarioMetaEImp / lucroPorCorte);
  const cortesApenasCorteSemana = Math.ceil(cortesCenarioApenasCorte / 4.33);
  const cortesApenasCorteDia = Math.ceil(cortesCenarioApenasCorte / 26);

  // Cenário 2: 100% Assinaturas
  const assinantesCenarioApenasPlano = Math.ceil(totalNecessarioMetaEImp / lucroPorPlano);
  const faturamentoAssinantesApenas = assinantesCenarioApenasPlano * ticketPlanoRef;

  // Cenário 3: Misto (Cortes + Assinaturas)
  const numAssinantesSim = Math.max(0, simAssinantes);
  const lucroVindoDasAssinaturas = numAssinantesSim * lucroPorPlano;
  const lucroRestanteComCortes = Math.max(0, totalNecessarioMetaEImp - lucroVindoDasAssinaturas);
  const cortesCenarioMisto = Math.ceil(lucroRestanteComCortes / lucroPorCorte);
  const cortesMistoSemana = Math.ceil(cortesCenarioMisto / 4.33);
  const cortesMistoDia = Math.ceil(cortesCenarioMisto / 26);

  return (
    <div className="space-y-8">
      {/* Settings da Meta */}
      <div className="bg-gray-800/80 p-6 sm:p-8 rounded-2xl border border-gray-700/50 shadow-xl">
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
          Descubra quantos serviços você precisa realizar para cobrir todos os seus custos e atingir a sua meta de lucro líquido desejado, considerando também a receita de assinaturas e o valor dos planos.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 max-w-2xl">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Qual a sua Meta de Lucro Líquido mensal?</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">R$</span>
              <input 
                type="number" step="0.01" value={localMetaLucro} onChange={e => setLocalMetaLucro(e.target.value)} onBlur={saveConfig}
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
                type="number" step="1" value={localImposto} onChange={e => setLocalImposto(e.target.value)} onBlur={saveConfig}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 text-lg font-bold focus:outline-none focus:border-blue-500"
                placeholder="6"
              />
              <span className="absolute right-3 top-2 text-gray-500">%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Aplicável somente quando o faturamento mensal exceder R$ 5.000,00.</p>
          </div>
        </div>

        {/* Progresso das Metas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 border-t border-gray-700/50 pt-8">
          {/* Progresso de Faturamento */}
          <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
            <h3 className="text-xs text-gray-400 mb-3 font-bold uppercase tracking-widest">Faturamento (Ponto de Equilíbrio)</h3>
            <div className="flex justify-between items-end mb-4">
              <span className="text-2xl md:text-3xl font-black text-white">R$ {faturamentoAtual.toFixed(2)}</span>
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
              <span className={`text-2xl md:text-3xl font-black ${lucroAtual >= 0 ? 'text-green-400' : 'text-red-400'}`}>R$ {lucroAtual.toFixed(2)}</span>
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

      <div className="grid grid-cols-1 gap-6">
        {/* Resumo Financeiro */}
        <div className="bg-gray-800/80 p-5 md:p-8 rounded-2xl border border-gray-700/50 shadow-xl space-y-4">
          <h3 className="text-xl font-bold text-white mb-6">Resumo Financeiro Mensal</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="flex justify-between items-center bg-gray-900/50 p-4 rounded-xl border border-gray-800">
              <span className="text-gray-300 font-medium text-sm">Custos Fixos</span>
              <span className="text-orange-400 font-bold bg-orange-500/10 px-2 py-1 rounded-lg text-sm">R$ {custoFixoTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center bg-gray-900/50 p-4 rounded-xl border border-gray-800">
              <span className="text-gray-300 font-medium text-sm">Custos Variáveis</span>
              <span className="text-blue-400 font-bold bg-blue-500/10 px-2 py-1 rounded-lg text-sm">R$ {custoVarTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center bg-gray-900/50 p-4 rounded-xl border border-gray-800">
              <span className="text-gray-300 font-medium text-sm">Meta de Lucro Líquido</span>
              <span className="text-green-400 font-bold bg-green-500/10 px-2 py-1 rounded-lg text-sm">R$ {numMeta.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center bg-blue-600/10 p-4 rounded-xl border border-blue-500/30">
              <span className="text-blue-100 font-semibold text-sm">Faturamento Necessário</span>
              <span className="text-blue-400 font-black text-lg">R$ {faturamentoNecessario.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Projeção de Cortes e Assinaturas */}
        <div className="bg-gray-800/80 p-5 md:p-8 rounded-2xl border border-gray-700/50 shadow-xl relative overflow-hidden space-y-6">
          <div className="absolute -top-10 -right-10 p-4 opacity-[0.03] pointer-events-none">
            <ChartBarIcon className="w-64 h-64" />
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-700/50 pb-4 relative z-10">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span>🚀 Projeção de Cortes e Assinaturas para Atingir a Meta</span>
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                Veja diferentes combinações de cortes avulsos e assinantes para atingir sua meta de R$ {numMeta.toFixed(2)} de Lucro Líquido.
              </p>
            </div>

            <div className="flex items-center gap-2.5 bg-gray-900/80 px-3 py-2 rounded-xl border border-gray-700 shrink-0 text-xs text-gray-300">
              <span>Corte Médio: <strong className="text-white">R$ {ticketCorteRef.toFixed(2)}</strong></span>
              <span className="text-gray-600">•</span>
              <span>Plano Médio: <strong className="text-purple-300">R$ {ticketPlanoRef.toFixed(2)}</strong></span>
            </div>
          </div>

          {servicos.length === 0 || barbeiros.length === 0 ? (
            <div className="text-sm text-yellow-500 bg-yellow-500/10 p-5 rounded-xl border border-yellow-500/30 font-medium relative z-10">
              Cadastre pelo menos 1 barbeiro e 1 serviço para ver a projeção detalhada.
            </div>
          ) : (
            <div className="space-y-6 relative z-10">
              {/* Grid dos 3 Cenários */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* Cenário 1: Somente Cortes */}
                <div className="bg-gray-900/80 p-5 rounded-2xl border border-gray-700/60 flex flex-col justify-between gap-4 relative overflow-hidden group hover:border-blue-500/50 transition-all">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
                        💈 100% Cortes
                      </span>
                      <span className="text-[11px] text-gray-500">Sem Assinaturas</span>
                    </div>
                    <h4 className="font-bold text-white text-base pt-1">Apenas com Cortes Avulsos</h4>
                    <p className="text-xs text-gray-400">Meta atingida somente realizando atendimentos na cadeira.</p>
                  </div>

                  <div className="bg-gray-800/80 p-4 rounded-xl border border-gray-700/50 text-center space-y-2">
                    <div className="text-3xl font-black text-white">{cortesCenarioApenasCorte}</div>
                    <div className="text-xs font-semibold text-blue-300 uppercase tracking-wider">Cortes / Mês</div>
                    
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-700/50 text-xs">
                      <div>
                        <span className="text-gray-400 block text-[10px]">Por Semana</span>
                        <span className="text-white font-bold">{cortesApenasCorteSemana} / sem</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px]">Por Dia</span>
                        <span className="text-white font-bold">{cortesApenasCorteDia} / dia</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cenário 2: Somente Assinaturas */}
                <div className="bg-purple-950/30 p-5 rounded-2xl border border-purple-800/50 flex flex-col justify-between gap-4 relative overflow-hidden group hover:border-purple-500/50 transition-all">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20">
                        💎 100% Assinaturas
                      </span>
                      <span className="text-[11px] text-purple-400">Recorrência Total</span>
                    </div>
                    <h4 className="font-bold text-white text-base pt-1">Garantido por Assinantes VIP</h4>
                    <p className="text-xs text-purple-300/80">Meta de custos e lucro cobertos no automático todo dia 1º.</p>
                  </div>

                  <div className="bg-purple-900/40 p-4 rounded-xl border border-purple-700/50 text-center space-y-2">
                    <div className="text-3xl font-black text-purple-200">{assinantesCenarioApenasPlano}</div>
                    <div className="text-xs font-semibold text-purple-300 uppercase tracking-wider">Assinantes Ativos</div>

                    <div className="pt-2 border-t border-purple-800/50 text-xs flex justify-between items-center px-1">
                      <span className="text-purple-300/70 text-[10px]">Faturamento Recorrente:</span>
                      <span className="text-emerald-400 font-bold">R$ {faturamentoAssinantesApenas.toFixed(2)}/mês</span>
                    </div>
                  </div>
                </div>

                {/* Cenário 3: Modelo Misto / Combinado */}
                <div className="bg-emerald-950/30 p-5 rounded-2xl border border-emerald-800/50 flex flex-col justify-between gap-4 relative overflow-hidden group hover:border-emerald-500/50 transition-all">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                        ⚡ Modelo Combinado
                      </span>
                      <span className="text-[11px] text-emerald-400 font-semibold">Simulador</span>
                    </div>
                    <h4 className="font-bold text-white text-base pt-1">Assinaturas + Cortes Restantes</h4>
                    <p className="text-xs text-emerald-300/80">Combine um número fixo de assinantes com atendimentos avulsos.</p>
                  </div>

                  <div className="bg-emerald-900/30 p-4 rounded-xl border border-emerald-700/50 text-center space-y-3">
                    {/* Control para simular quantidade de assinantes */}
                    <div className="flex items-center justify-between bg-emerald-950/60 p-2 rounded-lg border border-emerald-800/60">
                      <span className="text-xs text-emerald-300 font-medium">Assinantes Simulado:</span>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setSimAssinantes(prev => Math.max(0, prev - 1))}
                          className="w-6 h-6 rounded bg-emerald-900 hover:bg-emerald-800 text-emerald-200 font-bold text-xs flex items-center justify-center transition-colors"
                        >
                          -
                        </button>
                        <span className="font-extrabold text-white text-sm w-6 text-center">{numAssinantesSim}</span>
                        <button 
                          onClick={() => setSimAssinantes(prev => prev + 1)}
                          className="w-6 h-6 rounded bg-emerald-900 hover:bg-emerald-800 text-emerald-200 font-bold text-xs flex items-center justify-center transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-2xl font-black text-white">{cortesCenarioMisto} <span className="text-xs font-normal text-gray-400">cortes restantes</span></div>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-800/50 text-xs">
                        <div>
                          <span className="text-emerald-300/70 block text-[10px]">Por Semana</span>
                          <span className="text-white font-bold">{cortesMistoSemana} / sem</span>
                        </div>
                        <div>
                          <span className="text-emerald-300/70 block text-[10px]">Por Dia</span>
                          <span className="text-white font-bold">{cortesMistoDia} / dia</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Banner Informativo de Redução */}
              {numAssinantesSim > 0 && (
                <div className="bg-gradient-to-r from-emerald-950/60 via-blue-950/60 to-purple-950/60 p-4 rounded-xl border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">💡</span>
                    <div>
                      <span className="text-white font-bold block">Impacto das Assinaturas na sua Meta</span>
                      <span className="text-gray-300">
                        Com <strong className="text-emerald-400">{numAssinantesSim} assinantes ativos</strong> (+R$ {(numAssinantesSim * ticketPlanoRef).toFixed(2)}/mês), você precisa fazer <strong className="text-emerald-400">{Math.max(0, cortesCenarioApenasCorte - cortesCenarioMisto)} cortes a menos</strong> por mês para bater a meta!
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Redução de Trabalho</span>
                    <span className="text-emerald-400 font-extrabold text-sm">
                      -{Math.round(((cortesCenarioApenasCorte - cortesCenarioMisto) / Math.max(1, cortesCenarioApenasCorte)) * 100)}% de cortes
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export interface CommissionPaymentRecord {
  id?: string;
  email: string;
  valorComissao: number;
  data: string;
  status: 'pago' | 'pendente' | 'cancelado';
  linkId: string;
  barbeiroNome: string;
  paidAt?: string;
}

export const loadPaidCommissionsFromStorage = async (empresaId: string): Promise<CommissionPaymentRecord[]> => {
  return await commissionsService.getByLink(empresaId);
};

export const formatarDateTime = (isoOrStr?: string) => {
  if (!isoOrStr) return '-';
  try {
    const d = new Date(isoOrStr);
    if (isNaN(d.getTime())) return isoOrStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} às ${hours}:${mins}`;
  } catch (e) {
    return isoOrStr;
  }
};

export const getPaidStatsForBarbeiro = (
  records: CommissionPaymentRecord[],
  barbeiroId: string,
  barbeiroEmail: string,
  barbeiroNome: string,
  periodKey: string,
  dataFiltro: string,
  totalCalculado: number
) => {
  const normEmail = (barbeiroEmail || '').toLowerCase().trim();
  const normNome = (barbeiroNome || '').toLowerCase().trim();
  const normId = (barbeiroId || '').toLowerCase().trim();

  const matchingPayments = records.filter(r => {
    if (r.status !== 'pago') return false;

    const rEmail = (r.email || '').toLowerCase().trim();
    const rNome = (r.barbeiroNome || '').toLowerCase().trim();

    const sameBarbeiro = (normEmail && rEmail && normEmail === rEmail) ||
      (normNome && rNome && normNome === rNome) ||
      (normId && (rEmail === normId || rNome === normId));

    const sameDate = r.data === dataFiltro;

    return sameBarbeiro && sameDate;
  });

  const totalPago = matchingPayments.reduce((acc, r) => acc + (Number(r.valorComissao) || 0), 0);
  const comissaoPendente = Math.max(0, Number((totalCalculado - totalPago).toFixed(2)));

  const isFullyPaid = totalPago >= totalCalculado && totalCalculado > 0;
  const isPartiallyPaid = totalPago > 0 && comissaoPendente > 0;

  return {
    totalPago,
    comissaoPendente,
    isFullyPaid,
    isPartiallyPaid,
    paymentsCount: matchingPayments.length,
    lastPaymentAt: matchingPayments.length > 0 ? matchingPayments[matchingPayments.length - 1].paidAt : null
  };
};

const TabRegistros = ({ empresaId, user }: { empresaId?: string, user?: User }) => {
  const { registros, addRegistro, removeRegistro, loadRegistros } = useBarbeariaRegistros(empresaId);
  const { agendamentos, updateStatus, loadAgendamentos } = useBarbeariaAgendamentos(empresaId);
  const { barbeiros, reloadBarbeiros } = useBarbeiros(empresaId);
  const { servicos, loadConfig, produtos, updateProduto, custos, taxas } = useBarbeariaConfig(empresaId);
  
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscribers, setSubscribers] = useState<SubscriptionClient[]>([]);

  const loadPlansAndSubscribers = useCallback(async () => {
    const resolvedLinkId = empresaId || 'barbearia-default';
    try {
      let resP = await fetch(`${API_BASE_URL}/subscription-plans?linkId=${resolvedLinkId}`).catch(() => null);
      if (!resP || !resP.ok || !(resP.headers.get('content-type') || '').includes('application/json')) {
        resP = await fetch(`/api/v1/subscription-plans?linkId=${resolvedLinkId}`);
      }
      if (resP && resP.ok && (resP.headers.get('content-type') || '').includes('application/json')) {
        const dataP = await resP.json();
        setPlans(Array.isArray(dataP) ? dataP : dataP.plans || dataP.data || []);
      }

      let resS = await fetch(`${API_BASE_URL}/subscription-clients?linkId=${resolvedLinkId}`).catch(() => null);
      if (!resS || !resS.ok || !(resS.headers.get('content-type') || '').includes('application/json')) {
        resS = await fetch(`/api/v1/subscription-clients?linkId=${resolvedLinkId}`);
      }
      if (resS && resS.ok && (resS.headers.get('content-type') || '').includes('application/json')) {
        const dataS = await resS.json();
        setSubscribers(Array.isArray(dataS) ? dataS : dataS.clients || dataS.subscribers || dataS.data || []);
      }
    } catch (err) {
      console.error("Erro ao carregar assinaturas no relatório:", err);
    }
  }, [empresaId]);

  useEffect(() => {
    loadPlansAndSubscribers();
  }, [loadPlansAndSubscribers]);

  const [dataFiltro, setDataFiltro] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
  });

  const [activeSubTab, setActiveSubTab] = useState<'aguardando' | 'diario' | 'mensal' | 'historico' | 'lucro'>('aguardando');

  const [expandedBarbeiros, setExpandedBarbeiros] = useState<Record<string, boolean>>({});
  const [cardAccordionMode, setCardAccordionMode] = useState<Record<string, 'atendimentos' | 'pagamentos'>>({});
  const [selectedBarberLogFilter, setSelectedBarberLogFilter] = useState<string>('todos');

  const toggleExpandBarbeiro = (id: string, defaultMode: 'atendimentos' | 'pagamentos' = 'atendimentos') => {
    setExpandedBarbeiros(prev => {
      const willExpand = !prev[id];
      if (willExpand) {
        setCardAccordionMode(m => ({ ...m, [id]: defaultMode }));
      }
      return { ...prev, [id]: willExpand };
    });
  };

  const [paidCommissionsList, setPaidCommissionsList] = useState<CommissionPaymentRecord[]>([]);

  const loadCommissions = useCallback(async () => {
    const linkId = empresaId || 'default';
    const list = await commissionsService.getByLink(linkId);
    setPaidCommissionsList(list);
  }, [empresaId]);

  useEffect(() => {
    loadCommissions();
  }, [loadCommissions]);

  const handleRemovePaidCommission = async (indexToRemove: number) => {
    const item = paidCommissionsList[indexToRemove];
    if (!item) return;

    const nome = item.barbeiroNome || item.email || 'Barbeiro';
    const dataFmt = (item.data || '').split('-').reverse().join('/');

    if (confirm(`Deseja realmente estornar/remover o pagamento de R$ ${Number(item.valorComissao).toFixed(2)} (Ref: ${dataFmt}) do barbeiro ${nome}? O valor voltará a ficar pendente.`)) {
      if (item.id) {
        await commissionsService.delete(item.id);
      }
      await loadCommissions();
    }
  };

  const [isFinalizarCaixaOpen, setIsFinalizarCaixaOpen] = useState(false);
  const [isFinalizando, setIsFinalizando] = useState(false);
  const [receitaData, setReceitaData] = useState<any>(null);

  const handleFinalizarCaixa = async () => {
    if (!receitaData || !user) {
      alert("Erro: Dados incompletos.");
      setIsFinalizarCaixaOpen(false);
      return;
    }
    
    setIsFinalizando(true);
    try {
      const isBarbearia = receitaData.isBarbearia;
      const dataFormatada = dataFiltro.split('-').reverse().join('/');
      
      if (isBarbearia) {
        const payload = {
          idEmail: user.idEmail || user.id,
          type: 'revenue',
          name: `Fechamento Barbearia - ${dataFormatada}`,
          amount: receitaData.caixaBarbearia,
          date: dataFiltro,
          status: 'pago',
          category: 'Caixa Barbearia'
        };

        const res = await fetch(`${API_BASE_URL}/transactions/simple`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(payload)
        });
        if (res.ok) {
          alert("✓ Receita do Caixa da Barbearia enviada para o financeiro com sucesso!");
        } else {
          alert("Erro ao criar transação do caixa.");
        }
      } else {
        // Pagamento de comissão do barbeiro:
        const valorAPagar = receitaData.totalComissao;
        const bObj = barbeiros.find(b => b.id === receitaData.barbeiro?.id || b.nome === receitaData.nome) || receitaData.barbeiro;
        let barbeiroIdEmail = (bObj?.idEmail || bObj?.email || bObj?.telefone || bObj?.id || user.email || user.idEmail || user.id || '').trim();
        let barbeiroRealEmail = extractValidEmail(bObj?.email) || extractValidEmail(user?.email);

        // 1. Criar Receita Paga para a Barbearia (Sangria no valor da comissão)
        const payloadRevenueBarbearia = {
          idEmail: user.idEmail || user.id,
          type: 'revenue',
          name: `Sangria Comissão - ${receitaData.nome} (${dataFormatada})`,
          amount: valorAPagar,
          date: dataFiltro,
          status: 'pago',
          category: 'Sangria'
        };

        // 2. Criar Despesa Paga para a Barbearia (Comissão do Barbeiro)
        const payloadExpenseBarbearia = {
          idEmail: user.idEmail || user.id,
          type: 'expense',
          name: `Pagamento Comissão - ${receitaData.nome} (${dataFormatada})`,
          amount: valorAPagar,
          date: dataFiltro,
          status: 'pago',
          category: 'Comissão de Barbeiro'
        };

        // 3. Criar Receita Paga para o Barbeiro
        const payloadRevenueBarbeiro = {
          idEmail: barbeiroIdEmail,
          type: 'revenue',
          name: `Comissão Recebida - ${receitaData.nome} (${dataFormatada})`,
          amount: valorAPagar,
          date: dataFiltro,
          status: 'pago',
          category: 'Comissão Recebida'
        };

        const postTx = async (payload: any) => {
          const endpoints = [
            'https://stok-5ytv.onrender.com/api/v1/transactions/simple',
            `${API_BASE_URL}/transactions/simple`,
            `${API_BASE_URL}/transactions`
          ];
          for (const ep of endpoints) {
            try {
              const res = await fetch(ep, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });
              if (res.ok) return true;
            } catch (e) {
              console.error(`Erro ao postar transação em ${ep}:`, e);
            }
          }
          return false;
        };

        const [resRevBarb, resExpBarb, resRevBarbeiro] = await Promise.all([
          postTx(payloadRevenueBarbearia),
          postTx(payloadExpenseBarbearia),
          postTx(payloadRevenueBarbeiro)
        ]);

        // Registrar comissão na API
        const createdCommission = await commissionsService.create({
          email: barbeiroRealEmail,
          valorComissao: valorAPagar,
          data: receitaData.subTab === 'mensal' ? dataFiltro.slice(0, 7) : dataFiltro,
          status: 'pago',
          linkId: empresaId || 'default',
          barbeiroNome: receitaData.nome,
          paidAt: new Date().toISOString()
        });

        if (createdCommission || resRevBarb || resExpBarb || resRevBarbeiro) {
          await loadCommissions();

          alert(`✓ Pagamento de comissão de R$ ${valorAPagar.toFixed(2)} registrado com sucesso na API de Comissões e Financeiro!\n\n` +
            `• 🟢 RECEITA PAGA (R$ ${valorAPagar.toFixed(2)}) de Sangria enviada para a Barbearia.\n` +
            `• 🔴 DESPESA PAGA (R$ ${valorAPagar.toFixed(2)}) de Comissão enviada para a Barbearia.\n` +
            `• 🟢 RECEITA PAGA (R$ ${valorAPagar.toFixed(2)}) enviada para o Barbeiro (${receitaData.nome}).\n` +
            `• 🌐 Registro salvo na API de Comissões.`);
        } else {
          alert("Erro ao registrar pagamento de comissão.");
        }
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao criar transação de comissão.");
    }
    setIsFinalizando(false);
    setIsFinalizarCaixaOpen(false);
  };

  const handleReload = () => {
    loadRegistros();
    loadAgendamentos();
    reloadBarbeiros();
    loadConfig();
    loadCommissions();
  };

  const pendentes = agendamentos.filter(a => {
    const st = (a.status || '').toLowerCase();
    const pagSt = (a.pagamento?.status || '').toLowerCase();
    if (st === 'pago' || pagSt === 'pago' || st === 'cancelado' || st === 'inativo') return false;
    return st === 'finalizado' || st === 'concluido' || st === 'atendido' || st === 'aguardando_pagamento' || st === 'pendente_pagamento';
  }).sort((a, b) => new Date(a.dataAgendada).getTime() - new Date(b.dataAgendada).getTime());
  
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
        email: a.email,
        barbeiroId: a.barbeiroId,
        barbeiroNome: barbeiros.find(b => b.id === a.barbeiroId)?.nome || 'Qualquer um',
        itens,
        total,
        tipoPagamento: a.tipoPagamento
      });
    }
  };

  // Calculando comissões do dia selecionado
  const safeDataFiltro = dataFiltro || new Date().toISOString().substring(0, 10);
  const registrosFiltradosDia = registros.filter(r => r && r.data && typeof r.data === 'string' && r.data.startsWith(safeDataFiltro));
  const registrosFiltradosMes = registros.filter(r => r && r.data && typeof r.data === 'string' && r.data.startsWith(safeDataFiltro.substring(0, 7)));

  const calcularTotaisGerais = (registrosBase: any[]) => {
    let faturamentoGeral = 0;
    let totalTaxasGeral = 0;

    registrosBase.forEach(r => {
      faturamentoGeral += r.total || 0;

      if (r.tipoPagamento && r.tipoPagamento.length > 0) {
        r.tipoPagamento.forEach((pStr: string) => {
          try {
            const p = JSON.parse(pStr);
            if (p.valor > 0) {
              if (p.valorOriginal !== undefined) {
                totalTaxasGeral += (p.valorOriginal - p.valor);
              } else {
                if (p.tipo === 'Pix' || p.tipo.toLowerCase() === 'pix') {
                  totalTaxasGeral += p.valor * ((taxas?.pix || 0) / 100);
                } else if (p.tipo === 'Crédito' || p.tipo.toLowerCase() === 'crédito') {
                  totalTaxasGeral += p.valor * ((taxas?.credito || 0) / 100);
                } else if (p.tipo === 'Débito' || p.tipo.toLowerCase() === 'débito') {
                  totalTaxasGeral += p.valor * ((taxas?.debito || 0) / 100);
                } else if (p.tipo === 'Dinheiro' || p.tipo.toLowerCase() === 'dinheiro') {
                  totalTaxasGeral += p.valor * ((taxas?.dinheiro || 0) / 100);
                }
              }
            }
          } catch (e) {}
        });
      }
    });

    return { faturamentoGeral, totalTaxasGeral };
  };

  const calcularComissoes = (registrosBase: any[]) => {
    return barbeiros.filter(b => b.linkId === empresaId).map(barbeiro => {
      const registrosBarbeiro = registrosBase.filter(r => r.barbeiroId === barbeiro.id);
      let totalServicos = 0;
      let totalProdutos = 0;
      let faturamentoTotal = 0;
      let comissaoServicos = 0;
      let comissaoProdutos = 0;
      let totalTaxas = 0;

      const detalhesAtendimentos = registrosBarbeiro.map(r => {
        const subtotalServicos = (r.itens || []).filter((i: any) => i.tipo === 'servico' || i.tipo === 'assinatura' || i.idItem === 'assinatura' || (i.nome && i.nome.toLowerCase().includes('assinatura'))).reduce((acc: number, i: any) => acc + (i.valor || 0), 0);
        const subtotalProdutos = (r.itens || []).filter((i: any) => i.tipo === 'produto').reduce((acc: number, i: any) => acc + (i.valor || 0), 0);
        const desconto = r.desconto ?? r.pagamento?.desconto ?? 0;
        const servicosValorCobrado = Math.max(0, subtotalServicos - Math.min(desconto, subtotalServicos));
        const factorServico = subtotalServicos > 0 ? servicosValorCobrado / subtotalServicos : 1;

        const isAssinatura = Boolean(r.temAssinatura || r.isSubscription || r.assinatura?.possui || r.itens?.some((i: any) => i.idItem === 'assinatura' || i.tipo === 'assinatura' || (i.nome && i.nome.toLowerCase().includes('assinatura'))));

        let comissaoServicoAtend = 0;
        let comissaoProdutoAtend = 0;

        if (isAssinatura) {
          const valServicos = subtotalServicos > 0 ? subtotalServicos : (r.valorOriginal || r.valorTotal || r.total || 0);
          if (valServicos > 30) {
            comissaoServicoAtend = 17.5;
          } else if (valServicos > 0) {
            comissaoServicoAtend = 10;
          }
          (r.itens || []).forEach((item: any) => {
            if (item.tipo === 'produto') {
              const produtoObj = produtos.find(p => p.id === item.idItem);
              const override = produtoObj && Number(produtoObj.comissao) > 0 ? Number(produtoObj.comissao) : Number(barbeiro.comissao);
              comissaoProdutoAtend += item.valor * ((override || 0) / 100);
            }
          });
        } else {
          (r.itens || []).forEach((item: any) => {
            if (item.tipo === 'servico' || item.tipo === 'assinatura' || item.idItem === 'assinatura' || (item.nome && item.nome.toLowerCase().includes('assinatura'))) {
              const servicoValorComDesconto = item.valor * factorServico;
              comissaoServicoAtend += servicoValorComDesconto * (barbeiro.corte / 100);
            } else if (item.tipo === 'produto') {
              const produtoObj = produtos.find(p => p.id === item.idItem);
              const override = produtoObj && Number(produtoObj.comissao) > 0 ? Number(produtoObj.comissao) : Number(barbeiro.comissao);
              comissaoProdutoAtend += item.valor * ((override || 0) / 100);
            }
          });
        }

        const valCalcAtend = servicosValorCobrado + subtotalProdutos;
        const valorTotalAtend = valCalcAtend > 0 ? valCalcAtend : (r.total || r.valorOriginal || r.valorTotal || 0);
        const comissaoTotalAtend = comissaoServicoAtend + comissaoProdutoAtend;

        return {
          id: r.id,
          cliente: r.cliente || r.nomeCliente || 'Cliente',
          dataAgendada: r.dataAgendada || r.data,
          horarios: r.horarios,
          isAssinatura,
          subtotalServicos: servicosValorCobrado,
          subtotalProdutos,
          valorTotalAtend,
          comissaoServicoAtend,
          comissaoProdutoAtend,
          comissaoTotalAtend,
          itens: r.itens || []
        };
      });

      registrosBarbeiro.forEach(r => {
        let totalItem = 0;
        const subtotalServicos = (r.itens || []).filter((i: any) => i.tipo === 'servico' || i.tipo === 'assinatura' || i.idItem === 'assinatura' || (i.nome && i.nome.toLowerCase().includes('assinatura'))).reduce((acc: number, i: any) => acc + (i.valor || 0), 0);
        const desconto = r.desconto ?? r.pagamento?.desconto ?? 0;
        const servicosValorCobrado = Math.max(0, subtotalServicos - Math.min(desconto, subtotalServicos));
        const factorServico = subtotalServicos > 0 ? servicosValorCobrado / subtotalServicos : 1;

        const isAssinatura = Boolean(r.temAssinatura || r.isSubscription || r.assinatura?.possui || r.itens?.some((i: any) => i.idItem === 'assinatura' || i.tipo === 'assinatura' || (i.nome && i.nome.toLowerCase().includes('assinatura'))));

        if (isAssinatura) {
          // Assinatura: comissão por serviço é R$ 10 para agendamento até R$ 30, e R$ 17,50 acima de R$ 30
          const valServicos = subtotalServicos > 0 ? subtotalServicos : (r.valorOriginal || r.valorTotal || r.total || 0);
          if (valServicos > 30) {
            comissaoServicos += 17.5;
          } else if (valServicos > 0) {
            comissaoServicos += 10;
          }

          let temItemProcessado = false;
          (r.itens || []).forEach((item: any) => {
            if (item.tipo === 'servico' || item.tipo === 'assinatura' || item.idItem === 'assinatura' || (item.nome && item.nome.toLowerCase().includes('assinatura'))) {
              const servicoValorComDesconto = item.valor > 0 ? item.valor * factorServico : 0;
              faturamentoTotal += servicoValorComDesconto;
              totalServicos += servicoValorComDesconto;
              totalItem += servicoValorComDesconto;
              temItemProcessado = true;
            } else if (item.tipo === 'produto') {
              faturamentoTotal += item.valor;
              totalProdutos += item.valor;
              totalItem += item.valor;
              temItemProcessado = true;
              const produtoObj = produtos.find(p => p.id === item.idItem);
              const override = produtoObj && Number(produtoObj.comissao) > 0 ? Number(produtoObj.comissao) : Number(barbeiro.comissao);
              comissaoProdutos += item.valor * ((override || 0) / 100);
            } else if (item.valor > 0) {
              faturamentoTotal += item.valor;
              totalItem += item.valor;
              temItemProcessado = true;
            }
          });

          if (!temItemProcessado || totalItem === 0) {
            const valAtend = r.total || r.valorOriginal || r.valorTotal || valServicos || 0;
            if (valAtend > 0) {
              faturamentoTotal += valAtend;
              totalServicos += valAtend;
            }
          }
        } else {
          let temItemProcessado = false;
          (r.itens || []).forEach((item: any) => {
            if (item.tipo === 'servico' || item.tipo === 'assinatura' || item.idItem === 'assinatura' || (item.nome && item.nome.toLowerCase().includes('assinatura'))) {
              const servicoValorComDesconto = item.valor * factorServico;
              faturamentoTotal += servicoValorComDesconto;
              totalServicos += servicoValorComDesconto;
              totalItem += servicoValorComDesconto;
              temItemProcessado = true;
              comissaoServicos += servicoValorComDesconto * (barbeiro.corte / 100);
            } else if (item.tipo === 'produto') {
              faturamentoTotal += item.valor;
              totalProdutos += item.valor;
              totalItem += item.valor;
              temItemProcessado = true;
              const produtoObj = produtos.find(p => p.id === item.idItem);
              const override = produtoObj && Number(produtoObj.comissao) > 0 ? Number(produtoObj.comissao) : Number(barbeiro.comissao);
              comissaoProdutos += item.valor * ((override || 0) / 100);
            } else if (item.valor > 0) {
              faturamentoTotal += item.valor;
              totalItem += item.valor;
              temItemProcessado = true;
            }
          });

          if (!temItemProcessado || totalItem === 0) {
            const valAtend = r.total || r.valorOriginal || r.valorTotal || 0;
            if (valAtend > 0) {
              faturamentoTotal += valAtend;
              totalServicos += valAtend;
              comissaoServicos += valAtend * (barbeiro.corte / 100);
            }
          }
        }

        // Compute taxas
        if (r.tipoPagamento && r.tipoPagamento.length > 0) {
          r.tipoPagamento.forEach((pStr: string) => {
             try {
               const p = JSON.parse(pStr);
               if (p.valor > 0) {
                 if (p.valorOriginal !== undefined) {
                    totalTaxas += (p.valorOriginal - p.valor);
                 } else {
                    if (p.tipo === 'Pix' || p.tipo.toLowerCase() === 'pix') {
                       totalTaxas += p.valor * ((taxas?.pix || 0) / 100);
                    } else if (p.tipo === 'Crédito' || p.tipo.toLowerCase() === 'crédito') {
                       totalTaxas += p.valor * ((taxas?.credito || 0) / 100);
                    } else if (p.tipo === 'Débito' || p.tipo.toLowerCase() === 'débito') {
                       totalTaxas += p.valor * ((taxas?.debito || 0) / 100);
                    } else if (p.tipo === 'Dinheiro' || p.tipo.toLowerCase() === 'dinheiro') {
                       totalTaxas += p.valor * ((taxas?.dinheiro || 0) / 100);
                    }
                 }
               }
             } catch (e) {}
          });
        }
      });

      return {
        barbeiro,
        totalServicos,
        totalProdutos,
        faturamentoTotal,
        comissaoServicos,
        comissaoProdutos,
        totalTaxas,
        detalhesAtendimentos,
        totalComissao: comissaoServicos + comissaoProdutos,
        caixaBarbearia: faturamentoTotal - (comissaoServicos + comissaoProdutos) - totalTaxas
      };
    }).filter(c => c.faturamentoTotal > 0);
  };

  const comissoesDia = calcularComissoes(registrosFiltradosDia).sort((a, b) => b.totalComissao - a.totalComissao);
  const comissoesMes = calcularComissoes(registrosFiltradosMes).sort((a, b) => b.totalComissao - a.totalComissao);

  const totaisDiaGeral = calcularTotaisGerais(registrosFiltradosDia);
  const totaisMesGeral = calcularTotaisGerais(registrosFiltradosMes);

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
          <button
            onClick={() => setActiveSubTab('lucro')}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeSubTab === 'lucro' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Lucro Líquido
          </button>
        </nav>
      </div>

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
                {registrosFiltradosDia.length === 0 ? (
                  <div className="w-full bg-gray-900/50 p-6 rounded-2xl border border-gray-800 text-center text-gray-500 mt-4">
                    <p>Nenhuma venda ou serviço registrado para esta data.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 mt-4">
                    {/* Barbearia Card */}
                    <div className="bg-blue-950/40 p-4 sm:p-6 rounded-2xl border border-blue-900/50 flex flex-col gap-4 transition-all shadow-md">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-900/40 pb-3">
                        <div>
                          <h3 className="font-bold text-blue-100 text-lg sm:text-xl flex items-center gap-2">
                             <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                             Caixa Barbearia
                          </h3>
                          <div className="text-xs sm:text-sm text-blue-300 mt-0.5">
                            Fat. Bruto Geral: <strong className="text-white">R$ {totaisDiaGeral.faturamentoGeral.toFixed(2)}</strong>
                          </div>
                        </div>

                        <button 
                          onClick={() => {
                            const faturamentoBrutoTotal = totaisDiaGeral.faturamentoGeral;
                            const caixaTotal = totaisDiaGeral.faturamentoGeral - comissoesDia.reduce((sum, c) => sum + c.totalComissao, 0) - totaisDiaGeral.totalTaxasGeral;
                            setReceitaData({ isBarbearia: true, faturamentoBrutoTotal, caixaBarbearia: caixaTotal });
                            setIsFinalizarCaixaOpen(true);
                          }}
                          className="flex items-center justify-center gap-2 px-3.5 py-2 bg-blue-800/60 hover:bg-blue-700/80 border border-blue-600/50 text-blue-100 text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-sm shrink-0 w-full sm:w-auto"
                          title="Fechar Barbearia (Criar Receita)"
                        >
                          <svg className="w-4 h-4 text-blue-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                          <span>Fechar Caixa Barbearia</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="bg-blue-900/20 p-3 rounded-xl border border-blue-800/40">
                          <span className="text-blue-200/70 text-[10px] font-bold uppercase tracking-wider block mb-0.5">Comissões Pagas</span>
                          <span className="text-red-400 font-semibold text-sm sm:text-base">- R$ {comissoesDia.reduce((sum, c) => sum + c.totalComissao, 0).toFixed(2)}</span>
                        </div>

                        <div className="bg-blue-900/20 p-3 rounded-xl border border-blue-800/40">
                          <span className="text-blue-200/70 text-[10px] font-bold uppercase tracking-wider block mb-0.5">Taxas (Cartão)</span>
                          <span className="text-amber-400 font-semibold text-sm sm:text-base">- R$ {totaisDiaGeral.totalTaxasGeral.toFixed(2)}</span>
                        </div>

                        <div className="bg-blue-900/40 p-3 rounded-xl border border-blue-700/50 col-span-2 sm:col-span-1">
                          <span className="text-blue-200 text-[10px] font-bold uppercase tracking-wider block mb-0.5">Lucro Barbearia</span>
                          <span className="text-blue-300 font-bold text-lg sm:text-xl">R$ {(totaisDiaGeral.faturamentoGeral - comissoesDia.reduce((sum, c) => sum + c.totalComissao, 0) - totaisDiaGeral.totalTaxasGeral).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    {/* Fim Barbearia Card */}

                    {comissoesDia.map((c, idx) => {
                      const expandKey = c.barbeiro.id + '_d';
                      const isExpanded = Boolean(expandedBarbeiros[expandKey]);
                      const paidKey = `${c.barbeiro.id}_d_${dataFiltro}`;
                      const stats = getPaidStatsForBarbeiro(
                        paidCommissionsList,
                        c.barbeiro.id,
                        c.barbeiro.email || c.barbeiro.idEmail,
                        c.barbeiro.nome,
                        paidKey,
                        dataFiltro,
                        c.totalComissao
                      );
                      const isPaid = stats.isFullyPaid;
                      const isPartiallyPaid = stats.isPartiallyPaid;

                      return (
                        <div key={idx} className="bg-gray-900/80 p-4 sm:p-6 rounded-2xl border border-gray-800 flex flex-col gap-4 sm:gap-5 transition-all hover:border-gray-700/80 shadow-lg">
                          {/* Header Row */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800/60 pb-3">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-white text-lg sm:text-xl">{c.barbeiro.nome}</h3>
                                <span className="text-[11px] sm:text-xs bg-blue-900/40 text-blue-300 font-medium px-2 py-0.5 rounded border border-blue-800/40 shrink-0">
                                  Corte {c.barbeiro.corte}% • Prod {c.barbeiro.comissao}%
                                </span>
                                {isPaid && (
                                  <span className="text-[11px] bg-emerald-500/20 text-emerald-400 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1">
                                    ✓ COMISSÃO QUITADA (R$ {stats.totalPago.toFixed(2)})
                                  </span>
                                )}
                                {isPartiallyPaid && (
                                  <span className="text-[11px] bg-amber-500/20 text-amber-300 font-bold px-2.5 py-0.5 rounded-full border border-amber-500/40 flex items-center gap-1">
                                    ⚡ NOVO SALDO PENDENTE: R$ {stats.comissaoPendente.toFixed(2)}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs sm:text-sm text-gray-400 flex items-center gap-2.5 flex-wrap">
                                <span>Fat. do Barbeiro: <strong className="text-white">R$ {c.faturamentoTotal.toFixed(2)}</strong></span>
                                <span className="text-gray-600">•</span>
                                <span>Atendimentos: <strong className="text-gray-200">{c.detalhesAtendimentos?.length || 0}</strong></span>
                              </div>
                            </div>

                            {isPaid ? (
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="flex items-center gap-1.5 px-3 py-2 bg-emerald-950/80 text-emerald-400 border border-emerald-500/50 text-xs sm:text-sm font-bold rounded-xl shadow-sm">
                                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                                  <span>Quitado (R$ {stats.totalPago.toFixed(2)})</span>
                                </span>
                                <button 
                                  onClick={() => {
                                    setReceitaData({ ...c, nome: c.barbeiro.nome, periodKey: paidKey, subTab: 'diario', totalComissao: c.totalComissao, totalPagoAnterior: stats.totalPago });
                                    setIsFinalizarCaixaOpen(true);
                                  }}
                                  className="text-xs text-gray-400 hover:text-white underline px-1 py-1"
                                  title="Refazer ou adicionar pagamento"
                                >
                                  Reenviar
                                </button>
                              </div>
                            ) : isPartiallyPaid ? (
                              <button 
                                onClick={() => {
                                  setReceitaData({ ...c, nome: c.barbeiro.nome, periodKey: paidKey, subTab: 'diario', totalComissao: stats.comissaoPendente, totalPagoAnterior: stats.totalPago });
                                  setIsFinalizarCaixaOpen(true);
                                }}
                                className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-sm shrink-0 w-full sm:w-auto"
                                title="Pagar apenas o saldo das novas comissões geradas"
                              >
                                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <span>Pagar Saldo (R$ {stats.comissaoPendente.toFixed(2)})</span>
                              </button>
                            ) : (
                              <button 
                                onClick={() => {
                                  setReceitaData({ ...c, nome: c.barbeiro.nome, periodKey: paidKey, subTab: 'diario', totalComissao: c.totalComissao, totalPagoAnterior: 0 });
                                  setIsFinalizarCaixaOpen(true);
                                }}
                                className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-sm shrink-0 w-full sm:w-auto"
                                title="Pagar comissão pendente do barbeiro"
                              >
                                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <span>Pagar Comissão (R$ {c.totalComissao.toFixed(2)})</span>
                              </button>
                            )}
                          </div>

                          {/* Metrics Grid */}
                          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
                            <div className="bg-gray-800/60 p-3 sm:p-4 rounded-xl border border-gray-700/50 flex flex-col justify-between gap-1">
                              <span className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider block">Comissão Serviços</span>
                              <div className="flex items-baseline justify-between gap-1 flex-wrap">
                                <span className="text-[10px] sm:text-xs text-gray-400">Fat: R$ {c.totalServicos.toFixed(2)}</span>
                                <span className="text-blue-400 font-bold text-sm sm:text-base">R$ {c.comissaoServicos.toFixed(2)}</span>
                              </div>
                            </div>

                            <div className="bg-gray-800/60 p-3 sm:p-4 rounded-xl border border-gray-700/50 flex flex-col justify-between gap-1">
                              <span className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider block">Comissão Produtos</span>
                              <div className="flex items-baseline justify-between gap-1 flex-wrap">
                                <span className="text-[10px] sm:text-xs text-gray-400">Fat: R$ {c.totalProdutos.toFixed(2)}</span>
                                <span className="text-purple-400 font-bold text-sm sm:text-base">R$ {c.comissaoProdutos.toFixed(2)}</span>
                              </div>
                            </div>

                            <div className="bg-emerald-950/40 p-3 sm:p-4 rounded-xl border border-emerald-500/40 col-span-2 lg:col-span-1 flex items-center justify-between gap-3">
                              <div>
                                <span className="text-emerald-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider block">
                                  {stats.totalPago > 0 ? 'Saldo A Pagar' : 'Comissão Total'}
                                </span>
                                {stats.totalPago > 0 && (
                                  <span className="text-[10px] text-gray-400 block">Já pago: R$ {stats.totalPago.toFixed(2)}</span>
                                )}
                              </div>
                              <div className="text-emerald-400 font-extrabold text-lg sm:text-2xl font-mono text-right">
                                R$ {stats.comissaoPendente.toFixed(2)}
                              </div>
                            </div>
                          </div>

                          {/* Accordion Extrato e Histórico de Pagamentos */}
                          {(() => {
                            const cardMode = cardAccordionMode[expandKey] || 'atendimentos';
                            const bEmail = (c.barbeiro.email || c.barbeiro.idEmail || '').toLowerCase().trim();
                            const bNome = (c.barbeiro.nome || '').toLowerCase().trim();
                            const bId = (c.barbeiro.id || '').toLowerCase().trim();

                            const barbeiroPayments = paidCommissionsList.filter(r => {
                              const rEmail = (r.email || '').toLowerCase().trim();
                              const rNome = (r.barbeiroNome || '').toLowerCase().trim();
                              return (bEmail && rEmail && bEmail === rEmail) ||
                                (bNome && rNome && bNome === rNome) ||
                                (bId && (rEmail === bId || rNome === bId));
                            });

                            return (
                              <div className="pt-1">
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                  <button
                                    onClick={() => {
                                      if (isExpanded && cardMode === 'atendimentos') {
                                        toggleExpandBarbeiro(expandKey, 'atendimentos');
                                      } else {
                                        setCardAccordionMode(m => ({ ...m, [expandKey]: 'atendimentos' }));
                                        if (!isExpanded) toggleExpandBarbeiro(expandKey, 'atendimentos');
                                      }
                                    }}
                                    className={`flex-1 flex items-center justify-between py-2 px-3.5 border rounded-xl text-xs font-semibold transition-all ${
                                      isExpanded && cardMode === 'atendimentos'
                                        ? 'bg-blue-600/90 text-white border-blue-500 shadow-sm'
                                        : 'bg-gray-800/40 hover:bg-gray-800/80 border-gray-700/50 text-gray-300 hover:text-white'
                                    }`}
                                  >
                                    <span className="flex items-center gap-2 truncate">
                                      <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                      <span className="truncate">Extrato Atendimentos ({c.detalhesAtendimentos?.length || 0})</span>
                                    </span>
                                    <span className="text-[10px] bg-gray-900/60 px-1.5 py-0.5 rounded text-gray-200 shrink-0 ml-1">
                                      {isExpanded && cardMode === 'atendimentos' ? '▲ Ocultar' : '▼ Extrato'}
                                    </span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      if (isExpanded && cardMode === 'pagamentos') {
                                        toggleExpandBarbeiro(expandKey, 'pagamentos');
                                      } else {
                                        setCardAccordionMode(m => ({ ...m, [expandKey]: 'pagamentos' }));
                                        if (!isExpanded) toggleExpandBarbeiro(expandKey, 'pagamentos');
                                      }
                                    }}
                                    className={`flex-1 flex items-center justify-between py-2 px-3.5 border rounded-xl text-xs font-semibold transition-all ${
                                      isExpanded && cardMode === 'pagamentos'
                                        ? 'bg-emerald-700/90 text-white border-emerald-500 shadow-sm'
                                        : 'bg-gray-800/40 hover:bg-gray-800/80 border-gray-700/50 text-gray-300 hover:text-white'
                                    }`}
                                  >
                                    <span className="flex items-center gap-2 truncate">
                                      <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                      <span className="truncate">📜 Histórico Pagamentos ({barbeiroPayments.length})</span>
                                    </span>
                                    <span className="text-[10px] bg-gray-900/60 px-1.5 py-0.5 rounded text-gray-200 shrink-0 ml-1">
                                      {isExpanded && cardMode === 'pagamentos' ? '▲ Ocultar' : '▼ Log'}
                                    </span>
                                  </button>
                                </div>

                                {isExpanded && cardMode === 'atendimentos' && (
                                  <div className="mt-3 bg-gray-950/80 p-3.5 sm:p-4 rounded-xl border border-gray-800 flex flex-col gap-3">
                                    <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                        Extrato Detalhado ({c.barbeiro.nome})
                                      </h4>
                                      <span className="text-xs text-gray-500">
                                        {c.detalhesAtendimentos?.length || 0} atendimento(s)
                                      </span>
                                    </div>

                                    {(!c.detalhesAtendimentos || c.detalhesAtendimentos.length === 0) ? (
                                      <p className="text-xs text-gray-500 py-2">Nenhum atendimento no período.</p>
                                    ) : (
                                      <div className="divide-y divide-gray-800/80">
                                        {c.detalhesAtendimentos.map((atend: any, idxAt: number) => {
                                          const { dataStr, horaStr } = formatarDataHora(atend.dataAgendada, atend.horarios);
                                          return (
                                            <div key={atend.id || idxAt} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                                              <div className="flex flex-col gap-1 min-w-[150px]">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                  <span className="font-semibold text-gray-300 bg-gray-800 px-2 py-0.5 rounded border border-gray-700 text-[11px]">
                                                    {dataStr} {horaStr ? `• ${horaStr}` : ''}
                                                  </span>
                                                  {atend.isAssinatura && (
                                                    <span className="bg-purple-900/50 text-purple-300 font-bold px-2 py-0.5 rounded border border-purple-700/50 text-[10px]">
                                                      🏷️ VIP
                                                    </span>
                                                  )}
                                                </div>
                                                <span className="font-bold text-white text-sm">{atend.cliente}</span>
                                              </div>

                                              <div className="flex-1 flex flex-wrap gap-1.5 my-0.5 sm:my-0">
                                                {atend.itens?.map((it: any, iIdx: number) => (
                                                  <span key={iIdx} className={`px-2 py-0.5 rounded border text-[11px] font-medium ${
                                                    it.tipo === 'servico' 
                                                      ? 'bg-blue-950/50 text-blue-300 border-blue-800/50' 
                                                      : 'bg-amber-950/50 text-amber-300 border-amber-800/50'
                                                  }`}>
                                                    {it.nome || (it.tipo === 'servico' ? 'Serviço' : 'Produto')} (R$ {Number(it.valor || 0).toFixed(2)})
                                                  </span>
                                                ))}
                                              </div>

                                              <div className="flex items-center justify-between sm:justify-end gap-3 min-w-[170px] pt-1 sm:pt-0 border-t sm:border-t-0 border-gray-800/60">
                                                <div className="text-right">
                                                  <span className="text-[10px] text-gray-500 uppercase font-bold block">Valor Total</span>
                                                  <span className="text-gray-300 font-semibold">R$ {atend.valorTotalAtend.toFixed(2)}</span>
                                                </div>

                                                <div className="text-right bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-800/50">
                                                  <span className="text-[10px] text-emerald-400/90 uppercase font-bold block">Comissão</span>
                                                  <span className="text-emerald-400 font-bold text-sm">R$ {atend.comissaoTotalAtend.toFixed(2)}</span>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {isExpanded && cardMode === 'pagamentos' && (
                                  <div className="mt-3 bg-gray-950/80 p-3.5 sm:p-4 rounded-xl border border-gray-800 flex flex-col gap-3">
                                    <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                                        <span>📜 Histórico de Sangrias e Pagamentos de Comissão ({c.barbeiro.nome})</span>
                                      </h4>
                                      <span className="text-xs text-gray-400 font-bold">
                                        Total Pago: R$ {barbeiroPayments.reduce((acc, p) => acc + Number(p.valorComissao || 0), 0).toFixed(2)}
                                      </span>
                                    </div>

                                    {barbeiroPayments.length === 0 ? (
                                      <p className="text-xs text-gray-500 py-3 text-center">Nenhum pagamento ou sangria de comissão registrado para este barbeiro.</p>
                                    ) : (
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs text-gray-300">
                                          <thead className="bg-gray-900 text-gray-400 uppercase text-[10px] font-bold">
                                            <tr>
                                              <th className="p-2">Data Ref.</th>
                                              <th className="p-2">Data/Hora Sangria</th>
                                              <th className="p-2">Email Barbeiro</th>
                                              <th className="p-2 text-right">Valor Pago</th>
                                              <th className="p-2 text-center">Status</th>
                                              <th className="p-2 text-center">Ação</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-800/80">
                                            {barbeiroPayments.map((p, pIdx) => {
                                              const originalIndex = paidCommissionsList.indexOf(p);
                                              const dataFmt = p.data ? p.data.split('-').reverse().join('/') : '-';
                                              return (
                                                <tr key={pIdx} className="hover:bg-gray-900/60">
                                                  <td className="p-2 font-mono text-gray-200 font-bold">
                                                    {dataFmt}
                                                  </td>
                                                  <td className="p-2 text-gray-400 font-mono text-[11px]">
                                                    {formatarDateTime(p.paidAt)}
                                                  </td>
                                                  <td className="p-2 text-gray-400 text-[11px] truncate max-w-[150px]">
                                                    {p.email || '-'}
                                                  </td>
                                                  <td className="p-2 text-right font-extrabold text-emerald-400">
                                                    R$ {Number(p.valorComissao).toFixed(2)}
                                                  </td>
                                                  <td className="p-2 text-center">
                                                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                                                      ✓ PAGO
                                                    </span>
                                                  </td>
                                                  <td className="p-2 text-center">
                                                    <button
                                                      onClick={() => handleRemovePaidCommission(originalIndex)}
                                                      className="text-red-400 hover:text-red-300 hover:bg-red-950/40 px-2 py-0.5 rounded text-[11px] font-semibold underline"
                                                      title="Estornar / remover pagamento de comissão"
                                                    >
                                                      Estornar
                                                    </button>
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
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
                  currentDate={new Date(parseInt((dataFiltro || '2026-08-01').split('-')[0]), parseInt((dataFiltro || '2026-08-01').split('-')[1]) - 1, 1)}
                  setCurrentDate={(d) => {
                    const yyyy = d.getFullYear();
                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                    setDataFiltro(`${yyyy}-${mm}-01`);
                  }}
                />
              </div>
                {comissoesMes.length === 0 ? (
                  <div className="w-full bg-gray-900/50 p-6 rounded-2xl border border-gray-800 text-center text-gray-500 mt-4">
                    <p>Nenhum registro encontrado para este mês.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 mt-4">
                    {comissoesMes.map((c, idx) => {
                      const expandKey = c.barbeiro.id + '_m';
                      const isExpanded = Boolean(expandedBarbeiros[expandKey]);
                      const paidKey = `${c.barbeiro.id}_m_${dataFiltro.slice(0, 7)}`;
                      const stats = getPaidStatsForBarbeiro(
                        paidCommissionsList,
                        c.barbeiro.id,
                        c.barbeiro.email || c.barbeiro.idEmail,
                        c.barbeiro.nome,
                        paidKey,
                        dataFiltro.slice(0, 7),
                        c.totalComissao
                      );
                      const isPaid = stats.isFullyPaid;
                      const isPartiallyPaid = stats.isPartiallyPaid;

                      return (
                        <div key={idx} className="bg-gray-900/80 p-4 sm:p-6 rounded-2xl border border-gray-800 flex flex-col gap-4 sm:gap-5 transition-all hover:border-gray-700/80 shadow-lg">
                          {/* Header Row */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800/60 pb-3">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-white text-lg sm:text-xl">{c.barbeiro.nome}</h3>
                                <span className="text-[11px] sm:text-xs bg-blue-900/40 text-blue-300 font-medium px-2 py-0.5 rounded border border-blue-800/40 shrink-0">
                                  Corte {c.barbeiro.corte}% • Prod {c.barbeiro.comissao}%
                                </span>
                                {isPaid && (
                                  <span className="text-[11px] bg-emerald-500/20 text-emerald-400 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1">
                                    ✓ MÊS QUITADO (R$ {stats.totalPago.toFixed(2)})
                                  </span>
                                )}
                                {isPartiallyPaid && (
                                  <span className="text-[11px] bg-amber-500/20 text-amber-300 font-bold px-2.5 py-0.5 rounded-full border border-amber-500/40 flex items-center gap-1">
                                    ⚡ NOVO SALDO MENSAL PENDENTE: R$ {stats.comissaoPendente.toFixed(2)}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs sm:text-sm text-gray-400 flex items-center gap-2.5 flex-wrap">
                                <span>Fat. do Barbeiro: <strong className="text-white">R$ {c.faturamentoTotal.toFixed(2)}</strong></span>
                                <span className="text-gray-600">•</span>
                                <span>Atendimentos: <strong className="text-gray-200">{c.detalhesAtendimentos?.length || 0}</strong></span>
                              </div>
                            </div>

                            {isPaid ? (
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="flex items-center gap-1.5 px-3 py-2 bg-emerald-950/80 text-emerald-400 border border-emerald-500/50 text-xs sm:text-sm font-bold rounded-xl shadow-sm">
                                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                                  <span>Mês Quitada (R$ {stats.totalPago.toFixed(2)})</span>
                                </span>
                                <button 
                                  onClick={() => {
                                    setReceitaData({ ...c, nome: c.barbeiro.nome, periodKey: paidKey, subTab: 'mensal', totalComissao: c.totalComissao, totalPagoAnterior: stats.totalPago });
                                    setIsFinalizarCaixaOpen(true);
                                  }}
                                  className="text-xs text-gray-400 hover:text-white underline px-1 py-1"
                                  title="Refazer ou adicionar pagamento do mês"
                                >
                                  Reenviar
                                </button>
                              </div>
                            ) : isPartiallyPaid ? (
                              <button 
                                onClick={() => {
                                  setReceitaData({ ...c, nome: c.barbeiro.nome, periodKey: paidKey, subTab: 'mensal', totalComissao: stats.comissaoPendente, totalPagoAnterior: stats.totalPago });
                                  setIsFinalizarCaixaOpen(true);
                                }}
                                className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-sm shrink-0 w-full sm:w-auto"
                                title="Pagar apenas o saldo pendente do mês"
                              >
                                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <span>Pagar Saldo do Mês (R$ {stats.comissaoPendente.toFixed(2)})</span>
                              </button>
                            ) : (
                              <button 
                                onClick={() => {
                                  setReceitaData({ ...c, nome: c.barbeiro.nome, periodKey: paidKey, subTab: 'mensal', totalComissao: c.totalComissao, totalPagoAnterior: 0 });
                                  setIsFinalizarCaixaOpen(true);
                                }}
                                className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-sm shrink-0 w-full sm:w-auto"
                                title="Pagar comissão do mês"
                              >
                                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <span>Pagar Comissão do Mês (R$ {c.totalComissao.toFixed(2)})</span>
                              </button>
                            )}
                          </div>

                          {/* Metrics Grid */}
                          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
                            <div className="bg-gray-800/60 p-3 sm:p-4 rounded-xl border border-gray-700/50 flex flex-col justify-between gap-1">
                              <span className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider block">Comissão Serviços</span>
                              <div className="flex items-baseline justify-between gap-1 flex-wrap">
                                <span className="text-[10px] sm:text-xs text-gray-400">Fat: R$ {c.totalServicos.toFixed(2)}</span>
                                <span className="text-blue-400 font-bold text-sm sm:text-base">R$ {c.comissaoServicos.toFixed(2)}</span>
                              </div>
                            </div>

                            <div className="bg-gray-800/60 p-3 sm:p-4 rounded-xl border border-gray-700/50 flex flex-col justify-between gap-1">
                              <span className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider block">Comissão Produtos</span>
                              <div className="flex items-baseline justify-between gap-1 flex-wrap">
                                <span className="text-[10px] sm:text-xs text-gray-400">Fat: R$ {c.totalProdutos.toFixed(2)}</span>
                                <span className="text-purple-400 font-bold text-sm sm:text-base">R$ {c.comissaoProdutos.toFixed(2)}</span>
                              </div>
                            </div>

                            <div className="bg-emerald-950/40 p-3 sm:p-4 rounded-xl border border-emerald-500/40 col-span-2 lg:col-span-1 flex items-center justify-between gap-3">
                              <div>
                                <span className="text-emerald-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider block">
                                  {stats.totalPago > 0 ? 'Saldo Mensal A Pagar' : 'Comissão Mensal'}
                                </span>
                                {stats.totalPago > 0 && (
                                  <span className="text-[10px] text-gray-400 block">Já pago: R$ {stats.totalPago.toFixed(2)}</span>
                                )}
                              </div>
                              <span className="text-emerald-400 font-extrabold text-lg sm:text-2xl shrink-0">
                                R$ {(stats.totalPago > 0 ? stats.comissaoPendente : c.totalComissao).toFixed(2)}
                              </span>
                            </div>
                          </div>

                          <div className="border-t border-gray-800/80 pt-3">
                            <button
                              onClick={() => toggleExpandBarbeiro(expandKey)}
                              className="w-full flex items-center justify-between py-2 px-4 bg-gray-800/40 hover:bg-gray-800/80 border border-gray-700/50 rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition-all"
                            >
                              <span className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                {isExpanded ? 'Ocultar extrato de atendimentos' : `Ver detalhe de cada valor/atendimento (${c.detalhesAtendimentos?.length || 0})`}
                              </span>
                              <span className="text-[11px] bg-gray-700/60 px-2 py-0.5 rounded text-gray-200">
                                {isExpanded ? '▲ Ocultar' : '▼ Expandir Extrato'}
                              </span>
                            </button>

                            {isExpanded && (
                              <div className="mt-3 bg-gray-950/80 p-4 rounded-xl border border-gray-800 flex flex-col gap-3">
                                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                    Extrato Detalhado de Comissões ({c.barbeiro.nome})
                                  </h4>
                                  <span className="text-xs text-gray-500">
                                    {c.detalhesAtendimentos?.length || 0} registro(s)
                                  </span>
                                </div>

                                {(!c.detalhesAtendimentos || c.detalhesAtendimentos.length === 0) ? (
                                  <p className="text-xs text-gray-500 py-2">Nenhum atendimento no período.</p>
                                ) : (
                                  <div className="divide-y divide-gray-800/80">
                                    {c.detalhesAtendimentos.map((atend: any, idxAt: number) => {
                                      const { dataStr, horaStr } = formatarDataHora(atend.dataAgendada, atend.horarios);
                                      return (
                                        <div key={atend.id || idxAt} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                          <div className="flex flex-col gap-1 min-w-[170px]">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              <span className="font-semibold text-gray-300 bg-gray-800 px-2 py-0.5 rounded border border-gray-700 text-[11px]">
                                                {dataStr} {horaStr ? `• ${horaStr}` : ''}
                                              </span>
                                              {atend.isAssinatura && (
                                                <span className="bg-purple-900/50 text-purple-300 font-bold px-2 py-0.5 rounded border border-purple-700/50 text-[10px]">
                                                  🏷️ VIP Assinatura
                                                </span>
                                              )}
                                            </div>
                                            <span className="font-bold text-white text-sm">{atend.cliente}</span>
                                          </div>

                                          <div className="flex-1 flex flex-wrap gap-1.5 my-1 sm:my-0">
                                            {atend.itens?.map((it: any, iIdx: number) => (
                                              <span key={iIdx} className={`px-2 py-0.5 rounded border text-[11px] font-medium ${
                                                it.tipo === 'servico' 
                                                  ? 'bg-blue-950/50 text-blue-300 border-blue-800/50' 
                                                  : 'bg-amber-950/50 text-amber-300 border-amber-800/50'
                                              }`}>
                                                {it.nome || (it.tipo === 'servico' ? 'Serviço' : 'Produto')} (R$ {Number(it.valor || 0).toFixed(2)})
                                              </span>
                                            ))}
                                          </div>

                                          <div className="flex items-center justify-between sm:justify-end gap-3 min-w-[190px] border-t sm:border-t-0 border-gray-800/80 pt-2 sm:pt-0">
                                            <div className="text-right">
                                              <span className="text-[10px] text-gray-500 uppercase font-bold block">Valor Atendimento</span>
                                              <span className="text-gray-300 font-semibold">R$ {atend.valorTotalAtend.toFixed(2)}</span>
                                            </div>

                                            <div className="text-right bg-emerald-950/40 px-3 py-1 rounded-lg border border-emerald-800/50">
                                              <span className="text-[10px] text-emerald-400/90 uppercase font-bold block">Comissão</span>
                                              <span className="text-emerald-400 font-bold text-sm">R$ {atend.comissaoTotalAtend.toFixed(2)}</span>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
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

      {activeSubTab === 'aguardando' && (
        <div className="bg-gray-800/80 p-6 sm:p-8 rounded-2xl border border-gray-700/50 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 w-full sm:w-auto">Aguardando Pagamento <span className="bg-gray-900 border border-gray-700 text-sm font-bold text-blue-400 py-0.5 px-2 rounded-lg">{pendentes.length}</span></h2>
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
              const { dataStr, horaStr } = formatarDataHora(a.dataAgendada, a.horarios);
              const barbeiro = barbeiros.find(b => b.id === a.barbeiroId)?.nome || 'Qualquer um';
              
              const servicosDoAgendamento: any[] = [];
              let subtotalServicos = 0;
              let subtotalProdutos = 0;

              if (a.servicosIds && a.servicosIds.length > 0) {
                a.servicosIds.forEach((sId: string) => {
                  const s = servicos.find(x => x.id === sId);
                  if (s) {
                    servicosDoAgendamento.push(s);
                    subtotalServicos += s.valor;
                  }
                });
              } else if (a.servicoId && a.servicoId !== 'assinatura') {
                const s = servicos.find(x => x.id === a.servicoId);
                if (s) {
                  servicosDoAgendamento.push(s);
                  subtotalServicos += s.valor;
                }
              }

              if (servicosDoAgendamento.length === 0 && (a.servicoNome || a.servicoId === 'assinatura' || a.isSubscription)) {
                const val = a.pagamento?.valorRecebido || a.pagamento?.valorOriginal || a.valorOriginal || a.valorTotalPrevisto || a.valorAssinatura || a.pagamento?.valorCobrado || 0;
                servicosDoAgendamento.push({ nome: a.servicoNome || 'Plano Assinatura', valor: val });
                subtotalServicos += val;
              }

              const produtosDoAgendamento: any[] = [];
              if (a.produtosIds && a.produtosIds.length > 0) {
                a.produtosIds.forEach((pId: string) => {
                  const p = produtos.find(x => x.id === pId);
                  if (p) {
                    produtosDoAgendamento.push(p);
                    subtotalProdutos += p.precoVenda;
                  }
                });
              }

              const resumoPag = calcularResumoPagamento(
                a.dataAgendada,
                subtotalServicos,
                subtotalProdutos,
                a.pagamento ? { ...a.pagamento, desconto: a.pagamento.desconto ?? a.desconto } : ({ desconto: a.desconto } as any),
                a.assinatura,
                a.assinaturaAplicada || (a as any).isSubscription
              );

              const temAssinatura = Boolean(
                resumoPag.temAssinatura ||
                a.assinatura?.possui ||
                a.assinaturaAplicada ||
                (a as any).isSubscription
              );

              const valorOriginal = a.pagamento?.valorOriginal || (subtotalServicos + subtotalProdutos);
              const valorDesconto = temAssinatura
                ? (subtotalServicos > 0 ? subtotalServicos : valorOriginal)
                : (a.pagamento?.desconto ?? resumoPag.desconto ?? 0);

              const valorTotal = (a.pagamento?.valorRecebido && a.pagamento.valorRecebido > 0)
                ? a.pagamento.valorRecebido
                : temAssinatura
                ? Math.max(0, subtotalProdutos)
                : (a.pagamento?.valorCobrado !== undefined && a.pagamento.valorCobrado >= 0)
                ? a.pagamento.valorCobrado
                : resumoPag.valorCobrado >= 0
                ? resumoPag.valorCobrado
                : Math.max(0, valorOriginal - valorDesconto);
              
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
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total a Pagar</span>
                      {valorDesconto > 0 && (
                        <span className="text-xs text-emerald-400 font-semibold mb-0.5">
                          🏷️ {resumoPag.temAssinatura || a.assinatura?.possui || a.assinaturaAplicada || (a as any).isSubscription ? 'Desconto Assinatura' : 'Desconto'}: - R$ {valorDesconto.toFixed(2)}
                        </span>
                      )}
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl lg:text-4xl font-black text-white">R$ {valorTotal.toFixed(2)}</span>
                        {valorDesconto > 0 && (
                          <span className="text-sm text-gray-500 line-through font-semibold">
                            R$ {valorOriginal.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-3 w-full sm:w-auto">
                      <button 
                        onClick={() => handleConcluir(a)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-green-500/10 hover:bg-green-500 text-green-400 hover:text-white border border-green-500/30 font-bold py-3.5 px-8 rounded-xl transition-all shadow-sm text-lg"
                      >
                        <CheckCircleIcon className="w-5 h-5 shrink-0" /> Pago
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

      {activeSubTab === 'lucro' && (() => {
        const faturamentoMes = totaisMesGeral.faturamentoGeral;
        const comissoesPagasMes = comissoesMes.reduce((sum, c) => sum + c.totalComissao, 0);
        const totalTaxasMes = totaisMesGeral.totalTaxasGeral;
        const custosFixosList = custos.filter(c => c.tipo === 'fixo');
        const custosVariaveisList = custos.filter(c => c.tipo === 'variavel');
        const custoFixoMes = custosFixosList.reduce((sum, c) => sum + c.valor, 0);
        const custoVariavelMes = custosVariaveisList.reduce((sum, c) => sum + c.valor, 0);
        const custosTotaisMes = custoFixoMes + custoVariavelMes + totalTaxasMes;
        const impostoTax = 6; 
        const impostosMes = faturamentoMes > 5000 ? faturamentoMes * (impostoTax / 100) : 0;
        const lucroLiquidoMes = faturamentoMes - comissoesPagasMes - custosTotaisMes - impostosMes;
        const margemLucro = faturamentoMes > 0 ? (lucroLiquidoMes / faturamentoMes) * 100 : 0;

        const faturamentoServicos = registrosFiltradosMes.reduce((sum, r) => {
          const servs = (r.itens || []).filter((i: any) => i.tipo === 'servico').reduce((acc: number, i: any) => acc + (i.valor || 0), 0);
          return sum + servs;
        }, 0);

        const faturamentoProdutos = registrosFiltradosMes.reduce((sum, r) => {
          const prods = (r.itens || []).filter((i: any) => i.tipo === 'produto').reduce((acc: number, i: any) => acc + (i.valor || 0), 0);
          return sum + prods;
        }, 0);

        const totalDescontosConcedidos = registrosFiltradosMes.reduce((sum, r) => {
          return sum + (r.desconto ?? r.pagamento?.desconto ?? 0);
        }, 0);

        const pagamentoBreakdown = {
          pix: { label: 'Pix', total: 0, qtd: 0, taxas: 0 },
          credito: { label: 'Cartão de Crédito', total: 0, qtd: 0, taxas: 0 },
          debito: { label: 'Cartão de Débito', total: 0, qtd: 0, taxas: 0 },
          dinheiro: { label: 'Dinheiro Espécie', total: 0, qtd: 0, taxas: 0 },
          outros: { label: 'Outras Formas', total: 0, qtd: 0, taxas: 0 },
        };

        registrosFiltradosMes.forEach(r => {
          if (r.tipoPagamento && r.tipoPagamento.length > 0) {
            r.tipoPagamento.forEach((pStr: string) => {
              try {
                const p = JSON.parse(pStr);
                if (p.valor > 0) {
                  const tp = (p.tipo || '').toLowerCase();
                  let taxaItem = 0;
                  if (p.valorOriginal !== undefined) {
                    taxaItem = p.valorOriginal - p.valor;
                  } else {
                    if (tp.includes('pix')) taxaItem = p.valor * ((taxas?.pix || 0) / 100);
                    else if (tp.includes('crédito') || tp.includes('credito')) taxaItem = p.valor * ((taxas?.credito || 0) / 100);
                    else if (tp.includes('débito') || tp.includes('debito')) taxaItem = p.valor * ((taxas?.debito || 0) / 100);
                    else if (tp.includes('dinheiro')) taxaItem = p.valor * ((taxas?.dinheiro || 0) / 100);
                  }

                  if (tp.includes('pix')) {
                    pagamentoBreakdown.pix.total += p.valor;
                    pagamentoBreakdown.pix.qtd += 1;
                    pagamentoBreakdown.pix.taxas += taxaItem;
                  } else if (tp.includes('crédito') || tp.includes('credito')) {
                    pagamentoBreakdown.credito.total += p.valor;
                    pagamentoBreakdown.credito.qtd += 1;
                    pagamentoBreakdown.credito.taxas += taxaItem;
                  } else if (tp.includes('débito') || tp.includes('debito')) {
                    pagamentoBreakdown.debito.total += p.valor;
                    pagamentoBreakdown.debito.qtd += 1;
                    pagamentoBreakdown.debito.taxas += taxaItem;
                  } else if (tp.includes('dinheiro')) {
                    pagamentoBreakdown.dinheiro.total += p.valor;
                    pagamentoBreakdown.dinheiro.qtd += 1;
                    pagamentoBreakdown.dinheiro.taxas += taxaItem;
                  } else {
                    pagamentoBreakdown.outros.total += p.valor;
                    pagamentoBreakdown.outros.qtd += 1;
                    pagamentoBreakdown.outros.taxas += taxaItem;
                  }
                }
              } catch (e) {}
            });
          }
        });

        const [anoFiltroStr, mesFiltroStr] = (dataFiltro || new Date().toISOString().substring(0, 10)).split('-');
        const dataFiltroObj = new Date(parseInt(anoFiltroStr || '2026'), parseInt(mesFiltroStr || '8') - 1, 1);
        const nomeMesAnoStr = dataFiltroObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

        return (
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-gray-800/80 p-6 sm:p-8 rounded-2xl border border-gray-700/50 shadow-xl space-y-6">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-gray-700/50 pb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                    📊 Relatório Financeiro Consolidado de Todos os Valores
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">
                    Demonstrativo completo de Entradas, Comissões, Custos, Taxas, Impostos e Lucro Líquido para <strong className="text-white capitalize">{nomeMesAnoStr}</strong>.
                  </p>
                </div>

                <button
                  onClick={() => window.print()}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md shrink-0 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  Imprimir / Exportar PDF
                </button>
              </div>
              
              <div>
                 <MonthNavigator
                    currentDate={new Date(parseInt((dataFiltro || '2026-08-01').split('-')[0]), parseInt((dataFiltro || '2026-08-01').split('-')[1]) - 1, 1)}
                    setCurrentDate={(d) => {
                      const yyyy = d.getFullYear();
                      const mm = String(d.getMonth() + 1).padStart(2, '0');
                      setDataFiltro(`${yyyy}-${mm}-01`);
                    }}
                  />
       
                  <div className="mt-8 flex flex-col gap-6">
                     {/* Cards Principais */}
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="bg-gray-900/60 p-4 border border-gray-700/50 rounded-xl">
                            <div className="text-xs text-gray-400 mb-1 font-medium">1. Faturamento Bruto</div>
                            <div className="text-xl font-bold text-white">R$ {faturamentoMes.toFixed(2)}</div>
                            <div className="text-[11px] text-emerald-400 mt-1">{registrosFiltradosMes.length} vendas/atend.</div>
                        </div>
                        <div className="bg-gray-900/60 p-4 border border-gray-700/50 rounded-xl">
                            <div className="text-xs text-gray-400 mb-1 font-medium">2. Comissões Pagas</div>
                            <div className="text-xl font-bold text-red-400/90">- R$ {comissoesPagasMes.toFixed(2)}</div>
                            <div className="text-[11px] text-gray-400 mt-1">{comissoesMes.length} barbeiros</div>
                        </div>
                        <div className="bg-gray-900/60 p-4 border border-gray-700/50 rounded-xl">
                            <div className="text-xs text-gray-400 mb-1 font-medium">3. Custos Barbearia</div>
                            <div className="text-xl font-bold text-orange-400/90">- R$ {(custoFixoMes + custoVariavelMes).toFixed(2)}</div>
                            <div className="text-[11px] text-gray-400 mt-1">Fixos + Variáveis</div>
                        </div>
                        <div className="bg-gray-900/60 p-4 border border-gray-700/50 rounded-xl">
                            <div className="text-xs text-gray-400 mb-1 font-medium">4. Taxas Maquininha</div>
                            <div className="text-xl font-bold text-orange-400/90">- R$ {totalTaxasMes.toFixed(2)}</div>
                            <div className="text-[11px] text-gray-400 mt-1">Pix / Cartões</div>
                        </div>
                        <div className="bg-gray-900/60 p-4 border border-gray-700/50 rounded-xl">
                            <div className="text-xs text-gray-400 mb-1 font-medium">5. Impostos</div>
                            <div className="text-xl font-bold text-red-500/90">- R$ {impostosMes.toFixed(2)}</div>
                            <div className="text-[11px] text-gray-400 mt-1">{impostosMes > 0 ? `${impostoTax}% (> R$5k)` : 'Isento'}</div>
                        </div>
                     </div>
                     
                     {/* Banner Resultado Lucro Líquido */}
                     <div className="bg-gray-900/80 p-6 md:p-8 rounded-2xl border border-gray-700 flex flex-col md:flex-row items-center justify-between gap-4 shadow-inner">
                        <div>
                          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                            LUCRO LÍQUIDO CONSOLIDADO DA BARBEARIA
                          </div>
                          <div className={`text-4xl md:text-5xl font-black tracking-tight ${lucroLiquidoMes >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                             R$ {lucroLiquidoMes.toFixed(2)}
                          </div>
                          {lucroLiquidoMes < 0 && (
                            <div className="text-xs text-red-400 mt-1.5 font-semibold">⚠️ Operação com prejuízo contábil no mês selecionado.</div>
                          )}
                          {lucroLiquidoMes >= 0 && (
                            <div className="text-xs text-green-400/90 mt-1.5 font-semibold">✅ Operação lucrativa com margem de {margemLucro.toFixed(1)}%.</div>
                          )}
                        </div>

                        <div className="bg-gray-800/80 p-4 rounded-xl border border-gray-700 text-right space-y-1 w-full md:w-auto">
                          <div className="text-xs text-gray-400">Margem Líquida</div>
                          <div className={`text-2xl font-bold ${margemLucro >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {margemLucro.toFixed(1)}%
                          </div>
                          <div className="text-[10px] text-gray-500">(Lucro Líquido / Faturamento)</div>
                        </div>
                     </div>
                  </div>
              </div>

              {/* DRE Detalhada e Tabelas de Discriminativo */}
              <div className="space-y-8 pt-4">
                
                {/* 1. DRE - Demonstrativo do Resultado do Exercício */}
                <div className="bg-gray-900/80 p-5 md:p-6 rounded-2xl border border-gray-700/80 space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
                    <span>🧾 DRE - Demonstrativo de Entradas e Saídas</span>
                  </h3>

                  <div className="space-y-2 text-sm">
                    {/* Receita Bruta */}
                    <div className="flex justify-between items-center py-2 px-3 bg-emerald-950/20 rounded-lg border border-emerald-900/30 text-emerald-300 font-semibold">
                      <span>(+) FATURAMENTO BRUTO TOTAL</span>
                      <span className="font-extrabold text-base">R$ {faturamentoMes.toFixed(2)}</span>
                    </div>
                    <div className="pl-4 space-y-1 text-xs text-gray-300 border-l-2 border-emerald-800/50 my-1">
                      <div className="flex justify-between py-1 border-b border-gray-800/50">
                        <span>• Venda de Serviços (Cortes/Barba)</span>
                        <span className="font-medium text-white">R$ {faturamentoServicos.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-800/50">
                        <span>• Venda de Produtos</span>
                        <span className="font-medium text-white">R$ {faturamentoProdutos.toFixed(2)}</span>
                      </div>
                      {totalDescontosConcedidos > 0 && (
                        <div className="flex justify-between py-1 text-orange-300">
                          <span>• Descontos Concedidos</span>
                          <span className="font-medium">- R$ {totalDescontosConcedidos.toFixed(2)}</span>
                        </div>
                      )}
                    </div>

                    {/* Saídas e Custos */}
                    <div className="flex justify-between items-center py-2 px-3 bg-red-950/20 rounded-lg border border-red-900/30 text-red-300 font-semibold mt-4">
                      <span>(-) DEDUÇÕES E DEDUTÍVEIS</span>
                      <span className="font-extrabold text-base">- R$ {(comissoesPagasMes + custosTotaisMes + impostosMes).toFixed(2)}</span>
                    </div>

                    <div className="pl-4 space-y-1 text-xs text-gray-300 border-l-2 border-red-800/50 my-1">
                      <div className="flex justify-between py-1 border-b border-gray-800/50">
                        <span>• Comissões aos Barbeiros</span>
                        <span className="font-medium text-red-300">- R$ {comissoesPagasMes.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-800/50">
                        <span>• Custos Fixos da Barbearia</span>
                        <span className="font-medium text-orange-300">- R$ {custoFixoMes.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-800/50">
                        <span>• Custos Variáveis</span>
                        <span className="font-medium text-orange-300">- R$ {custoVariavelMes.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-800/50">
                        <span>• Taxas de Meios de Pagamento</span>
                        <span className="font-medium text-orange-300">- R$ {totalTaxasMes.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>• Impostos ({impostosMes > 0 ? `${impostoTax}%` : '0%'})</span>
                        <span className="font-medium text-red-400">- R$ {impostosMes.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Resultado */}
                    <div className="flex justify-between items-center py-3 px-4 bg-gray-950 rounded-xl border border-gray-700 text-white font-bold text-base mt-4 shadow-md">
                      <span className="text-gray-200">(=) RESULTADO LÍQUIDO FINAL</span>
                      <span className={lucroLiquidoMes >= 0 ? 'text-green-400 font-black text-lg' : 'text-red-400 font-black text-lg'}>
                        R$ {lucroLiquidoMes.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Tabela de Comissões por Barbeiro */}
                <div className="bg-gray-900/80 p-5 md:p-6 rounded-2xl border border-gray-700/80 space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center justify-between border-b border-gray-800 pb-3">
                    <span>💈 Discriminação de Comissões por Barbeiro</span>
                    <span className="text-xs font-normal text-gray-400">Total: R$ {comissoesPagasMes.toFixed(2)}</span>
                  </h3>

                  {comissoesMes.length === 0 ? (
                    <p className="text-xs text-gray-500 py-2">Nenhum atendimento registrado no mês.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-gray-300">
                        <thead className="bg-gray-800/80 text-gray-400 uppercase text-[10px] font-bold">
                          <tr>
                            <th className="p-2.5 rounded-l-lg">Barbeiro</th>
                            <th className="p-2.5 text-center">Atendimentos</th>
                            <th className="p-2.5 text-right">Fat. Gerado</th>
                            <th className="p-2.5 text-right">Com. Serviços</th>
                            <th className="p-2.5 text-right">Com. Produtos</th>
                            <th className="p-2.5 text-right">Comissão Total</th>
                            <th className="p-2.5 text-center rounded-r-lg">Status / Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/60">
                          {comissoesMes.map((c, idx) => {
                            const paidKey = `${c.barbeiro.id}_m_${dataFiltro.slice(0, 7)}`;
                            const stats = getPaidStatsForBarbeiro(
                              paidCommissionsList,
                              c.barbeiro.id,
                              c.barbeiro.email || c.barbeiro.idEmail,
                              c.barbeiro.nome,
                              paidKey,
                              dataFiltro.slice(0, 7),
                              c.totalComissao
                            );
                            const isPaid = stats.isFullyPaid;
                            const isPartiallyPaid = stats.isPartiallyPaid;

                            return (
                              <tr key={c.barbeiroId || c.nome || `barb-${idx}`} className="hover:bg-gray-800/40 transition-colors">
                                <td className="p-2.5 font-bold text-white flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                                    {(c.nome || 'Barbeiro').substring(0, 2).toUpperCase()}
                                  </div>
                                  {c.nome || 'Barbeiro'}
                                </td>
                                <td className="p-2.5 text-center font-medium text-gray-300">
                                  {c.detalhesAtendimentos?.length || 0}
                                </td>
                                <td className="p-2.5 text-right font-medium text-gray-200">
                                  R$ {c.faturamentoTotal.toFixed(2)}
                                </td>
                                <td className="p-2.5 text-right font-semibold text-blue-400">
                                  R$ {c.comissaoServicos.toFixed(2)}
                                </td>
                                <td className="p-2.5 text-right font-semibold text-purple-400">
                                  R$ {c.comissaoProdutos.toFixed(2)}
                                </td>
                                <td className="p-2.5 text-right font-extrabold text-emerald-400">
                                  R$ {c.totalComissao.toFixed(2)}
                                  {stats.totalPago > 0 && (
                                    <div className="text-[10px] font-normal text-amber-300">
                                      Pendente: R$ {stats.comissaoPendente.toFixed(2)}
                                    </div>
                                  )}
                                </td>
                                <td className="p-2.5 text-center">
                                  {isPaid ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold rounded-lg">
                                      ✓ QUITADO
                                    </span>
                                  ) : isPartiallyPaid ? (
                                    <button
                                      onClick={() => {
                                        setReceitaData({ ...c, nome: c.barbeiro.nome, periodKey: paidKey, subTab: 'mensal', totalComissao: stats.comissaoPendente, totalPagoAnterior: stats.totalPago });
                                        setIsFinalizarCaixaOpen(true);
                                      }}
                                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold rounded-lg transition-all shadow-sm"
                                      title="Pagar saldo pendente"
                                    >
                                      Pagar R$ {stats.comissaoPendente.toFixed(2)}
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setReceitaData({ ...c, nome: c.barbeiro.nome, periodKey: paidKey, subTab: 'mensal', totalComissao: c.totalComissao, totalPagoAnterior: 0 });
                                        setIsFinalizarCaixaOpen(true);
                                      }}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg transition-all shadow-sm"
                                      title="Pagar comissão do mês"
                                    >
                                      Pagar R$ {c.totalComissao.toFixed(2)}
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 3. Tabela de Formas de Pagamento e Taxas */}
                <div className="bg-gray-900/80 p-5 md:p-6 rounded-2xl border border-gray-700/80 space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center justify-between border-b border-gray-800 pb-3">
                    <span>💳 Detalhamento por Forma de Pagamento</span>
                    <span className="text-xs font-normal text-orange-400">Taxas Retidas: R$ {totalTaxasMes.toFixed(2)}</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(pagamentoBreakdown).map(([key, item]) => {
                      if (item.qtd === 0 && item.total === 0) return null;
                      const liquido = item.total - item.taxas;
                      return (
                        <div key={key} className="bg-gray-800/60 p-3.5 rounded-xl border border-gray-700/50 space-y-1 text-xs">
                          <div className="flex justify-between items-center text-gray-300 font-semibold">
                            <span>{item.label}</span>
                            <span className="text-[10px] text-gray-500">{item.qtd}x</span>
                          </div>
                          <div className="text-base font-bold text-white">R$ {item.total.toFixed(2)}</div>
                          <div className="flex justify-between text-[11px] pt-1 border-t border-gray-700/40 text-gray-400">
                            <span>Taxas: <strong className="text-orange-400">R$ {item.taxas.toFixed(2)}</strong></span>
                            <span>Líquido: <strong className="text-emerald-400">R$ {liquido.toFixed(2)}</strong></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Estrutura de Custos do Mês */}
                <div className="bg-gray-900/80 p-5 md:p-6 rounded-2xl border border-gray-700/80 space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center justify-between border-b border-gray-800 pb-3">
                    <span>🏢 Custos Fixos e Variáveis Cadastrados</span>
                    <span className="text-xs font-normal text-orange-400">Total: R$ {(custoFixoMes + custoVariavelMes).toFixed(2)}</span>
                  </h3>

                  {custos.length === 0 ? (
                    <p className="text-xs text-gray-500 py-2">Nenhum custo fixo ou variável cadastrado.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {custos.map((custo) => (
                        <div key={custo.id} className="bg-gray-800/60 p-3 rounded-xl border border-gray-700/50 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-white block">{custo.nome}</span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase ${custo.tipo === 'fixo' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                              {custo.tipo}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-orange-300">R$ {custo.valor.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 5. Agendamentos do Mês */}
                {(() => {
                  const mesFiltroStr = safeDataFiltro.substring(0, 7);
                  const agendamentosDoMes = agendamentos.filter(a => {
                    const d = a.dataAgendada || a.data || '';
                    return typeof d === 'string' && d.startsWith(mesFiltroStr);
                  });
                  const totalAgend = agendamentosDoMes.length;
                  const concluidosAgend = agendamentosDoMes.filter(a => a.status === 'concluido' || a.status === 'pago').length;
                  const pendentesAgend = agendamentosDoMes.filter(a => a.status === 'confirmado' || a.status === 'pendente' || a.status === 'aguardando' || !a.status).length;
                  const canceladosAgend = agendamentosDoMes.filter(a => a.status === 'cancelado').length;

                  return (
                    <div className="bg-gray-900/80 p-5 md:p-6 rounded-2xl border border-gray-700/80 space-y-4">
                      <h3 className="text-lg font-bold text-white flex items-center justify-between border-b border-gray-800 pb-3">
                        <span className="flex items-center gap-2">📅 Agendamentos do Mês</span>
                        <span className="text-xs font-normal text-blue-400">Total: {totalAgend} agendamentos</span>
                      </h3>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="bg-gray-800/60 p-3 rounded-xl border border-gray-700/50">
                          <span className="text-gray-400 block text-[11px]">Total no Mês</span>
                          <span className="text-lg font-bold text-white">{totalAgend}</span>
                        </div>
                        <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                          <span className="text-emerald-400 block text-[11px]">Concluídos</span>
                          <span className="text-lg font-bold text-emerald-300">{concluidosAgend}</span>
                        </div>
                        <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
                          <span className="text-blue-400 block text-[11px]">Confirmados / Pendentes</span>
                          <span className="text-lg font-bold text-blue-300">{pendentesAgend}</span>
                        </div>
                        <div className="bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                          <span className="text-red-400 block text-[11px]">Cancelados</span>
                          <span className="text-lg font-bold text-red-300">{canceladosAgend}</span>
                        </div>
                      </div>

                      {agendamentosDoMes.length === 0 ? (
                        <p className="text-xs text-gray-500 py-2">Nenhum agendamento registrado para o mês selecionado.</p>
                      ) : (
                        <div className="overflow-x-auto max-h-64 overflow-y-auto custom-scrollbar">
                          <table className="w-full text-left text-xs text-gray-300">
                            <thead className="bg-gray-800/80 text-gray-400 uppercase text-[10px] font-bold sticky top-0">
                              <tr>
                                <th className="p-2">Cliente</th>
                                <th className="p-2">Data/Hora</th>
                                <th className="p-2">Barbeiro</th>
                                <th className="p-2">Serviço / Valor</th>
                                <th className="p-2 text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/60">
                              {agendamentosDoMes.slice(0, 30).map((a, idx) => {
                                const dataFormatted = (a.dataAgendada || a.data || '').split('-').reverse().join('/');
                                const val = a.pagamento?.valorCobrado || a.valorOriginal || a.valorTotalPrevisto || 0;
                                return (
                                  <tr key={a.id || `agend-${idx}`} className="hover:bg-gray-800/40 transition-colors">
                                    <td className="p-2 font-semibold text-white">{a.clienteNome || a.cliente || 'Cliente'}</td>
                                    <td className="p-2 text-gray-400">{dataFormatted} {a.horario || ''}</td>
                                    <td className="p-2 text-gray-300">{a.barbeiroNome || 'N/A'}</td>
                                    <td className="p-2 font-medium text-blue-300">
                                      {a.servicoNome || 'Serviço'} <span className="text-gray-400 font-normal">(R$ {val.toFixed(2)})</span>
                                    </td>
                                    <td className="p-2 text-right">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                        a.status === 'concluido' || a.status === 'pago' ? 'bg-emerald-500/20 text-emerald-400' :
                                        a.status === 'cancelado' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                                      }`}>
                                        {a.status || 'pendente'}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 6. Discriminativo de Vendas do Mês */}
                {(() => {
                  let totalQtdServicos = 0;
                  let totalQtdProdutos = 0;
                  let totalValServicos = 0;
                  let totalValProdutos = 0;

                  registrosFiltradosMes.forEach(r => {
                    (r.itens || []).forEach((i: any) => {
                      if (i.tipo === 'servico') {
                        totalQtdServicos += (i.quantidade || 1);
                        totalValServicos += (i.valor || 0);
                      } else if (i.tipo === 'produto') {
                        totalQtdProdutos += (i.quantidade || 1);
                        totalValProdutos += (i.valor || 0);
                      }
                    });
                  });

                  return (
                    <div className="bg-gray-900/80 p-5 md:p-6 rounded-2xl border border-gray-700/80 space-y-4">
                      <h3 className="text-lg font-bold text-white flex items-center justify-between border-b border-gray-800 pb-3">
                        <span className="flex items-center gap-2">🛍️ Detalhamento de Vendas e Atendimentos</span>
                        <span className="text-xs font-normal text-purple-400">{registrosFiltradosMes.length} vendas/atend.</span>
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="bg-blue-500/10 p-3.5 rounded-xl border border-blue-500/20 flex justify-between items-center">
                          <div>
                            <span className="text-blue-400 block text-[11px] font-semibold">✂️ Serviços Realizados</span>
                            <span className="text-gray-300 text-[10px]">{totalQtdServicos} execuções no mês</span>
                          </div>
                          <span className="text-base font-bold text-blue-300">R$ {totalValServicos.toFixed(2)}</span>
                        </div>
                        <div className="bg-purple-500/10 p-3.5 rounded-xl border border-purple-500/20 flex justify-between items-center">
                          <div>
                            <span className="text-purple-400 block text-[11px] font-semibold">🧴 Produtos Vendidos</span>
                            <span className="text-gray-300 text-[10px]">{totalQtdProdutos} unidades vendidas</span>
                          </div>
                          <span className="text-base font-bold text-purple-300">R$ {totalValProdutos.toFixed(2)}</span>
                        </div>
                      </div>

                      {registrosFiltradosMes.length === 0 ? (
                        <p className="text-xs text-gray-500 py-2">Nenhuma venda ou atendimento finalizado no mês selecionado.</p>
                      ) : (
                        <div className="overflow-x-auto max-h-72 overflow-y-auto custom-scrollbar">
                          <table className="w-full text-left text-xs text-gray-300">
                            <thead className="bg-gray-800/80 text-gray-400 uppercase text-[10px] font-bold sticky top-0">
                              <tr>
                                <th className="p-2">Data</th>
                                <th className="p-2">Cliente</th>
                                <th className="p-2">Barbeiro</th>
                                <th className="p-2">Itens / Serviços</th>
                                <th className="p-2 text-right">Valor Pago</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/60">
                              {registrosFiltradosMes.map((r, idx) => {
                                const dataFormatada = (r.data || '').split('-').reverse().join('/');
                                return (
                                  <tr key={r.id || `venda-${idx}`} className="hover:bg-gray-800/40 transition-colors">
                                    <td className="p-2 font-mono text-gray-400">{dataFormatada}</td>
                                    <td className="p-2 font-semibold text-white">{r.cliente || 'Cliente'}</td>
                                    <td className="p-2 text-gray-300">{r.barbeiroNome || 'N/A'}</td>
                                    <td className="p-2">
                                      <div className="flex flex-wrap gap-1">
                                        {(r.itens || []).map((item: any, iIdx: number) => (
                                          <span key={iIdx} className="bg-gray-800 text-gray-200 text-[10px] px-2 py-0.5 rounded border border-gray-700">
                                            {item.tipo === 'servico' ? '✂️' : '🧴'} {item.nome}
                                          </span>
                                        ))}
                                      </div>
                                    </td>
                                    <td className="p-2 text-right font-extrabold text-emerald-400">
                                      R$ {(r.total || 0).toFixed(2)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 7. Assinaturas e Recorrência (Subscrições) */}
                {(() => {
                  const assinantesAtivos = subscribers.filter(s => s.status === 'ativo' || s.ativo === true);
                  const receitaRecorrente = assinantesAtivos.reduce((acc, sub) => {
                    const plan = plans.find(p => (p.id === sub.planoId || p._id === sub.planoId));
                    const val = sub.pagamento?.valor || sub.valorMensal || plan?.valorMensal || 0;
                    return acc + Number(val);
                  }, 0);

                  return (
                    <div className="bg-gray-900/80 p-5 md:p-6 rounded-2xl border border-gray-700/80 space-y-4">
                      <h3 className="text-lg font-bold text-white flex items-center justify-between border-b border-gray-800 pb-3">
                        <span className="flex items-center gap-2">💎 Assinaturas e Clubes VIP</span>
                        <span className="text-xs font-normal text-amber-400">Recorrência Mensal: R$ {receitaRecorrente.toFixed(2)}</span>
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="bg-amber-500/10 p-3.5 rounded-xl border border-amber-500/20">
                          <span className="text-amber-400 block text-[11px]">Assinantes Ativos</span>
                          <span className="text-xl font-bold text-amber-300">{assinantesAtivos.length} clientes VIP</span>
                        </div>
                        <div className="bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-500/20">
                          <span className="text-emerald-400 block text-[11px]">Faturamento Recorrente Mensal</span>
                          <span className="text-xl font-bold text-emerald-300">R$ {receitaRecorrente.toFixed(2)}</span>
                        </div>
                        <div className="bg-gray-800/60 p-3.5 rounded-xl border border-gray-700/50">
                          <span className="text-gray-400 block text-[11px]">Planos Disponíveis</span>
                          <span className="text-xl font-bold text-white">{plans.length} modalidades</span>
                        </div>
                      </div>

                      {subscribers.length === 0 ? (
                        <p className="text-xs text-gray-500 py-2">Nenhum assinante cadastrado na plataforma.</p>
                      ) : (
                        <div className="overflow-x-auto max-h-60 overflow-y-auto custom-scrollbar">
                          <table className="w-full text-left text-xs text-gray-300">
                            <thead className="bg-gray-800/80 text-gray-400 uppercase text-[10px] font-bold sticky top-0">
                              <tr>
                                <th className="p-2">Assinante</th>
                                <th className="p-2">Telefone</th>
                                <th className="p-2">Plano</th>
                                <th className="p-2">Mensalidade</th>
                                <th className="p-2 text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/60">
                              {subscribers.map((sub, idx) => {
                                const plan = plans.find(p => p.id === sub.planoId || p._id === sub.planoId);
                                const isAtivo = sub.status === 'ativo' || sub.ativo === true;
                                const val = sub.pagamento?.valor || sub.valorMensal || plan?.valorMensal || 0;
                                return (
                                  <tr key={sub.id || sub._id || `sub-${idx}`} className="hover:bg-gray-800/40 transition-colors">
                                    <td className="p-2 font-bold text-white">{sub.nome || 'Assinante VIP'}</td>
                                    <td className="p-2 text-gray-400">{sub.telefone || sub.whatsapp || 'N/A'}</td>
                                    <td className="p-2 text-amber-300 font-medium">{sub.planoNome || plan?.nome || 'Plano VIP'}</td>
                                    <td className="p-2 font-bold text-emerald-400">R$ {Number(val).toFixed(2)}</td>
                                    <td className="p-2 text-right">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                        isAtivo ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-700 text-gray-400'
                                      }`}>
                                        {isAtivo ? 'Ativo VIP' : 'Inativo'}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })()}

              </div>
            </div>
          </div>
        );
      })()}

      {activeSubTab === 'historico' && (
      <div className="flex flex-col gap-6">
        {/* Card 1: Log de Histórico de Pagamentos de Comissão */}
        <div className="bg-gray-800/80 p-6 sm:p-8 rounded-2xl border border-gray-700/50 shadow-xl space-y-5">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-gray-700/50 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>📜 Log de Histórico de Pagamentos e Sangrias de Comissão</span>
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                Visualização detalhada de todos os pagamentos e sangrias efetuados aos barbeiros, armazenados no histórico.
              </p>
            </div>

            {/* Filtro por Barbeiro */}
            <div className="flex items-center gap-2 self-start md:self-auto">
              <label className="text-xs font-bold text-gray-400 uppercase">Filtrar Barbeiro:</label>
              <select
                value={selectedBarberLogFilter}
                onChange={(e) => setSelectedBarberLogFilter(e.target.value)}
                className="bg-gray-900 text-gray-200 border border-gray-700 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-blue-500"
              >
                <option value="todos">Todos os barbeiros</option>
                {barbeiros.map(b => (
                  <option key={b.id} value={(b.email || b.idEmail || b.nome || '').toLowerCase().trim()}>
                    {b.nome} ({b.email || b.idEmail || 'Sem email'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(() => {
            const listFiltered = paidCommissionsList.filter(item => {
              if (selectedBarberLogFilter === 'todos') return true;
              const bEmail = (item.email || '').toLowerCase().trim();
              const bNome = (item.barbeiroNome || '').toLowerCase().trim();
              return bEmail.includes(selectedBarberLogFilter) || bNome.includes(selectedBarberLogFilter);
            });

            const totalPagoGeral = listFiltered.reduce((acc, curr) => acc + Number(curr.valorComissao || 0), 0);

            return (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-gray-900/60 p-3.5 rounded-xl border border-gray-700/50 flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-bold uppercase">Total de Pagamentos / Sangrias</span>
                    <span className="text-lg font-bold text-blue-400">{listFiltered.length} transações</span>
                  </div>
                  <div className="bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-800/50 flex items-center justify-between">
                    <span className="text-xs text-emerald-400 font-bold uppercase">Total Geral Pago</span>
                    <span className="text-xl font-black text-emerald-400">R$ {totalPagoGeral.toFixed(2)}</span>
                  </div>
                </div>

                {listFiltered.length === 0 ? (
                  <div className="w-full bg-gray-900/50 p-6 rounded-2xl border border-gray-800 text-center text-gray-500">
                    <p className="text-sm">Nenhum histórico de pagamento de comissão encontrado.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-xs text-gray-300">
                      <thead className="bg-gray-900 text-gray-400 uppercase text-[10px] font-bold sticky top-0">
                        <tr>
                          <th className="p-3">Data Ref.</th>
                          <th className="p-3">Data/Hora Sangria</th>
                          <th className="p-3">Barbeiro</th>
                          <th className="p-3">Email</th>
                          <th className="p-3 text-right">Valor Pago</th>
                          <th className="p-3 text-center">Status</th>
                          <th className="p-3 text-center">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/80">
                        {listFiltered.map((p, idx) => {
                          const originalIndex = paidCommissionsList.indexOf(p);
                          const dataFmt = p.data ? p.data.split('-').reverse().join('/') : '-';
                          return (
                            <tr key={idx} className="hover:bg-gray-900/60 transition-colors">
                              <td className="p-3 font-mono text-gray-200 font-bold">
                                {dataFmt}
                              </td>
                              <td className="p-3 text-gray-400 font-mono text-[11px]">
                                {formatarDateTime(p.paidAt)}
                              </td>
                              <td className="p-3 font-bold text-white">
                                {p.barbeiroNome || 'Barbeiro'}
                              </td>
                              <td className="p-3 text-gray-400 text-[11px] truncate max-w-[160px]">
                                {p.email || '-'}
                              </td>
                              <td className="p-3 text-right font-black text-emerald-400 text-sm">
                                R$ {Number(p.valorComissao).toFixed(2)}
                              </td>
                              <td className="p-3 text-center">
                                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full text-[10px] font-bold">
                                  ✓ PAGO
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => handleRemovePaidCommission(originalIndex)}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-950/40 px-2.5 py-1 rounded-lg text-xs font-semibold border border-red-800/40 transition-all"
                                  title="Estornar / remover registro de pagamento"
                                >
                                  Estornar
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Card 2: Histórico de Registros de Vendas / Cortes de Hoje */}
        <div className="bg-gray-800/80 p-6 sm:p-8 rounded-2xl border border-gray-700/50 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6">Histórico de Atendimentos Concluídos <span className="text-gray-500 text-sm font-normal ml-2">(Hoje)</span></h2>
          {registrosFiltradosDia.length === 0 ? (
            <div className="w-full bg-gray-900/50 p-8 rounded-2xl border border-gray-800 text-center text-gray-500 flex flex-col items-center justify-center">
              <ClipboardListIcon className="w-16 h-16 mb-4 text-gray-700" />
              <p className="text-lg">Nenhum registro encontrado no histórico de hoje.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {[...registrosFiltradosDia].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).map(r => {
                const { dataHoraStr } = formatarDataHora(r.data, r.horarios);
                const valorDesconto = r.desconto ?? r.pagamento?.desconto ?? 0;
                const valorOriginal = r.valorOriginal ?? r.pagamento?.valorOriginal ?? (r.total + valorDesconto);
                const temDesconto = valorDesconto > 0;

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
                      <div className="flex items-center gap-3 mt-2">
                        <p className="text-xs font-medium text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">{dataHoraStr}</p>
                        <p className="text-xs text-gray-400 font-medium">Barbeiro: <span className="text-gray-300 ml-1">{r.barbeiroNome || 'N/A'}</span></p>
                      </div>
                      {temDesconto && (
                        <div className="mt-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 w-fit flex items-center gap-1.5">
                          🏷️ Desconto aplicado: - R$ {valorDesconto.toFixed(2)} (Subtotal: R$ {valorOriginal.toFixed(2)})
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 mt-4">
                        {r.itens.map((item, idx) => (
                          <span key={idx} className="bg-gray-800 border border-gray-700 text-gray-200 font-medium text-xs px-3 py-1.5 rounded-lg">
                            <span className="text-gray-400 mr-1">{item.tipo === 'servico' ? '✂️' : '🧴'}</span>
                            {item.nome} <span className="text-gray-500 ml-1 font-normal">R$ {item.valor.toFixed(2)}</span>
                          </span>
                        ))}
                      </div>
                      {r.tipoPagamento && r.tipoPagamento.length > 0 && (
                        <div className="flex gap-2 flex-wrap items-center mt-3">
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
                            } catch(e) { return null; }
                          })}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between md:flex-col md:items-end gap-2 border-t md:border-t-0 md:border-l border-gray-800 pt-4 md:pt-0 md:pl-5 min-w-40">
                      <div className="flex flex-col items-end">
                        <span className="text-green-400 font-black text-2xl bg-green-500/10 px-3.5 py-1.5 rounded-xl border border-green-500/20">
                          R$ {r.total.toFixed(2)}
                        </span>
                        {temDesconto && (
                          <span className="text-xs text-gray-500 line-through mt-1 font-semibold">
                            R$ {valorOriginal.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <button onClick={() => removeRegistro(r.id)} className="text-gray-500 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all bg-gray-800 p-2 rounded-lg mt-2">
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      )}
      <ConfirmationModal
        isOpen={isFinalizarCaixaOpen}
        onClose={() => setIsFinalizarCaixaOpen(false)}
        onConfirm={handleFinalizarCaixa}
        title={receitaData?.isBarbearia 
          ? "Fechar Caixa Barbearia (Criar Receita)" 
          : `Pagar Comissão - ${receitaData?.nome || 'Barbeiro'}`
        }
        message={receitaData?.isBarbearia 
          ? `Tem certeza que deseja fechar o caixa da barbearia (R$ ${receitaData?.caixaBarbearia?.toFixed(2)}) e enviar para o fluxo de caixa? Isso criará uma transação de Receita.`
          : `Deseja efetuar o pagamento das comissões de ${receitaData?.nome} no valor de R$ ${receitaData?.totalComissao?.toFixed(2)}?\n\n` +
            `Ações que serão realizadas:\n` +
            `• 🟢 RECEITA PAGA de R$ ${receitaData?.totalComissao?.toFixed(2)} enviada para a Barbearia (Sangria de Caixa).\n` +
            `• 🔴 DESPESA PAGA de R$ ${receitaData?.totalComissao?.toFixed(2)} enviada para o financeiro da Barbearia (Comissão).\n` +
            `• 🟢 RECEITA PAGA de R$ ${receitaData?.totalComissao?.toFixed(2)} enviada para a conta do barbeiro.\n` +
            `• 🔒 Sinalização do status como PAGO para evitar pagamentos duplicados.`
        }
      />
    </div>
  );
};

export default BarbeirosPage;