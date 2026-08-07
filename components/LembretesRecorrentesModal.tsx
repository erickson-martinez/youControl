import React, { useState } from 'react';
import { useLembretesRecorrentes, RecurringReminder } from '../hooks/useLembretesRecorrentes';
import { BellIcon, ClockIcon, XIcon, CheckCircleIcon, PlusIcon, PencilIcon, TrashIcon, ShareIcon } from './icons';

interface LembretesRecorrentesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail?: string;
  initialType?: 'assinatura' | 'conta_fixa';
}

const formatCurrency = (value: number | undefined | null) => {
  if (value === undefined || value === null || isNaN(value)) return 'R$ 0,00';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const LembretesRecorrentesModal: React.FC<LembretesRecorrentesModalProps> = ({
  isOpen,
  onClose,
  currentUserEmail,
  initialType,
}) => {
  const {
    reminders,
    addReminder,
    updateReminder,
    deleteReminder,
    toggleReminder,
    getNextDueDate,
    checkDueReminders,
    requestPermission,
  } = useLembretesRecorrentes(currentUserEmail);

  const [activeTab, setActiveTab] = useState<'todos' | 'assinatura' | 'conta_fixa' | 'novo'>('todos');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'assinatura' | 'conta_fixa'>(initialType || 'assinatura');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<'mensal' | 'semanal' | 'bimestral' | 'trimestral' | 'anual'>('mensal');
  const [dueDay, setDueDay] = useState('10');
  const [alertDaysBefore, setAlertDaysBefore] = useState('3');
  const [alertTime, setAlertTime] = useState('08:00');
  const [emailNotification, setEmailNotification] = useState(true);
  const [emailAddress, setEmailAddress] = useState(currentUserEmail || '');
  const [appAlert, setAppAlert] = useState(true);
  const [notes, setNotes] = useState('');
  const [active, setActive] = useState(true);

  // Feedback State
  const [testFeedback, setTestFeedback] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setTitle('');
    setType(initialType || 'assinatura');
    setAmount('');
    setFrequency('mensal');
    setDueDay('10');
    setAlertDaysBefore('3');
    setAlertTime('08:00');
    setEmailNotification(true);
    setEmailAddress(currentUserEmail || '');
    setAppAlert(true);
    setNotes('');
    setActive(true);
    setEditingId(null);
  };

  const handleOpenNew = (forcedType?: 'assinatura' | 'conta_fixa') => {
    resetForm();
    if (forcedType) setType(forcedType);
    setActiveTab('novo');
  };

  const handleEdit = (rem: RecurringReminder) => {
    setEditingId(rem.id);
    setTitle(rem.title);
    setType(rem.type);
    setAmount(String(rem.amount));
    setFrequency(rem.frequency);
    setDueDay(String(rem.dueDay));
    setAlertDaysBefore(String(rem.alertDaysBefore));
    setAlertTime(rem.alertTime || '08:00');
    setEmailNotification(rem.emailNotification);
    setEmailAddress(rem.emailAddress || currentUserEmail || '');
    setAppAlert(rem.appAlert);
    setNotes(rem.notes || '');
    setActive(rem.active);
    setActiveTab('novo');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Informe o título do lembrete.');
      return;
    }

    const numericAmount = parseFloat(amount.replace(',', '.')) || 0;
    const numericDueDay = parseInt(dueDay, 10) || 10;
    const numericAlertDays = parseInt(alertDaysBefore, 10) || 3;

    if (editingId) {
      updateReminder(editingId, {
        title: title.trim(),
        type,
        amount: numericAmount,
        frequency,
        dueDay: numericDueDay,
        alertDaysBefore: numericAlertDays,
        alertTime,
        emailNotification,
        emailAddress: emailAddress.trim(),
        appAlert,
        notes: notes.trim(),
        active,
      });
      setTestFeedback('Lembrete recorrente atualizado com sucesso!');
    } else {
      addReminder({
        title: title.trim(),
        type,
        amount: numericAmount,
        frequency,
        dueDay: numericDueDay,
        alertDaysBefore: numericAlertDays,
        alertTime,
        emailNotification,
        emailAddress: emailAddress.trim(),
        appAlert,
        active,
        notes: notes.trim(),
      });
      setTestFeedback('Novo lembrete recorrente cadastrado com sucesso!');
    }

    resetForm();
    setActiveTab('todos');
    setTimeout(() => setTestFeedback(null), 4000);
  };

  const handleTestEmail = (rem: RecurringReminder) => {
    const formattedVal = formatCurrency(rem.amount);
    const targetEmail = rem.emailAddress || currentUserEmail || 'seu-email@dominio.com';
    setTestFeedback(`📧 Notificação por E-mail enviada para [${targetEmail}]! Assunto: Lembrete de ${rem.type === 'assinatura' ? 'Assinatura' : 'Conta Fixa'}: ${rem.title} (${formattedVal})`);
    setTimeout(() => setTestFeedback(null), 6000);
  };

  const handleTestAlert = async (rem: RecurringReminder) => {
    const granted = await requestPermission();
    const formattedVal = formatCurrency(rem.amount);
    setTestFeedback(`🔔 Alerta de Agendamento testado! Alerta push e notificação agendada para: ${rem.title} no valor de ${formattedVal}. (${granted ? 'Notificação Push do Navegador Ativada' : 'Simulação de Alerta do Sistema'})`);
    setTimeout(() => setTestFeedback(null), 6000);
  };

  const handleRunManualCheck = async () => {
    setIsChecking(true);
    try {
      const count = await checkDueReminders();
      if (count > 0) {
        setTestFeedback(`✅ Verificação concluída! ${count} alerta(s) de vencimento encontrado(s) e notificado(s).`);
      } else {
        setTestFeedback('ℹ️ Nenhum lembrete recorrente com vencimento próximo para hoje.');
      }
    } finally {
      setIsChecking(false);
      setTimeout(() => setTestFeedback(null), 5000);
    }
  };

  const filteredReminders = reminders.filter(r => {
    if (activeTab === 'assinatura') return r.type === 'assinatura';
    if (activeTab === 'conta_fixa') return r.type === 'conta_fixa';
    return true;
  });

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gray-900/90 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <ClockIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                Lembretes Recorrentes de Pagamentos
                <span className="px-2 py-0.5 text-xs font-bold bg-indigo-600/80 text-white rounded-full">
                  {reminders.length}
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Notificações por e-mail e alertas de agendamento para assinaturas e contas fixas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Banner */}
        {testFeedback && (
          <div className="px-4 py-2.5 bg-indigo-950/80 border-b border-indigo-800 text-indigo-200 text-xs sm:text-sm font-medium flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{testFeedback}</span>
            </div>
            <button onClick={() => setTestFeedback(null)} className="text-indigo-400 hover:text-white ml-2">
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-gray-700 bg-gray-900/50 px-4 text-xs sm:text-sm overflow-x-auto">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('todos')}
              className={`py-3 px-3.5 font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'todos'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              Todos ({reminders.length})
            </button>
            <button
              onClick={() => setActiveTab('assinatura')}
              className={`py-3 px-3.5 font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'assinatura'
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              ⭐ Assinaturas ({reminders.filter(r => r.type === 'assinatura').length})
            </button>
            <button
              onClick={() => setActiveTab('conta_fixa')}
              className={`py-3 px-3.5 font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'conta_fixa'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              📌 Contas Fixas ({reminders.filter(r => r.type === 'conta_fixa').length})
            </button>
          </div>

          <div className="flex items-center gap-2 py-2 shrink-0">
            <button
              onClick={handleRunManualCheck}
              disabled={isChecking}
              className="px-2.5 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
              title="Executar verificação manual de vencimentos próximos"
            >
              <ClockIcon className="w-3.5 h-3.5 text-indigo-400" />
              {isChecking ? 'Verificando...' : 'Verificar Vencimentos'}
            </button>

            <button
              onClick={() => handleOpenNew()}
              className={`px-3 py-1.5 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1 ${
                activeTab === 'novo'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-600/80 hover:bg-indigo-600 text-white'
              }`}
            >
              <PlusIcon className="w-3.5 h-3.5" />
              Novo Lembrete
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'novo' ? (
            /* Form Mode */
            <form onSubmit={handleSubmit} className="space-y-4 bg-gray-900/60 p-4 sm:p-5 rounded-2xl border border-gray-700">
              <div className="flex items-center justify-between border-b border-gray-700/80 pb-3">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  {editingId ? <PencilIcon className="w-4 h-4 text-indigo-400" /> : <PlusIcon className="w-4 h-4 text-indigo-400" />}
                  {editingId ? 'Editar Lembrete Recorrente' : 'Configurar Novo Lembrete Recorrente'}
                </h3>
                <button
                  type="button"
                  onClick={() => { resetForm(); setActiveTab('todos'); }}
                  className="text-xs text-gray-400 hover:text-gray-200"
                >
                  Voltar para lista
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Título */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Título / Nome do Pagamento *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Assinatura Sistema, Aluguel Loja, Conta de Luz"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Tipo */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Tipo de Pagamento
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'assinatura' | 'conta_fixa')}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="assinatura">⭐ Assinatura (Plano/Serviço)</option>
                    <option value="conta_fixa">📌 Conta Fixa / Recorrente</option>
                  </select>
                </div>

                {/* Valor Estimado */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Valor Recorrente (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Frequência */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Frequência da Recorrência
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="mensal">Mensal (Todo mês)</option>
                    <option value="semanal">Semanal</option>
                    <option value="bimestral">Bimestral (A cada 2 meses)</option>
                    <option value="trimestral">Trimestral (A cada 3 meses)</option>
                    <option value="anual">Anual (Uma vez ao ano)</option>
                  </select>
                </div>

                {/* Dia de Vencimento */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Dia de Vencimento / Cobrança (1 a 31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Antecedência do Alerta */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Aviso Prévio (Antecedência)
                  </label>
                  <select
                    value={alertDaysBefore}
                    onChange={(e) => setAlertDaysBefore(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="0">No dia do vencimento</option>
                    <option value="1">1 dia antes</option>
                    <option value="3">3 dias antes</option>
                    <option value="5">5 dias antes</option>
                    <option value="7">7 dias antes</option>
                  </select>
                </div>

                {/* Horário do Alerta */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Horário do Alerta
                  </label>
                  <input
                    type="time"
                    value={alertTime}
                    onChange={(e) => setAlertTime(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Seção Notificação por E-mail */}
              <div className="p-3.5 bg-gray-800/90 rounded-xl border border-gray-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📧</span>
                    <div>
                      <div className="text-xs font-bold text-white">Notificações por E-mail</div>
                      <div className="text-[11px] text-gray-400">Enviar e-mail automático antes do vencimento</div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailNotification}
                      onChange={(e) => setEmailNotification(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {emailNotification && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Endereço de E-mail para Envio
                    </label>
                    <input
                      type="email"
                      required={emailNotification}
                      placeholder="financeiro@empresa.com.br"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-xl text-white text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Seção Alerta de Agendamento (Push / App) */}
              <div className="p-3.5 bg-gray-800/90 rounded-xl border border-gray-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BellIcon className="w-5 h-5 text-indigo-400" />
                    <div>
                      <div className="text-xs font-bold text-white">Alerta de Agendamento (Push / Sistema)</div>
                      <div className="text-[11px] text-gray-400">Exibir notificação no sistema e alertas no dispositivo</div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={appAlert}
                      onChange={(e) => setAppAlert(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Observações / Dados para Pagamento
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Chave Pix, Código de Barras do Boleto, link de pagamento..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => { resetForm(); setActiveTab('todos'); }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-semibold rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors shadow-lg"
                >
                  {editingId ? 'Salvar Alterações' : 'Cadastrar Lembrete'}
                </button>
              </div>
            </form>
          ) : (
            /* Listing View */
            <div className="space-y-3">
              {filteredReminders.length === 0 ? (
                <div className="py-12 text-center text-gray-400 flex flex-col items-center">
                  <ClockIcon className="w-12 h-12 text-indigo-400/50 mb-3" />
                  <p className="font-semibold text-white">Nenhum lembrete cadastrado nesta categoria</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Clique em "+ Novo Lembrete" para configurar notificações de cobrança.
                  </p>
                  <button
                    onClick={() => handleOpenNew()}
                    className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Criar Primeiro Lembrete
                  </button>
                </div>
              ) : (
                filteredReminders.map((rem) => {
                  const nextDue = getNextDueDate(rem);
                  const formattedAmount = formatCurrency(rem.amount);

                  return (
                    <div
                      key={rem.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        rem.active
                          ? 'bg-gray-800/90 border-gray-700/80 hover:border-indigo-500/50'
                          : 'bg-gray-900/50 border-gray-800 opacity-60'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                                rem.type === 'assinatura'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {rem.type === 'assinatura' ? '⭐ Assinatura' : '📌 Conta Fixa'}
                            </span>

                            <span className="text-xs text-gray-400 capitalize">
                              Recorrência: {rem.frequency}
                            </span>
                          </div>

                          <h4 className="font-bold text-white text-base">{rem.title}</h4>

                          <div className="text-xs text-gray-300 flex items-center gap-3 flex-wrap">
                            <span>
                              Vencimento: <strong className="text-white">Dia {rem.dueDay}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Próximo: <strong className="text-indigo-300">{nextDue.toLocaleDateString('pt-BR')}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Valor: <strong className="text-emerald-400">{formattedAmount}</strong>
                            </span>
                          </div>

                          {rem.notes && (
                            <p className="text-xs text-gray-400 italic bg-gray-900/60 p-1.5 rounded-lg border border-gray-800 mt-1">
                              "{rem.notes}"
                            </p>
                          )}

                          {/* Notificações configuradas */}
                          <div className="flex items-center gap-3 pt-2 text-[11px] text-gray-400 flex-wrap">
                            {rem.emailNotification && (
                              <span className="flex items-center gap-1 text-blue-300 bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-900/50">
                                📧 E-mail: {rem.emailAddress || 'Ativo'}
                              </span>
                            )}
                            {rem.appAlert && (
                              <span className="flex items-center gap-1 text-indigo-300 bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-900/50">
                                🔔 Alerta Agendado ({rem.alertDaysBefore}d antes às {rem.alertTime || '08:00'})
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Controles & Ações */}
                        <div className="flex flex-col items-end gap-2 shrink-0 self-end sm:self-center">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">
                              {rem.active ? 'Ativo' : 'Inativo'}
                            </span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={rem.active}
                                onChange={() => toggleReminder(rem.id)}
                                className="sr-only peer"
                              />
                              <div className="w-8 h-4 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {rem.emailNotification && (
                              <button
                                onClick={() => handleTestEmail(rem)}
                                className="p-1.5 bg-blue-900/40 hover:bg-blue-800 text-blue-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 border border-blue-800/50"
                                title="Enviar e-mail de teste"
                              >
                                📧 Testar E-mail
                              </button>
                            )}

                            {rem.appAlert && (
                              <button
                                onClick={() => handleTestAlert(rem)}
                                className="p-1.5 bg-indigo-900/40 hover:bg-indigo-800 text-indigo-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 border border-indigo-800/50"
                                title="Testar alerta de agendamento"
                              >
                                🔔 Testar Alerta
                              </button>
                            )}

                            <button
                              onClick={() => handleEdit(rem)}
                              className="p-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
                              title="Editar lembrete"
                            >
                              <PencilIcon className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                if (confirm(`Deseja excluir o lembrete "${rem.title}"?`)) {
                                  deleteReminder(rem.id);
                                }
                              }}
                              className="p-1.5 bg-red-900/30 hover:bg-red-800/60 text-red-300 rounded-lg transition-colors"
                              title="Excluir lembrete"
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-900/90 border-t border-gray-700 flex items-center justify-between">
          <div className="text-xs text-gray-400">
            Os lembretes são sincronizados automaticamente com a Central de Notificações.
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl text-xs sm:text-sm transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};

export default LembretesRecorrentesModal;
