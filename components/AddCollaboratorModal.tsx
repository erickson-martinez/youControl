
import React, { useState, useEffect } from 'react';
import type { Empresa } from '../types';

interface AddCollaboratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (phone: string, empresaId: string) => void;
    empresas: Empresa[];
}

const AddCollaboratorModal: React.FC<AddCollaboratorModalProps> = ({ isOpen, onClose, onSave, empresas }) => {
    const [phone, setPhone] = useState('');
    const [selectedEmpresa, setSelectedEmpresa] = useState<string>('');
    
    useEffect(() => {
        if (isOpen) {
            setPhone('');
            // Set default selected company if available
            setSelectedEmpresa(empresas.length > 0 ? empresas[0].id : '');
        }
    }, [isOpen, empresas]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (phone.trim() && selectedEmpresa) {
            onSave(phone.trim(), selectedEmpresa);
        } else {
            alert("Por favor, preencha o telefone e selecione uma empresa.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
            <div className="w-full max-w-md p-6 mx-4 bg-gray-800 rounded-lg shadow-xl">
                <h2 className="mb-4 text-xl font-bold text-white">
                    Adicionar Colaborador
                </h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="phone" className="block mb-2 text-sm font-medium text-gray-300">Telefone do Colaborador</label>
                        <input 
                            type="tel" 
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                            maxLength={11}
                            className={`w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-blue-500`}
                            placeholder="67912345678"
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="empresa" className="block mb-2 text-sm font-medium text-gray-300">Vincular à Empresa</label>
                        <select
                            id="empresa"
                            value={selectedEmpresa}
                            onChange={(e) => setSelectedEmpresa(e.target.value)}
                            required
                            className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-blue-500"
                        >
                            {empresas.length > 0 ? (
                                empresas.map(empresa => (
                                <option key={empresa.id} value={empresa.id}>
                                    {empresa.name}
                                </option>
                                ))
                            ) : (
                                <option value="" disabled>Nenhuma empresa cadastrada</option>
                            )}
                        </select>
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 font-medium text-gray-300 bg-gray-600 rounded-md hover:bg-gray-700">Cancelar</button>
                        <button type="submit" className="px-4 py-2 font-medium text-white rounded-md bg-blue-accent hover:bg-blue-accent/90">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddCollaboratorModal;
