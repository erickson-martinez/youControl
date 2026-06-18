
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { User, Transaction, SharedUser, Addition, ActivePage } from '../types';
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
import PendingApprovalModal from './PendingApprovalModal';
import { XCircleIcon, ChartBarIcon, UsersIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';
import { API_BASE_URL } from '../constants';
import { exportYearlyPDF } from './exportPDF';

interface DashboardProps {
  user: User;
  onNavigate: (page: ActivePage) => void;
}

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<TransactionType>(TransactionType.REVENUE);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'transactions' | 'shared' | 'receitas' | 'despesas'>('transactions');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [isAddValueModalOpen, setIsAddValueModalOpen] = useState(false);
  const [transactionToAddValueTo, setTransactionToAddValueTo] = useState<Transaction | null>(null);
  const [isOverdueModalOpen, setIsOverdueModalOpen] = useState(false);
  const [isPendingApprovalModalOpen, setIsPendingApprovalModalOpen] = useState(false);
  const [isSharedUsersPopoverOpen, setIsSharedUsersPopoverOpen] = useState(false);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState({ revenue: 0, expenses: 0, balance: 0, total: 0, paid: 0, investments: 0 });
  const [sharedUsersInfo, setSharedUsersInfo] = useState<SharedUser[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setPortalNode(document.getElementById('top-header-portal'));
  }, []);

  const handleExportPDF = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
        await exportYearlyPDF(user.idEmail || user.id || '', user.email, user.phone, currentDate.getFullYear());
    } catch (err) {
        alert('Falha ao exportar PDF. Tente novamente.');
    } finally {
        setIsExporting(false);
    }
  };

  // Cache para armazenar respostas da API (Key: "mes-ano", Value: Response Data)
  const transactionsCache = useRef<Record<string, any>>({});

  const clearCache = () => {
      transactionsCache.current = {};
  };

  // Remove do cache apenas o mês especificado pela data "YYYY-MM-DD"
  const invalidateCache = (dateString: string) => {
      if (!dateString) return;
      try {
          const [year, month] = dateString.split('-');
          // A chave do cache é "mês-ano" (ex: 10-2026), onde mês não tem zero à esquerda se for < 10 no parse atual, 
          // mas vamos garantir consistência com o fetchTransactions que usa (month + 1).
          // O split retorna strings. parseInt remove zeros à esquerda.
          const key = `${parseInt(month)}-${year}`;
          if (transactionsCache.current[key]) {
              delete transactionsCache.current[key];
          }
      } catch (e) {
          console.error("Erro ao invalidar cache para data:", dateString);
      }
  };

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

  const userMap = useMemo(() => {
    return allUsers.reduce((acc, user) => {
      acc[user.email] = user.name;
      return acc;
    }, {} as Record<string, string>);
  }, [allUsers]);

  const calculateInvestmentValue = useCallback((tx: any, targetDate: Date = new Date()): number => {
      if (!tx.investment) return Number(tx.amount || 0);

      const amount = Number(tx.amount || 0);
      const safeDateStr = tx.date.includes('T') ? tx.date.split('T')[0] : tx.date;
      const startDate = new Date(safeDateStr + "T00:00:00");
      let end = new Date(targetDate);
      
      if (tx.status === PaymentStatus.PAID && tx.updatedAt) {
          const updatedDate = new Date(tx.updatedAt);
          if (updatedDate < end) {
              end = updatedDate;
          }
      }
      
      startDate.setHours(0,0,0,0);
      end.setHours(23,59,59,999);

      if (startDate > end) return amount;

      let businessDays = 0;
      let curDate = new Date(startDate);
      curDate.setDate(curDate.getDate() + 1);
      while (curDate <= end) {
          const dayOfWeek = curDate.getDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) businessDays++;
          curDate.setDate(curDate.getDate() + 1);
      }

      if (businessDays === 0) return amount;

      let renderDay = tx.investment.renderDay ? Number(tx.investment.renderDay) : 0;
      if (!renderDay || renderDay <= 0) {
          if (tx.investment.percentage) {
              const pct = Number(tx.investment.percentage);
              renderDay = amount * 0.00034 * (pct / 100);
          }
          if (!renderDay || renderDay <= 0) renderDay = 0.01;
      }
      
      const dailyRate = renderDay / amount;
      return amount * Math.pow(1 + dailyRate, businessDays);
  }, []);

  const calculateMonthlyTotals = useCallback((transactionsList: any[], targetDate?: Date) => {
      let r = 0;
      let e = 0;
      let p = 0;
      let i = 0;
      let redeemedInvestments = 0;
      const currentUserId = user.idEmail || user.id;
      
      transactionsList.forEach((tx: any) => {
          const amt = Number(tx.amount || 0);
          const isMine = tx.idEmail === currentUserId;
          const isTarget = tx.isControlled && tx.idEmail !== currentUserId && ((tx.targetEmail && user.email && tx.targetEmail === user.email) || (tx.targetPhone && user.phone && tx.targetPhone === user.phone));
          const isSharedWithMe = tx.idEmail !== currentUserId && !isTarget && ((tx.sharedEmail && user.email && tx.sharedEmail === user.email) || (tx.sharedPhone && user.phone && tx.sharedPhone === user.phone));
          
          let displayType = tx.type;
          if (isTarget && (tx.type === TransactionType.REVENUE || tx.type === TransactionType.EXPENSE)) {
            displayType = tx.type === TransactionType.REVENUE ? TransactionType.EXPENSE : TransactionType.REVENUE;
          }

          if (isMine || isTarget || (isSharedWithMe && tx.aggregate === true)) {
              if (displayType === TransactionType.REVENUE) {
                  r += amt;
              }
              else if (displayType === TransactionType.EXPENSE) {
                  e += amt;
                  if (tx.status === PaymentStatus.PAID) {
                      p += amt;
                  }
              } else if (displayType === TransactionType.INVESTMENT || displayType === 'INVESTMENT' || displayType === 'investimento') {
                  const invValue = calculateInvestmentValue(tx, targetDate);
                  if (tx.status === PaymentStatus.PAID) {
                      redeemedInvestments += invValue;
                  } else {
                      i += invValue; // remains as pending investment KPI
                  }
              }
          }
      });
      return { revenue: r, expenses: e, paid: p, investments: i, redeemedInvestments };
  }, [user.email, user.id, user.idEmail, user.phone, calculateInvestmentValue]);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        const cacheKey = `${month}-${year}`;
        
        let data;

        // Tenta pegar do cache primeiro
        if (transactionsCache.current[cacheKey]) {
            data = transactionsCache.current[cacheKey];
        } else {           
            const queryParams = new URLSearchParams({
                idEmail: user.idEmail || user.id,
                month: month.toString(),
                year: year.toString(),
            });
            if (user.email) {
                queryParams.append('sharedEmail', user.email);
                queryParams.append('targetEmail', user.email);
            }
            if (user.phone) {
                queryParams.append('sharedPhone', user.phone);
                queryParams.append('targetPhone', user.phone);
            }
            const response = await apiFetch(`${API_BASE_URL}/transactions?${queryParams.toString()}`);
          
            if (!response.ok) {
                const errData = await response.json().catch(() => ({ message: 'Falha ao buscar transações.' }));
                throw new Error(errData.message || 'Erro de rede');
            }
            data = await response.json();

            // Salva no cache
            transactionsCache.current[cacheKey] = data;
        }

        // --- MANUALLY CARRY OVER PAST INVESTMENTS ---
        let pastInvestmentsMap = new Map();
        for (let m = 1; m < month; m++) {
            const mKey = `${m}-${year}`;
            let mData;
            if (transactionsCache.current[mKey]) {
                mData = transactionsCache.current[mKey];
            } else {
                const queryParams = new URLSearchParams({
                    idEmail: user.idEmail || user.id,
                    month: m.toString(),
                    year: year.toString(),
                });
                if (user.email) {
                    queryParams.append('sharedEmail', user.email);
                    queryParams.append('targetEmail', user.email);
                }
                if (user.phone) {
                    queryParams.append('sharedPhone', user.phone);
                    queryParams.append('targetPhone', user.phone);
                }
                try {
                    const mRes = await apiFetch(`${API_BASE_URL}/transactions?${queryParams.toString()}`);
                    if (mRes.ok) {
                        mData = await mRes.json();
                        transactionsCache.current[mKey] = mData;
                    }
                } catch (e) {
                    console.error("Failed to fetch past month for investments", e);
                }
            }
            if (mData && mData.transactions) {
                const invs = mData.transactions.filter((t: any) => {
                    if (t.type !== TransactionType.INVESTMENT && t.type !== 'INVESTMENT' && t.type !== 'investimento') return false;
                    
                    const isPaid = t.status === PaymentStatus.PAID || t.status === 'pago';
                    if (!isPaid) return true;
                    
                    const pDate = t.updatedAt ? new Date(t.updatedAt) : new Date(t.date);
                    const pMonth = pDate.getMonth() + 1;
                    const pYear = pDate.getFullYear();
                    
                    // Do not carry over if it was already paid in a previous month
                    if (pYear < year || (pYear === year && pMonth < month)) {
                        return false;
                    }
                    return true;
                });
                invs.forEach((t: any) => pastInvestmentsMap.set(t._id || t.id, t));
            }
        }
        
        let pastInvestments = Array.from(pastInvestmentsMap.values());
        
        if (data && data.transactions) {
            const currentIds = new Set(data.transactions.map((t: any) => t._id || t.id));
            const uniquePastInvestments = pastInvestments.filter(t => !currentIds.has(t._id || t.id));
            data = {
                ...data,
                transactions: [...data.transactions, ...uniquePastInvestments]
            };
        }
        // ---------------------------------------------
        
        const currentUserId = user.idEmail || user.id;
        const mappedTransactions: Transaction[] = (data.transactions || []).map(
          (tx: any) => {
            const isTarget = tx.idEmail !== currentUserId && ((tx.targetEmail && user.email && tx.targetEmail === user.email) || (tx.targetPhone && user.phone && tx.targetPhone === user.phone));
            let displayType = tx.type;
            if (isTarget) {
               displayType = tx.type === TransactionType.REVENUE ? TransactionType.EXPENSE : TransactionType.REVENUE;
            }
            return {
            id: tx._id,
            idEmail: tx.idEmail,
            email: tx.email,
            type: displayType,
            name: tx.name,
            amount: tx.amount,
            date: new Date(tx.date).toISOString().split('T')[0],
            isControlled: tx.isControlled,
            status: tx.status,
            sharedEmail: tx.sharedEmail || '',
            sharedPhone: tx.sharedPhone || '',
            targetEmail: tx.targetEmail || '',
            targetPhone: tx.targetPhone || '',
            aggregate: tx.aggregate,
            paymentRequest: tx.paymentRequest,
            additions: (tx.additions || []).map((add: any) => ({
              _id: add._id,
              name: add.description,
              value: add.amount,
              removed: add.removed,
            })),
            paidAmount: tx.paidAmount ?? 0,
            investment: tx.investment,
            };
          }
        );

