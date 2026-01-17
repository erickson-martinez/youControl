
import React, { useState, useEffect } from 'react';
import type { OrdemServico } from '../types';

interface ResolverOSModalProps {
    isOpen: boolean;
    onClose: () => void;
    os: OrdemServico | null;
    onResolve: (osId: string, resolution: string) => Promise<void>;
}

const ResolverOSModal: React.FC<ResolverOSModalProps> = ({ isOpen, onClose, os, onResolve }) => {
    const [resolution, setResolution] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setResolution('');
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!os || !resolution.trim()) {
            alert('Por favor, descreva a solução.');
            return;
        }

        setIsSaving(true);
        try {
            await onResolve(os.id, resolution.trim());
            onClose();
        } catch (error) {
             alert(`Falha ao resolver OS: ${(error as Error).message}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen || !os) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
            <div className="w-full max-w-lg p-6 mx-4 bg-gray-800 rounded-lg shadow-xl">
                <h2 className="mb-2 text-xl font-bold text-white">Resolver Ordem de Serviço</h2>
                <div className='p-3 mb-4 bg-gray-700 rounded-md'>
                    <h3 className="font-semibold text-gray-200">{os.title}</h3>
                    <p className="text-sm text-gray-400">{os.description}</p>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <fieldset disabled={isSaving}>
                        <div>
                            <label htmlFor="resolution" className="block mb-2 text-sm font-medium text-gray-300">
                                Descrição da Solução
                            </label>
                            <textarea
                                id="resolution"
                                value={resolution}
                                onChange={e => setResolution(e.target.value)}
                                required
                                rows={5}
                                className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                placeholder="Descreva como o chamado foi resolvido..."
                            />
                        </div>
                    </fieldset>
                    <div className="flex justify-end pt-4 space-x-3">
                        <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 font-medium text-gray-300 bg-gray-600 rounded-md hover:bg-gray-700 disabled:opacity-50">Cancelar</button>
                        <button type="submit" disabled={isSaving} className="px-4 py-2 font-medium text-white rounded-md bg-green-accent hover:bg-green-accent/90 disabled:bg-gray-500 disabled:cursor-wait">
                            {isSaving ? 'Salvando...' : 'Marcar como Resolvido'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResolverOSModal;
