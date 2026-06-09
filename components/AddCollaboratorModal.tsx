
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Empresa, User } from '../types';
import SearchableSelect from './SearchableSelect';
import { API_BASE_URL } from '../constants';

interface AddCollaboratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (email: string, empresaId: string, role: string) => Promise<void>;
    empresas: Empresa[];
    linkedUserEmails: string[];
}

const AddCollaboratorModal: React.FC<AddCollaboratorModalProps> = ({ isOpen, onClose, onSave, empresas, linkedUserEmails }) => {
    const [selectedEmail, setSelectedEmail] = useState('');
    const [selectedEmpresa, setSelectedEmpresa] = useState<string>('');
    const [selectedRole, setSelectedRole] = useState<string>('Barbeiro');
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/users`);
            if (!response.ok) throw new Error('Falha ao buscar usuários.');
            const data = await response.json();
            const usersList = Array.isArray(data) ? data : data.users;
            setAllUsers(usersList || []);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    useEffect(() => {
        if (isOpen) {
            setSelectedEmail('');
            setSelectedEmpresa(empresas.length > 0 ? empresas[0].id : '');
            fetchUsers();
        }
    }, [isOpen, empresas, fetchUsers]);
    
    const unlinkedUsers = useMemo(() => {
        const linkedIdsSet = new Set(linkedUserEmails);
        return allUsers
          .filter(user => {
            const userId = user.idEmail || user.email;
            return !linkedIdsSet.has(userId);
          })
          .sort((a,b) => (a.name || '').localeCompare(b.name || ''));
    }, [allUsers, linkedUserEmails]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmail || !selectedEmpresa || !selectedRole) {
            alert("Por favor, selecione um colaborador, uma empresa e uma função.");
            return;
        }
        
        setIsSaving(true);
        try {
            await onSave(selectedEmail, selectedEmpresa, selectedRole);
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
                    Vincular Colaborador
                </h2>
                <form onSubmit={handleSubmit}>
                    <fieldset disabled={isSaving}>
                        <div className="mb-4">
                            <label htmlFor="collaborator" className="block mb-2 text-sm font-medium text-gray-300">Colaborador</label>
                            {isLoading ? <p className="text-gray-400">Carregando usuários...</p> : error ? <p className="text-red-accent">{error}</p> :
                                <SearchableSelect
                                    options={unlinkedUsers.map(u => ({ id: u.idEmail || u.email, name: `${u.name} (${u.email})` }))}
                                    value={selectedEmail}
                                    onChange={setSelectedEmail}
                                    placeholder="Buscar colaborador por nome ou email..."
                                />
                            }
                        </div>
                        <div className="mb-6">
                            <label htmlFor="empresa" className="block mb-2 text-sm font-medium text-gray-300">Vincular à Empresa</label>
                            <select
                                id="empresa"
                                value={selectedEmpresa}
                                onChange={(e) => setSelectedEmpresa(e.target.value)}
                                required
                                className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 disabled:opacity-50"
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
                        <div className="mb-6">
                            <label htmlFor="role" className="block mb-2 text-sm font-medium text-gray-300">Função</label>
                            <select
                                id="role"
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                required
                                className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 disabled:opacity-50"
                            >
                                <option value="Caixa">Caixa</option>
                                <option value="Vendedor">Vendedor</option>
                                <option value="Gerente">Gerente</option>
                                <option value="Proprietário">Proprietário</option>
                                <option value="Barbeiro">Barbeiro</option>
                            </select>
                        </div>
                    </fieldset>
                    <div className="flex justify-end space-x-3">
                        <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 font-medium text-gray-300 bg-gray-600 rounded-md hover:bg-gray-700 disabled:opacity-50">Cancelar</button>
                        <button type="submit" disabled={isSaving || isLoading} className="px-4 py-2 font-medium text-white rounded-md bg-blue-accent hover:bg-blue-accent/90 disabled:bg-gray-500 disabled:cursor-wait">
                            {isSaving ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddCollaboratorModal;
