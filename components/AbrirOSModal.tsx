
import React, { useState, useEffect } from 'react';
import type { Empresa, OrdemServico } from '../types';

interface AbrirOSModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (osData: Omit<OrdemServico, 'id' | 'status' | 'createdAt' | 'openerPhone' | 'empresaId' | 'resolution'>) => void;
    userCompany: Empresa;
}

const AbrirOSModal: React.FC<AbrirOSModalProps> = ({ isOpen, onClose, onSave, userCompany }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setDescription('');
        }
    }, [isOpen]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title && description) {
            onSave({
                title,
                description,
            });
            onClose();
        } else {
            alert('Por favor, preencha todos os campos.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
            <div className="w-full max-w-lg p-6 mx-4 bg-gray-800 rounded-lg shadow-xl">
                <h2 className="mb-4 text-xl font-bold text-white">Abrir Nova Ordem de Serviço</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-300">Empresa</label>
                        <p className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md">
                            {userCompany.name}
                        </p>
                    </div>
                     <div>
                        <label htmlFor="title" className="block mb-2 text-sm font-medium text-gray-300">Título</label>
                        <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} required className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md" />
                    </div>
                     <div>
                        <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-300">Descrição</label>
                        <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} required rows={4} className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md"></textarea>
                    </div>
                    <div className="flex justify-end pt-2 space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 font-medium text-gray-300 bg-gray-600 rounded-md hover:bg-gray-700">Cancelar</button>
                        <button type="submit" className="px-4 py-2 font-medium text-white rounded-md bg-blue-accent hover:bg-blue-accent/90">Salvar OS</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AbrirOSModal;
