
// FIX: Import useState and useMemo from React.
import React, { useState, useMemo } from 'react';
import type { Transaction, Addition } from '../types';
import { TransactionType, PaymentStatus } from '../types';
import { CheckCircleIcon, ClockIcon, XCircleIcon, ShareIcon, PencilIcon, TrashIcon, ChevronDownIcon, PlusIcon, MinusIcon, BellIcon, EyeIcon, RefreshIcon } from './icons';
import ConfirmationModal from './ConfirmationModal';

const calculateInvestmentValue = (tx: any, targetDate: Date = new Date()): number => {
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
};

interface TransactionListProps {
  transactions: Transaction[];
  currentUserEmail: string;
  currentUserPhone?: string;
  currentUserId: string;
  onUpdateStatus: (transaction: Transaction, newStatus: PaymentStatus) => void;
  onToggleSimplePaid: (id: string) => Promise<void>;
  onStartEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  onDeleteSubTransaction: (transactionId: string, additionName: string, idEmail: string) => Promise<void>;
  onOpenAddValueModal: (transaction: Transaction) => void;
  onRequestPayment: (transaction: Transaction) => void;
  onApprovePayment: (transaction: Transaction) => void;
  onRejectPayment: (transaction: Transaction) => void;
  isPastMonth: boolean;
  tabSummary?: React.ReactNode;
  listActions?: React.ReactNode;
  currentViewDate?: Date;
}

interface TransactionItemProps {
  transaction: Transaction;
  currentUserEmail: string;
  currentUserPhone?: string;
  currentUserId: string;
  onUpdateStatus: (transaction: Transaction, newStatus: PaymentStatus) => void;
  onToggleSimplePaid: (id: string) => Promise<void>;
  onStartEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  onDeleteSubTransaction: (transactionId: string, additionName: string, idEmail: string) => Promise<void>;
  onOpenAddValueModal: (transaction: Transaction) => void;
  onRequestPayment: (transaction: Transaction) => void;
  onApprovePayment: (transaction: Transaction) => void;
  onRejectPayment: (transaction: Transaction) => void;
  isPastMonth: boolean;
  currentViewDate?: Date;
}

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const StatusBadge: React.FC<{ status: PaymentStatus | string }> = ({ status }) => {
    const statusMap: any = {
        [PaymentStatus.PAID]: { text: 'Pago', icon: <CheckCircleIcon className="w-4 h-4" />, color: 'text-green-accent' },
        [PaymentStatus.UNPAID]: { text: 'Não Pago', icon: <XCircleIcon className="w-4 h-4" />, color: 'text-red-accent' },
        [PaymentStatus.PENDING]: { text: 'Pendente', icon: <ClockIcon className="w-4 h-4" />, color: 'text-yellow-accent' },
        'investimento': { text: 'Rendendo', icon: <CheckCircleIcon className="w-4 h-4" />, color: 'text-yellow-300' },
    };
    const { text, icon, color } = statusMap[status] || statusMap[PaymentStatus.UNPAID];
    return <div className={`flex items-center flex-shrink-0 space-x-1 text-xs font-medium px-2 py-1 rounded-full ${color} bg-gray-700`}>{icon}<span>{text}</span></div>;
};

