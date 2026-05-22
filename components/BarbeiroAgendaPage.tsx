import React, { useState } from 'react';
import { useBarbeiros } from '../hooks/useBarbeiros';
import { useBarbeariaRegistros, useBarbeariaAgendamentos } from '../hooks/useBarbeariaRegistros';
import { useBarbeariaConfig } from '../hooks/useBarbeariaConfig';
import { CheckCircleIcon, XCircleIcon, ClockIcon, ScissorsIcon } from './icons';
import { User, Empresa } from '../types';
import { CustomDatePicker } from './CustomDatePicker';
import ConfirmationModal from './ConfirmationModal';
import { API_BASE_URL } from '../constants';

interface BarbeiroAgendaPageProps {
  user: User;
  empresa?: Empresa;
  isAdmin?: boolean;
  linkId?: String;
}

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

const BarbeiroAgendaPage: React.FC<BarbeiroAgendaPageProps> = ({ user, empresa, linkId, isAdmin }) => {


  const resolvedCompanyId = (linkId && linkId !== 'undefined' ? linkId : undefined) || empresa?.id;
  const { barbeiros } = useBarbeiros(resolvedCompanyId);
  const { agendamentos, addAgendamento, updateStatus, updateAgendamento, loadAgendamentos } = useBarbeariaAgendamentos(resolvedCompanyId);
  const { registros, addRegistro } = useBarbeariaRegistros(resolvedCompanyId);
  const { servicos, produtos, updateProduto } = useBarbeariaConfig(resolvedCompanyId);

  // Vamos assumir que o barbeiro pode escolher quem ele é na tela, ou se o número de telefone 
  // dele bater com algum cadastro, pegar automaticamente.
  const [selectedBarbeiroId, setSelectedBarbeiroId] = useState<string>('');
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [activeAgendamentoId, setActiveAgendamentoId] = useState<string | null>(null);
  const [selectedServicosIds, setSelectedServicosIds] = useState<string[]>([]);
  const [selectedProdutosIds, setSelectedProdutosIds] = useState<string[]>([]);
  const [isSelectBarbeiroModalOpen, setIsSelectBarbeiroModalOpen] = useState(false);
  const [agendamentoToAtender, setAgendamentoToAtender] = useState<any>(null);
  const [barbeiroToAtender, setBarbeiroToAtender] = useState<string>('');
  const [errorAlert, setErrorAlert] = useState<string>('');
  const [isFinalizarCaixaOpen, setIsFinalizarCaixaOpen] = useState(false);
  const [isFinalizando, setIsFinalizando] = useState(false);

  const userPhoneNumbers = user?.phone?.replace(/\D/g, '');
  const barbeiroLogado = barbeiros.find(b => b.telefone && b.telefone.replace(/\D/g, '') === userPhoneNumbers);

  const [metaBarbeiro, setMetaBarbeiro] = useState(() => {
    return localStorage.getItem('minha_meta_barbeiro') || '';
  });

  React.useEffect(() => {
    if (metaBarbeiro) {
      localStorage.setItem('minha_meta_barbeiro', metaBarbeiro);
    } else {
      localStorage.removeItem('minha_meta_barbeiro');
    }
  }, [metaBarbeiro]);

  React.useEffect(() => {
    if (user && user.phone && barbeiros.length > 0 && !selectedBarbeiroId) {
      if (isAdmin || (empresa?.phone && user.phone.replace(/\D/g, '') === empresa.phone.replace(/\D/g, ''))) {
        setSelectedBarbeiroId('todos');
      } else {
        if (barbeiroLogado) {
          setSelectedBarbeiroId(barbeiroLogado.id);
        }
      }
    }
  }, [user, barbeiros, selectedBarbeiroId, isAdmin, empresa, barbeiroLogado]);

  const barbeiro = selectedBarbeiroId === 'todos' ? { id: 'todos', nome: 'Todos os Barbeiros' } : barbeiros.find(b => b.id === selectedBarbeiroId);
  
  const agendamentosByBarbeiro = selectedBarbeiroId === 'todos' 
    ? agendamentos 
    : agendamentos.filter(a => a.barbeiroId === selectedBarbeiroId || !a.barbeiroId || a.barbeiroId === 'Qualquer um');
    
  const meusAgendamentos = agendamentosByBarbeiro.filter(a => a.dataAgendada.startsWith(selectedDate));
  
  const pendentes = meusAgendamentos.filter(a => a.status === 'pendente' || a.status === 'atendendo').sort((a, b) => new Date(a.dataAgendada).getTime() - new Date(b.dataAgendada).getTime());
  const finalizados = meusAgendamentos.filter(a => a.status === 'finalizado' || a.status === 'pago').sort((a, b) => new Date(b.dataAgendada).getTime() - new Date(a.dataAgendada).getTime());

  const currentMonth = selectedDate.substring(0, 7);
  const meusAgendamentosMes = agendamentosByBarbeiro.filter(a => a.dataAgendada.startsWith(currentMonth));
  const finalizadosMes = meusAgendamentosMes.filter(a => a.status === 'finalizado' || a.status === 'pago').sort((a, b) => new Date(b.dataAgendada).getTime() - new Date(a.dataAgendada).getTime());

  const computeComissao = (agendamento: any, bId: string) => {
    const barbeiro = barbeiros.find(b => b.id === bId);
    if (!barbeiro) return 0;
    
    let comissaoServicos = 0;
    let comissaoProdutos = 0;

    if (agendamento.servicosIds && agendamento.servicosIds.length > 0) {
      agendamento.servicosIds.forEach((sId: string) => {
        const s = servicos.find(x => x.id === sId);
        if (s) comissaoServicos += s.valor * ((barbeiro.corte || 0) / 100);
      });
    } else if (agendamento.servicoId) {
      const s = servicos.find(x => x.id === agendamento.servicoId);
      if (s) comissaoServicos += s.valor * ((barbeiro.corte || 0) / 100);
    }

    if (agendamento.produtosIds && agendamento.produtosIds.length > 0) {
      agendamento.produtosIds.forEach((pId: string) => {
        const p = produtos.find(prod => prod.id === pId);
        if (p) {
          const override = Number(p.comissao) > 0 ? Number(p.comissao) : Number(barbeiro.comissao || 0);
          comissaoProdutos += p.precoVenda * (override / 100);
        }
      });
    }

    return comissaoServicos + comissaoProdutos;
  };

  const totalComissaoDia = React.useMemo(() => {
    return finalizados.reduce((acc, a) => acc + computeComissao(a, a.barbeiroId || selectedBarbeiroId), 0);
  }, [finalizados, selectedBarbeiroId, servicos, produtos, barbeiros]);

  const totalComissaoMes = React.useMemo(() => {
    return finalizadosMes.reduce((acc, a) => acc + computeComissao(a, a.barbeiroId || selectedBarbeiroId), 0);
  }, [finalizadosMes, selectedBarbeiroId, servicos, produtos, barbeiros]);

  const restanteParaMeta = React.useMemo(() => {
    const metaNum = Number(metaBarbeiro) || 0;
    if (metaNum <= 0 || totalComissaoMes >= metaNum) return 0;
    
    let fallbackMedia = 30;
    if (servicos.length > 0) {
      const bb = barbeiros.find(b => b.id === selectedBarbeiroId);
      const comissaoPerc = bb ? bb.corte : 50;
      const soma = servicos.reduce((acc, s) => acc + s.valor, 0);
      fallbackMedia = (soma / servicos.length) * (comissaoPerc / 100);
    }
    
    const mediaAtual = finalizadosMes.length > 0 ? (totalComissaoMes / finalizadosMes.length) : fallbackMedia;
    const faltam = metaNum - totalComissaoMes;
    
    return mediaAtual > 0 ? Math.ceil(faltam / mediaAtual) : 0;
  }, [metaBarbeiro, totalComissaoMes, finalizadosMes.length, servicos, barbeiros, selectedBarbeiroId]);

  const restanteParaMetaDiaria = React.useMemo(() => {
    const metaNum = Number(metaBarbeiro) || 0;
    if (metaNum <= 0 || totalComissaoMes >= metaNum) return 0;
    
    let fallbackMedia = 30;
    if (servicos.length > 0) {
      const bb = barbeiros.find(b => b.id === selectedBarbeiroId);
      const comissaoPerc = bb ? bb.corte : 50;
      const soma = servicos.reduce((acc, s) => acc + s.valor, 0);
      fallbackMedia = (soma / servicos.length) * (comissaoPerc / 100);
    }
    
    const mediaAtual = finalizadosMes.length > 0 ? (totalComissaoMes / finalizadosMes.length) : fallbackMedia;
    const faltam = metaNum - totalComissaoMes;

    const currentDateObj = new Date();
    const currentMonth = currentDateObj.getMonth();
    const currentYear = currentDateObj.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const bb = barbeiros.find(b => b.id === selectedBarbeiroId);
    let workingDaysLeft = 0;
    const validDaysNames = bb?.diasTrabalhados || [];
    const hasRestrictedDays = validDaysNames.length > 0;
    const ptBRWeekdaysNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    for (let i = currentDateObj.getDate(); i <= daysInMonth; i++) {
        const dateToCheck = new Date(currentYear, currentMonth, i);
        const dayName = ptBRWeekdaysNames[dateToCheck.getDay()];
        if (!hasRestrictedDays || validDaysNames.includes(dayName)) {
            workingDaysLeft++;
        }
    }
    
    const daysLeft = Math.max(1, workingDaysLeft);

    const metaRestanteDia = faltam / daysLeft;
    
    return mediaAtual > 0 ? Math.ceil(metaRestanteDia / mediaAtual) : 0;
  }, [metaBarbeiro, totalComissaoMes, finalizadosMes.length, servicos, barbeiros, selectedBarbeiroId]);

  const handleAtender = async (a: any) => {
    const isUnassigned = !a.barbeiroId || a.barbeiroId === 'Qualquer um';

    let finalBarbeiroId = a.barbeiroId;

    if (isUnassigned) {
      if (barbeiroLogado) {
        // Logged user is an active barber, assign to him
        finalBarbeiroId = barbeiroLogado.id;
        await updateAgendamento(a.id, { status: 'atendendo', barbeiroId: finalBarbeiroId });
        await updateStatus(a.id, 'atendendo', finalBarbeiroId);
      } else {
        // Not an active barber (probably admin)
        if (barbeiros.length === 1) {
          finalBarbeiroId = barbeiros[0].id;
          await updateAgendamento(a.id, { status: 'atendendo', barbeiroId: finalBarbeiroId });
          await updateStatus(a.id, 'atendendo', finalBarbeiroId);
        } else if (barbeiros.length > 1) {
          // Open modal to select barber
          setAgendamentoToAtender(a);
          setBarbeiroToAtender('');
          setIsSelectBarbeiroModalOpen(true);
          return;
        } else {
          // No barbers available? Just atendendo
          await updateAgendamento(a.id, { status: 'atendendo' });
          await updateStatus(a.id, 'atendendo', undefined);
        }
      }
    } else {
      // Already assigned
      // Provide fallback logic if needed, but per request: "mas só ele pode trocar" meaning it shouldn't be unassigned automatically here.
      await updateAgendamento(a.id, { status: 'atendendo', barbeiroId: finalBarbeiroId !== 'Qualquer um' ? finalBarbeiroId : undefined });
      await updateStatus(a.id, 'atendendo', finalBarbeiroId !== 'Qualquer um' ? finalBarbeiroId : undefined);
    }
  };

  const handleFinalizarCaixa = async () => {
    if (totalComissaoDia <= 0) {
      setErrorAlert("Não há comissões para finalizar hoje.");
      setIsFinalizarCaixaOpen(false);
      return;
    }
    
    setIsFinalizando(true);
    try {
      const barbeiroNome = barbeiros.find(b => b.id === selectedBarbeiroId)?.nome || "Barbeiro";
      const payload = {
        ownerPhone: user.phone,
        type: 'revenue',
        name: `Comissões Barbeiro (${barbeiroNome}) - ${selectedDate.split('-').reverse().join('/')}`,
        amount: totalComissaoDia,
        date: selectedDate,
        status: 'pago'
      };

      const res = await fetch(`${API_BASE_URL}/transactions/simple`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(payload)
      });
      if (res.ok) {
         setIsFinalizarCaixaOpen(false);
      } else {
         setErrorAlert("Erro ao finalizar caixa.");
         setIsFinalizarCaixaOpen(false);
      }
    } catch (e) {
      console.error(e);
      setErrorAlert("Erro ao finalizar caixa.");
      setIsFinalizarCaixaOpen(false);
    } finally {
      setIsFinalizando(false);
    }
  };

  const confirmAtender = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barbeiroToAtender || !agendamentoToAtender) return;
    
    // First try to update the whole agendamento to ensure barbeiroId is saved
    await updateAgendamento(agendamentoToAtender.id, { 
      status: 'atendendo', 
      barbeiroId: barbeiroToAtender 
    });
    // Fallback: Also call updateStatus which hits the /status endpoint explicitly
    await updateStatus(agendamentoToAtender.id, 'atendendo', barbeiroToAtender);
    
    setIsSelectBarbeiroModalOpen(false);
    setAgendamentoToAtender(null);
  };

  const handleConcluir = async (a: any) => {
    if (!a.servicosIds || a.servicosIds.length === 0) {
      setErrorAlert('É necessário ter pelo menos 1 serviço vinculado para concluir o agendamento.');
      return;
    }

    let finalBarbeiroId = a.barbeiroId;
    let barbeiroDoAgendamento = barbeiros.find(b => b.id === finalBarbeiroId);

    // Se um barbeiro logado o conclui, ele assume o agendamento de vez.
    if (selectedBarbeiroId && selectedBarbeiroId !== 'todos') {
      finalBarbeiroId = selectedBarbeiroId;
      barbeiroDoAgendamento = barbeiros.find(b => b.id === finalBarbeiroId);
    }

    const decidedBarbeiroId = finalBarbeiroId !== 'Qualquer um' ? finalBarbeiroId : undefined;
    await updateAgendamento(a.id, { status: 'finalizado', barbeiroId: decidedBarbeiroId });
    await updateStatus(a.id, 'finalizado', decidedBarbeiroId);

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

    if (servicosDoAgendamento.length > 0 || agendamentoProdutos.length > 0) {
      const itens: any[] = [];
      let total = 0;

      servicosDoAgendamento.forEach(s => {
        itens.push({ idItem: s.id, nome: s.nome, tipo: 'servico', valor: s.valor });
        total += s.valor;
      });

      agendamentoProdutos.forEach(p => {
        itens.push({ idItem: p.id, nome: p.nome, tipo: 'produto', valor: p.precoVenda });
        total += p.precoVenda;
      });

    }
  };

  const [isAddClienteModalOpen, setIsAddClienteModalOpen] = useState(false);
  const [addClienteNome, setAddClienteNome] = useState('');
  const [addClienteTelefone, setAddClienteTelefone] = useState('');
  const [addClienteServicos, setAddClienteServicos] = useState<string[]>([]);
  const [addClienteProdutos, setAddClienteProdutos] = useState<string[]>([]);
  const [addClienteData, setAddClienteData] = useState<string>(todayStr);
  const [addClienteHora, setAddClienteHora] = useState('');
  const [addClienteDescricao, setAddClienteDescricao] = useState('');
  const [activeTab, setActiveTab] = useState<'proximos' | 'historico' | 'resumoMensal'>('proximos');

  const addClienteTotal = React.useMemo(() => {
    let total = 0;
    addClienteServicos.forEach(id => {
      const s = servicos.find(x => x.id === id);
      if (s) total += s.valor;
    });
    addClienteProdutos.forEach(id => {
      const p = produtos.find(x => x.id === id);
      if (p) total += p.precoVenda;
    });
    return total;
  }, [addClienteServicos, addClienteProdutos, servicos, produtos]);

  const availableHorariosAddCliente = React.useMemo(() => {
    if (!addClienteData) return HORARIOS;
    if (addClienteData > todayStr) return HORARIOS;

    const nowHour = new Date().getHours();
    const nowMinute = new Date().getMinutes();

    return HORARIOS.filter((h) => {
      const [hHour, hMinute] = h.split(":").map(Number);
      if (hHour > nowHour) return true;
      if (hHour === nowHour && hMinute > nowMinute) return true;
      return false;
    });
  }, [addClienteData, todayStr]);

  React.useEffect(() => {
    // Polling a cada 30 segundos usando loadAgendamentos para manter a agenda sempre atualizada
    const interval = setInterval(() => {
      loadAgendamentos();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadAgendamentos]);

  const handleAddClienteSubmit = async (statusFinal: 'atendendo' | 'finalizado') => {
    if (!addClienteTelefone || !addClienteHora || !addClienteData) {
      alert("Preencha telefone, data e hora.");
      return;
    }
    
    const justNumbers = addClienteTelefone.replace(/\D/g, "");
    if (justNumbers.length < 10 || justNumbers.length > 11) {
      alert("Por favor, insira um telefone válido com código de área (DDD) contendo 10 ou 11 dígitos.");
      return;
    }

    if (addClienteServicos.length === 0 && addClienteProdutos.length === 0) {
      alert("Selecione ao menos um serviço ou produto.");
      return;
    }

    const agendamentoData: any = {
      clienteNome: addClienteNome || "Cliente Avulso",
      clienteTelefone: addClienteTelefone,
      barbeiroId: selectedBarbeiroId === 'todos' ? '' : selectedBarbeiroId,
      servicosIds: addClienteServicos,
      produtosIds: addClienteProdutos,
      dataAgendada: `${addClienteData}T${addClienteHora}:00`,
      horarios: [addClienteHora],
      status: 'pendente', // Must be created as pendente
      quantidadePessoas: 1,
      nomesAcompanhantes: "",
      descricao: addClienteDescricao,
      linkId: resolvedCompanyId
    };

    const added = await addAgendamento(agendamentoData);
    
    if (added && statusFinal !== 'pendente') {
      const decidedBarbeiroId = selectedBarbeiroId === 'todos' ? undefined : selectedBarbeiroId;
      await updateAgendamento(added.id, { status: statusFinal, barbeiroId: decidedBarbeiroId });
      await updateStatus(added.id, statusFinal, decidedBarbeiroId);
      
      // Update inventory if products are finalized and pago
      if (statusFinal === 'finalizado') {
        const agendamentoProdutos: any[] = [];
        if (addClienteProdutos.length > 0) {
          addClienteProdutos.forEach((pId: string) => {
            const prod = produtos.find(p => p.id === pId);
            if (prod) {
              agendamentoProdutos.push(prod);
              if (prod.estoque > 0) {
                updateProduto(prod.id, { estoque: prod.estoque - 1 });
              }
            }
          });
        }
      }
    }

    // Limpar estados
    setIsAddClienteModalOpen(false);
    setAddClienteNome('');
    setAddClienteTelefone('');
    setAddClienteServicos([]);
    setAddClienteProdutos([]);
    setAddClienteData(todayStr);
    setAddClienteHora('');
    setAddClienteDescricao('');
    loadAgendamentos();
  };

  const handleAddExtraItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAgendamentoId) return;

    const a = pendentes.find(x => x.id === activeAgendamentoId);
    if (!a) return;

    let updates: any = {};
    updates.servicosIds = selectedServicosIds;
    updates.produtosIds = selectedProdutosIds;
    
    // Atualiza o agendamento no backend (e state local via poll)
    if (Object.keys(updates).length > 0) {
      await updateAgendamento(a.id, updates);
    }

    // Fechar modal
    setIsAddItemModalOpen(false);
    setSelectedServicosIds([]);
    setSelectedProdutosIds([]);
  };

  const barbeiroParaAgenda = barbeiros.find(b => b.id === selectedBarbeiroId);
  const allowedDays = barbeiroParaAgenda?.diasTrabalhados?.length > 0 ? barbeiroParaAgenda.diasTrabalhados : undefined;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-gray-800 pb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600/20 p-3 rounded-2xl border border-blue-500/30">
            <ClockIcon className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Minha Agenda</h1>
            <p className="text-gray-400 mt-1 text-sm font-medium">Acompanhe seus clientes e tarefas com facilidade</p>
          </div>
        </div>
        <div>
          <button onClick={loadAgendamentos} className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-xl text-sm font-bold border border-gray-700 transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Atualizar Agenda
          </button>
        </div>
      </div>

      {!selectedBarbeiroId ? (
        <div className="bg-gray-800/80 p-5 md:p-8 rounded-2xl border border-gray-700/50 shadow-xl max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-8">Quem é você?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
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
            <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
              <button 
                onClick={() => {
                  const agendamentoLink = `${window.location.origin}/agendamento?empresaId=${resolvedCompanyId}` + (selectedBarbeiroId && selectedBarbeiroId !== 'todos' ? `&barbeiroId=${selectedBarbeiroId}` : '');
                  navigator.clipboard.writeText(agendamentoLink)
                    .then(() => alert('Link de agendamento copiado para a área de transferência!'))
                    .catch(() => alert('Não foi possível copiar o link.'));
                }}
                className="flex-1 sm:flex-none text-sm font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-4 py-2.5 rounded-xl transition-all border border-blue-500/20 whitespace-nowrap flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                Compartilhar
              </button>
              <button onClick={() => setIsAddClienteModalOpen(true)} className="flex-1 sm:flex-none text-sm font-bold text-green-400 hover:text-green-300 bg-green-500/10 hover:bg-green-500/20 px-4 py-2.5 rounded-xl transition-all border border-green-500/20 whitespace-nowrap">
                + Adicionar
              </button>
            </div>
          </div>
          
          <div className="mb-8">
            <CustomDatePicker allowPast={true} selectedDate={selectedDate} onChange={(d) => setSelectedDate(d)} allowedDaysOfWeek={allowedDays} />
          </div>

          {errorAlert && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#121214] border border-red-900/50 rounded-2xl p-6 sm:p-8 w-full max-w-lg mx-auto shadow-2xl text-center">
                <div className="w-12 md:w-16 h-12 md:h-16 bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                  <XCircleIcon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Atenção</h3>
                <p className="text-gray-300 mb-6 text-sm">{errorAlert}</p>
                <button 
                  onClick={() => setErrorAlert('')}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition-colors border border-gray-700"
                >
                  Entendi
                </button>
              </div>
            </div>
          )}

          {isSelectBarbeiroModalOpen && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#121214] border border-gray-800 rounded-2xl p-6 sm:p-8 w-full max-w-lg mx-auto shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white">Selecionar Barbeiro</h3>
                  <button onClick={() => { setIsSelectBarbeiroModalOpen(false); setAgendamentoToAtender(null); }} className="text-gray-500 hover:text-gray-300">
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>
                <form onSubmit={confirmAtender} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Qual barbeiro irá atender?</label>
                    <select 
                      required value={barbeiroToAtender} onChange={e => setBarbeiroToAtender(e.target.value)}
                      className="w-full bg-gray-900/50 text-white border border-gray-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">Selecione um barbeiro...</option>
                      {barbeiros.map(b => (
                        <option key={b.id} value={b.id}>{b.nome}</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 mt-4 rounded-xl transition-colors">
                    Confirmar e Atender
                  </button>
                </form>
              </div>
            </div>
          )}

          {isAddClienteModalOpen && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8 w-full max-w-lg mx-auto shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white">Adicionar Cliente</h3>
                  <button onClick={() => setIsAddClienteModalOpen(false)} className="text-gray-500 hover:text-gray-300">
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Telefone / Celular</label>
                    <input 
                      type="tel" value={addClienteTelefone} onChange={e => {
                        let val = e.target.value.replace(/\D/g, "");
                        if (val.length > 11) val = val.substring(0, 11);
                        if (val.length > 2) val = `(${val.substring(0, 2)}) ${val.substring(2)}`;
                        if (val.length > 9) val = `${val.substring(0, 10)}-${val.substring(10)}`;
                        setAddClienteTelefone(val);
                      }}
                      className="w-full bg-gray-800 text-white border border-gray-700 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                      placeholder="(DD) 99999-9999"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Nome do Cliente</label>
                    <input 
                      type="text" value={addClienteNome} onChange={e => setAddClienteNome(e.target.value)}
                      className="w-full bg-gray-800 text-white border border-gray-700 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                      placeholder="Nome do cliente"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Produtos (Opcionais)</label>
                      <div className="bg-gray-700 border border-gray-600 rounded p-3 max-h-40 overflow-y-auto w-full custom-scrollbar">
                        {produtos.length === 0 && <p className="text-gray-500 text-sm">Nenhum produto.</p>}
                        {produtos.map(p => (
                          <label key={p.id} className="flex items-center space-x-3 mb-2 cursor-pointer pb-2 border-b border-gray-600/50 last:mb-0 last:pb-0 last:border-0">
                            <input
                              type="checkbox"
                              className="rounded text-blue-500 bg-gray-600 border-gray-500 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                              checked={addClienteProdutos.includes(p.id)}
                              onChange={(e) => {
                                if (e.target.checked) setAddClienteProdutos(prev => [...prev, p.id]);
                                else setAddClienteProdutos(prev => prev.filter(id => id !== p.id));
                              }}
                            />
                            <span className="text-sm font-medium text-gray-200">
                              {p.nome} <span className="text-blue-400">R$ {p.precoVenda.toFixed(2)}</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Serviços (Opcionais)</label>
                      <div className="bg-gray-700 border border-gray-600 rounded p-3 max-h-40 overflow-y-auto w-full custom-scrollbar">
                        {servicos.length === 0 && <p className="text-gray-500 text-sm">Nenhum serviço.</p>}
                        {servicos.map(s => (
                          <label key={s.id} className="flex items-center space-x-3 mb-2 cursor-pointer pb-2 border-b border-gray-600/50 last:mb-0 last:pb-0 last:border-0">
                            <input
                              type="checkbox"
                              className="rounded text-blue-500 bg-gray-600 border-gray-500 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                              checked={addClienteServicos.includes(s.id)}
                              onChange={(e) => {
                                if (e.target.checked) setAddClienteServicos(prev => [...prev, s.id]);
                                else setAddClienteServicos(prev => prev.filter(id => id !== s.id));
                              }}
                            />
                            <span className="text-sm font-medium text-gray-200">
                              {s.nome} <span className="text-green-400">R$ {s.valor.toFixed(2)}</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Selecione a Data *</label>
                    <CustomDatePicker
                      selectedDate={addClienteData}
                      onChange={(d) => {
                        setAddClienteData(d);
                        setAddClienteHora('');
                      }}
                      onMonthChange={() => {
                        setAddClienteHora('');
                      }}
                      allowedDaysOfWeek={allowedDays}
                    />
                    {addClienteData && availableHorariosAddCliente.length === 0 && (
                      <p className="text-red-400 text-xs mt-2">Nenhum horário disponível para esta data hoje.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Horários *</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {availableHorariosAddCliente.map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setAddClienteHora(h)}
                          className={`py-1 px-1.5 rounded text-xs text-center border transition-colors ${
                            addClienteHora === h
                              ? "bg-blue-600 border-blue-500 text-white"
                              : "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                          }`}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Descrição / Observações (Opcional)</label>
                    <textarea 
                      value={addClienteDescricao} 
                      onChange={e => setAddClienteDescricao(e.target.value)}
                      className="w-full bg-gray-800 text-white border border-gray-700 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:outline-none resize-none h-20 custom-scrollbar"
                      placeholder="Adicione observações ou comentários sobre o cliente..."
                    />
                  </div>

                  <div className="flex justify-end items-center mb-4 mt-2">
                    <span className="text-gray-300 font-medium">Total:</span>
                    <span className="text-xl font-bold text-emerald-400 ml-3">R$ {addClienteTotal.toFixed(2)}</span>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-800">
                    <button 
                      type="button" 
                      onClick={() => handleAddClienteSubmit('atendendo')} 
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 pt-4 rounded-xl transition-colors text-sm"
                    >
                      Atender
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleAddClienteSubmit('finalizado')} 
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 pt-4 rounded-xl transition-colors text-sm"
                    >
                      Concluir
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isAddItemModalOpen && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
              <div className="bg-[#121214] border border-gray-800 rounded-2xl p-6 sm:p-8 w-full max-w-lg mx-auto shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-6 shrink-0">
                  <h3 className="text-xl font-bold text-white">Adicionar Itens</h3>
                  <button onClick={() => setIsAddItemModalOpen(false)} className="text-gray-500 hover:text-gray-300">
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>
                <form onSubmit={handleAddExtraItem} className="flex flex-col flex-1 min-h-0">
                  <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 min-h-0 space-y-6">
                    <div>
                      <label className="block text-sm text-gray-400 mb-3 font-medium">Produtos Disponíveis</label>
                      <div className="space-y-2">
                          {produtos.length > 0 ? produtos.map(p => (
                            <label key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedProdutosIds.includes(p.id) ? 'bg-blue-900/20 border-blue-500/50' : 'bg-gray-900/50 border-gray-800 hover:border-gray-700'}`}>
                              <input 
                                type="checkbox" 
                                checked={selectedProdutosIds.includes(p.id)} 
                                onChange={(e) => {
                                  setSelectedProdutosIds(prev => e.target.checked ? [...prev, p.id] : prev.filter(i => i !== p.id));
                                }} 
                                className="w-5 h-5 rounded border-gray-700 text-blue-600 focus:ring-blue-500 bg-gray-800 shrink-0" 
                              />
                              <div className="flex-1 flex justify-between items-center min-w-0">
                                <div className="truncate pr-2">
                                  <div className="text-gray-200 font-medium truncate">{p.nome}</div>
                                  <div className="text-gray-500 text-xs mt-0.5">Estoque: {p.estoque}</div>
                                </div>
                                <span className="text-emerald-400 font-bold ml-2 whitespace-nowrap shrink-0">R$ {p.precoVenda.toFixed(2)}</span>
                              </div>
                            </label>
                          )) : (
                            <div className="text-sm text-gray-500 p-3 bg-gray-900/30 rounded-xl border border-gray-800 text-center">Nenhum produto cadastrado.</div>
                          )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-3 font-medium">Serviços Disponíveis</label>
                      <div className="space-y-2">
                          {servicos.length > 0 ? servicos.map(s => (
                            <label key={s.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedServicosIds.includes(s.id) ? 'bg-blue-900/20 border-blue-500/50' : 'bg-gray-900/50 border-gray-800 hover:border-gray-700'}`}>
                              <input 
                                type="checkbox" 
                                checked={selectedServicosIds.includes(s.id)} 
                                onChange={(e) => {
                                  setSelectedServicosIds(prev => e.target.checked ? [...prev, s.id] : prev.filter(i => i !== s.id));
                                }} 
                                className="w-5 h-5 rounded border-gray-700 text-blue-600 focus:ring-blue-500 bg-gray-800 shrink-0" 
                              />
                              <div className="flex-1 flex justify-between items-center min-w-0">
                                <span className="text-gray-200 font-medium truncate pr-2">{s.nome}</span>
                                <span className="text-emerald-400 font-bold ml-2 whitespace-nowrap shrink-0">R$ {s.valor.toFixed(2)}</span>
                              </div>
                            </label>
                          )) : (
                            <div className="text-sm text-gray-500 p-3 bg-gray-900/30 rounded-xl border border-gray-800 text-center">Nenhum serviço cadastrado.</div>
                          )}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 pt-4 mt-2 border-t border-gray-800/50">
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors shrink-0">
                      Salvar Selecionados ({selectedServicosIds.length + selectedProdutosIds.length})
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 bg-gray-900 border border-gray-800 rounded-2xl p-2 mb-6">
            <button 
              onClick={() => setActiveTab('proximos')} 
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${activeTab === 'proximos' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
              Próximos Agendamentos ({pendentes.length})
            </button>
            <button 
              onClick={() => setActiveTab('historico')} 
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${activeTab === 'historico' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
              Resumo Diário
            </button>
            <button 
              onClick={() => setActiveTab('resumoMensal')} 
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${activeTab === 'resumoMensal' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
              Resumo Mensal
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5 md:p-8">
            {activeTab === 'proximos' && (
            <div className="bg-[#1a1a1d] p-6 sm:p-8 rounded-3xl border border-gray-800/60 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h2 className="text-2xl font-black text-gray-100 mb-6 border-b border-gray-800/80 pb-4 flex justify-between items-center tracking-tight">
                <span>Próximos Agendamentos</span>
                <span className="bg-blue-600 shadow-lg shadow-blue-500/20 font-black text-white text-sm px-3 py-1 rounded-xl">{pendentes.length}</span>
              </h2>
              {pendentes.length === 0 ? (
                <div className="w-full bg-gray-900/50 p-5 md:p-8 rounded-2xl border border-gray-800 text-center text-gray-500 flex flex-col items-center justify-center">
                  <svg className="w-12 h-12 mb-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  <p>Bom trabalho! Nenhum agendamento pendente.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                  {pendentes.map(a => {
                      const dataObj = new Date(a.dataAgendada);

                      const servicosDoAgendamento: any[] = [];
                      let valorTotal = 0;

                      // Serviços
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

                      // Produtos
                      if (a.produtosIds && a.produtosIds.length > 0) {
                        a.produtosIds.forEach((pId: string) => {
                          const p = produtos.find(prod => prod.id === pId);

                          if (p) {
                            valorTotal += p.precoVenda;
                          }
                        });
                      }

                      return (
                        <div
                          key={a.id}
                          className={`bg-[#121214] p-5 rounded-2xl border ${
                            a.status === 'atendendo'
                              ? 'border-blue-500/50 shadow-blue-500/10'
                              : 'border-gray-800/60 hover:border-gray-700'
                          } text-white shadow-xl transition-all relative flex flex-col gap-4`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col gap-1.5 flex-1">
                              {a.status === 'atendendo' && (
                                <div className="w-fit bg-blue-500/10 text-blue-400 text-[10px] px-2.5 py-1 rounded-md border border-blue-500/30 uppercase tracking-widest font-bold flex items-center gap-1.5 shadow-sm shadow-blue-500/10 mb-0.5">
                                  <ScissorsIcon className="w-3.5 h-3.5" />
                                  EM ATENDIMENTO
                                </div>
                              )}

                              <h3 className="font-bold text-xl text-gray-100 flex items-center gap-2">
                                {a.cliente}
                              </h3>

                              <p className="text-xs text-gray-400 font-mono tracking-tight bg-gray-800/80 w-fit px-2 py-1 rounded-md border border-gray-700/50">
                                {a.telefone}
                              </p>

                              {isAdmin ? (
                                <select
                                  value={a.barbeiroId || 'Qualquer um'}
                                  onChange={(e) =>
                                    updateAgendamento(a.id, {
                                      barbeiroId: e.target.value,
                                    })
                                  }
                                  className="mt-1 flex items-center gap-1.5 text-xs text-indigo-300 font-medium bg-indigo-900/20 px-2 py-1 rounded-md w-fit border border-indigo-500/20 focus:outline-none focus:border-indigo-500 cursor-pointer"
                                >
                                  <option
                                    className="bg-gray-900 text-gray-300"
                                    value="Qualquer um"
                                  >
                                    💈 Sem preferência
                                  </option>

                                  {barbeiros.map(b => (
                                    <option
                                      className="bg-gray-900 text-gray-300"
                                      key={b.id}
                                      value={b.id}
                                    >
                                      💈 {b.nome}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <p className="flex items-center gap-1.5 mt-1 text-xs text-indigo-300 font-medium bg-indigo-900/20 px-2.5 py-1 rounded-md w-fit border border-indigo-500/20">
                                  <span className="text-[10px]">💈</span>
                                  {barbeiros.find(b => b.id === a.barbeiroId)?.nome ||
                                    'Sem preferência'}
                                </p>
                              )}

                              {a.quantidadePessoas && a.quantidadePessoas > 1 && (
                                <p className="flex items-center gap-1.5 mt-1 text-xs text-orange-300 font-medium bg-orange-900/20 px-2.5 py-1.5 rounded-md w-fit border border-orange-500/20">
                                  👥 {a.quantidadePessoas} Pessoas
                                  {a.nomesAcompanhantes && (
                                    <span className="opacity-70 mx-1">|</span>
                                  )}
                                  {a.nomesAcompanhantes && (
                                    <span className="opacity-60 font-normal">
                                      {a.nomesAcompanhantes}
                                    </span>
                                  )}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-col items-end gap-1">
                              <div className="bg-blue-600/10 text-blue-400 font-black text-xl px-3 py-1.5 rounded-xl border border-blue-500/20 tabular-nums tracking-tighter shadow-inner">
                                {a.horarios && a.horarios.length > 0
                                  ? a.horarios.join(', ')
                                  : dataObj.toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 mt-2">
                            {servicosDoAgendamento.map(s => (
                              <div
                                key={s.id}
                                className="flex justify-between items-center text-sm bg-gray-800/30 px-3 py-2 rounded-lg border border-gray-700/30"
                              >
                                <span className="text-gray-300 font-medium">
                                  {s.nome}
                                </span>

                                <span className="text-emerald-400 font-bold tracking-tight">
                                  R$ {s.valor.toFixed(2)}
                                </span>
                              </div>
                            ))}

                            {a.produtosIds &&
                              a.produtosIds.map((pId: string) => {
                                const p = produtos.find(prod => prod.id === pId);

                                if (!p) return null;

                                return (
                                  <div
                                    key={pId}
                                    className="flex justify-between items-center text-sm bg-gray-800/30 px-3 py-2 rounded-lg border border-gray-700/30"
                                  >
                                    <span className="text-blue-300 font-medium text-xs">
                                      {p.nome}
                                    </span>

                                    <span className="text-blue-400 font-bold tracking-tight text-xs">
                                      R$ {p.precoVenda.toFixed(2)}
                                    </span>
                                  </div>
                                );
                              })}

                            {valorTotal > 0 && (
                              <div className="flex justify-between items-center text-sm px-3 py-2 border-t border-gray-700/50 mt-1">
                                <span className="text-gray-400 font-medium">
                                  Total
                                </span>

                                <span className="text-emerald-400 font-bold text-base">
                                  R$ {valorTotal.toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2 pt-4 mt-1 border-t border-gray-800/80">
                            {a.status === 'pendente' && (
                              <button
                                onClick={() => handleAtender(a)}
                                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold text-sm py-2.5 rounded-xl transition-all shadow-md hover:bg-blue-500 hover:shadow-blue-500/20 active:scale-[0.98]"
                              >
                                <ClockIcon className="w-4 h-4" />
                                Atender
                              </button>
                            )}

                            {a.status === 'atendendo' && (
                              <>
                                <button
                                  onClick={() => {
                                    setActiveAgendamentoId(a.id);
                                    setSelectedServicosIds(a.servicosIds || []);
                                    setSelectedProdutosIds(a.produtosIds || []);
                                    setIsAddItemModalOpen(true);
                                  }}
                                  className="flex-[0.8] flex items-center justify-center gap-2 bg-gray-800 text-gray-300 font-semibold text-sm py-2.5 rounded-xl transition-all border border-gray-700 hover:bg-gray-700 hover:text-white active:scale-[0.98]"
                                >
                                  + Adicionar Item
                                </button>

                                <button
                                  onClick={() => handleConcluir(a)}
                                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white font-black tracking-wide text-sm py-2.5 rounded-xl transition-all shadow-md hover:bg-emerald-500 hover:shadow-emerald-500/20 active:scale-[0.98]"
                                >
                                  <CheckCircleIcon className="w-4 h-4" />
                                  CONCLUIR
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
            )}

            {activeTab === 'historico' && (
            <div className="bg-[#1a1a1d] p-6 sm:p-8 rounded-3xl border border-gray-800/60 shadow-2xl h-fit animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h2 className="text-xl font-bold text-gray-300 mb-6 border-b border-gray-800/80 pb-4 flex justify-between items-center tracking-tight">
                <span>Resumo Diário</span>
                <span className="text-emerald-400 font-black text-xl">R$ {totalComissaoDia.toFixed(2)}</span>
              </h2>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4 gap-4">
                <div className="flex justify-between items-center w-full">
                  <div>
                    <p className="text-gray-400 text-sm">Serviços concluídos</p>
                    <p className="text-white font-bold text-lg">{finalizados.length}</p>
                  </div>
                  {Number(metaBarbeiro) > 0 && restanteParaMetaDiaria > 0 && (
                    <div className="text-right">
                      <p className="text-gray-400 text-sm">Meta diária restante</p>
                      <p className="text-blue-400 font-bold text-lg">{restanteParaMetaDiaria} <span className="text-sm font-normal text-gray-500">serviços</span></p>
                    </div>
                  )}
                  {Number(metaBarbeiro) > 0 && restanteParaMetaDiaria === 0 && (
                    <div className="text-right">
                      <p className="text-emerald-400 text-sm font-bold flex items-center justify-end gap-1"><CheckCircleIcon className="w-4 h-4" /> Meta batida!</p>
                    </div>
                  )}
                </div>
                {isAdmin && selectedDate === todayStr && totalComissaoDia > 0 && (
                  <button 
                    onClick={() => setIsFinalizarCaixaOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-xl text-sm transition-all shadow-md shrink-0 whitespace-nowrap"
                  >
                    Finalizar Caixa Hoje
                  </button>
                )}
              </div>
              {finalizados.length === 0 ? (
                <div className="w-full bg-gray-900/50 p-5 md:p-8 rounded-2xl border border-gray-800 text-center text-gray-500 flex flex-col items-center justify-center">
                  <CheckCircleIcon className="w-12 h-12 mb-3 text-gray-700" />
                  <p>Nenhum serviço concluído.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {finalizados.map(a => {
                    const dataObj = new Date(a.dataAgendada);
                    
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

                    if (a.produtosIds && a.produtosIds.length > 0) {
                      a.produtosIds.forEach((pId: string) => {
                        const p = produtos.find(prod => prod.id === pId);
                        if (p) valorTotal += p.precoVenda;
                      });
                    }

                    return (
                      <div key={a.id} className="bg-[#121214]/60 p-4 rounded-xl border border-gray-800 flex flex-col gap-3 group hover:border-gray-700 hover:bg-[#121214] transition-all">
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col gap-1.5 flex-1">
                            {a.status === 'pago' ? (
                              <div className="w-fit bg-emerald-500/10 text-emerald-400 font-bold text-[10px] px-2.5 py-1 rounded-md border border-emerald-500/20 uppercase tracking-widest flex items-center gap-1.5 shadow-sm shadow-emerald-500/10 mb-0.5">
                                <CheckCircleIcon className="w-3.5 h-3.5" />
                                PAGO
                              </div>
                            ) : (
                              <div className="w-fit bg-blue-500/10 text-blue-400 font-bold text-[10px] px-2.5 py-1 rounded-md border border-blue-500/20 uppercase tracking-widest flex items-center gap-1.5 shadow-sm shadow-blue-500/10 mb-0.5">
                                <CheckCircleIcon className="w-3.5 h-3.5" />
                                FINALIZADO (AGUARD. PAGAMENTO)
                              </div>
                            )}
                            <h3 className="font-bold text-gray-300 text-lg flex items-center gap-2">
                              {a.cliente}
                            </h3>
                            {isAdmin ? (
                                <select
                                  value={a.barbeiroId || 'Qualquer um'}
                                  onChange={(e) => updateAgendamento(a.id, { barbeiroId: e.target.value })}
                                  className="mt-1 bg-transparent text-[10px] text-gray-500 font-medium w-fit focus:outline-none cursor-pointer border border-gray-700/50 rounded-sm px-1 py-0.5"
                                >
                                  <option className="bg-gray-900 text-gray-300" value="Qualquer um">✂️ Sem preferência</option>
                                  {barbeiros.map(b => (
                                    <option className="bg-gray-900 text-gray-300" key={b.id} value={b.id}>✂️ {b.nome}</option>
                                  ))}
                                </select>
                              ) : (
                                <p className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-500 font-medium">
                                    <ScissorsIcon className="w-3 h-3 opacity-70" /> {barbeiros.find(b => b.id === a.barbeiroId)?.nome || 'Sem preferência'}
                                </p>
                              )}
                          </div>
                          
                          <div className="flex flex-col items-end gap-1.5">
                            <div className="text-right">
                              <div className="text-gray-300 font-bold text-sm tracking-tight">
                                {a.horarios && a.horarios.length > 0 
                                  ? a.horarios.join(', ') 
                                  : dataObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                                }
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 w-full mt-1">
                          {servicosDoAgendamento.map(s => (
                            <div key={s.id} className="flex justify-between items-center text-sm bg-gray-800/30 px-3 py-2 rounded-lg border border-gray-700/30 w-full">
                              <span className="text-gray-300 font-medium truncate">{s.nome}</span>
                            </div>
                          ))}
                          {a.produtosIds && a.produtosIds.map((pId: string) => {
                            const p = produtos.find(prod => prod.id === pId);
                            if (!p) return null;
                            return (
                              <div key={pId} className="flex justify-between items-center text-sm bg-blue-900/10 px-3 py-2 rounded-lg border border-blue-800/20 w-full">
                                <span className="text-blue-400 font-medium truncate">{p.nome}</span>
                              </div>
                            );
                          })}
                          {valorTotal > 0 && (
                            <div className="flex justify-between items-center text-sm px-3 py-2 border-t border-gray-700/50 mt-1">
                              <span className="text-gray-400 font-medium">Sua Comissão</span>
                              <span className="text-emerald-400 font-bold text-base">R$ {computeComissao(a, a.barbeiroId || selectedBarbeiroId).toFixed(2)}</span>
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

            {activeTab === 'resumoMensal' && (
              <div className="space-y-6">
                <div className="bg-[#1a1a1d] p-6 sm:p-8 rounded-3xl border border-gray-800/60 shadow-2xl h-fit animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <h2 className="text-xl font-bold text-gray-300 mb-6 border-b border-gray-800/80 pb-4 flex justify-between items-center tracking-tight">
                    <span>Resumo Mensal ({currentMonth.split('-').reverse().join('/')})</span>
                    <span className="text-purple-400 font-black text-xl">R$ {totalComissaoMes.toFixed(2)}</span>
                  </h2>
                  
                  <div className="flex justify-between items-center bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
                    <div>
                      <p className="text-gray-400 text-sm">Serviços concluídos</p>
                      <p className="text-white font-bold text-lg">{finalizadosMes.length}</p>
                    </div>
                    {Number(metaBarbeiro) > 0 && restanteParaMeta > 0 && (
                      <div className="text-right">
                        <p className="text-gray-400 text-sm">Meta mensal restante</p>
                        <p className="text-blue-400 font-bold text-lg">{restanteParaMeta} <span className="text-sm font-normal text-gray-500">serviços</span></p>
                      </div>
                    )}
                    {Number(metaBarbeiro) > 0 && restanteParaMeta === 0 && (
                      <div className="text-right mt-2">
                        <p className="text-emerald-400 text-sm font-bold flex items-center justify-end gap-1"><CheckCircleIcon className="w-4 h-4" /> Meta mensal batida!</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-[#1a1a1d] p-6 sm:p-8 rounded-3xl border border-gray-800/60 shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-300">
                  <h2 className="text-xl font-bold text-gray-300 mb-4 border-b border-gray-800/80 pb-4 tracking-tight">
                    Minha Meta de Ganhos Mensal
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Qual o seu objetivo de ganhos este mês?</label>
                      <div className="relative max-w-sm">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                        <input
                          type="number"
                          value={metaBarbeiro}
                          onChange={(e) => setMetaBarbeiro(e.target.value)}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 placeholder-gray-600 transition-colors font-bold text-lg"
                          placeholder="Ex: 3000"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2 flex gap-1 items-start">
                        <ClockIcon className="w-4 h-4 shrink-0 text-yellow-600/70" />
                        Esta meta é salva localmente apenas neste dispositivo. Ao trocar de celular ou computador, será necessário configurá-la novamente.
                      </p>
                    </div>

                    {Number(metaBarbeiro) > 0 && (
                      <div className="mt-6 bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
                        <div className="flex justify-between items-end mb-3">
                          <span className="text-white font-bold">Progresso da Meta</span>
                          <span className="text-sm font-medium text-gray-400">Meta: R$ {Number(metaBarbeiro).toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden shadow-inner">
                          <div 
                            className={`h-full transition-all duration-1000 ${totalComissaoMes >= Number(metaBarbeiro) ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-blue-500'}`} 
                            style={{ width: `${Math.min(100, (totalComissaoMes / Number(metaBarbeiro)) * 100)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-end items-center mt-2">
                          <p className="text-xs font-bold text-gray-500">
                            {((totalComissaoMes / Number(metaBarbeiro)) * 100).toFixed(1)}% alcançado
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={isFinalizarCaixaOpen}
        onClose={() => setIsFinalizarCaixaOpen(false)}
        onConfirm={handleFinalizarCaixa}
        title="Finalizar Caixa Diário"
        message={`Tem certeza que deseja enviar o valor total de R$ ${totalComissaoDia.toFixed(2)} das comissões de hoje para o fluxo de caixa? Isso criará uma transação de Receita.`}
      />
    </div>
  );
};

export default BarbeiroAgendaPage;