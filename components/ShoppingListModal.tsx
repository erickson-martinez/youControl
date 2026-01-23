
import React, { useState, useEffect } from 'react';
import type { ShoppingList, Market } from '../types';

interface ShoppingListModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { name: string, marketId: string, date: string }) => Promise<void>;
    listToEdit: ShoppingList | null;
    markets: Market[];
}

const ShoppingListModal: React.FC<ShoppingListModalProps> = ({ isOpen, onClose, onSave, listToEdit, markets }) => {
    const [name, setName] = useState('');
    const [marketId, setMarketId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSaving, setIsSaving] = useState(false);

    // Efeito para gerar o nome automaticamente
    useEffect(() => {
        const todayStr = new Date(date).toLocaleDateString('pt-BR');
        if (marketId) {
            const marketName = markets.find(m => m.id === marketId)?.name || 'Loja';
            setName(`${marketName} - ${todayStr}`);
        } else {
            setName(`Lista de compras - ${todayStr}`);
        }
    }, [marketId, date, markets]);

    useEffect(() => {
        if (isOpen) {
            if (listToEdit) {
                // Se for edição, mantém o nome original (ou adapta a lógica se desejado)
                // Aqui assumimos que edição pode querer mudar a loja, então o nome reagiria
                // Mas para consistência com o requisito de criação:
                setMarketId(listToEdit.marketId);
                // A data pode vir da lista ou default hoje se não tiver
                setDate(listToEdit.date || new Date().toISOString().split('T')[0]);
            } else {
                setMarketId('');
                setDate(new Date().toISOString().split('T')[0]);
            }
        }
    }, [listToEdit, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!marketId) {
            alert("Por favor, selecione uma loja.");
            return;
        }

        setIsSaving(true);
        try {
            await onSave({ name, marketId, date });
        } catch (error) {
            alert(`Falha ao salvar: ${(error as Error).message}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
            <div className="w-full max-w-md p-6 mx-4 bg-gray-800 rounded-lg shadow-xl">
                <h2 className="mb-4 text-xl font-bold text-white">
                    {listToEdit ? 'Editar Lista' : 'Criar Nova Lista'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <fieldset disabled={isSaving} className="space-y-4">
                        <div>
                            <label htmlFor="list-market" className="block mb-2 text-sm font-medium text-gray-300">Selecione a Loja</label>
                            <select 
                                id="list-market" 
                                value={marketId} 
                                onChange={(e) => setMarketId(e.target.value)} 
                                required 
                                className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 disabled:opacity-50"
                            >
                                <option value="">Selecione...</option>
                                {markets.map(market => (
                                    <option key={market.id} value={market.id}>{market.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="list-date" className="block mb-2 text-sm font-medium text-gray-300">Data</label>
                            <input 
                                id="list-date" 
                                type="date" 
                                value={date} 
                                onChange={(e) => setDate(e.target.value)} 
                                required 
                                className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md disabled:opacity-50"
                            />
                        </div>
                        <div>
                            <label htmlFor="list-name" className="block mb-2 text-sm font-medium text-gray-300">Nome da Lista (Automático)</label>
                            <input 
                                id="list-name" 
                                type="text" 
                                value={name} 
                                readOnly
                                className="w-full px-3 py-2 text-gray-400 bg-gray-900 border border-gray-700 rounded-md cursor-not-allowed focus:outline-none"
                            />
                        </div>
                    </fieldset>
                    <div className="flex justify-end pt-4 space-x-3">
                        <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 font-medium text-gray-300 bg-gray-600 rounded-md hover:bg-gray-700 disabled:opacity-50">Cancelar</button>
                        <button type="submit" disabled={isSaving} className="px-4 py-2 font-medium text-white rounded-md bg-blue-accent hover:bg-blue-accent/90 disabled:bg-gray-500 disabled:cursor-wait">
                            {isSaving ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ShoppingListModal;