const TransactionItem: React.FC<TransactionItemProps> = React.memo(({ transaction, currentUserEmail, currentUserPhone, currentUserId, onUpdateStatus, onToggleSimplePaid, onStartEdit, onDelete, onDeleteSubTransaction, onOpenAddValueModal, onRequestPayment, onApprovePayment, onRejectPayment, isPastMonth, currentViewDate }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [additionToDelete, setAdditionToDelete] = useState<Addition | null>(null);
    const [isConfirmUnpayOpen, setIsConfirmUnpayOpen] = useState(false);

    const isRevenue = transaction.type === TransactionType.REVENUE;
    const isInvestment = transaction.type === TransactionType.INVESTMENT;
    const isPaid = transaction.status === PaymentStatus.PAID;
    
    // Logic for shared transactions aggregation visualization
    const isOwner = transaction.idEmail === currentUserId;
    const isTarget = !isOwner && transaction.isControlled && (
        (transaction.targetEmail && transaction.targetEmail === currentUserEmail) || 
        (transaction.targetPhone && transaction.targetPhone === currentUserPhone)
    );
    const isSharedViewer = !isOwner && !isTarget;
    
    // We treat target as aggregated always, viewer uses aggregate field.
    const isAggregated = isTarget || transaction.aggregate === true;
    
    const isSharedWithMe = isTarget || isSharedViewer;
    
    // Determine if it really acts as a controlled transaction (meaning it involves targeting someone as debtor/creditor)
    const isEffectivelyControlled = transaction.isControlled && (!!transaction.targetEmail || !!transaction.targetPhone);

    // Determine if user owes money or receives money based on displayed type
    const isReceiver = transaction.type === TransactionType.REVENUE;
    const isDebtor = !isReceiver;

    const isPaymentRequested = transaction.paymentRequest?.requested === true && !transaction.paymentRequest?.approved && !transaction.paymentRequest?.rejected;

    // True when the user receives money and the status is PENDING or requested
    const isPendingApprovalFromMe = isEffectivelyControlled && (isOwner || isTarget) && (transaction.status === PaymentStatus.PENDING || isPaymentRequested) && isReceiver;
    
    // True when I am the owner of a controlled transaction
    const isOwnerOfControlled = isEffectivelyControlled && isOwner;
    
    const addValueTitle = isPastMonth
        ? "Não é possível adicionar valores em meses anteriores"
        : isPaid
        ? "Não é possível adicionar valores a transações já pagas."
        : isRevenue ? "Adicionar item à receita" : "Adicionar item à despesa";

    const activeAdditions = useMemo(() => transaction.additions?.filter(a => !a.removed) || [], [transaction.additions]);

    // Determine styles based on aggregation status
    const amountClass = (isSharedWithMe && !isAggregated)
        ? 'text-gray-500 line-through decoration-gray-500/50 opacity-60' // Crossed out if not aggregating
        : (isRevenue ? 'text-green-accent' : 'text-red-accent'); // Normal colors

    const handleSimpleToggle = () => {
        if (isPaid) {
            setIsConfirmUnpayOpen(true);
        } else {
            onToggleSimplePaid(transaction.id);
        }
    }
    
    const handleDelete = () => {
        onDelete(transaction);
    };

    const handleConfirmDeleteAddition = async () => {
        if (additionToDelete) {
            await onDeleteSubTransaction(transaction.id, additionToDelete.name, transaction.idEmail);
        }
        setAdditionToDelete(null);
    };

    const handleConfirmUnpay = async () => {
        await onToggleSimplePaid(transaction.id);
        setIsConfirmUnpayOpen(false);
    };
    
    const renderStatusDisplay = () => {
        // Case 1: Creditor needs to confirm a pending payment (most specific case)
        if (isPendingApprovalFromMe) {
            return (
                <button
                    onClick={() => onApprovePayment(transaction)}
                    className="flex items-center space-x-2 cursor-pointer transition-opacity hover:opacity-80"
                    title="Confirmar Pagamento"
                >
                    <div className="w-5 h-5 rounded border flex items-center justify-center transition-colors border-gray-500 text-transparent bg-gray-700/50">
                        <svg className="w-3.5 h-3.5 opacity-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <span className="text-sm text-gray-300">Pago</span>
                </button>
            );
        }

        // Case 2: Receiver of a controlled transaction (PAID/UNPAID states) has direct control
        if (isEffectivelyControlled && isReceiver && (isOwner || isTarget)) {
            const isDisabled = isPastMonth && isPaid;
            const title = isDisabled 
                ? "Não é possível alterar o status em meses anteriores." 
                : isPaid ? "Marcar como Não Pago" : "Confirmar Recebimento";
            return (
                <button
                    onClick={() => {
                        if (isDisabled) return;
                        const unpayStatus = (isInvestment || transaction.type === 'investimento') ? 'investimento' as PaymentStatus : PaymentStatus.UNPAID;
                        onUpdateStatus(transaction, isPaid ? unpayStatus : PaymentStatus.PAID);
                    }}
                    disabled={isDisabled}
                    className={`flex items-center space-x-2 ${isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:opacity-80 transition-opacity'}`}
                    title={title}
                >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        isPaid
                            ? 'bg-green-900/40 border-green-500/50 text-green-400'
                            : 'border-gray-500 text-transparent bg-gray-700/50'
                    }`}>
                        <svg className={`w-3.5 h-3.5 ${isPaid ? 'opacity-100' : 'opacity-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <span className="text-sm text-gray-300">Recebido</span>
                </button>
            );
        }
        
        // Case 3: Other controlled transactions (e.g., expenses from debtor's POV)
        if (isEffectivelyControlled) {
            return <StatusBadge status={transaction.status} />;
        }
        
        // Case 4: Default for simple (non-controlled) transactions
        // Disable if past month and paid, OR if user is just a shared viewer
        const isSimpleToggleDisabled = (isPastMonth && isPaid) || isSharedViewer;
        
        let simpleTitle = isPaid ? "Marcar como Não Pago" : "Marcar como Pago";
        if (isPastMonth && isPaid) {
            simpleTitle = "Não é possível alterar o status em meses anteriores.";
        } else if (isSharedViewer) {
            simpleTitle = "Apenas visualização. Não é possível alterar o status.";
        }

        return (
             <button
                onClick={(e) => {
                    if (isSimpleToggleDisabled) return;
                    handleSimpleToggle(e as any);
                }}
                disabled={isSimpleToggleDisabled}
                className={`flex items-center space-x-2 ${isSimpleToggleDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:opacity-80 transition-opacity'}`}
                title={simpleTitle}
            >
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    isPaid
                        ? 'bg-green-900/40 border-green-500/50 text-green-400'
                        : 'border-gray-500 text-transparent bg-gray-700/50'
                }`}>
                    <svg className={`w-3.5 h-3.5 ${isPaid ? 'opacity-100' : 'opacity-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <span className="text-sm text-gray-300">Pago</span>
            </button>
        );
    };

    return (
        <li className={`p-3 sm:p-4 bg-gray-800 rounded-lg shadow-sm border-y border-r border-gray-700/50 border-l-4 ${isInvestment ? 'border-l-yellow-accent' : (isRevenue ? 'border-l-green-accent' : 'border-l-red-accent')}`}>
            <div className="flex items-start justify-between gap-3">
                {/* LEFT SIDE: Info & Actions */}
                <div className="flex items-start gap-3 flex-grow min-w-0">
                    
                    <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-white truncate text-sm sm:text-base leading-tight">{transaction.name}</p>
                            {isPendingApprovalFromMe && (
                                <span title="Aguardando sua confirmação de recebimento">
                                    <BellIcon className="w-4 h-4 text-yellow-accent animate-pulse" />
                                </span>
                            )}
                            {(transaction.sharedEmail || transaction.sharedPhone || (transaction.isControlled && isOwner && (transaction.targetEmail || transaction.targetPhone))) && !isTarget && (
                                <span className="inline-flex items-center flex-shrink-0 px-2 py-0.5 text-[10px] text-purple-300 bg-purple-900/40 border border-purple-500/30 rounded-full" title={`Compartilhamento`}>
                                    <ShareIcon className="w-3 h-3 mr-1" />
                                    <span className="truncate max-w-[100px] sm:max-w-[150px]">
                                        {transaction.idEmail === currentUserId 
                                            ? `${transaction.sharedEmail || transaction.sharedPhone || transaction.targetEmail || transaction.targetPhone}` 
                                            : (transaction.email ? `De: ${transaction.email}` : "Compartilhado com você")}
                                    </span>
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            {new Date(transaction.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
                        </p>

                        {/* Actions neatly tucked under the text */}
                        <div className="flex items-center gap-2 mt-2 sm:mt-3 flex-wrap">
                            {/* Payment request actions */}
                            {isEffectivelyControlled && (isOwner || isTarget) && isDebtor && transaction.status === PaymentStatus.UNPAID && !isPaymentRequested && (
                                <button onClick={() => onRequestPayment(transaction)} className="px-2 py-1 text-[10px] sm:text-xs text-white transition-colors bg-blue-accent rounded-md hover:bg-blue-accent/90">Informar Pagamento</button>
                            )}
                            {isPendingApprovalFromMe && (
                                <>
                                <button onClick={() => onApprovePayment(transaction)} className="px-2 py-1 text-[10px] sm:text-xs text-white transition-colors bg-green-accent rounded-md hover:bg-green-600">Aprovar</button>
                                <button onClick={() => onRejectPayment(transaction)} className="px-2 py-1 text-[10px] sm:text-xs text-white transition-colors bg-red-600 rounded-md hover:bg-red-700">Recusar</button>
                                </>
                            )}

                            {/* Standard actions */}
                            {isOwner && !isPendingApprovalFromMe && (
                                <>
                                <button
                                    onClick={() => onOpenAddValueModal(transaction)}
                                    disabled={isPastMonth || isPaid}
                                    className={`flex items-center justify-center p-1.5 px-2 text-xs font-bold text-white rounded-md transition-colors ${
                                        isRevenue
                                            ? 'bg-green-900/40 text-green-300 border border-green-500/30 hover:bg-green-900/60'
                                            : 'bg-red-900/40 text-red-300 border border-red-500/30 hover:bg-red-900/60'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    title={addValueTitle}
                                    aria-label={addValueTitle}
                                >
                                    {isRevenue ? <PlusIcon className="w-3.5 h-3.5" /> : <MinusIcon className="w-3.5 h-3.5" />}
                                </button>
                                <button 
                                    onClick={() => onStartEdit(transaction)}
                                    disabled={isEffectivelyControlled || isPastMonth}
                                    className="p-1.5 px-2 text-gray-400 bg-gray-700/50 border border-gray-600 transition-colors rounded-md hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={isEffectivelyControlled ? "Não é possível editar transações controladas" : (isPastMonth ? "Não é possível editar em meses anteriores" : "Editar")}
                                    aria-label="Editar transação"
                                >
                                    <PencilIcon className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                    onClick={handleDelete}
                                    className="p-1.5 px-2 text-gray-400 bg-gray-700/50 border border-gray-600 transition-colors rounded-md hover:bg-red-900/40 hover:text-red-400 hover:border-red-500/30"
                                    title="Excluir"
                                    aria-label="Excluir transação"
                                >
                                    <TrashIcon className="w-3.5 h-3.5" />
                                </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE: Amount & Status */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="flex flex-col items-end gap-0.5">
                        <div className="flex items-center gap-1.5">
                            <p className={`font-bold text-sm md:text-base whitespace-nowrap ${amountClass}`}>
                                {formatCurrency(transaction.amount)}
                            </p>
                            {isSharedViewer && (
                                <div>
                                    {isAggregated ? (
                                        <span title="Soma no Total" className="inline-flex items-center text-blue-400 bg-blue-900/40 p-1 rounded-full border border-blue-500/30 cursor-help">
                                            <PlusIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                        </span>
                                    ) : (
                                        <span title="Apenas Visão" className="inline-flex items-center text-gray-400 bg-gray-800/50 p-1 rounded-full border border-gray-600 cursor-help">
                                            <EyeIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                        {isInvestment && (
                            <div className="flex flex-col items-end">
                                <p className="text-xs text-yellow-200/80 font-medium" title="Valor atual aproximado">
                                    Atual: {formatCurrency(calculateInvestmentValue(transaction))}
                                </p>
                                {currentViewDate && currentViewDate > new Date() && (
                                    <p className="text-xs text-yellow-400 font-bold" title="Projeção para o fim do mês selecionado">
                                        Fim do Mês: {formatCurrency(calculateInvestmentValue(transaction, currentViewDate))}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                    {/* Status Label/Toggle */}
                    <div>
                        {renderStatusDisplay()}
                    </div>
                </div>
            </div>
            
            {/* ACCORDION */}
            {activeAdditions.length > 0 && (
                <div className="w-full pt-3 mt-3 space-y-2 border-t border-gray-600">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center justify-between w-full text-sm text-gray-400 hover:text-white"
                        aria-expanded={isExpanded}
                    >
                        <span>Detalhes adicionais ({activeAdditions.length})</span>
                        <ChevronDownIcon className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    {isExpanded && (
                        <ul className="pl-4 space-y-2 text-sm border-l-2 border-gray-500">
                            {activeAdditions.map((item) => (
                                <li key={item._id} className="flex items-center justify-between group">
                                    <span className="text-gray-300">{item.name}</span>
                                    <div className="flex items-center space-x-2">
                                        <span className="font-medium text-gray-300">
                                            {formatCurrency(item.value)}
                                        </span>
                                        <button
                                            onClick={() => setAdditionToDelete(item)}
                                            className="p-1 text-gray-500 transition-colors rounded-md hover:bg-gray-600 hover:text-red-accent"
                                            title="Excluir item"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
            <ConfirmationModal
                isOpen={!!additionToDelete}
                onClose={() => setAdditionToDelete(null)}
                onConfirm={handleConfirmDeleteAddition}
                title="Confirmar Exclusão do Item"
                message={`Tem certeza que deseja excluir o item "${additionToDelete?.name}" da fatura?`}
            />
            <ConfirmationModal
                isOpen={isConfirmUnpayOpen}
                onClose={() => setIsConfirmUnpayOpen(false)}
                onConfirm={handleConfirmUnpay}
                title="Confirmar Alteração de Status"
                message={`Tem certeza que deseja marcar a transação "${transaction.name}" como 'Não Paga'?`}
            />
        </li>
    );
});

const TransactionList: React.FC<TransactionListProps> = ({ transactions, tabSummary, listActions, ...rest }) => {
    const sortedTransactions = [...transactions].sort((a, b) => {
        const weightA = a.status === PaymentStatus.PAID ? 1 : 0;
        const weightB = b.status === PaymentStatus.PAID ? 1 : 0;
        if (weightA !== weightB) {
            return weightA - weightB;
        }
        return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

  return (
    <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 sm:space-x-4">
                <h2 className="text-base sm:text-lg font-bold text-white">Transações do Mês</h2>
                {tabSummary && <div className="text-sm font-medium">{tabSummary}</div>}
            </div>
            {listActions && <div>{listActions}</div>}
        </div>
      {sortedTransactions.length > 0 ? (
        <ul className="space-y-3">
          {sortedTransactions.map((transaction) => (
            <TransactionItem key={transaction.id} transaction={transaction} {...rest} />
          ))}
        </ul>
      ) : (
        <div className="p-8 text-center bg-gray-700 rounded-lg">
          <p className="text-gray-400">Nenhuma transação encontrada para este mês.</p>
        </div>
      )}
    </div>
  );
};

export default TransactionList;
