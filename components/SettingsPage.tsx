
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
        burgerDelivery: false, burgerDashboard: false, burgerClient: false, burgerCompany: false,
        treino: false, jogoDaVida: false, jornada: false, barbearia: false, caixaBarbearia: false, agendamento: false, barbeiroAgenda: false
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
  onUpdate: (user: User, newPermissions: MenuPermissions) => Promise<void>;
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
    await onUpdate(user, currentPermissions);
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
            <p className="text-sm text-gray-400">{user.email}</p>
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
                <label key={key as string} className="flex items-center space-x-2 text-sm text-gray-200 cursor-pointer">
                    <input
                    type="checkbox"
                    checked={currentPermissions[key] || false}
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
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);

    // Filter states
    const [nameFilter, setNameFilter] = useState('');
    const [emailFilter, setEmailFilter] = useState('');

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
    
    const handleSearch = async () => {
        if (!nameFilter.trim() && !emailFilter.trim()) {
            setError("Por favor, informe um nome ou e-mail para buscar.");
            setAllUsers([]);
            return;
        }

        setIsLoading(true);
        setError(null);
        setHasSearched(true);

        try {
            // Se a API suportar query params a gente os envia
            const queryParams = new URLSearchParams();
            if (nameFilter.trim()) queryParams.append('name', nameFilter.trim());
            if (emailFilter.trim()) queryParams.append('email', emailFilter.trim());

            const response = await apiFetch(`${API_BASE_URL}/users?${queryParams.toString()}`);
            const data = await response.json();
            let usersList = Array.isArray(data) ? data : (data.users || []);

            // Fallback: se a API retornar todos os usuários, a gente filtra via frontend
            if (usersList.length > 0) {
                usersList = usersList.filter((u: any) => {
                    const matchesName = !nameFilter.trim() || (u.name || '').toLowerCase().includes(nameFilter.trim().toLowerCase());
                    const matchesEmail = !emailFilter.trim() || (u.email || '').toLowerCase().includes(emailFilter.trim().toLowerCase());
                    return matchesName && matchesEmail;
                });
            }

            setAllUsers(usersList);

            if (usersList.length > 0) {
                // Fetch permissions só dos usuários encontrados
                const perms: Record<string, MenuPermissions> = {};
                for (const u of usersList) {
                    const safeEmail = u.email || 'unknown';
                    const idToMatch = u.idEmail || u.id || safeEmail;
                    try {
                        const pResp = await apiFetch(`${API_BASE_URL}/permissions?idEmail=${idToMatch}${safeEmail && safeEmail !== 'unknown' ? `&email=${encodeURIComponent(safeEmail)}` : ''}`);
                        const pData = await pResp.json();
                        perms[safeEmail] = apiToFrontendPermissions(pData.permissions || []);
                    } catch (e) {
                        console.warn(`Could not fetch permissions for ${safeEmail}`, e);
                        perms[safeEmail] = FALLBACK_PERMISSIONS;
                    }
                }
                setAllPermissions(perms);
            }

        } catch (err) {
            console.error("Falha ao buscar usuários ou permissões.", err);
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdatePermissions = async (user: User, newPerms: MenuPermissions) => {
        const email = user.email;
        const idEmail = user.idEmail || user.id || email;
        const oldPerms = allPermissions[email || 'unknown'] || FALLBACK_PERMISSIONS;
        const oldPermsList = frontendToApiPermissions(oldPerms);
        const newPermsList = frontendToApiPermissions(newPerms);

        const permsToAdd = newPermsList.filter(p => !oldPermsList.includes(p));
        const permsToRemove = oldPermsList.filter(p => !newPermsList.includes(p));

        const apiPromises = [];
        if (permsToAdd.length > 0) {
            apiPromises.push(apiFetch(`${API_BASE_URL}/permissions?idEmail=${idEmail}&add=true`, { 
                method: 'PATCH', 
                body: JSON.stringify({ idEmail, email, permissions: permsToAdd }) 
            }));
        }
        if (permsToRemove.length > 0) {
            apiPromises.push(apiFetch(`${API_BASE_URL}/permissions?idEmail=${idEmail}&add=false`, { 
                method: 'PATCH', 
                body: JSON.stringify({ idEmail, email, permissions: permsToRemove }) 
            }));
        }
        
        if (apiPromises.length === 0) return;

        try {
            await Promise.all(apiPromises);
            
            // Re-fetch individual user
            const pResp = await apiFetch(`${API_BASE_URL}/permissions?idEmail=${idEmail}${email ? `&email=${encodeURIComponent(email)}` : ''}`);
            const pData = await pResp.json();
            const safeEmail = email || 'unknown';

            setAllPermissions(prev => ({
                ...prev,
                [safeEmail]: apiToFrontendPermissions(pData.permissions || [])
            }));

            if (currentUser.email === email) {
                onCurrentUserPermissionsUpdate();
            }
            alert('Permissões atualizadas com sucesso!');
        } catch (err) {
            alert(`Falha ao atualizar permissões: ${(err as Error).message}`);
        }
    };

    const renderContent = () => {
        if (isLoading) return <p className="text-center text-gray-400">Buscando dados...</p>;
        if (error) return <p className="text-center text-red-accent">{error}</p>;
        if (!hasSearched) return <p className="text-center text-gray-400">Utilize os filtros acima para buscar um usuário.</p>;
        if (allUsers.length === 0) return <p className="text-center text-gray-400">Nenhum usuário encontrado para a busca especificada.</p>;

        return allUsers.map((user, index) => {
            const safeEmail = user.email || 'unknown';
            return (
            <UserPermissionsCard 
                key={user.idEmail || user.id || user.email || `index-${index}`}
                user={user}
                permissions={allPermissions[safeEmail] || FALLBACK_PERMISSIONS}
                onUpdate={handleUpdatePermissions}
            />
            );
        });
    };

    return (
        <div className="p-4 bg-gray-800 rounded-lg">
            <div className="flex flex-col gap-4 mb-6">
                <h1 className="text-2xl font-bold text-white">Gerenciar Permissões</h1>
                
                <div className="p-4 bg-gray-700 rounded-lg shadow-md">
                    <h2 className="mb-3 text-sm font-semibold tracking-wider text-gray-300 uppercase">Buscar Usuário</h2>
                    <div className="flex flex-col items-end gap-4 md:flex-row">
                        <div className="flex-1 w-full">
                            <label htmlFor="filterName" className="block mb-1 text-xs text-gray-400">Buscar por Nome</label>
                            <input 
                                id="filterName"
                                type="text" 
                                placeholder="Ex: João Silva" 
                                value={nameFilter}
                                onChange={(e) => setNameFilter(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="w-full px-3 py-2 text-white bg-gray-800 border border-gray-600 rounded-md placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex-1 w-full">
                            <label htmlFor="filterEmail" className="block mb-1 text-xs text-gray-400">Buscar por Email</label>
                            <input 
                                id="filterEmail"
                                type="text" 
                                placeholder="Ex: usuario@gmail.com" 
                                value={emailFilter}
                                onChange={(e) => setEmailFilter(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="w-full px-3 py-2 text-white bg-gray-800 border border-gray-600 rounded-md placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button 
                            onClick={handleSearch}
                            disabled={isLoading}
                            className="w-full px-6 py-2 font-medium text-white transition-colors rounded-md md:w-auto bg-blue-accent hover:bg-blue-600 disabled:opacity-50"
                        >
                            {isLoading ? 'Buscando...' : 'Buscar'}
                        </button>
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
