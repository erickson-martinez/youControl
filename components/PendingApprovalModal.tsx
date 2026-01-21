
import React, { useState } from 'react';
import type { Transaction } from '../types';

interface PendingApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingTransactions: Transaction[];
  onApprove: (transactionId: string) => Promise<void>;
  onReject: (transactionId: string) => Promise<void>;
  userMap: Record<string, string>;
}

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
};

const PendingApprovalModal: React.FC<PendingApprovalModalProps> = ({ isOpen, onClose, pendingTransactions, onApprove, onReject, userMap }) => {
    const [processingId, setProcessingId] = useState<string | null>(null);

    const handleApprove = async (transactionId: string) => {
        setProcessingId(transactionId);
        try {
            await onApprove(transactionId);
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (transactionId: string) => {
        setProcessingId(transactionId);
        try {
            await onReject(transactionId);
        } finally {
            setProcessingId(null);
        }
    };


    if (!isOpen || pendingTransactions.length === 0) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
            <div className="w-full max-w-lg p-6 mx-4 bg-gray-800 rounded-lg shadow-xl">
                <h2 className="mb-4 text-2xl font-bold text-white">Pagamentos Pendentes de Aprovação</h2>
                <p className="mb-6 text-gray-400">Os seguintes pagamentos foram solicitados e aguardam sua confirmação.</p>
                
                <div className="pr-2 space-y-3 overflow-y-auto max-h-72">
                    {pendingTransactions.map(tx => {
                        const isProcessing = processingId === tx.id;
                        const debtorName = tx.counterpartyPhone ? userMap[tx.counterpartyPhone] || tx.counterpartyPhone : 'Desconhecido';
                        return (
                             <div key={tx.id} className="p-3 bg-gray-700 rounded-lg">
                                <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
                                    <div className='flex-1 min-w-0'>
                                        <p className="font-semibold text-white truncate">{tx.name}</p>
                                        <p className="text-sm text-gray-400">
                                            Solicitado por: <span className="font-medium text-gray-300">{debtorName}</span>
                                        </p>
                                        <p className="text-sm text-gray-400">
                                            Data: {formatDate(tx.date)}
                                        </p>
                                    </div>
                                    <div className='flex items-center justify-between w-full sm:w-auto sm:justify-end sm:gap-4'>
                                        <p className={`font-bold ${tx.type === 'revenue' ? 'text-green-accent' : 'text-red-accent'}`}>
                                            {formatCurrency(tx.amount)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-end mt-3 space-x-2">
                                  <button onClick={() => handleReject(tx.id)} disabled={isProcessing} className="px-3 py-1 text-xs font-semibold text-white transition-colors bg-red-accent rounded-md hover:bg-red-accent/90 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {isProcessing ? '...' : 'Rejeitar'}
                                  </button>
                                  <button onClick={() => handleApprove(tx.id)} disabled={isProcessing} className="px-3 py-1 text-xs font-semibold text-white transition-colors bg-green-accent rounded-md hover:bg-green-accent/90 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {isProcessing ? '...' : 'Aprovar'}
                                  </button>
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

export default PendingApprovalModal;
