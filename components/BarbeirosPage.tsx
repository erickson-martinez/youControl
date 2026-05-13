import React, { useState } from 'react';
import { useBarbeiros } from '../hooks/useBarbeiros';
import { useBarbeariaConfig, Produto, Servico, Custo } from '../hooks/useBarbeariaConfig';
import { useBarbeariaRegistros, useBarbeariaAgendamentos } from '../hooks/useBarbeariaRegistros';
import { UsersIcon, TrashIcon, PlusIcon, TagIcon, CogIcon, CashIcon, DocumentTextIcon, ChartBarIcon, ClipboardListIcon, CheckCircleIcon, XCircleIcon } from './icons';
import { User } from '../types';

const DIAS_SEMANA = [
  'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'
];

interface BarbeirosPageProps {
  user: User;
}

const BarbeirosPage: React.FC<BarbeirosPageProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'barbeiros' | 'produtos' | 'servicos' | 'custos' | 'metas' | 'registros'>('barbeiros');

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-3 mb-2">
        <UsersIcon className="w-8 h-8 text-blue-500" />
        <div>
          <h1 className="text-3xl font-bold text-white">Barbearia Admin</h1>
          <p className="text-gray-400 mt-1">Gerencie equipe, produtos, serviços, custos e metas.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-800 p-1 rounded-xl border border-gray-700 overflow-x-auto">
        <button
          onClick={() => setActiveTab('barbeiros')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap px-4 ${
            activeTab === 'barbeiros' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <UsersIcon className="w-4 h-4" /> Barbeiros
        </button>
        <button
          onClick={() => setActiveTab('produtos')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap px-4 ${
            activeTab === 'produtos' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <TagIcon className="w-4 h-4" /> Produtos
        </button>
        <button
          onClick={() => setActiveTab('servicos')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap px-4 ${
            activeTab === 'servicos' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <DocumentTextIcon className="w-4 h-4" /> Serviços
        </button>
        <button
          onClick={() => setActiveTab('custos')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap px-4 ${
            activeTab === 'custos' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <CashIcon className="w-4 h-4" /> Custos
        </button>
        <button
          onClick={() => setActiveTab('metas')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap px-4 ${
            activeTab === 'metas' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <ChartBarIcon className="w-4 h-4" /> Metas
        </button>
        <button
          onClick={() => setActiveTab('registros')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap px-4 ${
            activeTab === 'registros' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <ClipboardListIcon className="w-4 h-4" /> Registros & Agendamentos
        </button>
      </div>

      {activeTab === 'barbeiros' && <TabBarbeiros />}
      {activeTab === 'produtos' && <TabProdutos />}
      {activeTab === 'servicos' && <TabServicos />}
      {activeTab === 'custos' && <TabCustos />}
      {activeTab === 'metas' && <TabMetas />}
      {activeTab === 'registros' && <TabRegistros />}
      
    </div>
  );
};

// --- TABS COMPONENTS ---

const TabBarbeiros = () => {
  const { barbeiros, addBarbeiro, removeBarbeiro } = useBarbeiros();
  const { addCusto } = useBarbeariaConfig();
  
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [comissao, setComissao] = useState('');
  const [corte, setCorte] = useState('');
  const [custoDiario, setCustoDiario] = useState('');
  const [dias, setDias] = useState<string[]>([]);

  const toggleDia = (dia: string) => {
    setDias(prev => prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]);
  };

  const handleCadastrar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return alert("Nome é obrigatório");
    
    addBarbeiro({
      nome,
      telefone,
      comissao: Number(comissao) || 0,
      corte: Number(corte) || 0,
      diasTrabalhados: dias
    });

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

    setNome('');
    setTelefone('');
    setComissao('');
    setCorte('');
    setCustoDiario('');
    setDias([]);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Formulário de Cadastro */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
        <h2 className="text-xl font-bold text-white mb-6 border-b border-gray-700 pb-2">Cadastrar Barbeiro</h2>
        
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

          <div>
            <label className="block text-sm text-gray-400 mb-1">Custo Variável por Dia de Trabalho (Transporte, Alimentação...)</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">R$</span>
              <input 
                type="number" step="0.01" min="0"
                value={custoDiario} onChange={e => setCustoDiario(e.target.value)}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                placeholder="Ex: 20.00"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Será adicionado aos Custos Variáveis focado nos dias selecionados abaixo.</p>
          </div>

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
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Salvar Barbeiro
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white mb-2">Barbeiros Cadastrados</h2>
        
        {barbeiros.length === 0 ? (
          <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 text-center text-gray-400">
            Nenhum barbeiro cadastrado ainda.
          </div>
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {barbeiros.map(barbeiro => (
              <div key={barbeiro.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex flex-col gap-3 relative group">
                <button 
                  onClick={() => removeBarbeiro(barbeiro.id)}
                  className="absolute top-4 right-4 text-red-400 opacity-50 group-hover:opacity-100 hover:text-red-300 transition-opacity"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
                
                <div>
                  <h3 className="text-lg font-bold text-white">{barbeiro.nome}</h3>
                  {barbeiro.telefone && <p className="text-sm text-gray-400">{barbeiro.telefone}</p>}
                </div>
                
                <div className="flex gap-4">
                  <div className="bg-gray-700 px-3 py-1 rounded text-sm text-blue-300">
                    <span className="text-xs text-gray-400 block">Comissão Prod.</span>
                    {barbeiro.comissao}%
                  </div>
                  <div className="bg-gray-700 px-3 py-1 rounded text-sm text-green-300">
                    <span className="text-xs text-gray-400 block">Comissão Serv.</span>
                    {barbeiro.corte}%
                  </div>
                </div>
                
                {barbeiro.diasTrabalhados.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {barbeiro.diasTrabalhados.map(dia => (
                      <span key={dia} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
                        {dia.slice(0, 3)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const TabProdutos = () => {
  const { produtos, addProduto, removeProduto } = useBarbeariaConfig();
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [custo, setCusto] = useState('');
  const [comissao, setComissao] = useState('');
  const [margemLucro, setMargemLucro] = useState('');
  const [precoVenda, setPrecoVenda] = useState('');

  const numCusto = Number(custo) || 0;
  const numComissao = Number(comissao) || 0;
  const numMargem = Number(margemLucro) || 0;
  const precoSemComissao = numCusto + (numCusto * (numMargem / 100));
  const precoIdeal = numComissao < 100 ? precoSemComissao / (1 - numComissao / 100) : precoSemComissao;
  const numVenda = Number(precoVenda) || 0;
  const isAbaixoDoIdeal = numVenda > 0 && numVenda < precoIdeal;

  const handleCadastrar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return alert("Nome é obrigatório");
    addProduto({ nome, categoria: categoria || 'Geral', custo: numCusto, comissao: numComissao, margemLucro: numMargem, precoVenda: numVenda });
    setNome(''); setCategoria(''); setCusto(''); setComissao(''); setMargemLucro(''); setPrecoVenda('');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
        <h2 className="text-xl font-bold text-white mb-6 border-b border-gray-700 pb-2">Cadastrar Produto</h2>
        <form onSubmit={handleCadastrar} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nome do Produto</label>
              <input 
                type="text" required value={nome} onChange={e => setNome(e.target.value)}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                placeholder="Ex: Pomada Modeladora"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Categoria</label>
              <input 
                type="text" value={categoria} onChange={e => setCategoria(e.target.value)}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                placeholder="Ex: Cabelo"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Custo (R$)</label>
              <input 
                type="number" step="0.01" required value={custo} onChange={e => setCusto(e.target.value)}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Comissão (%)</label>
              <input 
                type="number" step="0.1" required value={comissao} onChange={e => setComissao(e.target.value)}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                placeholder="Ex: 5"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Lucro (%)</label>
              <input 
                type="number" step="0.1" required value={margemLucro} onChange={e => setMargemLucro(e.target.value)}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                placeholder="Ex: 50"
              />
            </div>
          </div>
          <div className="bg-blue-900/40 p-3 rounded-lg border border-blue-500/30 text-sm">
            <p className="text-blue-300">Preço Ideal Calculado: <strong className="text-white">R$ {precoIdeal.toFixed(2)}</strong></p>
            <p className="text-blue-200/60 text-xs mt-1">Cobre custo, {numComissao}% de comissão e {numMargem}% de lucro.</p>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Preço de Venda Praticado (R$)</label>
            <input 
              type="number" step="0.01" required value={precoVenda} onChange={e => setPrecoVenda(e.target.value)}
              className={`w-full bg-gray-700 text-white border rounded px-3 py-2 text-sm focus:outline-none ${isAbaixoDoIdeal ? 'border-red-500 focus:border-red-500' : 'border-gray-600 focus:border-blue-500'}`}
              placeholder="0.00"
            />
            {isAbaixoDoIdeal && (
              <p className="text-red-400 text-xs mt-1">Aviso: O preço de venda está abaixo do valor ideal sugerido.</p>
            )}
          </div>
          <div className="pt-4 border-t border-gray-700">
            <button type="submit" className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
              <PlusIcon className="w-5 h-5" /> Salvar Produto
            </button>
          </div>
        </form>
      </div>
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white mb-2">Produtos Cadastrados</h2>
        {produtos.length === 0 ? (
          <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 text-center text-gray-400">Nenhum produto cadastrado.</div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {produtos.map(p => {
              const pComissao = p.comissao || 0;
              const semComissao = p.custo + (p.custo * (p.margemLucro / 100));
              const ideal = pComissao < 100 ? semComissao / (1 - pComissao / 100) : semComissao;
              const isBelow = p.precoVenda < ideal;
              return (
                <div key={p.id} className={`bg-gray-800 p-4 rounded-xl border flex flex-col gap-2 relative group flex-1 ${isBelow ? 'border-yellow-600/50' : 'border-gray-700'}`}>
                  <button onClick={() => removeProduto(p.id)} className="absolute top-4 right-4 text-red-400 opacity-50 group-hover:opacity-100 hover:text-red-300">
                    <TrashIcon className="w-5 h-5" />
                  </button>
                  <h3 className="text-lg font-bold text-white pr-8">{p.nome}</h3>
                  {p.categoria && <span className="text-xs text-blue-400 font-medium">{p.categoria}</span>}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm mt-2">
                    <div className="bg-gray-700 p-2 rounded">
                      <span className="text-xs text-gray-400 block">Custo</span>R$ {p.custo.toFixed(2)}
                    </div>
                    <div className="bg-gray-700 p-2 rounded">
                      <span className="text-xs text-gray-400 block">Comissão</span>{pComissao}%
                    </div>
                    <div className="bg-gray-700 p-2 rounded">
                      <span className="text-xs text-gray-400 block">Margem</span>{p.margemLucro}%
                    </div>
                    <div className="bg-gray-700 p-2 rounded">
                      <span className="text-xs text-gray-400 block">Ideal</span>R$ {ideal.toFixed(2)}
                    </div>
                    <div className={`p-2 rounded font-bold ${isBelow ? 'bg-yellow-900/30 text-yellow-500' : 'bg-green-900/30 text-green-400'}`}>
                      <span className="text-xs opacity-80 block font-normal">Venda</span>R$ {p.precoVenda.toFixed(2)}
                    </div>
                  </div>
                  {isBelow && <div className="text-xs text-yellow-500 mt-1">Preço de venda abaixo do ideal!</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const TabServicos = () => {
  const { servicos, addServico, removeServico } = useBarbeariaConfig();
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<'cabelo' | 'barba' | string>('cabelo');
  const [valor, setValor] = useState('');

  const handleCadastrar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return alert("Nome é obrigatório");
    addServico({ nome, categoria, valor: Number(valor) || 0 });
    setNome(''); setValor(''); setCategoria('cabelo');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg h-fit">
        <h2 className="text-xl font-bold text-white mb-6 border-b border-gray-700 pb-2">Cadastrar Serviço</h2>
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
          <div className="pt-4 border-t border-gray-700">
            <button type="submit" className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
              <PlusIcon className="w-5 h-5" /> Salvar Serviço
            </button>
          </div>
        </form>
      </div>
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white mb-2">Serviços Cadastrados</h2>
        {servicos.length === 0 ? (
          <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 text-center text-gray-400">Nenhum serviço cadastrado.</div>
        ) : (
          <div className="grid grid-cols-1 gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {servicos.map(s => (
              <div key={s.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex items-center justify-between group">
                <div>
                  <h3 className="font-bold text-white">{s.nome}</h3>
                  <div className="flex gap-2">
                    <span className="text-gray-400 text-xs px-2 py-0.5 mt-1 bg-gray-700 rounded-full">{s.categoria}</span>
                  </div>
                  <p className="text-green-400 font-medium text-sm mt-2">R$ {s.valor.toFixed(2)}</p>
                </div>
                <button onClick={() => removeServico(s.id)} className="text-red-400 opacity-50 group-hover:opacity-100 hover:text-red-300 p-2">
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const TabCustos = () => {
  const { custos, addCusto, removeCusto } = useBarbeariaConfig();
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState('');
  const [tipo, setTipo] = useState<'fixo'|'variavel'>('fixo');

  const handleCadastrar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return alert("Nome é obrigatório");
    addCusto({ nome, valor: Number(valor) || 0, tipo });
    setNome(''); setValor(''); setTipo('fixo');
  };

  const fixos = custos.filter(c => c.tipo === 'fixo');
  const variaveis = custos.filter(c => c.tipo === 'variavel');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg h-fit">
        <h2 className="text-xl font-bold text-white mb-1 border-gray-700">Cadastrar Custo / Despesa</h2>
        <p className="text-sm text-gray-400 mb-5 border-b border-gray-700 pb-3">Siga boas práticas: Custos fixos não variam direto com os serviços (ex: Aluguel). Custos variáveis dependem do volume de vendas/serviços (ex: Produtos de bancada, taxas de cartão).</p>

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
          <div className="pt-4 border-t border-gray-700">
            <button type="submit" className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
              <PlusIcon className="w-5 h-5" /> Salvar Custo
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white mb-3">Custos Fixos <span className="text-gray-400 font-normal text-sm">({fixos.length})</span></h2>
          {fixos.length === 0 ? <p className="text-sm text-gray-500 italic">Nenhum registrado</p> : (
            <div className="grid grid-cols-1 gap-2">
              {fixos.map(c => (
                <div key={c.id} className="bg-gray-800 p-3 rounded-lg border border-gray-700 flex justify-between items-center group">
                  <span className="text-gray-200">{c.nome}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-orange-300 text-sm font-medium">R$ {c.valor.toFixed(2)}</span>
                    <button onClick={() => removeCusto(c.id)} className="text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-300">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-bold text-white mb-3">Custos Variáveis <span className="text-gray-400 font-normal text-sm">({variaveis.length})</span></h2>
          {variaveis.length === 0 ? <p className="text-sm text-gray-500 italic">Nenhum registrado</p> : (
            <div className="grid grid-cols-1 gap-2">
              {variaveis.map(c => (
                <div key={c.id} className="bg-gray-800 p-3 rounded-lg border border-gray-700 flex justify-between items-center group">
                  <span className="text-gray-200">{c.nome}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-blue-300 text-sm font-medium">R$ {c.valor.toFixed(2)}</span>
                    <button onClick={() => removeCusto(c.id)} className="text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-300">
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

const TabMetas = () => {
  const { servicos, custos, loadConfig } = useBarbeariaConfig();
  const { barbeiros, reloadBarbeiros } = useBarbeiros();
  const { registros } = useBarbeariaRegistros();
  const [metaLucro, setMetaLucro] = useState('5000');

  const handleReload = () => {
    loadConfig();
    reloadBarbeiros();
  };

  const numMeta = Number(metaLucro) || 0;
  const custoFixoTotal = custos.filter(c => c.tipo === 'fixo').reduce((acc, c) => acc + c.valor, 0);
  const custoVarTotal = custos.filter(c => c.tipo === 'variavel').reduce((acc, c) => acc + c.valor, 0);
  const custosTotais = custoFixoTotal + custoVarTotal;
  const faturamentoNecessario = numMeta + custosTotais;

  // Calculando o faturamento atual (neste caso, a soma de todos os registros)
  const faturamentoAtual = registros.reduce((acc, r) => acc + r.total, 0);
  const lucroAtual = faturamentoAtual - custosTotais;
  
  // Quanto de faturamento da meta foi alcançado (%)
  const porcentagemFaturamento = faturamentoNecessario > 0 ? (faturamentoAtual / faturamentoNecessario) * 100 : 0;
  const porcentagemLucro = numMeta > 0 ? (Math.max(0, lucroAtual) / numMeta) * 100 : 0;

  const ticketMedioServico = servicos.length > 0 ? servicos.reduce((acc, s) => acc + s.valor, 0) / servicos.length : 0;
  const comissaoMedia = barbeiros.length > 0 ? barbeiros.reduce((acc, b) => acc + b.corte, 0) / barbeiros.length : 0;
  
  // Lucro bruto médio da barbearia por serviço = Valor do Serviço - (Valor do Serviço * Comissão)
  const lucroBrutoMedioPorServico = ticketMedioServico * (1 - (comissaoMedia / 100));

  const qtdServicosMes = lucroBrutoMedioPorServico > 0 ? faturamentoNecessario / lucroBrutoMedioPorServico : 0;
  const qtdServicosSemana = qtdServicosMes / 4.33; // Média de semanas num mês
  const qtdServicosDia = qtdServicosMes / 26; // Considerando 26 dias úteis

  return (
    <div className="space-y-8">
      {/* Settings da Meta */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-xl font-bold text-white">Simulador de Metas e Ponto de Equilíbrio</h2>
          <button
            onClick={handleReload}
            className="px-3 py-1 bg-gray-700 text-xs text-gray-300 rounded hover:bg-gray-600 transition border border-gray-600 inline-flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            Recarregar
          </button>
        </div>
        <p className="text-sm text-gray-400 mb-6 border-b border-gray-700 pb-4">
          Descubra quantos serviços você precisa realizar para cobrir todos os seus custos e atingir a sua meta de lucro líquido desejado. Neste resumo, você confere o progresso atual.
        </p>

        <div className="max-w-md space-y-4 mb-6">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Qual a sua Meta de Lucro Líquido mensal?</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">R$</span>
              <input 
                type="number" step="0.01" value={metaLucro} onChange={e => setMetaLucro(e.target.value)}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded pl-9 pr-3 py-2 text-lg font-bold focus:outline-none focus:border-blue-500"
                placeholder="5000.00"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Este é o valor livre que você deseja que a barbearia lucre, já pagando todos os custos e comissões.</p>
          </div>
        </div>

        {/* Progresso das Metas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-700 pt-6">
          {/* Progresso de Faturamento */}
          <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-600/50">
            <h3 className="text-sm text-gray-400 mb-2 font-semibold uppercase tracking-wider">Faturamento (Ponto de Equilíbrio)</h3>
            <div className="flex justify-between items-end mb-2">
              <span className="text-2xl font-bold text-white">R$ {faturamentoAtual.toFixed(2)}</span>
              <span className="text-sm text-gray-400">/ R$ {faturamentoNecessario.toFixed(2)}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${porcentagemFaturamento >= 100 ? 'bg-green-500' : 'bg-blue-500'}`} 
                style={{ width: `${Math.min(100, porcentagemFaturamento)}%` }}
              ></div>
            </div>
            <p className="text-right text-xs mt-1 text-gray-400">{porcentagemFaturamento.toFixed(1)}%</p>
          </div>

          {/* Progresso de Lucro Líquido */}
          <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-600/50">
            <h3 className="text-sm text-gray-400 mb-2 font-semibold uppercase tracking-wider">Lucro Líquido</h3>
            <div className="flex justify-between items-end mb-2">
              <span className={`text-2xl font-bold ${lucroAtual >= 0 ? 'text-green-400' : 'text-red-400'}`}>R$ {lucroAtual.toFixed(2)}</span>
              <span className="text-sm text-gray-400">/ R$ {numMeta.toFixed(2)}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${porcentagemLucro >= 100 ? 'bg-green-500' : 'bg-green-400'}`} 
                style={{ width: `${Math.min(100, porcentagemLucro)}%` }}
              ></div>
            </div>
            <p className="text-right text-xs mt-1 text-gray-400">{porcentagemLucro.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Resumo Financeiro */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-4">Resumo Financeiro Mensal</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-gray-700/50 p-3 rounded">
              <span className="text-gray-300">Custos Fixos Estimados</span>
              <span className="text-orange-300 font-bold">R$ {custoFixoTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center bg-gray-700/50 p-3 rounded">
              <span className="text-gray-300">Custos Variáveis Estimados</span>
              <span className="text-blue-300 font-bold">R$ {custoVarTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center bg-gray-700/50 p-3 rounded">
              <span className="text-gray-300">Meta de Lucro Líquido</span>
              <span className="text-green-400 font-bold">R$ {numMeta.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-600 pt-3 flex justify-between items-center p-3 rounded bg-blue-900/20 border-blue-500/30 border">
              <span className="text-white font-medium">Faturamento Necessário (da Barbearia)</span>
              <span className="text-white font-bold text-xl">R$ {faturamentoNecessario.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Projeção de Serviços */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <ChartBarIcon className="w-48 h-48" />
          </div>
          
          <h3 className="text-lg font-bold text-white mb-4 relative z-10">Projeção de Serviços Adicionais</h3>

          {servicos.length === 0 || barbeiros.length === 0 ? (
            <div className="text-sm text-yellow-500 bg-yellow-500/10 p-4 rounded border border-yellow-500/30">
              Cadastre pelo menos 1 barbeiro e 1 serviço para ver a projeção.
            </div>
          ) : (
            <div className="space-y-5 relative z-10">
              <div className="text-sm text-gray-300 bg-gray-700/50 p-4 rounded leading-relaxed">
                <p>O <strong>Ticket Médio de Serviço</strong> atual é <strong className="text-white">R$ {ticketMedioServico.toFixed(2)}</strong>.</p>
                <p className="mt-2">A média de <strong>Comissão dos Barbeiros</strong> é <strong className="text-white">{comissaoMedia.toFixed(1)}%</strong>.</p>
                <p className="mt-2">A Barbearia lucra em média <strong className="text-green-400">R$ {lucroBrutoMedioPorServico.toFixed(2)}</strong> por serviço.</p>
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-2">Para atingir a sua meta, será necessário realizar uma média de:</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-gray-700 p-3 rounded-lg text-center border-b-2 border-blue-500">
                    <div className="text-2xl font-bold text-white">{Math.ceil(qtdServicosMes)}</div>
                    <div className="text-xs text-gray-400 mt-1 uppercase tracking-wide">Serv./Mês</div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded-lg text-center border-b-2 border-green-500">
                    <div className="text-2xl font-bold text-white">{Math.ceil(qtdServicosSemana)}</div>
                    <div className="text-xs text-gray-400 mt-1 uppercase tracking-wide">Serv./Semana</div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded-lg text-center border-b-2 border-purple-500">
                    <div className="text-2xl font-bold text-white">{Math.ceil(qtdServicosDia)}</div>
                    <div className="text-xs text-gray-400 mt-1 uppercase tracking-wide">Serv./Dia</div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3 text-center">*(Considerando 26 dias úteis no mês e a comissão dos barbeiros)*</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TabRegistros = () => {
  const { registros, addRegistro, removeRegistro, loadRegistros } = useBarbeariaRegistros();
  const { agendamentos, updateStatus, loadAgendamentos } = useBarbeariaAgendamentos();
  const { barbeiros, reloadBarbeiros } = useBarbeiros();
  const { servicos, loadConfig } = useBarbeariaConfig();
  
  const handleReload = () => {
    loadRegistros();
    loadAgendamentos();
    reloadBarbeiros();
    loadConfig();
  };

  const pendentes = agendamentos.filter(a => a.status === 'pendente').sort((a, b) => new Date(a.dataAgendada).getTime() - new Date(b.dataAgendada).getTime());
  
  const handleConcluir = (a: any) => {
    updateStatus(a.id, 'concluido');
    const servico = servicos.find(s => s.id === a.servicoId);
    if (servico) {
      addRegistro({
        cliente: a.cliente,
        telefone: a.telefone,
        barbeiroId: a.barbeiroId,
        barbeiroNome: barbeiros.find(b => b.id === a.barbeiroId)?.nome,
        itens: [{ idItem: servico.id, nome: servico.nome, tipo: 'servico', valor: servico.valor }],
        total: servico.valor
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Agendamentos Pendentes */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Agendamentos Pendentes <span className="text-sm font-normal text-gray-400">({pendentes.length})</span></h2>
          <button
            onClick={handleReload}
            className="px-3 py-1 bg-gray-700 text-xs text-gray-300 rounded hover:bg-gray-600 transition border border-gray-600 inline-flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            Recarregar
          </button>
        </div>
        
        {pendentes.length === 0 ? (
          <p className="text-sm text-gray-500 italic">Nenhum agendamento pendente.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendentes.map(a => {
              const dataAgendada = new Date(a.dataAgendada);
              const dataStr = dataAgendada.toLocaleDateString();
              const horaStr = dataAgendada.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
              const barbeiro = barbeiros.find(b => b.id === a.barbeiroId)?.nome || 'Qualquer um';
              const servico = servicos.find(s => s.id === a.servicoId);
              
              return (
                <div key={a.id} className="bg-gray-700/50 p-4 rounded-lg border border-gray-600 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-white text-lg">{a.cliente}</h3>
                      <p className="text-sm text-gray-400">{a.telefone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-blue-400 font-bold">{dataStr} {horaStr}</p>
                      <p className="text-xs text-gray-400 mt-1">{barbeiro}</p>
                    </div>
                  </div>
                  {servico && <div className="text-sm text-gray-300 bg-gray-800 px-3 py-1 rounded inline-flex w-fit">{servico.nome} (R$ {servico.valor.toFixed(2)})</div>}
                  
                  <div className="flex gap-2 mt-2 pt-3 border-t border-gray-600">
                    <button 
                      onClick={() => handleConcluir(a)}
                      className="flex-1 flex items-center justify-center gap-1 bg-green-600 hover:bg-green-500 text-white text-sm py-1.5 rounded transition"
                    >
                      <CheckCircleIcon className="w-4 h-4" /> Concluir
                    </button>
                    <button 
                      onClick={() => updateStatus(a.id, 'cancelado')}
                      className="flex items-center justify-center gap-1 bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded transition"
                    >
                      <XCircleIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
        <h2 className="text-xl font-bold text-white mb-4">Histórico de Registros (Vendas/Cortes)</h2>
        {registros.length === 0 ? (
          <p className="text-sm text-gray-500 italic">Nenhum registro encontrado no histórico.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {[...registros].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).map(r => {
              const dataObj = new Date(r.data);
              return (
                <div key={r.id} className="bg-gray-700/50 p-4 rounded-lg border border-gray-600 flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                  <div>
                    <h3 className="font-bold text-white">{r.cliente}</h3>
                    <p className="text-xs text-gray-400">{dataObj.toLocaleDateString()} {dataObj.toLocaleTimeString()}</p>
                    <p className="text-sm text-gray-300 mt-1">Barbeiro: {r.barbeiroNome || 'N/A'}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {r.itens.map((item, idx) => (
                        <span key={idx} className="bg-gray-800 border border-gray-600 text-gray-300 text-xs px-2 py-1 rounded">
                          {item.nome} (R$ {item.valor.toFixed(2)})
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between md:flex-col md:items-end gap-2">
                    <span className="text-green-400 font-bold text-lg">R$ {r.total.toFixed(2)}</span>
                    <button onClick={() => removeRegistro(r.id)} className="text-red-400 opacity-50 group-hover:opacity-100 hover:text-red-300">
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
  );
};

export default BarbeirosPage;
