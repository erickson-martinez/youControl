
import React, { useState, useEffect } from 'react';
import type { Market } from '../types';

interface MarketModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { name: string }) => Promise<void>;
    marketToEdit: Market | null;
}

const MarketModal: React.FC<MarketModalProps> = ({ isOpen, onClose, onSave, marketToEdit }) => {
    const [name, setName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (marketToEdit) {
            setName(marketToEdit.name);
        } else {
            setName('');
        }
    }, [marketToEdit, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSaving(true);
        try {
            await onSave({ name: name.trim() });
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
                    {marketToEdit ? 'Editar Mercado' : 'Adicionar Mercado'}
                </h2>
                <form onSubmit={handleSubmit}>
                    <fieldset disabled={isSaving}>
                        <div className="mb-6">
                            <label htmlFor="market-name" className="block mb-2 text-sm font-medium text-gray-300">Nome do Mercado</label>
                            <input
                                id="market-name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 disabled:opacity-50"
                            />
                        </div>
                    </fieldset>
                    <div className="flex justify-end space-x-3">
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

export default MarketModal;
