import React, { useState, useMemo } from 'react';
import { useBarbeiros } from '../hooks/useBarbeiros';
import { useBarbeariaConfig } from '../hooks/useBarbeariaConfig';
import { useBarbeariaAgendamentos } from '../hooks/useBarbeariaRegistros';

const HORARIOS = [
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'
];

import { Empresa } from '../types';

export default function AgendamentoPage({ empresa }: { empresa?: Empresa }) {
  const { barbeiros, reloadBarbeiros } = useBarbeiros(empresa?.id);
  const { servicos, produtos, loadConfig } = useBarbeariaConfig(empresa?.id);
  const { agendamentos, addAgendamento, loadAgendamentos } = useBarbeariaAgendamentos(empresa?.id);

  const [telefone, setTelefone] = useState('');
  const [nome, setNome] = useState('');
  const [barbeiroId, setBarbeiroId] = useState('');
  const [servicoId, setServicoId] = useState('');
  const [produtosSelecionados, setProdutosSelecionados] = useState<string[]>([]);
  const [data, setData] = useState('');
  const [horario, setHorario] = useState('');
  const [agendado, setAgendado] = useState(false);

  const handleReload = () => {
    reloadBarbeiros();
    loadConfig();
    loadAgendamentos();
  };

  const handleTelefoneBlur = () => {
    if (!telefone) return;
    const existente = agendamentos.find(a => a.telefone === telefone);
    if (existente && !nome) {
      setNome(existente.cliente);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!telefone.trim() || !nome.trim() || !data || !horario) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }
    
    // Validar horário repetido para o mesmo barbeiro
    if (barbeiroId) {
      const conflito = agendamentos.find(a => 
        a.barbeiroId === barbeiroId && 
        a.dataAgendada.startsWith(data) && 
        a.dataAgendada.includes(horario) &&
        a.status === 'pendente'
      );
      if (conflito) {
        alert("Já existe um agendamento para este barbeiro neste horário. Por favor, escolha outro.");
        return;
      }
    }

    const dataAgendada = `${data}T${horario}:00`;

    addAgendamento({
      telefone,
      cliente: nome,
      barbeiroId: barbeiroId || undefined,
      servicoId: servicoId || undefined,
      produtosIds: produtosSelecionados.length > 0 ? produtosSelecionados : undefined,
      dataAgendada
    });

    setAgendado(true);
  };

  const servicosPorCategoria = useMemo(() => {
    const acc: Record<string, typeof servicos> = {};
    servicos.forEach(s => {
      const cat = s.categoria || 'Geral';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(s);
    });
    return acc;
  }, [servicos]);

  const produtosPorCategoria = useMemo(() => {
    const acc: Record<string, typeof produtos> = {};
    produtos.forEach(p => {
      const cat = p.categoria || 'Geral';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(p);
    });
    return acc;
  }, [produtos]);

  if (agendado) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-6">
        <div className="bg-green-600/20 text-green-400 p-8 rounded-xl border border-green-500/30">
          <h2 className="text-2xl font-bold mb-4">Agendamento Confirmado!</h2>
          <p>Seu horário foi reservado com sucesso.</p>
          <button 
            onClick={() => {
              setAgendado(false);
              setTelefone(''); setNome(''); setData(''); setHorario(''); setBarbeiroId(''); setServicoId(''); setProdutosSelecionados([]);
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
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Barbearia VIP - Agendamento</h1>
        <p className="text-gray-400">Agende seu horário, veja nossos serviços e produtos.</p>
        <button
          onClick={handleReload}
          className="mt-4 px-4 py-2 bg-gray-800 text-sm text-gray-300 rounded hover:bg-gray-700 transition border border-gray-600 inline-flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          Recarregar Dados
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Formulário de Agendamento */}
        <div className="lg:col-span-2 bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg relative h-fit">
          <h2 className="text-xl font-bold text-white mb-6 border-b border-gray-700 pb-2">Seu Horário</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Telefone (Obrigatório) *</label>
                <input 
                  type="tel" required value={telefone} 
                  onChange={e => setTelefone(e.target.value)}
                  onBlur={handleTelefoneBlur}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                  placeholder="(DDD) 99999-9999"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Seu Nome *</label>
                <input 
                  type="text" required value={nome} 
                  onChange={e => setNome(e.target.value)}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                  placeholder="Como gostaria de ser chamado?"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Barbeiro (Opcional)</label>
                <select 
                  value={barbeiroId} onChange={e => setBarbeiroId(e.target.value)}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Qualquer Barbeiro</option>
                  {barbeiros.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Serviço (Opcional)</label>
                <select 
                  value={servicoId} onChange={e => setServicoId(e.target.value)}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Decidir na hora</option>
                  {servicos.map(s => <option key={s.id} value={s.id}>{s.nome} - R$ {s.valor.toFixed(2)}</option>)}
                </select>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-2">Produtos (Opcionais)</label>
              <div className="bg-gray-700 border border-gray-600 rounded p-3 max-h-40 overflow-y-auto w-full custom-scrollbar">
                {produtos.length === 0 && <p className="text-gray-500 text-sm">Nenhum produto disponível.</p>}
                {produtos.map(p => (
                  <label key={p.id} className="flex items-center space-x-3 mb-2 cursor-pointer pb-2 border-b border-gray-600/50 last:mb-0 last:pb-0 last:border-0">
                    <input 
                      type="checkbox" 
                      className="rounded text-blue-500 bg-gray-600 border-gray-500 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      checked={produtosSelecionados.includes(p.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setProdutosSelecionados(prev => [...prev, p.id]);
                        } else {
                          setProdutosSelecionados(prev => prev.filter(id => id !== p.id));
                        }
                      }}
                    />
                    <span className="text-sm text-gray-200 font-medium">{p.nome} <span className="text-blue-300 ml-1">R$ {p.precoVenda.toFixed(2)}</span></span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Data *</label>
                <input 
                  type="date" required value={data} 
                  onChange={e => setData(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Horário *</label>
                <div className="grid grid-cols-3 gap-2">
                  {HORARIOS.map(h => (
                    <button
                      key={h} type="button"
                      onClick={() => setHorario(h)}
                      className={`py-1 px-2 rounded text-sm text-center border transition-colors ${
                        horario === h 
                          ? 'bg-blue-600 border-blue-500 text-white' 
                          : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-700">
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg transition-transform active:scale-[0.98]">
                Confirmar Agendamento
              </button>
            </div>
          </form>
        </div>

        {/* Catálogo de Serviços e Produtos */}
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
            <h3 className="text-xl font-bold text-white mb-4">Nossos Serviços</h3>
            {Object.keys(servicosPorCategoria).length === 0 ? (
              <p className="text-sm text-gray-500 italic">Nenhum serviço cadastrado.</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(servicosPorCategoria).map(([cat, servs]) => (
                  <div key={cat}>
                    <h4 className="text-sm font-semibold text-gray-400 uppercase mb-2 border-b border-gray-700 pb-1">{cat}</h4>
                    <div className="space-y-2">
                      {servs.map(s => (
                        <div key={s.id} className="flex justify-between items-center text-sm">
                          <span className="text-gray-200">{s.nome}</span>
                          <span className="text-green-400 font-medium">R$ {s.valor.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
            <h3 className="text-xl font-bold text-white mb-4">Nossos Produtos</h3>
            {Object.keys(produtosPorCategoria).length === 0 ? (
              <p className="text-sm text-gray-500 italic">Nenhum produto cadastrado.</p>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {Object.entries(produtosPorCategoria).map(([cat, prods]) => (
                  <div key={cat}>
                    <h4 className="text-sm font-semibold text-gray-400 uppercase mb-2 border-b border-gray-700 pb-1">{cat}</h4>
                    <div className="space-y-2">
                      {prods.map(p => (
                        <div key={p.id} className="flex justify-between items-center text-sm">
                          <span className="text-gray-200">{p.nome}</span>
                          <span className="text-blue-300 font-medium">R$ {p.precoVenda.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
