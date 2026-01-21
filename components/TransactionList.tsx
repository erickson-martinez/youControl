
// FIX: Import useState and useMemo from React.
import React, { useState, useMemo } from 'react';
import type { Transaction, Addition } from '../types';
import { TransactionType, PaymentStatus } from '../types';
import { CheckCircleIcon, ClockIcon, ArrowUpCircleIcon, ArrowDownCircleIcon, XCircleIcon, ShareIcon, PencilIcon, TrashIcon, ChevronDownIcon, PlusIcon, MinusIcon, BellIcon } from './icons';
import ConfirmationModal from './ConfirmationModal';

interface TransactionListProps {
  transactions: Transaction[];
  currentUserPhone: string;
  onUpdateStatus: (transaction: Transaction, newStatus: PaymentStatus) => void;
  onToggleSimplePaid: (id: string) => Promise<void>;
  onStartEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  onDeleteSubTransaction: (transactionId: string, additionName: string, ownerPhone: string) => Promise<void>;
  onOpenAddValueModal: (transaction: Transaction) => void;
  isPastMonth: boolean;
}

interface TransactionItemProps {
  transaction: Transaction;
  currentUserPhone: string;
  onUpdateStatus: (transaction: Transaction, newStatus: PaymentStatus) => void;
  onToggleSimplePaid: (id: string) => Promise<void>;
  onStartEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  onDeleteSubTransaction: (transactionId: string, additionName: string, ownerPhone: string) => Promise<void>;
  onOpenAddValueModal: (transaction: Transaction) => void;
  isPastMonth: boolean;
}

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const StatusBadge: React.FC<{ status: PaymentStatus }> = ({ status }) => {
    const statusMap = {
        [PaymentStatus.PAID]: { text: 'Pago', icon: <CheckCircleIcon className="w-4 h-4" />, color: 'text-green-accent' },
        [PaymentStatus.UNPAID]: { text: 'Não Pago', icon: <XCircleIcon className="w-4 h-4" />, color: 'text-red-accent' },
        [PaymentStatus.PENDING]: { text: 'Pendente', icon: <ClockIcon className="w-4 h-4" />, color: 'text-yellow-accent' },
    };
    const { text, icon, color } = statusMap[status] || statusMap[PaymentStatus.UNPAID];
    return <div className={`flex items-center flex-shrink-0 space-x-1 text-xs font-medium px-2 py-1 rounded-full ${color} bg-gray-700`}>{icon}<span>{text}</span></div>;
};

