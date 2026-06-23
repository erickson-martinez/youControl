import React, { useState, useEffect } from 'react';
import type { Transaction } from '../types';
import { formatCurrency } from '../utils/format'; // wait, do we have formatCurrency in utils? I will redefine it

interface EndMonthReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    investments: Transaction[];
    onUpdateInvestment: (transaction: Transaction, newAmount: number) => Promise<void>;
}

const EndMonthReviewModal: React.FC<EndMonthReviewModalProps> = ({ isOpen, onClose, investments, onUpdateInvestment }) => {
    const [values, setValues] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [updatedList, setUpdatedList] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            const initialValues: Record<string, string> = {};
            investments.forEach(inv => {
                initialValues[inv.id] = inv.amount.toString();
            });
            setValues(initialValues);
            setUpdatedList([]);
        }
    }, [isOpen, investments]);

    if (!isOpen) return null;

    const handleValueChange = (id: string, val: string) => {
        setValues(prev => ({ ...prev, [id]: val }));
    };

    const handleUpdate = async (id: string) => {
        const inv = investments.find(i => i.id === id);
        if (!inv) return;
        
        setIsSubmitting(true);
        try {
            await onUpdateInvestment(inv, Number(values[id]));
            setUpdatedList(prev => [...prev, id]);
        } catch (error) {
            alert('Falha ao atualizar investimento.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-lg p-6 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-y-auto max-h-[90vh]">
                <h3 className="mb-2 text-xl font-bold text-white text-yellow-400">Revisão de Final de Mês</h3>
                <p className="mb-4 text-sm text-gray-300 leading-relaxed">
                    Hoje é o último dia do mês! Revise e atualize os valores reais dos seus investimentos de acordo com o seu banco.
                </p>
                <div className="space-y-4 mb-6">
                    {investments.length === 0 ? (
                        <p className="text-gray-500">Nenhum investimento para revisar este mês.</p>
                    ) : (
                        investments.map(inv => {
                            const isUpdated = updatedList.includes(inv.id);
                            return (
                                <div key={inv.id} className={`p-4 rounded-lg bg-gray-900 border ${isUpdated ? 'border-green-500/50' : 'border-gray-700'} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
                                    <div className="flex-1">
                                        <div className="font-medium text-white">{inv.name}</div>
                                        <div className="text-xs text-gray-400 mt-1">Estimativa Atual: {Number(inv.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            className="w-28 px-2 py-1 text-sm text-white bg-gray-800 border border-gray-600 rounded focus:ring-yellow-accent focus:border-yellow-accent"
                                            value={values[inv.id] || ''}
                                            onChange={(e) => handleValueChange(inv.id, e.target.value)}
                                            disabled={isSubmitting || isUpdated}
                                        />
                                        <button 
                                            onClick={() => handleUpdate(inv.id)}
                                            disabled={isSubmitting || isUpdated || Number(values[inv.id]) === inv.amount}
                                            className="px-3 py-1 font-medium text-xs rounded bg-yellow-accent text-gray-900 disabled:opacity-50 transition-colors"
                                        >
                                            {isUpdated ? 'Feito' : 'Atualizar'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
                <div className="flex justify-end pt-2">
                    <button 
                        onClick={onClose} 
                        disabled={isSubmitting} 
                        className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EndMonthReviewModal;
