
import React, { useState, useEffect } from 'react';
import type { Loja } from '../types';

interface LojaFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<Loja, 'id'>) => Promise<void>;
    lojaToEdit: Loja | null;
}

const initialState = {
    name: '',
    address: '',
    number: '',
    zip: '',
    status: 'active' as 'active' | 'inactive',
};

const LojaFormModal: React.FC<LojaFormModalProps> = ({ isOpen, onClose, onSave, lojaToEdit }) => {
    const [formData, setFormData] = useState(initialState);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (lojaToEdit) {
            setFormData({
                name: lojaToEdit.name || '',
                address: lojaToEdit.address || '',
                number: lojaToEdit.number || '',
                zip: lojaToEdit.zip || '',
                status: lojaToEdit.status,
            });
        } else {
            setFormData(initialState);
        }
    }, [lojaToEdit, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave(formData);
        } catch (error) {
            console.error("Falha ao salvar loja:", error);
            alert(`Ocorreu um erro ao salvar: ${(error as Error).message}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
            <div className="w-full max-w-lg p-6 mx-4 bg-gray-800 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
                <h2 className="mb-4 text-2xl font-bold text-white">
                    {lojaToEdit ? 'Editar Loja' : 'Cadastrar Nova Loja'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <fieldset disabled={isSaving} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block mb-1 text-sm text-gray-300">Nome da Loja*</label>
                            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md disabled:opacity-50"/>
                        </div>
                        <div>
                            <label htmlFor="address" className="block mb-1 text-sm text-gray-300">Endereço</label>
                            <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md disabled:opacity-50"/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label htmlFor="number" className="block mb-1 text-sm text-gray-300">Número</label>
                                <input type="text" name="number" id="number" value={formData.number} onChange={handleChange} className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md disabled:opacity-50"/>
                            </div>
                             <div>
                                <label htmlFor="zip" className="block mb-1 text-sm text-gray-300">CEP</label>
                                <input type="text" name="zip" id="zip" value={formData.zip} onChange={handleChange} className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md disabled:opacity-50"/>
                            </div>
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

export default LojaFormModal;
