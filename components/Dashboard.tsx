
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { User, Transaction, SharedUser, Addition } from '../types';
import { TransactionType, PaymentStatus } from '../types';
import MonthNavigator from './MonthNavigator';
import SummaryCards from './SummaryCards';
import ActionButtons from './ActionButtons';
import TransactionList from './TransactionList';
import TransactionFormModal from './TransactionFormModal';
import ShareModal from './ShareModal';
import ConfirmationModal from './ConfirmationModal';
import AddValueModal from './AddValueModal';
import OverdueNoticeModal from './OverdueNoticeModal';
import { XCircleIcon } from './icons';
import { API_BASE_URL } from '../constants';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<TransactionType>(TransactionType.REVENUE);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'transactions' | 'shared'>('transactions');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [isAddValueModalOpen, setIsAddValueModalOpen] = useState(false);
  const [transactionToAddValueTo, setTransactionToAddValueTo] = useState<Transaction | null>(null);
  const [isOverdueModalOpen, setIsOverdueModalOpen] = useState(false);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState({ revenue: 0, expenses: 0, balance: 0, total: 0 });
  const [sharedUsersInfo, setSharedUsersInfo] = useState<SharedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    if (!user) throw new Error("Usuário não está logado.");
    return fetch(url, {
      ...options,
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  }, [user]);
  
  const { isPastMonth, isFutureMonth } = useMemo(() => {
    const today = new Date();
    today.setDate(1);
    today.setHours(0, 0, 0, 0);

    const viewingDate = new Date(currentDate);
    viewingDate.setDate(1);
    viewingDate.setHours(0, 0, 0, 0);

    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const viewingYear = viewingDate.getFullYear();
    const viewingMonth = viewingDate.getMonth();

    const isPast = viewingYear < todayYear || (viewingYear === todayYear && viewingMonth < todayMonth);
    
    return {
      isPastMonth: isPast,
      // Treat current month as a "future" month for consistent forecasting
      isFutureMonth: !isPast,
    };
  }, [currentDate]);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        const response = await apiFetch(`${API_BASE_URL}/transactions?phone=${user.phone}&includeShared=true&month=${month}&year=${year}`);

        if (!response.ok) {
            const errData = await response.json().catch(() => ({ message: 'Falha ao buscar transações.' }));
            throw new Error(errData.message || 'Erro de rede');
        }
        
        const data = await response.json();
        
        const mappedTransactions = (data.transactions || []).map((tx: any) => ({
            id: tx._id, ownerPhone: tx.ownerPhone, type: tx.type, name: tx.name, amount: tx.amount,
            date: new Date(tx.date).toISOString().split('T')[0],
            isControlled: tx.isControlled, counterpartyPhone: tx.counterpartyPhone, status: tx.status,
            controlId: tx.controlId, sharerPhone: tx.sharerPhone, aggregate: tx.aggregate,
            additions: (tx.additions || []).map((add: any) => ({
                _id: add._id,
                name: add.description,
                value: add.amount,
                removed: add.removed,
            })).filter((a: any) => a._id),
            paidAmount: tx.paidAmount || 0,
        }));
        setTransactions(mappedTransactions);
        
        const revenue = data.summary?.totalRevenue || 0;
        const expenses = data.summary?.totalExpense || 0;
        
        if (isPastMonth) {
            setSummary({
                revenue,
                expenses,
                balance: data.summary?.monthlyBalance || 0,
                total: data.summary?.accumulatedBalance || 0,
            });
        } else {
            const today = new Date();
            const currentMonthData = (currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear())
                ? data 
                : await (await apiFetch(`${API_BASE_URL}/transactions?phone=${user.phone}&includeShared=true&month=${today.getMonth() + 1}&year=${today.getFullYear()}`)).json();
            
            const realBalanceUpToLastMonth = (currentMonthData.summary?.accumulatedBalance || 0) - (currentMonthData.summary?.monthlyBalance || 0);
            
            let forecastTotal = realBalanceUpToLastMonth;
            const startMonthLoop = new Date(today.getFullYear(), today.getMonth(), 1);
            const endMonthLoop = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            
            for (let d = new Date(startMonthLoop); d <= endMonthLoop; d.setMonth(d.getMonth() + 1)) {
                const loopMonth = d.getMonth() + 1;
                const loopYear = d.getFullYear();
                
                let loopData;
                if (loopYear === year && loopMonth === month) loopData = data;
                else if (loopYear === today.getFullYear() && loopMonth === today.getMonth() + 1) loopData = currentMonthData;
                else {
                    const loopResponse = await apiFetch(`${API_BASE_URL}/transactions?phone=${user.phone}&includeShared=true&month=${loopMonth}&year=${loopYear}`);
                    if (loopResponse.ok) loopData = await loopResponse.json();
                }
                if (loopData) forecastTotal += (loopData.summary?.totalRevenue || 0) - (loopData.summary?.totalExpense || 0);
            }
            
            setSummary({ revenue, expenses, balance: revenue - expenses, total: forecastTotal });
        }
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
    } finally {
        setIsLoading(false);
    }
  }, [currentDate, user.phone, apiFetch, isPastMonth]);


  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const onAddTransaction = async (newTransactionData: Omit<Transaction, 'id' | 'ownerPhone' | 'controlId'> & { repeatCount?: number }) => {
    const { repeatCount, ...baseTransactionData } = newTransactionData;
    const isControlled = baseTransactionData.isControlled;
    const endpoint = isControlled
      ? `${API_BASE_URL}/transactions/controlled`
      : `${API_BASE_URL}/transactions/simple`;

    const createTransactionPayload = (data: typeof baseTransactionData) => {
      if (isControlled) {
        return { ownerPhone: user.phone, counterpartyPhone: data.counterpartyPhone, name: data.name, amount: data.amount, date: data.date };
      } else {
        return { ownerPhone: user.phone, type: data.type, name: data.name, amount: data.amount, date: data.date, status: data.status };
      }
    };

    const addMonths = (dateStr: string, months: number): string => {
      const date = new Date(`${dateStr}T12:00:00Z`);
      date.setUTCMonth(date.getUTCMonth() + months);
      return date.toISOString().split('T')[0];
    };

    try {
      const transactionPromises = [];
      const totalTransactions = (repeatCount || 0) + 1;
      for (let i = 0; i < totalTransactions; i++) {
        const transactionForMonth = { ...baseTransactionData, date: addMonths(baseTransactionData.date, i) };
        const payload = createTransactionPayload(transactionForMonth);
        transactionPromises.push(apiFetch(endpoint, { method: 'POST', body: JSON.stringify(payload) }));
      }
      const responses = await Promise.all(transactionPromises);
      for (const response of responses) {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `Falha ao adicionar uma das transações recorrentes` }));
          throw new Error(errorData.message || 'Falha ao adicionar transação recorrente');
        }
      }
      await fetchTransactions();
    } catch (error) {
      alert((error as Error).message);
    }
  };

  const onEditTransaction = async (updatedTransaction: Transaction) => {
     try {
      const response = await apiFetch(`${API_BASE_URL}/transactions/${updatedTransaction.id}`, { method: 'PUT', body: JSON.stringify(updatedTransaction) });
      if (!response.ok) throw new Error('Falha ao editar transação');
      await fetchTransactions();
    } catch (error) {
      alert((error as Error).message);
    }
  };

  const handleStartDelete = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!transactionToDelete) return;
    try {
        const response = await apiFetch(`${API_BASE_URL}/transactions`, { 
          method: 'DELETE',
          body: JSON.stringify({ transactionId: transactionToDelete.id, ownerPhone: transactionToDelete.ownerPhone })
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Erro ao decodificar a resposta de erro da API.'}));
          throw new Error(errorData.message || 'Falha ao excluir transação');
        }
        await fetchTransactions();
    } catch (error) {
        alert((error as Error).message);
    } finally {
        setIsConfirmModalOpen(false);
        setTransactionToDelete(null);
    }
  };
  
  const onUpdateTransactionStatus = async (transaction: Transaction, newStatus: PaymentStatus) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/transactions/status`, {
        method: 'PATCH',
        body: JSON.stringify({ transactionId: transaction.id, ownerPhone: transaction.ownerPhone, status: newStatus }),
      });
      if (!response.ok) throw new Error('Falha ao atualizar status');
      await fetchTransactions();
    } catch (error) {
      alert((error as Error).message);
    }
  };

  const onToggleSimpleTransactionPaid = async (id: string) => {
    const transaction = transactions.find((t) => t.id === id);
    if (!transaction) return;
    const newStatus = transaction.status === PaymentStatus.PAID ? PaymentStatus.UNPAID : PaymentStatus.PAID;
    try {
      const response = await apiFetch(`${API_BASE_URL}/transactions/status`, {
        method: 'PATCH',
        body: JSON.stringify({ transactionId: transaction.id, ownerPhone: transaction.ownerPhone, status: newStatus }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Falha ao atualizar o status da transação.' }));
        throw new Error(errorData.message || 'Falha ao atualizar status');
      }
      await fetchTransactions();
    } catch (error) {
      alert((error as Error).message);
    }
  };
  
  const onDeleteSubTransaction = async (transactionId: string, description: string, ownerPhone: string) => {
    try {
        const response = await apiFetch(`${API_BASE_URL}/transactions/${transactionId}/subtract-value`, {
            method: 'PATCH',
            body: JSON.stringify({ description, ownerPhone }),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Falha ao remover item da transação.' }));
            throw new Error(errorData.message || 'Falha ao remover item.');
        }
        await fetchTransactions();
    } catch (error) {
        alert((error as Error).message);
    }
  };

  const onShare = async (shareePhone: string, aggregate: boolean) => { console.log("Sharing logic to be implemented via API"); };
  const onUnshare = (phoneToUnshare: string) => { console.log("Unsharing logic to be implemented via API"); };

  const openModal = (type: TransactionType) => { setEditingTransaction(null); setModalType(type); setIsModalOpen(true); };
  const handleStartEdit = (transaction: Transaction) => { setEditingTransaction(transaction); setIsModalOpen(true); };
  const handleModalClose = () => { setIsModalOpen(false); setEditingTransaction(null); };

  const handleModalSubmit = async (data: (Omit<Transaction, 'id' | 'ownerPhone' | 'controlId'> | Transaction) & { repeatCount?: number }) => {
      if ('id' in data) {
        await onEditTransaction(data as Transaction);
      } else {
        await onAddTransaction(data as Omit<Transaction, 'id' | 'ownerPhone' | 'controlId'> & { repeatCount?: number });
      }
      handleModalClose();
  };

  const handleOpenAddValueModal = (transaction: Transaction) => {
    setTransactionToAddValueTo(transaction);
    setIsAddValueModalOpen(true);
  };

  const handleSaveAddedValue = async (data: { name: string; value: number }) => {
    if (!transactionToAddValueTo) return;
    try {
      const response = await apiFetch(`${API_BASE_URL}/transactions/${transactionToAddValueTo.id}/add-value`, {
        method: 'PATCH',
        body: JSON.stringify({
          description: data.name,
          additionalAmount: data.value,
          ownerPhone: transactionToAddValueTo.ownerPhone,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Falha ao adicionar valor.' }));
        throw new Error(errorData.message || 'Falha ao adicionar valor.');
      }
      await fetchTransactions();
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setIsAddValueModalOpen(false);
      setTransactionToAddValueTo(null);
    }
  };

  const { personalTransactions, sharedTransactions } = useMemo(() => {
    const personal = transactions.filter(t => t.ownerPhone === user.phone);
    const shared = transactions.filter(t => t.sharerPhone === user.phone);
    return { personalTransactions: personal, sharedTransactions: shared };
  }, [transactions, user.phone]);

  const overdueTransactions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to the start of the day
    return personalTransactions.filter(t => {
      if (t.status !== PaymentStatus.UNPAID) return false;
      // Parse YYYY-MM-DD as local date to avoid timezone issues with `new Date()`
      const parts = t.date.split('-').map(p => parseInt(p, 10));
      const dueDate = new Date(parts[0], parts[1] - 1, parts[2]);
      return dueDate < today;
    });
  }, [personalTransactions]);

  useEffect(() => {
    if (isLoading) return; // Only run after initial load is complete

    const hasShownModal = sessionStorage.getItem('overdueModalShown');
    if (overdueTransactions.length > 0 && !hasShownModal) {
        setIsOverdueModalOpen(true);
        sessionStorage.setItem('overdueModalShown', 'true');
    }
  }, [isLoading, overdueTransactions]);


  const transactionsForCurrentTab = activeTab === 'transactions' ? personalTransactions : sharedTransactions;

  return (
    <>
      <MonthNavigator currentDate={currentDate} setCurrentDate={setCurrentDate} />
      <SummaryCards revenue={summary.revenue} expenses={summary.expenses} balance={summary.balance} total={summary.total} isFutureMonth={isFutureMonth} />
      <ActionButtons onAddRevenue={() => openModal(TransactionType.REVENUE)} onAddExpense={() => openModal(TransactionType.EXPENSE)} onShare={() => setIsShareModalOpen(true)} isPastMonth={isPastMonth} />
      
      {sharedUsersInfo.length > 0 && (
          <div className="p-4 mb-6 bg-gray-800 rounded-lg">
              <h3 className="mb-2 text-sm font-semibold text-white">Compartilhando com:</h3>
              <ul className="space-y-2">
                  {sharedUsersInfo.map(sharedUser => (
                      <li key={sharedUser.phone} className="flex items-center justify-between p-2 text-sm bg-gray-700 rounded-md">
                          <div>
                            <span>{sharedUser.phone}</span>
                            {sharedUser.aggregate && <span className="ml-2 text-xs text-blue-300">(Somando valores)</span>}
                          </div>
                          <button onClick={() => onUnshare(sharedUser.phone)} className="text-red-400 transition-colors hover:text-red-300" aria-label={`Parar de compartilhar com ${sharedUser.phone}`}>
                            <XCircleIcon className="w-5 h-5" />
                          </button>
                      </li>
                  ))}
              </ul>
          </div>
      )}
      
      <div className="p-4 bg-gray-800 rounded-lg">
        <div className="border-b border-gray-700">
          <nav className="flex -mb-px space-x-6">
            <button onClick={() => setActiveTab('transactions')} className={`px-3 py-2 font-medium text-sm rounded-t-md ${activeTab === 'transactions' ? 'border-b-2 border-blue-accent text-white' : 'text-gray-400 hover:text-white'}`}>Minhas Transações ({personalTransactions.length})</button>
            <button onClick={() => setActiveTab('shared')} className={`px-3 py-2 font-medium text-sm rounded-t-md ${activeTab === 'shared' ? 'border-b-2 border-blue-accent text-white' : 'text-gray-400 hover:text-white'}`}>Compartilhados Comigo ({sharedTransactions.length})</button>
          </nav>
        </div>
        <div className="pt-4">
          {isLoading ? <p>Carregando...</p> : error ? <p className="text-red-accent">{error}</p> : (
            <TransactionList 
              transactions={transactionsForCurrentTab} 
              currentUserPhone={user.phone}
              onUpdateStatus={onUpdateTransactionStatus}
              onToggleSimplePaid={onToggleSimpleTransactionPaid}
              onStartEdit={handleStartEdit}
              onDelete={handleStartDelete}
              onDeleteSubTransaction={onDeleteSubTransaction}
              onOpenAddValueModal={handleOpenAddValueModal}
              isPastMonth={isPastMonth}
            />
          )}
        </div>
      </div>

      {isModalOpen && ( <TransactionFormModal isOpen={isModalOpen} onClose={handleModalClose} onSubmit={handleModalSubmit} type={editingTransaction?.type ?? modalType} transactionToEdit={editingTransaction} currentDateForForm={currentDate} /> )}
      <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} onShare={(sharedUserInfo) => onShare(sharedUserInfo.phone, sharedUserInfo.aggregate)} />
      <ConfirmationModal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" message={`Tem certeza de que deseja excluir a transação "${transactionToDelete?.name}"? Esta ação não pode ser desfeita.`} />
      {isAddValueModalOpen && transactionToAddValueTo && (
        <AddValueModal
          isOpen={isAddValueModalOpen}
          onClose={() => setIsAddValueModalOpen(false)}
          onSubmit={handleSaveAddedValue}
          transactionType={transactionToAddValueTo.type}
        />
      )}
      <OverdueNoticeModal
        isOpen={isOverdueModalOpen}
        onClose={() => setIsOverdueModalOpen(false)}
        overdueTransactions={overdueTransactions}
        onMarkAsPaid={onToggleSimpleTransactionPaid}
      />
    </>
  );
};

export default Dashboard;
