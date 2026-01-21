
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import EmpresaPage from './components/EmpresaPage';
import RHPage from './components/RHPage';
import PontoPage from './components/PontoPage';
import AprovarHorasPage from './components/AprovarHorasPage';
import OSPage from './components/OSPage';
import ChamadosPage from './components/ChamadosPage';
import ListPurcharsePage from './components/ListPurcharsePage';
import SettingsPage from './components/SettingsPage';
import HomePage from './components/HomePage';
import ExemploPage from './components/ExemploPage';
import FinancialManualPage from './components/FinancialManualPage';
import { MenuIcon, XCircleIcon } from './components/icons';
import type { User, MenuPermissions, Empresa, WorkRecord, ActivePage, PontoStatus, OrdemServico, UserCompanyLink } from './types';
import { API_BASE_URL, FALLBACK_PERMISSIONS, NEW_COLLABORATOR_PERMISSIONS } from './constants';
import { PontoStatus as PontoStatusEnum, OSStatus } from './types';

const apiToFrontendPermissions = (apiPerms: string[] | null | undefined, userPhone?: string): MenuPermissions => {
    const frontendPerms: MenuPermissions = { rh: false, financeiro: false, os: false, ponto: false, aprovarHoras: false, chamados: false, empresa: false, listPurcharse: false, settings: false, exemplo: false, financialManual: false };
    if (Array.isArray(apiPerms)) {
        for (const key of apiPerms) {
            if (key in frontendPerms) {
                frontendPerms[key as keyof MenuPermissions] = true;
            }
        }
    }
    return frontendPerms;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState<ActivePage>('home');
  
  const [userPermissions, setUserPermissions] = useState<MenuPermissions | null>(null);

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [canUserClockIn, setCanUserClockIn] = useState(false);
  const [linkedCompanyId, setLinkedCompanyId] = useState<string | null>(null);
  const [aprovarHorasDate, setAprovarHorasDate] = useState(new Date());
  
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedUserJSON = localStorage.getItem('currentUser');
      if (savedUserJSON) {
        const savedUser: User = JSON.parse(savedUserJSON);
        if (savedUser && savedUser.phone && savedUser.name) {
          setUser(savedUser);
        } else {
          setIsLoading(false); // Stop loading if user data is invalid
        }
      } else {
        setIsLoading(false); // Stop loading if no user is saved
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('currentUser');
      setIsLoading(false); // Stop loading on error
    }
  }, []);

  const apiFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    if (!user) {
      throw new Error("Usuário não está logado.");
    }
    
    let response;
    try {
      response = await fetch(url, {
        ...options,
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
    } catch (error) {
      console.error(`API call to ${url} failed with network error:`, error);
      const networkErrorMessage = 'Falha de conexão: Não foi possível comunicar com o servidor. Verifique sua conexão com a internet e tente novamente.';
      if (!apiError) {
        setApiError(networkErrorMessage);
      }
      throw new Error(networkErrorMessage);
    }

    if (!response.ok) {
      let errorJson;
      try {
        errorJson = await response.json();
      } catch (e) {
        errorJson = { message: `O servidor respondeu com um erro (HTTP ${response.status}).` };
      }
      const serverErrorMessage = errorJson.error || errorJson.message || `Erro do servidor (HTTP ${response.status}).`;
      console.error(`API call to ${url} failed with status ${response.status}:`, serverErrorMessage);
      
      // Don't set global error for 404s, as they are often handled locally
      if (response.status !== 404 && !apiError) {
        setApiError(serverErrorMessage);
      }
      throw new Error(serverErrorMessage);
    }

    return response;
  }, [user, apiError]);

  const fetchUserPermissions = useCallback(async (phone: string) => {
    try {
        const response = await apiFetch(`${API_BASE_URL}/permissions?userPhone=${phone}`);
        const data = await response.json();
        const permissionsList = data.permissions || [];

        if (permissionsList.length === 0) {
            console.warn(`User ${phone} has no permissions. Granting default 'financeiro' access.`);
            await apiFetch(`${API_BASE_URL}/permissions?phone=${phone}&add=true`, {
                method: 'PATCH',
                body: JSON.stringify({ permissions: ["financeiro"] }),
            });
            
            const refetchedResponse = await apiFetch(`${API_BASE_URL}/permissions?userPhone=${phone}`);
            const refetchedData = await refetchedResponse.json();
            const refetchedPermissionsList = refetchedData.permissions || [];
            const perms = apiToFrontendPermissions(refetchedPermissionsList, phone);
            setUserPermissions(perms);
            return perms;
        }

        const perms = apiToFrontendPermissions(permissionsList, phone);
        setUserPermissions(perms);
        return perms;

    } catch (error) {
        if ((error as Error).message.includes('404')) {
            console.warn(`No permissions record for ${phone} (404). Granting default 'financeiro' access.`);
            try {
                await apiFetch(`${API_BASE_URL}/permissions?phone=${phone}&add=true`, {
                    method: 'PATCH',
                    body: JSON.stringify({ permissions: ["financeiro"] }),
                });

                const refetchedResponse = await apiFetch(`${API_BASE_URL}/permissions?userPhone=${phone}`);
                const refetchedData = await refetchedResponse.json();
                const perms = apiToFrontendPermissions(refetchedData.permissions || [], phone);
                setUserPermissions(perms);
                return perms;
            } catch (grantError) {
                console.error(`Failed to grant permissions after 404 for ${phone}, applying fallback.`, grantError);
                setUserPermissions(FALLBACK_PERMISSIONS);
                return FALLBACK_PERMISSIONS;
            }
        } else {
            console.error("Erro ao carregar permissões do usuário:", error);
            throw error;
        }
    }
  }, [apiFetch]);

  const fetchUserCompanyLink = useCallback(async (currentUser: User) => {
    try {
        const response = await apiFetch(`${API_BASE_URL}/rh/company/${currentUser.phone}`);
        const data = await response.json();
        if (data && Array.isArray(data.employees) && data.employees.length > 0) {
            const activeLink = data.employees.find((emp: any) => emp.status === 'ativo');
            const companyId = activeLink ? activeLink.company : null;
            setLinkedCompanyId(companyId);
            return companyId;
        }
        setLinkedCompanyId(null);
        return null;
    } catch (error) {
        if (!(error as Error).message.includes('404')) {
          console.error("Falha ao buscar vínculo da empresa do usuário.", error);
          throw error;
        }
        setLinkedCompanyId(null);
        return null;
    }
  }, [apiFetch]);

  const fetchEmpresas = useCallback(async (currentUser: User): Promise<Empresa[]> => {
    try {
        const response = await apiFetch(`${API_BASE_URL}/companies/${currentUser.phone}`);
        const data = await response.json();
        return (data.companies || []).map((emp: any) => ({ ...emp, id: emp._id }));
    } catch (error) {
        if (!(error as Error).message.includes('404')) {
          console.error("Falha ao buscar empresas.", error);
          // Don't re-throw for 404s, just return empty.
        } else {
           throw error;
        }
        return [];
    }
  }, [apiFetch]);

  const refreshCompanies = useCallback(async (user: User) => {
    const companyId = await fetchUserCompanyLink(user);
    const ownedEmpresasRaw = await fetchEmpresas(user);
    const ownedEmpresas = ownedEmpresasRaw.map(e => ({...e, isOwnedByCurrentUser: true }));

    let allKnownEmpresas: Empresa[] = [...ownedEmpresas];
    if (companyId && !ownedEmpresas.some(e => e.id === companyId)) {
        try {
            const response = await apiFetch(`${API_BASE_URL}/companies/${companyId}`);
            const companyData = await response.json();
            const linkedCompanyDetails = companyData.company || companyData;
            if (linkedCompanyDetails && linkedCompanyDetails._id) {
                allKnownEmpresas.push({ ...linkedCompanyDetails, id: linkedCompanyDetails._id, isOwnedByCurrentUser: false });
            }
        } catch (e) {
            console.error("Não foi possível carregar detalhes da empresa vinculada:", e);
        }
    }
    setEmpresas(allKnownEmpresas);
  }, [apiFetch, fetchEmpresas, fetchUserCompanyLink]);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const companiesForManagement = useMemo(() => {
    if (!user || !userPermissions) return [];

    const managedCompanies = new Map<string, Empresa>();

    // Add all owned companies
    const owned = empresas.filter(e => e.isOwnedByCurrentUser);
    owned.forEach(e => managedCompanies.set(e.id, e));

    // Add the linked company if the user has management permissions
    const canManage = userPermissions.rh || userPermissions.empresa || userPermissions.chamados;
    if (canManage && linkedCompanyId) {
        const linkedCompany = empresas.find(e => e.id === linkedCompanyId);
        if (linkedCompany) {
            managedCompanies.set(linkedCompany.id, linkedCompany);
        }
    }

    return Array.from(managedCompanies.values());
  }, [user, empresas, linkedCompanyId, userPermissions]);
  
  const companiesForApproval = useMemo(() => {
    if (!user || !userPermissions) return [];

    const approvalCompanies = new Map<string, Empresa>();

    // Add all owned companies
    const owned = empresas.filter(e => e.isOwnedByCurrentUser);
    owned.forEach(e => approvalCompanies.set(e.id, e));
    
    // Add the linked company if the user has approval permissions
    const hasApprovalPerms = userPermissions.aprovarHoras;
    if (hasApprovalPerms && linkedCompanyId) {
        const linkedCompany = empresas.find(e => e.id === linkedCompanyId);
        if (linkedCompany) {
            approvalCompanies.set(linkedCompany.id, linkedCompany);
        }
    }

    return Array.from(approvalCompanies.values());
  }, [user, empresas, linkedCompanyId, userPermissions]);
  
  useEffect(() => {
    if (!user) return;

    const loadInitialData = async () => {
      setIsLoading(true);
      setApiError(null);
      try {
        await fetchUserPermissions(user.phone);
        await refreshCompanies(user);
      } catch (error) {
        console.error("Falha crítica ao inicializar a sessão do usuário.", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInitialData();
  }, [user, fetchUserPermissions, refreshCompanies]);

  useEffect(() => {
    setCanUserClockIn(!!linkedCompanyId);
  }, [linkedCompanyId]);

  const handleLogout = () => {
    setUser(null);
    setApiError(null);
    setIsLoading(false);
    setUserPermissions(null);
    setEmpresas([]);
    setActivePage('home');
    setLinkedCompanyId(null);
    localStorage.removeItem('activeWorkSession');
    localStorage.removeItem('currentUser');
  };
  
  const handleNavigate = (page: ActivePage) => {
    setActivePage(page);
    setSidebarOpen(false);
  };

  const handleSaveEmpresa = async (empresaData: Omit<Empresa, 'id' | 'owner'>) => {
    if (!user) return;
    try {
        await apiFetch(`${API_BASE_URL}/companies`, {
            method: 'POST',
            body: JSON.stringify({ ...empresaData, owner: user.phone }),
        });
        await refreshCompanies(user);
    } catch (error) {
        alert("Falha ao salvar empresa.");
    }
  };

  const handleUpdateEmpresa = async (empresaId: string, empresaData: Partial<Omit<Empresa, 'id' | 'owner'>>) => {
    if (!user) return;
    try {
        await apiFetch(`${API_BASE_URL}/companies/${empresaId}`, {
            method: 'PUT',
            body: JSON.stringify(empresaData),
        });
        await refreshCompanies(user);
    } catch (error) {
        alert("Falha ao atualizar empresa.");
    }
  };
  
   const handleDeleteEmpresa = async (empresaId: string) => {
    if (!user) return;
    try {
        await apiFetch(`${API_BASE_URL}/companies/${empresaId}`, {
            method: 'DELETE',
        });
        await refreshCompanies(user);
    } catch (error) {
       alert("Falha ao excluir empresa.");
    }
  };

  const handleUpdateEmpresaStatus = async (empresaId: string, status: 'ativo' | 'inativo') => {
      if (!user) return;
      try {
          await apiFetch(`${API_BASE_URL}/companies/${empresaId}/status`, {
              method: 'PATCH',
              body: JSON.stringify({ status }),
          });
          await refreshCompanies(user);
      } catch (error) {
          alert("Falha ao atualizar status da empresa.");
      }
  };
  
  const handleCurrentUserUpdate = useCallback(async () => {
    if (!user) return;
    await refreshCompanies(user);
    await fetchUserPermissions(user.phone);
  }, [user, refreshCompanies, fetchUserPermissions]);
  
  const handlePontoUpdate = useCallback(async () => {
    // This function is now a placeholder. The AprovarHorasPage will refetch its own data.
  }, []);

  const handleCurrentUserPermissionsUpdate = useCallback(async () => {
    if (!user) return;
    await fetchUserPermissions(user.phone);
  }, [user, fetchUserPermissions]);

  if (apiError) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-gray-900">
            <XCircleIcon className="w-16 h-16 text-red-accent"/>
            <h2 className="mt-4 text-2xl font-bold text-white">Ocorreu um Erro</h2>
            <p className="mt-2 text-gray-400">{apiError}</p>
            <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 mt-6 font-semibold text-white transition-colors rounded-lg bg-blue-accent hover:bg-blue-accent/90"
            >
                Tentar Novamente
            </button>
        </div>
    );
  }

  if (!user) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }
  
  let userCompany = empresas.find(e => e.id === linkedCompanyId);
  if (!userCompany && linkedCompanyId) {
    userCompany = {
      id: linkedCompanyId,
      name: 'Empresa Vinculada',
      status: 'ativo',
      owner: 'desconhecido',
    };
  }


  return (
    <div className="min-h-screen font-sans bg-gray-900 text-gray-100">
      <Sidebar user={user} onLogout={handleLogout} isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} permissions={userPermissions || FALLBACK_PERMISSIONS} activePage={activePage} onNavigate={handleNavigate} canClockIn={canUserClockIn}/>
      <div className="transition-all md:ml-64">
         <header className="flex items-center justify-between p-4 mb-2 md:justify-end">
            <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-400 rounded-lg md:hidden hover:bg-gray-700 focus:outline-none" aria-controls="default-sidebar" aria-label="Open sidebar"><span className="sr-only">Open sidebar</span><MenuIcon className="w-6 h-6" /></button>
            <div className='flex-1 min-w-0 text-right'>
                <h1 className="text-2xl font-bold text-white truncate">Olá, {user.name}</h1>
                <p className="hidden text-sm text-gray-400 md:block">Bem-vindo ao seu painel.</p>
            </div>
        </header>
        
        <main className="max-w-4xl p-4 pt-0 mx-auto md:p-8 md:pt-0">
          {(isLoading || !userPermissions) ? (
            <div className="flex flex-col items-center justify-center pt-24">
              <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-accent"></div>
              <p className="mt-4 text-lg text-white">Carregando dados...</p>
            </div>
          ) : (
            <>
              {activePage === 'home' && <HomePage user={user} permissions={userPermissions} onNavigate={handleNavigate} />}
              {activePage === 'financeiro' && userPermissions.financeiro && <Dashboard user={user}/>}
              {activePage === 'empresa' && userPermissions.empresa && <EmpresaPage empresas={companiesForManagement} onSave={handleSaveEmpresa} onUpdate={handleUpdateEmpresa} onDelete={handleDeleteEmpresa} onUpdateStatus={handleUpdateEmpresaStatus}/>}
              {activePage === 'rh' && userPermissions.rh && <RHPage user={user} empresas={companiesForManagement} onCurrentUserUpdate={handleCurrentUserUpdate} />}
              {activePage === 'ponto' && userPermissions.ponto && linkedCompanyId && userCompany && <PontoPage user={user} empresa={userCompany} onPontoUpdate={handlePontoUpdate} />}
              {activePage === 'aprovar-horas' && userPermissions.aprovarHoras && <AprovarHorasPage user={user} empresas={companiesForApproval} currentDate={aprovarHorasDate} setCurrentDate={setAprovarHorasDate} />}
              {activePage === 'os' && userPermissions.os && <OSPage user={user} empresas={empresas} userCompany={userCompany} />}
              {activePage === 'chamados' && userPermissions.chamados && <ChamadosPage managedEmpresas={companiesForManagement} user={user} />}
              {activePage === 'listPurcharse' && userPermissions.listPurcharse && <ListPurcharsePage />}
              {activePage === 'settings' && userPermissions.settings && <SettingsPage currentUser={user} onCurrentUserPermissionsUpdate={handleCurrentUserPermissionsUpdate} />}
              {activePage === 'exemplo' && userPermissions.exemplo && <ExemploPage />}
              {activePage === 'financialManual' && userPermissions.financialManual && <FinancialManualPage />}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
