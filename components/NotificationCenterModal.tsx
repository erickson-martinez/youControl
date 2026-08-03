import React, { useState } from 'react';
import type { Transaction } from '../types';
import { BellIcon, XIcon, CheckCircleIcon, XCircleIcon, ClockIcon, ShareIcon } from './icons';
import { useNotifications } from '../hooks/useNotifications';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  overdueTransactions: Transaction[];
  pendingApprovalTransactions: Transaction[];
  sharedTransactions: Transaction[];
  onMarkAsPaid: (id: string) => Promise<void>;
  onApprovePending: (id: string) => Promise<void>;
  onRejectPending: (id: string) => Promise<void>;
  onNavigateToTab: (tab: 'transactions' | 'shared') => void;
  userMap?: Record<string, string>;
}

const formatCurrency = (value: number | undefined | null) => {
  if (value === undefined || value === null || isNaN(value)) return 'R$ 0,00';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  overdueTransactions,
  pendingApprovalTransactions,
  sharedTransactions,
  onMarkAsPaid,
  onApprovePending,
  onRejectPending,
  onNavigateToTab,
  userMap = {},
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'overdue' | 'approvals' | 'shared'>('all');
  const { permission, requestPermission } = useNotifications();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAction = async (actionFn: () => Promise<void>, id: string) => {
    setIsProcessing(id);
    try {
      await actionFn();
    } finally {
      setIsProcessing(null);
    }
  };

  const totalNotifications = overdueTransactions.length + pendingApprovalTransactions.length + sharedTransactions.length;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gray-900/80 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl">
              <BellIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Central de Notificações
                {totalNotifications > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-blue-500 text-white rounded-full">
                    {totalNotifications}
                  </span>
                )}
              </h2>
              <p className="text-xs text-gray-400">Alertas de finanças, cobranças e compartilhamentos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Status das Notificações Push do Navegador */}
        <div className="px-4 sm:px-6 py-2.5 bg-gray-900/40 border-b border-gray-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-gray-300">
            <span className={`w-2 h-2 rounded-full ${permission === 'granted' ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
            <span>
              Notificações do navegador:{' '}
              <strong className={permission === 'granted' ? 'text-green-400' : 'text-yellow-400'}>
                {permission === 'granted' ? 'Ativadas' : permission === 'denied' ? 'Bloqueadas' : 'Não ativadas'}
              </strong>
            </span>
          </div>
          {permission !== 'granted' && (
            <button
              onClick={() => requestPermission()}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-md transition-colors"
            >
              Ativar Notificações Push
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 bg-gray-800/80 px-4 text-xs sm:text-sm overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-3 px-4 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'all'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Todas ({totalNotifications})
          </button>
          <button
            onClick={() => setActiveTab('overdue')}
            className={`py-3 px-4 font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'overdue'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Vencidas / Lembretes ({overdueTransactions.length})
          </button>
          <button
            onClick={() => setActiveTab('approvals')}
            className={`py-3 px-4 font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'approvals'
                ? 'border-yellow-500 text-yellow-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Aprovações ({pendingApprovalTransactions.length})
          </button>
          <button
            onClick={() => setActiveTab('shared')}
            className={`py-3 px-4 font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'shared'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Compartilhadas ({sharedTransactions.length})
          </button>
        </div>

        {/* Listing */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {totalNotifications === 0 ? (
            <div className="py-12 text-center text-gray-400 flex flex-col items-center">
              <CheckCircleIcon className="w-12 h-12 text-green-500/50 mb-3" />
              <p className="font-semibold text-white">Tudo em dia!</p>
              <p className="text-sm text-gray-500 mt-1">Você não possui pendências ou notificações não lidas no momento.</p>
            </div>
          ) : (
            <>
              {/* Overdue Items */}
              {(activeTab === 'all' || activeTab === 'overdue') && overdueTransactions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                    <ClockIcon className="w-4 h-4" />
                    Contas Vencidas / Lembretes ({overdueTransactions.length})
                  </h3>
                  {overdueTransactions.map(tx => (
                    <div
                      key={tx.id}
                      className="p-3.5 bg-red-950/30 border border-red-800/50 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-semibold text-white text-sm">{tx.name}</div>
                        <div className="text-xs text-red-300/80">
                          Venceu em: {tx.date.split('T')[0]} • Valor: <strong className="text-white">{formatCurrency(tx.amount)}</strong>
                        </div>
                      </div>
                      <button
                        disabled={isProcessing === tx.id}
                        onClick={() => handleAction(() => onMarkAsPaid(tx.id), tx.id)}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 self-end sm:self-center shrink-0 disabled:opacity-50"
                      >
                        <CheckCircleIcon className="w-4 h-4" />
                        {isProcessing === tx.id ? 'Aguarde...' : 'Marcar como Pago'}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Pending Approvals */}
              {(activeTab === 'all' || activeTab === 'approvals') && pendingApprovalTransactions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-2">
                    <ClockIcon className="w-4 h-4" />
                    Solicitações de Pagamento / Aprovações ({pendingApprovalTransactions.length})
                  </h3>
                  {pendingApprovalTransactions.map(tx => {
                    const requesterName = tx.paymentRequest?.requestedBy
                      ? userMap[tx.paymentRequest.requestedBy] || tx.paymentRequest.requestedBy
                      : 'Um usuário';
                    return (
                      <div
                        key={tx.id}
                        className="p-3.5 bg-yellow-950/30 border border-yellow-800/50 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="font-semibold text-white text-sm">{tx.name}</div>
                          <div className="text-xs text-yellow-300/80">
                            Solicitante: <strong>{requesterName}</strong> • Valor: <strong className="text-white">{formatCurrency(tx.amount)}</strong>
                          </div>
                          {tx.paymentRequest?.message && (
                            <div className="text-xs text-gray-300 italic mt-1 bg-gray-900/60 p-1.5 rounded">
                              "{tx.paymentRequest.message}"
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <button
                            disabled={isProcessing === tx.id}
                            onClick={() => handleAction(() => onRejectPending(tx.id), tx.id)}
                            className="px-3 py-1.5 bg-red-800/60 hover:bg-red-700 text-red-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                          >
                            <XCircleIcon className="w-4 h-4" />
                            Rejeitar
                          </button>
                          <button
                            disabled={isProcessing === tx.id}
                            onClick={() => handleAction(() => onApprovePending(tx.id), tx.id)}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                            Aprovar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Shared Transactions */}
              {(activeTab === 'all' || activeTab === 'shared') && sharedTransactions.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                      <ShareIcon className="w-4 h-4" />
                      Transações Compartilhadas com Você ({sharedTransactions.length})
                    </h3>
                    <button
                      onClick={() => {
                        onNavigateToTab('shared');
                        onClose();
                      }}
                      className="text-xs text-purple-300 hover:underline"
                    >
                      Ver na aba compartilhados →
                    </button>
                  </div>
                  {sharedTransactions.slice(0, 5).map(tx => (
                    <div
                      key={tx.id}
                      className="p-3 bg-gray-700/50 border border-gray-600/50 rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-white text-sm">{tx.name}</div>
                        <div className="text-xs text-gray-400">
                          Data: {tx.date.split('T')[0]} • De: {userMap[tx.email || ''] || tx.email || 'Outro usuário'}
                        </div>
                      </div>
                      <div className="font-bold text-purple-300 text-sm">
                        {formatCurrency(tx.amount)}
                      </div>
                    </div>
                  ))}
                  {sharedTransactions.length > 5 && (
                    <p className="text-xs text-center text-gray-400">
                      + {sharedTransactions.length - 5} outras transações compartilhadas
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-900/80 border-t border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg text-sm transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationCenterModal;
