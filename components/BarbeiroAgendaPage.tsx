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
  const { servicos } = useBarbeariaConfig(empresa?.id);

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

    if (servico && barbeiroDoAgendamento) {
      addRegistro({
        cliente: a.cliente,
        telefone: a.telefone,
        barbeiroId: barbeiroDoAgendamento.id,
        barbeiroNome: barbeiroDoAgendamento.nome,
        itens: [{ idItem: servico.id, nome: servico.nome, tipo: 'servico', valor: servico.valor }],
        total: servico.valor
      });
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-3 mb-8 border-b border-gray-700 pb-4">
        <ClockIcon className="w-8 h-8 text-blue-500" />
        <h1 className="text-3xl font-bold text-white">Minha Agenda</h1>
      </div>

      {!selectedBarbeiroId ? (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Selecione seu perfil</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {isAdmin && (
              <button
                onClick={() => setSelectedBarbeiroId('todos')}
                className="bg-purple-900 hover:bg-purple-800 border border-purple-700 rounded-lg p-4 text-center transition"
              >
                <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-xl font-bold text-white mx-auto mb-2">
                  TD
                </div>
                <h3 className="font-bold text-white">Todos (Admin)</h3>
              </button>
            )}
            {barbeiros.map(b => (
              <button
                key={b.id}
                onClick={() => setSelectedBarbeiroId(b.id)}
                className="bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg p-4 text-center transition"
              >
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-xl font-bold text-white mx-auto mb-2">
                  {b.nome.substring(0, 2).toUpperCase()}
                </div>
                <h3 className="font-bold text-white">{b.nome}</h3>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex justify-between items-center bg-gray-800 p-4 rounded-xl border border-gray-700">
            <h2 className="text-xl font-bold text-white">Agenda de {barbeiro?.nome}</h2>
            <button onClick={() => setSelectedBarbeiroId('')} className="text-sm text-blue-400 hover:text-blue-300">Trocar Perfil</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
              <h2 className="text-xl font-bold text-white mb-4 text-blue-400">Próximos Agendamentos</h2>
              {pendentes.length === 0 ? (
                <p className="text-gray-400 text-sm italic">Nenhum agendamento pendente.</p>
              ) : (
                <div className="space-y-4">
                  {pendentes.map(a => {
                    const dataObj = new Date(a.dataAgendada);
                    const servico = servicos.find(s => s.id === a.servicoId);
                    return (
                      <div key={a.id} className="bg-gray-700 border border-gray-600 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-bold text-white text-lg">{a.cliente}</h3>
                            <p className="text-xs text-gray-400">{a.telefone}</p>
                            {selectedBarbeiroId === 'todos' && (
                                <p className="text-xs text-purple-400 font-bold mt-1">
                                    Barbeiro: {barbeiros.find(b => b.id === a.barbeiroId)?.nome || 'Desconhecido'}
                                </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-blue-400 font-bold">{dataObj.toLocaleDateString()} {dataObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                          </div>
                        </div>
                        {servico && <div className="text-sm text-gray-300 bg-gray-800 px-3 py-1 rounded inline-flex mt-1 mb-3">{servico.nome} (R$ {servico.valor.toFixed(2)})</div>}
                        
                        <div className="flex gap-2 pt-2 border-t border-gray-600">
                          <button 
                            onClick={() => handleConcluir(a)}
                            className="flex-1 flex items-center justify-center gap-1 bg-green-600 hover:bg-green-500 text-white text-sm py-2 rounded transition font-medium"
                          >
                            <CheckCircleIcon className="w-5 h-5" /> Concluir Serviço
                          </button>
                          <button 
                            onClick={() => updateStatus(a.id, 'cancelado')}
                            className="flex items-center justify-center gap-1 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded transition"
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

            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg opacity-80">
              <h2 className="text-xl font-bold text-white mb-4 text-green-400">Histórico Recente</h2>
              {concluidos.length === 0 ? (
                <p className="text-gray-400 text-sm italic">Nenhum serviço concluído.</p>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {concluidos.map(a => {
                    const dataObj = new Date(a.dataAgendada);
                    const servico = servicos.find(s => s.id === a.servicoId);
                    return (
                      <div key={a.id} className="bg-gray-700/50 border border-gray-600 p-3 rounded-lg flex justify-between items-center">
                        <div>
                          <h3 className="font-bold text-white">{a.cliente}</h3>
                          {servico && <p className="text-xs text-gray-400">{servico.nome}</p>}
                          {selectedBarbeiroId === 'todos' && (
                              <p className="text-xs text-purple-400 font-bold mt-1">
                                  Barbeiro: {barbeiros.find(b => b.id === a.barbeiroId)?.nome || 'Desconhecido'}
                              </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">{dataObj.toLocaleDateString()}</p>
                          <p className="text-xs font-bold text-green-400 mt-1">Concluído</p>
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
