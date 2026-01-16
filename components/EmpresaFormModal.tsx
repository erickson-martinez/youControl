
import React, { useState, useEffect } from 'react';
import type { Empresa } from '../types';

interface EmpresaFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<Empresa, 'id' | 'owner'>) => void;
    empresaToEdit: Empresa | null;
}

const initialState = {
    name: '',
    cnpj: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    status: 'ativo' as 'ativo' | 'inativo',
};

const EmpresaFormModal: React.FC<EmpresaFormModalProps> = ({ isOpen, onClose, onSave, empresaToEdit }) => {
    const [formData, setFormData] = useState(initialState);

    useEffect(() => {
        if (empresaToEdit) {
            setFormData({
                name: empresaToEdit.name || '',
                cnpj: empresaToEdit.cnpj || '',
                phone: empresaToEdit.phone || '',
                email: empresaToEdit.email || '',
                address: empresaToEdit.address || '',
                city: empresaToEdit.city || '',
                state: empresaToEdit.state || '',
                zipCode: empresaToEdit.zipCode || '',
                status: empresaToEdit.status,
            });
        } else {
            setFormData(initialState);
        }
    }, [empresaToEdit, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
            <div className="w-full max-w-2xl p-6 mx-4 bg-gray-800 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
                <h2 className="mb-4 text-2xl font-bold text-white">
                    {empresaToEdit ? 'Editar Empresa' : 'Cadastrar Nova Empresa'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label htmlFor="name" className="block mb-1 text-sm text-gray-300">Nome da Empresa*</label>
                            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md"/>
                        </div>
                        <div>
                            <label htmlFor="cnpj" className="block mb-1 text-sm text-gray-300">CNPJ</label>
                            <input type="text" name="cnpj" id="cnpj" value={formData.cnpj} onChange={handleChange} className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md"/>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label htmlFor="phone" className="block mb-1 text-sm text-gray-300">Telefone</label>
                            <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md"/>
                        </div>
                        <div>
                            <label htmlFor="email" className="block mb-1 text-sm text-gray-300">Email</label>
                            <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md"/>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="address" className="block mb-1 text-sm text-gray-300">Endereço</label>
                        <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md"/>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                         <div>
                            <label htmlFor="city" className="block mb-1 text-sm text-gray-300">Cidade</label>
                            <input type="text" name="city" id="city" value={formData.city} onChange={handleChange} className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md"/>
                        </div>
                         <div>
                            <label htmlFor="state" className="block mb-1 text-sm text-gray-300">Estado</label>
                            <input type="text" name="state" id="state" value={formData.state} onChange={handleChange} maxLength={2} className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md"/>
                        </div>
                         <div>
                            <label htmlFor="zipCode" className="block mb-1 text-sm text-gray-300">CEP</label>
                            <input type="text" name="zipCode" id="zipCode" value={formData.zipCode} onChange={handleChange} className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md"/>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 font-medium text-gray-300 bg-gray-600 rounded-md hover:bg-gray-700">Cancelar</button>
                        <button type="submit" className="px-4 py-2 font-medium text-white rounded-md bg-blue-accent hover:bg-blue-accent/90">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EmpresaFormModal;