const TransactionItem: React.FC<TransactionItemProps> = React.memo(({ transaction, currentUserPhone, onUpdateStatus, onToggleSimplePaid, onStartEdit, onDelete, onDeleteSubTransaction, onOpenAddValueModal, isPastMonth }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [additionToDelete, setAdditionToDelete] = useState<Addition | null>(null);
    const [isConfirmUnpayOpen, setIsConfirmUnpayOpen] = useState(false);

    const isRevenue = transaction.type === TransactionType.REVENUE;
    const isPaid = transaction.status === PaymentStatus.PAID;

    // True when I am the creditor of a controlled revenue and the debtor has sent a payment request. My action is required.
    const isPendingApprovalFromMe = transaction.isControlled && isRevenue && transaction.status === PaymentStatus.PENDING && transaction.ownerPhone === currentUserPhone;
    
    // True when I am the creator/collector of a controlled revenue I created (covers all its states)
    const isCollectorOfControlledRevenue = transaction.isControlled && isRevenue && transaction.ownerPhone === currentUserPhone;
    
    const addValueTitle = isPastMonth
        ? "Não é possível adicionar valores em meses anteriores"
        : isPaid
        ? "Não é possível adicionar valores a transações já pagas."
        : isRevenue ? "Adicionar item à receita" : "Adicionar item à despesa";

    const activeAdditions = useMemo(() => transaction.additions?.filter(a => !a.removed) || [], [transaction.additions]);

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
            await onDeleteSubTransaction(transaction.id, additionToDelete.name, transaction.ownerPhone);
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
                <label 
                    htmlFor={`confirm-toggle-${transaction.id}`} 
                    className="flex items-center space-x-2 cursor-pointer"
                    title="Confirmar Pagamento"
                >
                    <input
                        type="checkbox"
                        id={`confirm-toggle-${transaction.id}`}
                        checked={false}
                        onChange={() => onUpdateStatus(transaction, PaymentStatus.PAID)}
                        className="w-5 h-5 text-green-accent bg-gray-600 border-gray-500 rounded focus:ring-green-accent focus:ring-offset-gray-800"
                    />
                    <span className="text-sm text-gray-300">Pago</span>
                </label>
            );
        }

        // Case 2: Collector of a controlled revenue (PAID/UNPAID states) has direct control
        if (isCollectorOfControlledRevenue) {
            const isDisabled = isPastMonth && isPaid;
            const title = isDisabled 
                ? "Não é possível alterar o status em meses anteriores." 
                : isPaid ? "Marcar como Não Recebido" : "Confirmar Recebimento";
            return (
                <label 
                    htmlFor={`paid-toggle-${transaction.id}`} 
                    className={`flex items-center space-x-2 ${isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                    title={title}
                >
                    <input
                        type="checkbox"
                        id={`paid-toggle-${transaction.id}`}
                        checked={isPaid}
                        onChange={handleSimpleToggle}
                        disabled={isDisabled}
                        className="w-5 h-5 text-green-accent bg-gray-600 border-gray-500 rounded focus:ring-green-accent focus:ring-offset-gray-800 disabled:cursor-not-allowed"
                    />
                    <span className="text-sm text-gray-300">Recebido</span>
                </label>
            );
        }
        
        // Case 3: Other controlled transactions (e.g., expenses from debtor's POV)
        if (transaction.isControlled) {
            return <StatusBadge status={transaction.status} />;
        }
        
        // Case 4: Default for simple (non-controlled) transactions
        const isSimpleToggleDisabled = isPastMonth && isPaid;
        const simpleTitle = isSimpleToggleDisabled 
            ? "Não é possível alterar o status em meses anteriores."
            : isPaid ? "Marcar como Não Pago" : "Marcar como Pago";
        return (
             <label 
                htmlFor={`paid-toggle-${transaction.id}`} 
                className={`flex items-center space-x-2 ${isSimpleToggleDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                title={simpleTitle}
            >
                <input
                    type="checkbox"
                    id={`paid-toggle-${transaction.id}`}
                    checked={isPaid}
                    onChange={handleSimpleToggle}
                    disabled={isSimpleToggleDisabled}
                    className="w-5 h-5 text-green-accent bg-gray-600 border-gray-500 rounded focus:ring-green-accent focus:ring-offset-gray-800 disabled:cursor-not-allowed"
                />
                <span className="text-sm text-gray-300">Pago</span>
            </label>
        );
    };

    return (
        <li className="p-3 bg-gray-700 rounded-lg">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
                {/* LEFT SIDE */}
                <div className="flex items-center justify-between flex-grow min-w-0">
                    <div className="flex items-center min-w-0 space-x-3">
                        {isRevenue ? <ArrowUpCircleIcon className="flex-shrink-0 w-6 h-6 text-green-accent" /> : <ArrowDownCircleIcon className="flex-shrink-0 w-6 h-6 text-red-accent" />}
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="font-semibold text-white truncate">{transaction.name}</p>
                                {isPendingApprovalFromMe && (
                                    <span title="Aguardando sua confirmação de recebimento">
                                        <BellIcon className="w-5 h-5 text-yellow-accent animate-pulse" />
                                    </span>
                                )}
                                {transaction.ownerPhone !== currentUserPhone && (
                                    <span className="inline-flex items-center flex-shrink-0 px-2 py-0.5 text-xs text-purple-300 bg-purple-800 rounded-full" title={`Compartilhado por ${transaction.ownerPhone}`}>
                                        <ShareIcon className="w-3 h-3 mr-1.5" />
                                        <span>{transaction.ownerPhone}</span>
                                    </span>
                                )}
                            </div>
                            <p className="flex items-center mt-1 text-sm text-gray-400 truncate">
                                <span>{new Date(transaction.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</span>
                                {transaction.isControlled && (
                                    <span className="flex items-center ml-2" title={`Transação controlada com: ${transaction.counterpartyPhone}`}>
                                        <ShareIcon className="w-3.5 h-3.5 text-purple-400" />
                                        <span className="ml-1.5 text-xs">Controlada</span>
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                    {transaction.ownerPhone === currentUserPhone && !isPendingApprovalFromMe && (
                         <button 
                            onClick={handleDelete}
                            className="p-1.5 text-gray-400 transition-colors rounded-md hover:bg-gray-600 hover:text-red-accent"
                            title="Excluir"
                            aria-label="Excluir transação"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* RIGHT SIDE - Mobile: space-between, Desktop: justify-end */}
                <div className="flex flex-wrap items-center justify-between w-full gap-x-4 gap-y-2 sm:w-auto sm:justify-end">
                    <p className={`font-bold text-base whitespace-nowrap ${isRevenue ? 'text-green-accent' : 'text-red-accent'}`}>
                        {formatCurrency(transaction.amount)}
                    </p>
                    
                    <div className="flex items-center flex-wrap justify-end gap-x-3 gap-y-2">
                        {transaction.isControlled && transaction.ownerPhone === currentUserPhone && transaction.type === TransactionType.EXPENSE && transaction.status === PaymentStatus.UNPAID && (
                            <button onClick={() => onUpdateStatus(transaction, PaymentStatus.PENDING)} className="px-2 py-1 text-xs text-white transition-colors bg-blue-accent rounded-md hover:bg-blue-accent/90">Solicitar</button>
                        )}
                        {isPendingApprovalFromMe && (
                            <button onClick={() => onUpdateStatus(transaction, PaymentStatus.UNPAID)} className="px-2 py-1 text-xs text-white transition-colors bg-red-600 rounded-md hover:bg-red-700">Recusar</button>
                        )}

                        {transaction.ownerPhone === currentUserPhone && !isPendingApprovalFromMe && (
                            <>
                            <button
                                onClick={() => onOpenAddValueModal(transaction)}
                                disabled={isPastMonth || isPaid}
                                className={`flex items-center justify-center px-2 py-1 text-xs font-bold text-white rounded-md transition-colors ${
                                    isRevenue
                                        ? 'bg-green-accent/90 hover:bg-green-accent'
                                        : 'bg-red-accent/90 hover:bg-red-accent'
                                } disabled:bg-gray-600 disabled:cursor-not-allowed`}
                                title={addValueTitle}
                                aria-label={addValueTitle}
                            >
                                {isRevenue ? <PlusIcon className="w-4 h-4" /> : <MinusIcon className="w-4 h-4" />}
                                <span className="ml-1">$</span>
                            </button>
                            <button 
                                onClick={() => onStartEdit(transaction)}
                                disabled={transaction.isControlled || isPastMonth}
                                className="p-1.5 text-gray-400 transition-colors rounded-md hover:bg-gray-600 disabled:text-gray-600 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                title={transaction.isControlled ? "Não é possível editar transações controladas" : (isPastMonth ? "Não é possível editar em meses anteriores" : "Editar")}
                                aria-label="Editar transação"
                            >
                                <PencilIcon className="w-4 h-4" />
                            </button>
                            </>
                        )}
                        
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

const TransactionList: React.FC<TransactionListProps> = ({ transactions, ...rest }) => {
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Transações do Mês</h2>
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