setTransactions(mappedTransactions);
       
        console.log(transactions)

        
        // Extract shared users info from transactions shared WITH me
        const sharedInfoMap = new Map<string, SharedUser>();
        mappedTransactions.forEach((tx: Transaction) => {
            const targetOrShared = tx.sharedEmail || tx.sharedPhone || tx.targetEmail || tx.targetPhone;
            const isSharedWithMe = (targetOrShared === user.email || (user.phone && targetOrShared === user.phone)) && tx.idEmail !== currentUserId;
            if (isSharedWithMe && targetOrShared) {
                sharedInfoMap.set(tx.idEmail, { email: targetOrShared, aggregate: !!tx.aggregate });
            }
        });
        setSharedUsersInfo(Array.from(sharedInfoMap.values()));
        
        // Calculate totals manually to respect 'aggregate' flag strictly
        const endOfViewedMonth = new Date(year, month, 0, 23, 59, 59);
        const { revenue, expenses, paid, investments, redeemedInvestments } = calculateMonthlyTotals(data.transactions || [], endOfViewedMonth);
        
        if (isPastMonth) {
            setSummary({
                revenue,
                expenses,
                paid,
                investments,
                balance: revenue - expenses,
                // accumulatedBalance from backend might include non-aggregated data, 
                // but we can't easily re-calc history. Using it as best effort baseline.
                total: (data.summary?.accumulatedBalance || 0) + investments + redeemedInvestments,
            });
        } else {
            const today = new Date();
            let currentMonthData = data;
            
            // If looking at a future month, fetch current month data to find baseline balance
            if (currentDate.getMonth() !== today.getMonth() || currentDate.getFullYear() !== today.getFullYear()) {
                 const cmKey = `${today.getMonth() + 1}-${today.getFullYear()}`;
                 if (transactionsCache.current[cmKey]) {
                     currentMonthData = transactionsCache.current[cmKey];
                 } else {
                     const params = new URLSearchParams({ idEmail: user.idEmail || user.id, month: (today.getMonth() + 1).toString(), year: today.getFullYear().toString(), includeShared: 'true' });
                     if (user.email) { params.append('sharedEmail', user.email); params.append('targetEmail', user.email); }
                     if (user.phone) { params.append('sharedPhone', user.phone); params.append('targetPhone', user.phone); }
                     const cmResponse = await apiFetch(`${API_BASE_URL}/transactions?${params.toString()}`);
                     if (cmResponse.ok) {
                         currentMonthData = await cmResponse.json();
                         transactionsCache.current[cmKey] = currentMonthData;
                     }
                 }
            }
            
            const baseAccumulated = currentMonthData.summary?.accumulatedBalance || 0;
            const baseMonthly = currentMonthData.summary?.monthlyBalance || 0; 
            
            // We try to approximate the "Start of Current Month" balance
            const realBalanceUpToLastMonth = baseAccumulated - baseMonthly;
            
            let forecastTotal = realBalanceUpToLastMonth;
            const startMonthLoop = new Date(today.getFullYear(), today.getMonth(), 1);
            const endMonthLoop = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            
            // Loop from current month up to viewing month to sum predicted balances
            for (let d = new Date(startMonthLoop); d <= endMonthLoop; d.setMonth(d.getMonth() + 1)) {
                const loopMonth = d.getMonth() + 1;
                const loopYear = d.getFullYear();
                const loopKey = `${loopMonth}-${loopYear}`;
                
                let loopData;
                // Check direct match
                if (loopYear === year && loopMonth === month) loopData = data;
                else if (loopYear === today.getFullYear() && loopMonth === today.getMonth() + 1) loopData = currentMonthData;
                else if (transactionsCache.current[loopKey]) {
                    // Check Cache
                    loopData = transactionsCache.current[loopKey];
                } else {
                    // Fetch and Cache
                    const params = new URLSearchParams({ idEmail: user.idEmail || user.id, month: loopMonth.toString(), year: loopYear.toString(), includeShared: 'true' });
                    if (user.email) { params.append('sharedEmail', user.email); params.append('targetEmail', user.email); }
                    if (user.phone) { params.append('sharedPhone', user.phone); params.append('targetPhone', user.phone); }
                    const loopResponse = await apiFetch(`${API_BASE_URL}/transactions?${params.toString()}`);
                    if (loopResponse.ok) {
                        loopData = await loopResponse.json();
                        transactionsCache.current[loopKey] = loopData;
                    }
                }
                
                if (loopData) {
                    const endOfLoopMonth = new Date(loopYear, loopMonth, 0, 23, 59, 59);
                    const { revenue: mRev, expenses: mExp } = calculateMonthlyTotals(loopData.transactions || [], endOfLoopMonth);
                    forecastTotal += (mRev - mExp);
                }
            }
            
            // Add the absolute values of investments and redeemed investments at the target month
            forecastTotal += (investments + redeemedInvestments);
            
            setSummary({ revenue, expenses, paid, investments, balance: revenue - expenses, total: forecastTotal });
        }
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
    } finally {
        setIsLoading(false);
    }
  }, [currentDate, user.email, apiFetch, isPastMonth, calculateMonthlyTotals]);


  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const onAddTransaction = async (newTransactionData: Omit<Transaction, 'id' | 'idEmail' | 'controlId'> & { repeatCount?: number }) => {
    const { repeatCount, ...baseTransactionData } = newTransactionData;
    const isControlled = baseTransactionData.isControlled;
    const endpoint = isControlled
      ? `${API_BASE_URL}/transactions/controlled`
      : `${API_BASE_URL}/transactions/simple`;

    const createTransactionPayload = (data: typeof baseTransactionData) => {
      if (isControlled) {
        const input = data.sharedEmailOrPhone || '';
        const targetEmail = input.includes('@') ? input : '';
        const targetPhone = input.includes('@') ? '' : input.replace(/\D/g, '');
        return { 
          idEmail: user.idEmail || user.id, 
          email: user.email,
          targetEmail,
          targetPhone,
          name: data.name, 
          amount: data.amount, 
          date: data.date,
          type: data.type,
          status: data.status,
          ...(data.investment ? { investment: data.investment } : {})
        };
      } else {
        return { 
          idEmail: user.idEmail || user.id, 
          email: user.email, 
          type: data.type, 
          name: data.name, 
          amount: data.amount, 
          date: data.date, 
          status: data.status,
          ...(data.investment ? { investment: data.investment } : {})
        };
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
      
      // Se houver repetição, invalidamos tudo por segurança pois afeta múltiplos meses futuros
      const shouldClearAllCache = totalTransactions > 1;

      for (let i = 0; i < totalTransactions; i++) {
        const transactionForMonth = { ...baseTransactionData, date: addMonths(baseTransactionData.date, i) };
        const payload = createTransactionPayload(transactionForMonth);
        transactionPromises.push(apiFetch(endpoint, { method: 'POST', body: JSON.stringify(payload) }));
      }
      
      const responses = await Promise.all(transactionPromises);
      for (const response of responses) {
        if (!response.ok) {
            let errorMessage = 'Falha ao adicionar transação.';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.message || errorMessage;
            } catch (e) { }
            throw new Error(errorMessage);
        }
      }
      
      if (shouldClearAllCache) {
          clearCache();
      } else {
          // Limpa apenas o mês da transação adicionada
          invalidateCache(baseTransactionData.date);
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
      
      // Invalida o mês da nova data
      invalidateCache(updatedTransaction.date);
      
      // Se a data original era diferente, invalida o mês antigo também
      if (editingTransaction && editingTransaction.date !== updatedTransaction.date) {
          invalidateCache(editingTransaction.date);
      }

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
          body: JSON.stringify({ transactionId: transactionToDelete.id, idEmail: transactionToDelete.idEmail })
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Erro ao decodificar a resposta de erro da API.'}));
          throw new Error(errorData.message || 'Falha ao excluir transação');
        }
        
        // Limpa cache apenas do mês da transação excluída
        invalidateCache(transactionToDelete.date);
        
        await fetchTransactions();
    } catch (error) {
        alert((error as Error).message);
    } finally {
        setIsConfirmModalOpen(false);
        setTransactionToDelete(null);
    }
  };
  
  const onRequestPayment = async (transaction: Transaction, message: string = 'Pagamento informado') => {
    try {
      const currentUserId = user.idEmail || user.id;
      const isOwner = transaction.idEmail === currentUserId;
      const isTargetPhone = transaction.targetPhone && user.phone && transaction.targetPhone === user.phone;
      const isTargetEmail = transaction.targetEmail && user.email && transaction.targetEmail === user.email;

      const payload: any = { transactionId: transaction.id, message };
      
      if (isOwner) {
          payload.idEmail = currentUserId;
      } else if (isTargetPhone) {
          payload.targetPhone = user.phone;
      } else if (isTargetEmail) {
          payload.targetEmail = user.email;
      } else {
          payload.idEmail = transaction.idEmail;
      }

      const response = await apiFetch(`${API_BASE_URL}/transactions/request-payment`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Falha ao informar pagamento.');
      }
      invalidateCache(transaction.date);
      await fetchTransactions();
    } catch (error) {
      alert((error as Error).message);
    }
  };

  const onApprovePayment = async (transaction: Transaction) => {
    try {
      const currentUserId = user.idEmail || user.id;
      const isOwner = transaction.idEmail === currentUserId;
      const isTargetPhone = transaction.targetPhone && user.phone && transaction.targetPhone === user.phone;
      const isTargetEmail = transaction.targetEmail && user.email && transaction.targetEmail === user.email;

      const payload: any = { transactionId: transaction.id };
      
      if (isOwner) {
          payload.idEmail = currentUserId;
      } else if (isTargetPhone) {
          payload.targetPhone = user.phone;
      } else if (isTargetEmail) {
          payload.targetEmail = user.email;
      } else {
          payload.idEmail = transaction.idEmail;
      }

      const response = await apiFetch(`${API_BASE_URL}/transactions/approve-payment`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Falha ao aprovar pagamento.');
      }
      invalidateCache(transaction.date);
      await fetchTransactions();
    } catch (error) {
      alert((error as Error).message);
    }
  };

  const onRejectPayment = async (transaction: Transaction, reason: string = 'Pagamento não localizado') => {
    try {
      const currentUserId = user.idEmail || user.id;
      const isOwner = transaction.idEmail === currentUserId;
      const isTargetPhone = transaction.targetPhone && user.phone && transaction.targetPhone === user.phone;
      const isTargetEmail = transaction.targetEmail && user.email && transaction.targetEmail === user.email;

      const payload: any = { transactionId: transaction.id, reason };
      
      if (isOwner) {
          payload.idEmail = currentUserId;
      } else if (isTargetPhone) {
          payload.targetPhone = user.phone;
      } else if (isTargetEmail) {
          payload.targetEmail = user.email;
      } else {
          payload.idEmail = transaction.idEmail;
      }

      const response = await apiFetch(`${API_BASE_URL}/transactions/reject-payment`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Falha ao rejeitar pagamento.');
      }
      invalidateCache(transaction.date);
      await fetchTransactions();
    } catch (error) {
      alert((error as Error).message);
    }
  };

  const onUpdateTransactionStatus = async (transaction: Transaction, newStatus: PaymentStatus) => {
    try {
      const currentUserId = user.idEmail || user.id;
      const isOwner = transaction.idEmail === currentUserId;
      const isTargetPhone = transaction.targetPhone && user.phone && transaction.targetPhone === user.phone;
      const isTargetEmail = transaction.targetEmail && user.email && transaction.targetEmail === user.email;

      const payload: any = { transactionId: transaction.id, status: newStatus };
      
      if (isOwner) {
          payload.idEmail = currentUserId;
      } else if (isTargetPhone) {
          payload.targetPhone = user.phone;
      } else if (isTargetEmail) {
          payload.targetEmail = user.email;
      } else {
          payload.idEmail = transaction.idEmail;
      }

      const response = await apiFetch(`${API_BASE_URL}/transactions/status`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Falha ao atualizar status. O servidor não respondeu com detalhes.' }));
        throw new Error(errorData.message || errorData.error || 'Falha ao atualizar status.');
      }
      
      invalidateCache(transaction.date);
      
      await fetchTransactions();
    } catch (error) {
      alert((error as Error).message);
    }
  };

  const onToggleSimpleTransactionPaid = async (id: string) => {
    const transaction = transactions.find((t) => t.id === id);
    if (!transaction) return;
    let newStatus = transaction.status === PaymentStatus.PAID ? PaymentStatus.UNPAID : PaymentStatus.PAID;
    if ((transaction.type === TransactionType.INVESTMENT || transaction.type === 'INVESTMENT' || transaction.type === 'investimento') && transaction.status === PaymentStatus.PAID) {
         newStatus = 'investimento' as PaymentStatus;
    }
    
    try {
      const currentUserId = user.idEmail || user.id;
      const isOwner = transaction.idEmail === currentUserId;
      const isTargetPhone = transaction.targetPhone && user.phone && transaction.targetPhone === user.phone;
      const isTargetEmail = transaction.targetEmail && user.email && transaction.targetEmail === user.email;

      const payload: any = { transactionId: transaction.id, status: newStatus };
      
      if (isOwner) {
          payload.idEmail = currentUserId;
      } else if (isTargetPhone) {
          payload.targetPhone = user.phone;
      } else if (isTargetEmail) {
          payload.targetEmail = user.email;
      } else {
          payload.idEmail = transaction.idEmail;
      }

      const response = await apiFetch(`${API_BASE_URL}/transactions/status`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Falha ao atualizar o status da transação.' }));
        throw new Error(errorData.message || 'Falha ao atualizar status');
      }
      
      invalidateCache(transaction.date);
      
      await fetchTransactions();
    } catch (error) {
      alert((error as Error).message);
    }
  };
  
  const onDeleteSubTransaction = async (transactionId: string, description: string, idEmail: string) => {
    try {
        const transaction = transactions.find(t => t.id === transactionId);
        
        const response = await apiFetch(`${API_BASE_URL}/transactions/${transactionId}/subtract-value`, {
            method: 'PATCH',
            body: JSON.stringify({ description, idEmail }),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Falha ao remover item da transação.' }));
            throw new Error(errorData.message || 'Falha ao remover item.');
        }
        
        if (transaction) {
            invalidateCache(transaction.date);
        } else {
            clearCache(); // Fallback se não encontrar a transação no state atual
        }

        await fetchTransactions();
    } catch (error) {
        alert((error as Error).message);
    }
  };

  const onShare = async (shareeEmail: string, aggregate: boolean) => {
    try {
        const sharedEmail = shareeEmail.includes('@') ? shareeEmail : '';
        const sharedPhone = shareeEmail.includes('@') ? '' : shareeEmail.replace(/\D/g, '');
        const response = await apiFetch(`${API_BASE_URL}/transactions/follow`, {
            method: 'PATCH',
            body: JSON.stringify({
                idEmail: user.idEmail || user.id, 
                sharedEmail,
                sharedPhone,
                aggregate
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Erro na requisição.' }));
            throw new Error(errorData.error || errorData.message || 'Falha ao compartilhar.');
        }

        const data = await response.json();
        alert(`Sucesso! Agora ${shareeEmail} pode visualizar suas transações.`);
        
    } catch (error) {
        console.error("Erro ao compartilhar:", error);
        alert((error as Error).message);
    }
  };

  const onUnshare = async (emailToUnshare: string) => {
      if (!confirm(`Deseja parar de acompanhar as finanças de ${emailToUnshare}?`)) return;

      try {
          const response = await apiFetch(`${API_BASE_URL}/transactions/follow`, {
              method: 'DELETE',
              body: JSON.stringify({
                  myEmail: emailToUnshare,
                  targetEmail: user.email
              })
          });

          if (!response.ok) {
             throw new Error('Falha ao deixar de seguir usuário.');
          }
          
          clearCache(); // Limpa tudo pois afeta o conjunto de dados globalmente
          await fetchTransactions();
          alert(`Você deixou de acompanhar ${emailToUnshare}.`);

      } catch (error) {
          alert((error as Error).message);
      }
  };

  const openModal = (type: TransactionType) => { setEditingTransaction(null); setModalType(type); setIsModalOpen(true); };
  const handleStartEdit = (transaction: Transaction) => { setEditingTransaction(transaction); setIsModalOpen(true); };
  const handleModalClose = () => { setIsModalOpen(false); setEditingTransaction(null); };

  const handleModalSubmit = async (data: (Omit<Transaction, 'id' | 'idEmail' | 'controlId'> | Transaction) & { repeatCount?: number }) => {
      if ('id' in data) {
        await onEditTransaction(data as Transaction);
      } else {
        await onAddTransaction(data as Omit<Transaction, 'id' | 'idEmail' | 'controlId'> & { repeatCount?: number });
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
          idEmail: transactionToAddValueTo.idEmail,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Falha ao adicionar valor.' }));
        throw new Error(errorData.message || 'Falha ao adicionar valor.');
      }
      
      invalidateCache(transactionToAddValueTo.date);
      
      await fetchTransactions();
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setIsAddValueModalOpen(false);
      setTransactionToAddValueTo(null);
    }
  };

  const { personalTransactions, sharedTransactions } = useMemo(() => {
    const currentUserId = user.idEmail || user.id;
    const personal = transactions.filter(t => {
      if (t.idEmail === currentUserId) return true;
      if (t.isControlled) {
        const isTarget = (t.targetEmail && user.email && t.targetEmail === user.email) || (t.targetPhone && user.phone && t.targetPhone === user.phone);
        if (isTarget) return true;
      }
      return false;
    });
    const shared = transactions.filter(t => {
      if (t.idEmail === currentUserId) return false;
      if (t.isControlled) {
        const isTarget = (t.targetEmail && user.email && t.targetEmail === user.email) || (t.targetPhone && user.phone && t.targetPhone === user.phone);
        if (isTarget) return false;
      }
      const isShared = (t.sharedEmail && user.email && t.sharedEmail === user.email) || (t.sharedPhone && user.phone && t.sharedPhone === user.phone);
      return isShared;
    });
    return { personalTransactions: personal, sharedTransactions: shared };
  }, [transactions, user.email, user.id, user.idEmail, user.phone]);

  const overdueTransactions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    return personalTransactions.filter(t => {
      if (t.type === TransactionType.INVESTMENT || t.type === 'INVESTMENT' || t.type === 'investimento') return false;
      if (t.status !== PaymentStatus.UNPAID) return false;
      const parts = t.date.split('T')[0].split('-').map(p => parseInt(p, 10));
      const dueDate = new Date(parts[0], parts[1] - 1, parts[2]);
      return dueDate < today;
    });
  }, [personalTransactions]);

  useEffect(() => {
    if (isLoading) return; 

    const hasShownModal = sessionStorage.getItem('overdueModalShown');
    if (overdueTransactions.length > 0 && !hasShownModal) {
        setIsOverdueModalOpen(true);
        sessionStorage.setItem('overdueModalShown', 'true');
    }
  }, [isLoading, overdueTransactions]);
  
  const pendingApprovalTransactions = useMemo(() => {
    const currentUserId = user.idEmail || user.id;
    return transactions.filter(t => {
      const isPaymentRequested = t.paymentRequest?.requested === true && !t.paymentRequest?.approved && !t.paymentRequest?.rejected;
      if (!t.isControlled || (t.status !== PaymentStatus.PENDING && !isPaymentRequested)) return false;
      
      const isOwner = t.idEmail === currentUserId;
      const isTarget = !isOwner && ((t.targetEmail && user.email && t.targetEmail === user.email) || (t.targetPhone && user.phone && t.targetPhone === user.phone));
      
      if (!isOwner && !isTarget) return false;

      let displayType = t.type;
      if (isTarget) {
          displayType = t.type === TransactionType.REVENUE ? TransactionType.EXPENSE : TransactionType.REVENUE;
      }

      return displayType === TransactionType.REVENUE;
    });
  }, [transactions, user.id, user.idEmail, user.email, user.phone]);

  useEffect(() => {
    if (isLoading) return;

    const hasShownPendingModal = sessionStorage.getItem('pendingApprovalModalShown');
    if (pendingApprovalTransactions.length > 0 && !hasShownPendingModal) {
      setIsPendingApprovalModalOpen(true);
      sessionStorage.setItem('pendingApprovalModalShown', 'true');
    }
  }, [isLoading, pendingApprovalTransactions]);
  
  const handleApprovePending = async (transactionId: string) => {
    const tx = transactions.find(t => t.id === transactionId);
    if (tx) {
        await onApprovePayment(tx);
    }
  };

  const handleRejectPending = async (transactionId: string) => {
      const tx = transactions.find(t => t.id === transactionId);
      if (tx) {
          await onRejectPayment(tx);
      }
  };

  const receitasTransactions = useMemo(() => {
     return personalTransactions.filter(t => t.type === TransactionType.REVENUE);
  }, [personalTransactions]);

  const despesasTransactions = useMemo(() => {
     return personalTransactions.filter(t => t.type === TransactionType.EXPENSE);
  }, [personalTransactions]);

  const investimentosTransactions = useMemo(() => {
     return personalTransactions.filter(t => (t.type === TransactionType.INVESTMENT || t.type === 'INVESTMENT' || t.type === 'investimento'));
  }, [personalTransactions]);

  const totalAReceber = useMemo(() => {
     return receitasTransactions.filter(t => t.status === PaymentStatus.UNPAID || t.status === PaymentStatus.PENDING).reduce((acc, t) => acc + Number(t.amount), 0);
  }, [receitasTransactions]);

  const totalAPagar = useMemo(() => {
     return despesasTransactions.filter(t => t.status === PaymentStatus.UNPAID || t.status === PaymentStatus.PENDING).reduce((acc, t) => acc + Number(t.amount), 0);
  }, [despesasTransactions]);

  const totalMinhasReceitas = useMemo(() => receitasTransactions.reduce((acc, t) => acc + Number(t.amount), 0), [receitasTransactions]);
  const totalMinhasDespesas = useMemo(() => despesasTransactions.reduce((acc, t) => acc + Number(t.amount), 0), [despesasTransactions]);
  const totalShared = useMemo(() => sharedTransactions.reduce((acc, t) => acc + Number(t.amount), 0), [sharedTransactions]);

  const tabSummaryNode = useMemo(() => {
      switch(activeTab) {
          case 'transactions':
              return (
                  <span 
                      className={`px-2 py-1 rounded-md bg-gray-700/50 text-gray-300 border border-gray-600 cursor-help`}
                      title={`Receitas (${formatCurrency(summary.revenue)}) - Despesas (${formatCurrency(summary.expenses)})`}
                  >
                      <span className={summary.balance >= 0 ? "text-green-accent" : "text-red-accent"}>
                          {formatCurrency(summary.balance)}
                      </span>
                  </span>
              );
          case 'shared':
              return <span title="Soma de transações compartilhadas" className={`px-2 py-1 rounded-md bg-purple-900/40 text-purple-300 border border-purple-500/30 cursor-help`}>{formatCurrency(totalShared)}</span>;
          case 'receitas':
              return <span title={`Soma de todas as receitas do mês (${formatCurrency(summary.revenue)})`} className={`px-2 py-1 rounded-md bg-green-900/40 text-green-300 border border-green-500/30 cursor-help`}>{formatCurrency(summary.revenue)}</span>;
          case 'despesas':
              return <span title={`Soma de todas as despesas do mês (${formatCurrency(summary.expenses)})`} className={`px-2 py-1 rounded-md bg-red-900/40 text-red-300 border border-red-500/30 cursor-help`}>{formatCurrency(summary.expenses)}</span>;
          default:
              return null;
      }
  }, [activeTab, totalMinhasReceitas, totalMinhasDespesas, totalShared, summary]);

  const minhasTransactions = useMemo(() => {
    return personalTransactions.filter(t => {
      if (t.type === TransactionType.INVESTMENT || t.type === 'INVESTMENT' || t.type === 'investimento') {
        const parts = String(t.date).split('T')[0].split('-');
        const tYear = parseInt(parts[0], 10);
        const tMonth = parseInt(parts[1], 10) - 1;
        if (tYear !== currentDate.getFullYear() || tMonth !== currentDate.getMonth()) {
          return false;
        }
      }
      return true;
    });
  }, [personalTransactions, currentDate]);

  const transactionsForCurrentTab = 
    activeTab === 'transactions' ? minhasTransactions : 
    activeTab === 'shared' ? sharedTransactions :
    activeTab === 'receitas' ? receitasTransactions :
    activeTab === 'investimentos' ? investimentosTransactions :
    despesasTransactions;

  const sharedUsersActionButton = activeTab === 'shared' && sharedUsersInfo.length > 0 ? (
    <div className="relative">
      <button 
        onClick={() => setIsSharedUsersPopoverOpen(!isSharedUsersPopoverOpen)}
        className="p-2 text-gray-400 hover:text-white bg-gray-800 border border-gray-700 hover:bg-gray-700 rounded-md transition-colors"
        title="Quem você segue"
      >
        <UsersIcon className="w-5 h-5" />
      </button>
      {isSharedUsersPopoverOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-gray-800 rounded-lg shadow-xl border border-gray-600 z-50">
            <div className="p-3 border-b border-gray-700 font-semibold text-white text-sm">
                Compartilhado Comigo (Você segue):
            </div>
            <ul className="max-h-60 overflow-y-auto p-2 space-y-1">
                {sharedUsersInfo.map(sharedUser => (
                    <li key={sharedUser.email} className="flex items-center justify-between p-2 text-sm bg-gray-700/50 rounded-md">
                        <div className="overflow-hidden flex-1 mr-2">
                          <span className="font-medium text-white truncate block">{userMap[sharedUser.email] || sharedUser.email}</span>
                          {sharedUser.aggregate && <span className="text-[10px] text-blue-300">(Somando valores)</span>}
                        </div>
                        <button 
                          onClick={() => {
                            onUnshare(sharedUser.email);
                          }} 
                          className="text-red-400 transition-colors hover:text-red-300 shrink-0" 
                          aria-label={`Parar de compartilhar com ${sharedUser.email}`}
                          title="Parar de seguir"
                        >
                          <XCircleIcon className="w-5 h-5" />
                        </button>
                    </li>
                ))}
            </ul>
        </div>
      )}
    </div>
  ) : null;

  return (
    <>
      {portalNode ? createPortal(
        <div className="flex-1 w-full max-w-sm md:max-w-full z-10 pointer-events-auto shrink-0 mx-auto">
          <MonthNavigator 
            currentDate={currentDate} 
            setCurrentDate={setCurrentDate}
            className="!mb-0 w-full"
          />
        </div>,
        portalNode
      ) : (
        <MonthNavigator 
          currentDate={currentDate} 
          setCurrentDate={setCurrentDate}
          className="mb-4"
        />
      )}

      <SummaryCards revenue={summary.revenue} expenses={summary.expenses} balance={summary.balance} total={summary.total} paid={summary.paid} investments={summary.investments || 0} isFutureMonth={isFutureMonth} />
      
      {isExporting && (
        <div className="flex items-center justify-center mb-4 p-3 bg-blue-900/50 rounded-lg border border-blue-500/30">
          <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-blue-400 mr-3"></div>
          <p className="text-sm text-blue-200">Gerando PDF com todos os meses do ano de {currentDate.getFullYear()}... Isso pode levar alguns segundos.</p>
        </div>
      )}

      <ActionButtons 
        onAddRevenue={() => openModal(TransactionType.REVENUE)} 
        onAddExpense={() => openModal(TransactionType.EXPENSE)} 
        onAddInvestment={() => openModal(TransactionType.INVESTMENT)}
        onShare={() => setIsShareModalOpen(true)} 
        isPastMonth={isPastMonth} 
        onViewReports={() => onNavigate('graficos')}
        onExportPDF={handleExportPDF}
      />
      
      <div className="p-4 bg-gray-800 rounded-lg">
        <div className="flex items-center justify-between px-2 sm:px-4 py-2 border border-gray-700/50 bg-gray-900 rounded-lg shadow-sm">
          <button 
            onClick={() => {
               const map = { transactions: 'investimentos', shared: 'transactions', receitas: 'shared', despesas: 'receitas', investimentos: 'despesas' } as const;
               setActiveTab(map[activeTab] as any);
            }} 
            className="p-2 text-gray-400 transition-colors rounded-lg hover:bg-gray-700 hover:text-white"
          >
             <ChevronLeftIcon className="w-5 h-5" />
          </button>
          
          <div className="flex-1 text-center font-bold text-sm sm:text-base">
            {activeTab === 'transactions' && <span className="text-blue-300">Minhas Transações <span className="text-gray-500 font-normal">({minhasTransactions.length})</span></span>}
            {activeTab === 'shared' && <span className="text-purple-300">Compartilhados <span className="text-gray-500 font-normal">({sharedTransactions.length})</span></span>}
            {activeTab === 'receitas' && <span className="text-green-300">Receitas <span className="text-gray-500 font-normal">({receitasTransactions.length})</span></span>}
            {activeTab === 'despesas' && <span className="text-red-300">Despesas <span className="text-gray-500 font-normal">({despesasTransactions.length})</span></span>}
            {activeTab === 'investimentos' && <span className="text-yellow-300">Investimentos <span className="text-gray-500 font-normal">({investimentosTransactions?.length || 0})</span></span>}
          </div>

          <button 
            onClick={() => {
               const map = { transactions: 'shared', shared: 'receitas', receitas: 'despesas', despesas: 'investimentos', investimentos: 'transactions' } as const;
               setActiveTab(map[activeTab] as any);
            }} 
            className="p-2 text-gray-400 transition-colors rounded-lg hover:bg-gray-700 hover:text-white"
          >
             <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="pt-4">
          {isLoading ? <p>Carregando...</p> : error ? <p className="text-red-accent">{error}</p> : (
            <TransactionList 
              transactions={transactionsForCurrentTab} 
              currentUserEmail={user.email}
              currentUserPhone={user.phone}
              currentUserId={user.idEmail || user.id}
              onUpdateStatus={onUpdateTransactionStatus}
              onToggleSimplePaid={onToggleSimpleTransactionPaid}
              onStartEdit={handleStartEdit}
              onDelete={handleStartDelete}
              onDeleteSubTransaction={onDeleteSubTransaction}
              onOpenAddValueModal={handleOpenAddValueModal}
              onRequestPayment={onRequestPayment}
              onApprovePayment={onApprovePayment}
              onRejectPayment={onRejectPayment}
              isPastMonth={isPastMonth}
              tabSummary={tabSummaryNode}
              listActions={sharedUsersActionButton}
              currentViewDate={new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59)}
            />
          )}
        </div>
      </div>

      {isModalOpen && ( 
        <TransactionFormModal 
            isOpen={isModalOpen} 
            onClose={handleModalClose} 
            onSubmit={handleModalSubmit} 
            type={editingTransaction?.type ?? modalType} 
            transactionToEdit={editingTransaction} 
            currentDateForForm={currentDate} 
            currentUserEmail={user.email} 
        /> 
      )}
      <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} onShare={(sharedUserInfo) => onShare(sharedUserInfo.email, sharedUserInfo.aggregate)} />
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
       <PendingApprovalModal
        isOpen={isPendingApprovalModalOpen}
        onClose={() => setIsPendingApprovalModalOpen(false)}
        pendingTransactions={pendingApprovalTransactions}
        onApprove={handleApprovePending}
        onReject={handleRejectPending}
        userMap={userMap}
      />
    </>
  );
};

export default Dashboard;
