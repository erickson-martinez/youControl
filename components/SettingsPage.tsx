
import React, { useState, useEffect, useCallback } from 'react';
import type { User, MenuPermissions } from '../types';
import { ALL_PERMISSION_KEYS_WITH_LABELS, FALLBACK_PERMISSIONS, API_BASE_URL } from '../constants';
import { ChevronDownIcon } from './icons';

interface SettingsPageProps {
  currentUser: User;
  onCurrentUserPermissionsUpdate: () => void;
}

const apiToFrontendPermissions = (apiPerms: string[] | null | undefined): MenuPermissions => {
    const frontendPerms: MenuPermissions = { 
        rh: false, financeiro: false, graficos: false, os: false, ponto: false, 
        aprovarHoras: false, chamados: false, empresa: false, lojas: false, 
        listPurcharse: false, settings: false, exemplo: false, financialManual: false,
        burgerProducts: false, burgerPOS: false, burgerWaiter: false, 
        burgerDelivery: false, burgerDashboard: false, burgerClient: false 
    };
    if (Array.isArray(apiPerms)) {
        for (const key of apiPerms) {
            if (key in frontendPerms) {
                frontendPerms[key as keyof MenuPermissions] = true;
            }
        }
    }
    return frontendPerms;
};

const frontendToApiPermissions = (frontendPerms: MenuPermissions): string[] => {
    return Object.entries(frontendPerms)
        .filter(([, value]) => value === true)
        .map(([key]) => key);
};

