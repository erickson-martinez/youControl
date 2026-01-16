
import React, { useState, useEffect, useCallback } from 'react';
import type { User, MenuPermissions } from '../types';
import { ALL_PERMISSION_KEYS_WITH_LABELS, FALLBACK_PERMISSIONS, API_BASE_URL } from '../constants';

interface SettingsPageProps {
  currentUser: User;
  onCurrentUserPermissionsUpdate: () => void;
}

const apiToFrontendPermissions = (apiPerms: string[] | null | undefined): MenuPermissions => {
    const frontendPerms: MenuPermissions = { rh: false, financeiro: false, os: false, ponto: false, aprovarHoras: false, chamados: false, empresa: false, listPurcharse: false, settings: false, exemplo: false };
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

  useEffect(() => {
    setCurrentPermissions(permissions);
  }, [permissions]);

  const handlePermissionChange = (key: keyof MenuPermissions, value: boolean) => {
    setCurrentPermissions(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onUpdate(user.phone, currentPermissions);
    setIsSaving(false);
  };

  return (
    <div className="p-4 bg-gray-700 rounded-lg">
      <div className="flex flex-col justify-between sm:flex-row">
        <div>
            <h3 className="font-bold text-white">{user.name}</h3>
            <p className="text-sm text-gray-400">{user.phone}</p>
        </div>
        <button
            onClick={handleSave}
            disabled={isSaving}
            className="self-start px-4 py-2 mt-2 font-semibold text-white transition-colors rounded-md sm:self-center sm:mt-0 bg-blue-accent hover:bg-blue-accent/90 disabled:bg-gray-500"
        >
            {isSaving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4 sm:grid-cols-3 md:grid-cols-4">
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
    </div>
  );
};

const SettingsPage: React.FC<SettingsPageProps> = ({ currentUser, onCurrentUserPermissionsUpdate }) => {
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [allPermissions, setAllPermissions] = useState<Record<string, MenuPermissions>>({});
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    const renderContent = () => {
        if (isLoadingUsers || isLoadingPermissions) return <p className="text-center text-gray-400">Carregando dados...</p>;
        if (error) return <p className="text-center text-red-accent">Erro ao carregar: {error}</p>;
        if (allUsers.length === 0) return <p className="text-center text-gray-400">Nenhum usuário encontrado.</p>;

        return allUsers.map(user => (
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
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-white">Gerenciar Permissões</h1>
            </div>

            <div className="space-y-4">
                {renderContent()}
            </div>
        </div>
    );
};

export default SettingsPage;
