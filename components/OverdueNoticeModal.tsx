
import React, { useState } from 'react';
import type { Transaction } from '../types';

interface OverdueNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  overdueTransactions: Transaction[];
  onMarkAsPaid: (transactionId: string) => Promise<void>;
}

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
};

const getDaysOverdue = (dateString: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Parse YYYY-MM-DD as local date to avoid timezone issues with `new Date()`
    const parts = dateString.split('-').map(p => parseInt(p, 10));
    const dueDate = new Date(parts[0], parts[1] - 1, parts[2]);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - dueDate.getTime();
    if (diffTime < 0) return 0;
    
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};


const OverdueNoticeModal: React.FC<OverdueNoticeModalProps> = ({ isOpen, onClose, overdueTransactions, onMarkAsPaid }) => {
    const [payingId, setPayingId] = useState<string | null>(null);

    const handleMarkAsPaid = async (transactionId: string) => {
        setPayingId(transactionId);
        try {
            await onMarkAsPaid(transactionId);
        } catch (error) {
            console.error('Falha ao marcar como pago:', error);
            alert('Não foi possível marcar a transação como paga.');
        } finally {
            setPayingId(null);
        }
    };

    if (!isOpen || overdueTransactions.length === 0) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
            <div className="w-full max-w-lg p-6 mx-4 bg-gray-800 rounded-lg shadow-xl">
                <h2 className="mb-4 text-2xl font-bold text-white">Avisos de Vencimento</h2>
                <p className="mb-6 text-gray-400">As seguintes transações estão vencidas. Revise-as para manter suas finanças em dia.</p>
                
                <div className="pr-2 space-y-3 overflow-y-auto max-h-72">
                    {overdueTransactions.map(tx => {
                        const daysOverdue = getDaysOverdue(tx.date);
                        const isPaying = payingId === tx.id;
                        return (
                             <div key={tx.id} className="p-3 bg-gray-700 rounded-lg">
                                <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
                                    <div className='flex-1 min-w-0'>
                                        <p className="font-semibold text-white truncate">{tx.name}</p>
                                        <p className="text-sm text-gray-400">
                                            Venceu em: {formatDate(tx.date)}
                                        </p>
                                    </div>
                                    <div className='flex items-center justify-between w-full sm:w-auto sm:justify-end sm:gap-4'>
                                        <div className='text-right'>
                                            <p className={`font-bold ${tx.type === 'revenue' ? 'text-green-accent' : 'text-red-accent'}`}>
                                                {formatCurrency(tx.amount)}
                                            </p>
                                            {daysOverdue > 0 && (
                                                <p className="text-xs font-bold text-red-accent">{daysOverdue} dia{daysOverdue > 1 ? 's' : ''} atrás</p>
                                            )}
                                        </div>
                                        <button 
                                            onClick={() => handleMarkAsPaid(tx.id)}
                                            disabled={isPaying}
                                            className="px-3 py-1 text-xs font-semibold text-white transition-colors rounded-md bg-green-accent hover:bg-green-accent/90 disabled:bg-gray-600 disabled:cursor-wait"
                                        >
                                            {isPaying ? 'Pagando...' : 'Marcar como Paga'}
                                        </button>
                                    </div>
                                </div>
                             </div>
                        );
                    })}
                </div>

                <div className="flex justify-end pt-6">
                    <button type="button" onClick={onClose} className="px-6 py-2 font-medium text-gray-300 bg-gray-600 rounded-md hover:bg-gray-700">
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OverdueNoticeModal;