const UserPermissionsCard: React.FC<{
  user: User;
  permissions: MenuPermissions;
  onUpdate: (phone: string, newPermissions: MenuPermissions) => Promise<void>;
}> = ({ user, permissions, onUpdate }) => {
  const [currentPermissions, setCurrentPermissions] = useState<MenuPermissions>(permissions);
  const [isSaving, setIsSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setCurrentPermissions(permissions);
  }, [permissions]);

  const handlePermissionChange = (key: keyof MenuPermissions, value: boolean) => {
    setCurrentPermissions(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent accordion toggle
    setIsSaving(true);
    await onUpdate(user.phone, currentPermissions);
    setIsSaving(false);
  };

  return (
    <div className="bg-gray-700 rounded-lg overflow-hidden transition-all duration-200">
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-600"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
            <h3 className="font-bold text-white">{user.name}</h3>
            <p className="text-sm text-gray-400">{user.phone}</p>
        </div>
        <div className="flex items-center space-x-4">
            <span className="text-xs text-gray-400 hidden sm:block">
                {isExpanded ? 'Ocultar Permissões' : 'Ver Permissões'}
            </span>
            <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-4 border-t border-gray-600 bg-gray-700/50">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {ALL_PERMISSION_KEYS_WITH_LABELS.map(({ key, label }) => (
                <label key={key} className="flex items-center space-x-2 text-sm text-gray-200 cursor-pointer">
                    <input
                    type="checkbox"
                    checked={currentPermissions[key]}
                    onChange={(e) => handlePermissionChange(key, e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
                    />
                    <span>{label}</span>
                </label>
                ))}
            </div>
            <div className="mt-6 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2 font-semibold text-white transition-colors rounded-md bg-blue-accent hover:bg-blue-accent/90 disabled:bg-gray-500"
                >
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

const SettingsPage: React.FC<SettingsPageProps> = ({ currentUser, onCurrentUserPermissionsUpdate }) => {
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [allPermissions, setAllPermissions] = useState<Record<string, MenuPermissions>>({});
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter states
    const [nameFilter, setNameFilter] = useState('');
    const [phoneFilter, setPhoneFilter] = useState('');

    const apiFetch = useCallback(async (url: string, options: RequestInit = {}) => {
        const response = await fetch(url, {
            ...options,
            cache: 'no-store',
            headers: { 'Content-Type': 'application/json', ...options.headers },
        });
        if (!response.ok) {
            const errorJson = await response.json().catch(() => ({}));
            const message = errorJson.error || errorJson.message || `Erro do servidor (HTTP ${response.status}).`;
            throw new Error(message);
        }
        return response;
    }, []);
    
    const fetchAllUsers = useCallback(async () => {
        setIsLoadingUsers(true);
        try {
            const response = await apiFetch(`${API_BASE_URL}/users`);
            const data = await response.json();
            const usersList = Array.isArray(data) ? data : data.users;
            setAllUsers(usersList || []);
        } catch (err) {
           console.error("Falha ao buscar todos os usuários.", err);
           setError((err as Error).message);
        } finally {
           setIsLoadingUsers(false);
        }
    }, [apiFetch]);
    
    useEffect(() => {
        fetchAllUsers();
    }, [fetchAllUsers]);

    const fetchAllPermissions = useCallback(async () => {
        setIsLoadingPermissions(true);
        setError(null);
        try {
            const response = await apiFetch(`${API_BASE_URL}/permissions`);
            const data = await response.json();
            const permissionsList = data.permissions || data;

            if (!Array.isArray(permissionsList)) {
                console.error('API response for all permissions is not an array:', permissionsList);
                throw new Error("Formato de resposta da API de permissões inválido.");
            }

            const permissionsMap = new Map<string, MenuPermissions>();
            permissionsList.forEach((p: { userPhone: string; permissions: string[] }) => {
                permissionsMap.set(p.userPhone, apiToFrontendPermissions(p.permissions));
            });

            const allPerms: Record<string, MenuPermissions> = {};
            allUsers.forEach(user => {
                allPerms[user.phone] = permissionsMap.get(user.phone) || FALLBACK_PERMISSIONS;
            });
            
            setAllPermissions(allPerms);

        } catch (err) {
            console.error("Falha ao buscar todas as permissões.", err);
            setError((err as Error).message);
        } finally {
            setIsLoadingPermissions(false);
        }
    }, [allUsers, apiFetch]);

    useEffect(() => {
        if (!isLoadingUsers && allUsers.length > 0) {
            fetchAllPermissions();
        } else if (!isLoadingUsers) {
            // No users, so no permissions to fetch.
            setIsLoadingPermissions(false);
        }
    }, [allUsers, isLoadingUsers, fetchAllPermissions]);

    const handleUpdatePermissions = async (phone: string, newPerms: MenuPermissions) => {
        const oldPerms = allPermissions[phone] || FALLBACK_PERMISSIONS;
        const oldPermsList = frontendToApiPermissions(oldPerms);
        const newPermsList = frontendToApiPermissions(newPerms);

        const permsToAdd = newPermsList.filter(p => !oldPermsList.includes(p));
        const permsToRemove = oldPermsList.filter(p => !newPermsList.includes(p));

        const apiPromises = [];
        if (permsToAdd.length > 0) {
            apiPromises.push(apiFetch(`${API_BASE_URL}/permissions?phone=${phone}&add=true`, { method: 'PATCH', body: JSON.stringify({ permissions: permsToAdd }) }));
        }
        if (permsToRemove.length > 0) {
            apiPromises.push(apiFetch(`${API_BASE_URL}/permissions?phone=${phone}&add=false`, { method: 'PATCH', body: JSON.stringify({ permissions: permsToRemove }) }));
        }
        if (apiPromises.length === 0) return;

        try {
            await Promise.all(apiPromises);
            await fetchAllPermissions();
            if (currentUser.phone === phone) {
                onCurrentUserPermissionsUpdate();
            }
            alert('Permissões atualizadas com sucesso!');
        } catch (err) {
            alert(`Falha ao atualizar permissões: ${(err as Error).message}`);
            await fetchAllPermissions();
        }
    };

    const filteredUsers = allUsers.filter(user => {
        const matchesName = user.name.toLowerCase().includes(nameFilter.toLowerCase());
        const matchesPhone = user.phone.includes(phoneFilter);
        return matchesName && matchesPhone;
    });

    const renderContent = () => {
        if (isLoadingUsers || isLoadingPermissions) return <p className="text-center text-gray-400">Carregando dados...</p>;
        if (error) return <p className="text-center text-red-accent">Erro ao carregar: {error}</p>;
        if (filteredUsers.length === 0) return <p className="text-center text-gray-400">Nenhum usuário encontrado.</p>;

        return filteredUsers.map(user => (
            <UserPermissionsCard 
                key={user.phone}
                user={user}
                permissions={allPermissions[user.phone] || FALLBACK_PERMISSIONS}
                onUpdate={handleUpdatePermissions}
            />
        ));
    };

    return (
        <div className="p-4 bg-gray-800 rounded-lg">
            <div className="flex flex-col mb-6 gap-4">
                <h1 className="text-2xl font-bold text-white">Gerenciar Permissões</h1>
                
                <div className="bg-gray-700 p-4 rounded-lg shadow-md">
                    <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Filtros</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="filterName" className="block text-xs text-gray-400 mb-1">Buscar por Nome</label>
                            <input 
                                id="filterName"
                                type="text" 
                                placeholder="Ex: João Silva" 
                                value={nameFilter}
                                onChange={(e) => setNameFilter(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="filterPhone" className="block text-xs text-gray-400 mb-1">Buscar por Telefone</label>
                            <input 
                                id="filterPhone"
                                type="text" 
                                placeholder="Ex: 679..." 
                                value={phoneFilter}
                                onChange={(e) => setPhoneFilter(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {renderContent()}
            </div>
        </div>
    );
};

export default SettingsPage;
