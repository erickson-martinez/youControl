
import React, { useState, useEffect, useCallback } from 'react';
import type { Transaction } from '../types';
import { API_BASE_URL } from '../constants';
import { TransactionType } from '../types';

interface CompleteListModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (financialData: any) => Promise<void>;
    listName: string;
    totalAmount: number;
    userPhone: string;
}

const CompleteListModal: React.FC<CompleteListModalProps> = ({ 
    isOpen, onClose, onConfirm, listName, totalAmount, userPhone 
}) => {
    // Estados do Formulário
    // 'registered' = Já registrei no sistema (apenas conclui a lista)
    const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid' | 'registered' | null>(null);
    const [date, setDate] = useState('');
    const [mode, setMode] = useState<'new' | 'existing'>('new');
    
    // Para modo 'new'
    const [expenseName, setExpenseName] = useState(listName);
    
    // Para modo 'existing'
    const [availableTransactions, setAvailableTransactions] = useState<Transaction[]>([]);
    const [selectedTransactionId, setSelectedTransactionId] = useState('');
    const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Inicialização ao abrir o modal
    useEffect(() => {
        if (isOpen) {
            setPaymentStatus(null); // Nada marcado inicialmente
            setMode('new');
            setExpenseName(listName);
            setSelectedTransactionId('');
            setAvailableTransactions([]);
            // Data será definida quando o usuário escolher o status
        }
    }, [isOpen, listName]);

    // Manipula a seleção de status de pagamento
    const handleStatusSelect = (status: 'paid' | 'unpaid' | 'registered') => {
        setPaymentStatus(status);
        const today = new Date();
        
        if (status === 'paid') {
            // Se pago: data é hoje, modo é nova despesa
            setDate(today.toISOString().split('T')[0]);
            setMode('new'); 
        } else if (status === 'unpaid') {
            // Se não pago: sugere próximo mês (ex: fatura cartão)
            // Pega o mês atual + 1, dia 10 (padrão seguro)
            const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 10);
            setDate(nextMonth.toISOString().split('T')[0]);
            setMode('new'); // Começa como nova, usuário pode mudar
        } else {
            // Se já registrou, não precisa de data ou modo
            setDate('');
            setMode('new');
        }
    };

    // Busca transações se estiver no modo 'existing' e status 'unpaid'
    const fetchTransactionsForDate = useCallback(async () => {
        if (paymentStatus === 'unpaid' && mode === 'existing' && date) {
            setIsLoadingTransactions(true);
            try {
                const dateObj = new Date(date);
                const month = dateObj.getMonth() + 1;
                const year = dateObj.getFullYear();
                
                const response = await fetch(`${API_BASE_URL}/transactions?phone=${userPhone}&month=${month}&year=${year}`);
                if (response.ok) {
                    const data = await response.json();
                    // Filtra apenas Despesas NÃO PAGAS e mapeia ID
                    const expenses = (data.transactions || [])
                        .filter((t: any) => t.type === TransactionType.EXPENSE && t.status === 'nao_pago')
                        .map((t: any) => ({ ...t, id: t._id || t.id }));
                    setAvailableTransactions(expenses);
                }
            } catch (error) {
                console.error("Erro ao buscar transações", error);
            } finally {
                setIsLoadingTransactions(false);
            }
        }
    }, [date, mode, paymentStatus, userPhone]);

    useEffect(() => {
        fetchTransactionsForDate();
    }, [fetchTransactionsForDate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentStatus) return;
        
        setIsSubmitting(true);
        
        try {
            // Se escolheu "Já registrei", enviamos flag para pular transação
            if (paymentStatus === 'registered') {
                await onConfirm({ skipTransaction: true });
                onClose();
                return;
            }

            const isPaid = paymentStatus === 'paid';
            const payload: any = {
                mode,
                isPaid,
                date
            };

            if (mode === 'new') {
                payload.data = {
                    ownerPhone: userPhone,
                    type: TransactionType.EXPENSE,
                    name: expenseName,
                    amount: totalAmount,
                    date: date,
                    status: isPaid ? 'pago' : 'nao_pago'
                };
            } else {
                if (!selectedTransactionId) {
                    alert("Selecione uma despesa existente.");
                    setIsSubmitting(false);
                    return;
                }
                payload.data = {
                    transactionId: selectedTransactionId,
                    description: `Lista: ${listName}`,
                    additionalAmount: totalAmount,
                    ownerPhone: userPhone
                };
            }

            await onConfirm(payload);
            onClose();
        } catch (error) {
            alert("Erro ao processar: " + (error as Error).message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
            <div className="w-full max-w-lg p-6 mx-4 bg-gray-800 rounded-lg shadow-xl">
                <h2 className="mb-4 text-xl font-bold text-white">Concluir Lista</h2>
                <div className="p-3 mb-4 bg-gray-700 rounded-md">
                    <p className="text-gray-300 text-sm">Lista: <span className="font-bold text-white">{listName}</span></p>
                    <p className="text-gray-300 text-sm">Valor Total: <span className="font-bold text-red-accent">R$ {totalAmount.toFixed(2)}</span></p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {/* Seleção de Status (Obrigatório) */}
                    <div className="flex flex-col gap-2 p-1 bg-gray-700 rounded-lg sm:flex-row">
                        <button
                            type="button"
                            onClick={() => handleStatusSelect('paid')}
                            className={`flex-1 py-2 px-2 text-sm font-medium rounded-md transition-colors ${paymentStatus === 'paid' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-600'}`}
                        >
                            Já paguei
                        </button>
                        <button
                            type="button"
                            onClick={() => handleStatusSelect('unpaid')}
                            className={`flex-1 py-2 px-2 text-sm font-medium rounded-md transition-colors ${paymentStatus === 'unpaid' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-600'}`}
                        >
                            Vou pagar depois
                        </button>
                        <button
                            type="button"
                            onClick={() => handleStatusSelect('registered')}
                            className={`flex-1 py-2 px-2 text-sm font-medium rounded-md transition-colors ${paymentStatus === 'registered' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-600'}`}
                        >
                            Já registrei
                        </button>
                    </div>

                    {/* Conteúdo Condicional só aparece após seleção */}
                    {paymentStatus && (
                        <>
                             {/* Mensagem informativa para modo 'registered' */}
                             {paymentStatus === 'registered' && (
                                <div className="p-3 text-sm text-blue-200 bg-blue-900/30 rounded-md border border-blue-800">
                                    <p>A lista será marcada como concluída, mas <strong>nenhuma nova despesa</strong> será gerada no financeiro.</p>
                                </div>
                            )}

                            {/* Seleção de Modo (Apenas para Não Pago) */}
                            {paymentStatus === 'unpaid' && (
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-300">Destino da Despesa</label>
                                    <div className="flex flex-col gap-2">
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input 
                                                type="radio" 
                                                name="mode" 
                                                checked={mode === 'new'} 
                                                onChange={() => setMode('new')}
                                                className="text-blue-500 focus:ring-blue-500 bg-gray-700 border-gray-600"
                                            />
                                            <span className="text-white">Criar uma nova despesa</span>
                                        </label>
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input 
                                                type="radio" 
                                                name="mode" 
                                                checked={mode === 'existing'} 
                                                onChange={() => setMode('existing')}
                                                className="text-blue-500 focus:ring-blue-500 bg-gray-700 border-gray-600"
                                            />
                                            <span className="text-white">Adicionar a uma despesa existente (ex: Cartão)</span>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Campo de Data (Apenas para Não Pago + Nova Despesa) */}
                            {paymentStatus === 'unpaid' && mode === 'new' && (
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-300">
                                        Data de Vencimento
                                    </label>
                                    <input 
                                        type="date" 
                                        value={date} 
                                        onChange={(e) => setDate(e.target.value)} 
                                        required 
                                        className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-blue-500"
                                    />
                                </div>
                            )}

                            {paymentStatus !== 'registered' && <div className="border-t border-gray-600 my-4"></div>}

                            {/* Inputs Específicos do Modo (apenas se não for 'registered') */}
                            {paymentStatus !== 'registered' && (
                                mode === 'new' ? (
                                    <div>
                                        <label className="block mb-1 text-sm font-medium text-gray-300">Nome da Despesa</label>
                                        <input 
                                            type="text" 
                                            value={expenseName} 
                                            onChange={(e) => setExpenseName(e.target.value)} 
                                            required 
                                            className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-blue-500"
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block mb-1 text-sm font-medium text-gray-300">Selecione a Despesa ({isLoadingTransactions ? 'Carregando...' : 'Disponíveis no próximo mês'})</label>
                                        <select 
                                            value={selectedTransactionId} 
                                            onChange={(e) => setSelectedTransactionId(e.target.value)} 
                                            required 
                                            className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-blue-500"
                                        >
                                            <option value="">Selecione...</option>
                                            {availableTransactions.map(t => (
                                                <option key={t.id} value={t.id}>
                                                    {t.name} (R$ {t.amount.toFixed(2)}) - {t.date.split('T')[0].split('-').reverse().join('/')}
                                                </option>
                                            ))}
                                        </select>
                                        {availableTransactions.length === 0 && !isLoadingTransactions && (
                                            <p className="text-xs text-yellow-500 mt-1">Nenhuma despesa não paga encontrada para o mês calculado.</p>
                                        )}
                                    </div>
                                )
                            )}

                            <div className="flex justify-end pt-4 space-x-3">
                                <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 font-medium text-gray-300 bg-gray-600 rounded-md hover:bg-gray-700 disabled:opacity-50">Cancelar</button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 font-medium text-white rounded-md bg-blue-accent hover:bg-blue-accent/90 disabled:bg-gray-500 disabled:cursor-wait">
                                    {isSubmitting ? 'Processando...' : 'Concluir Lista'}
                                </button>
                            </div>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
};

export default CompleteListModal;
