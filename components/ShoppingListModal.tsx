
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

    useEffect(() => {
        if (isOpen) {
            if (listToEdit) {
                setName(listToEdit.name);
                setMarketId(listToEdit.marketId);
                setDate(listToEdit.date);
            } else {
                setName('');
                setMarketId(markets.length > 0 ? markets[0].id : '');
                setDate(new Date().toISOString().split('T')[0]);
            }
        }
    }, [listToEdit, isOpen, markets]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !marketId || !date) return;

        setIsSaving(true);
        try {
            await onSave({ name: name.trim(), marketId, date });
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
                    {listToEdit ? 'Editar Lista' : 'Nova Lista de Compras'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <fieldset disabled={isSaving} className="space-y-4">
                        <div>
                            <label htmlFor="list-name" className="block mb-2 text-sm font-medium text-gray-300">Nome da Lista</label>
                            <input id="list-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md disabled:opacity-50"/>
                        </div>
                        <div>
                            <label htmlFor="list-market" className="block mb-2 text-sm font-medium text-gray-300">Mercado</label>
                            <select id="list-market" value={marketId} onChange={(e) => setMarketId(e.target.value)} required className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md disabled:opacity-50">
                                {markets.map(market => (
                                    <option key={market.id} value={market.id}>{market.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="list-date" className="block mb-2 text-sm font-medium text-gray-300">Data</label>
                            <input id="list-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md disabled:opacity-50"/>
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
