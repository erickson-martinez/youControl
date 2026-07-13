import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import EmpresaPage from './components/EmpresaPage';
import LojasPage from './components/LojasPage';
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
import GraphicsPage from './components/GraphicsPage';
import LandingPage from './components/LandingPage';
import TreinoPage from './components/TreinoPage';
import JogoDaVidaPage from './components/JogoDaVidaPage';
import JornadaPage from './components/JornadaPage';
import BarbeirosPage from './components/BarbeirosPage';
import CaixaBarbeariaPage from './components/CaixaBarbeariaPage';
import BarbeiroAgendaPage from './components/BarbeiroAgendaPage';
import AgendamentoPage from './components/AgendamentoPage';
import SimuladorSolarPage from './components/SimuladorSolarPage';
// Burger Imports
import BurgerProductsPage from './components/BurgerProductsPage';
import BurgerPOSPage from './components/BurgerPOSPage';
import BurgerWaiterPage from './components/BurgerWaiterPage';
import BurgerDeliveryPage from './components/BurgerDeliveryPage';
import BurgerDashboardPage from './components/BurgerDashboardPage';
import BurgerClientOrderPage from './components/BurgerClientOrderPage';
import BurgerCompanyPage from './components/BurgerCompanyPage';

import { MenuIcon, XCircleIcon } from './components/icons';
import type { User, MenuPermissions, Empresa, WorkRecord, ActivePage, PontoStatus, OrdemServico, UserCompanyLink } from './types';
import { API_BASE_URL, FALLBACK_PERMISSIONS, NEW_COLLABORATOR_PERMISSIONS } from './constants';
import { PontoStatus as PontoStatusEnum, OSStatus } from './types';

const apiToFrontendPermissions = (apiPerms: string[] | null | undefined, userEmail?: string): MenuPermissions => {
    // Default structure including burger perms
    const frontendPerms: MenuPermissions = { 
        rh: false, financeiro: false, graficos: false, os: false, ponto: false, aprovarHoras: false, 
        chamados: false, empresa: false, lojas: false, listPurcharse: false, settings: false, 
        exemplo: false, financialManual: false,
        burgerProducts: false, burgerPOS: false, burgerWaiter: false, burgerDelivery: false, 
        burgerDashboard: false, burgerClient: false, burgerCompany: false,
        treino: false, jogoDaVida: false, jornada: false, barbearia: false, caixaBarbearia: false, barbeiroAgenda: false, agendamento: false
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

const PublicAgendamentoWrapper = ({ empresaIdParam }: { empresaIdParam?: string }) => {
  const [empresa, setEmpresa] = useState<Empresa | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompany = async () => {
      if (!empresaIdParam) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/companies?linkId=${empresaIdParam}`);
        if (!response.ok) throw new Error("Erro na rede");
        const data = await response.json();
        if (data && data.companies && data.companies.length > 0) {
          // Find exact match just in case, but response should be filtered
          const company = data.companies.find((c: any) => c.linkId === empresaIdParam || c._id === empresaIdParam);
          if (company) {
             setEmpresa({ ...company, id: company._id });
          }
        }
      } catch (error) {
        console.error("Falha ao buscar detalhes da empresa pelo link", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCompany();
  }, [empresaIdParam]);

  if (loading) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Carregando agendamento...</div>;
  }

  // Se não encontrar no banco, usa um mock com o ID para poder cadastrar dados locais pelo menos, ou apenas exibe erro.
  const fallbackEmpresa = empresaIdParam ? { id: empresaIdParam, linkId: empresaIdParam, name: "Barbearia", owner: "", status: "ativo" } as Empresa : undefined;
  const finalEmpresa = empresa || fallbackEmpresa;

  return (
    <div className="min-h-screen bg-gray-900 overflow-y-auto">
      <AgendamentoPage empresa={finalEmpresa} empresas={finalEmpresa ? [finalEmpresa] : []} />
    </div>
  );
};

const GoogleLinkModal = ({ user, onSuccess }: { user: User, onSuccess: (user: User) => void }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLink = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const firebaseUser = userCredential.user;

      const oldIdEmail = user.idEmail || user.id;

      // Update backend
      const res = await fetch(`${API_BASE_URL}/user/${oldIdEmail}`, {
        method: 'PATCH',
        headers: {
           'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          newIdEmail: firebaseUser.uid,
          email: firebaseUser.email
        })
      });

      if (!res.ok) {
        let errData;
        try { errData = await res.json(); } catch(e){}
        throw new Error(errData?.error || 'Falha ao atualizar usuário no sistema.');
      }

      // Update permissions
      try {
        await fetch(`${API_BASE_URL}/permissions/${oldIdEmail}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            idEmailPermissions: firebaseUser.uid,
            email: firebaseUser.email
          })
        });
      } catch (err) {
        console.error("Erro ao atualizar permissões", err);
      }

      // Update transactions
      try {
        await fetch(`${API_BASE_URL}/transactions/${oldIdEmail}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            newIdEmail: firebaseUser.uid
          })
        });
      } catch (err) {
        console.error("Erro ao atualizar transações", err);
      }

      // Update local user
      const updatedUser = {
        ...user,
        id: firebaseUser.uid,
        idEmail: firebaseUser.uid,
        email: firebaseUser.email || user.email,
        name: firebaseUser.displayName || user.name
      };

      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      onSuccess(updatedUser);
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
         setError(err.message || 'Erro ao vincular conta. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/90 backdrop-blur-sm p-4">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-700 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Atualização de Segurança</h2>
        <p className="text-gray-300 mb-6 text-sm">
          Estamos aprimorando a segurança do sistema. Por favor, vincule sua conta ao Google para continuar acessando todos os recursos.
        </p>
        
        {error && <p className="text-red-400 mb-4 text-sm font-medium">{error}</p>}
        
        <button
          onClick={handleLink}
          disabled={loading}
          className="w-full flex items-center justify-center px-4 py-3 bg-white text-gray-900 font-bold rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          {loading ? 'Vinculando...' : (
             <>
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.25,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1V11.1Z"
                  />
                </svg>
                Vincular com o Google
             </>
          )}
        </button>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      console.log('🌍 [PWA] Evento beforeinstallprompt disparado!', e);
      e.preventDefault();
      // Mostra as plataformas onde a instalação é suportada
      console.log('🌍 [PWA] Plataformas suportadas:', e.platforms);
    };

    const handleAppInstalled = (e: any) => {
      console.log('✅ [PWA] Aplicativo instalado com sucesso!', e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    console.log('🔍 [PWA] Listeners de instalação registrados no App.tsx');

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // --- ROTAS PÚBLICAS ---
  const isPublicMenu = window.location.pathname === '/cardapio' || window.location.search.includes('view=menu');
  const isPublicAgendamento = window.location.pathname === '/agendamento' || window.location.search.includes('empresaId=');

  if (isPublicMenu) {
    return <BurgerClientOrderPage />;
  }

  // Agendamento publico via URL (direto)
  if (isPublicAgendamento) {
    const urlParams = new URLSearchParams(window.location.search);
    const empresaIdParam = urlParams.get('empresaId') || undefined;
    return <PublicAgendamentoWrapper empresaIdParam={empresaIdParam} />;
  }
  // ---------------------------------------

  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState<ActivePage>('home');
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  
  const [userPermissions, setUserPermissions] = useState<MenuPermissions | null>(null);

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [canUserClockIn, setCanUserClockIn] = useState(false);
  const [linkedCompanyId, setLinkedCompanyId] = useState<string | null>(null);
  const [linkedId, setLinkedId] = useState<string | null>(null);
  const [aprovarHorasDate, setAprovarHorasDate] = useState(new Date());
  
  const [isLoading, setIsLoading] = useState(true); 
  const [apiError, setApiError] = useState<string | null>(null);

  const [firebaseChecked, setFirebaseChecked] = useState(false);
  const [isFirebaseUserLogged, setIsFirebaseUserLogged] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setIsFirebaseUserLogged(!!firebaseUser);
      setFirebaseChecked(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    try {
      const savedUserJSON = localStorage.getItem('currentUser');

      if (savedUserJSON) {
        const savedUser: User = JSON.parse(savedUserJSON);
        if (savedUser && savedUser.name && (savedUser.email || savedUser.id || savedUser.idEmail)) {
          setUser(savedUser);
        } else {
          setIsLoading(false); 
        }
      } else {
        setIsLoading(false); 
      }

    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('currentUser');
      setIsLoading(false); 
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
      // Don't fatally block the UI
      // if (!apiError) setApiError(networkErrorMessage);
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
      
      // Don't fatally block the UI for 404/500s that components might want to handle locally
      // if (response.status !== 404 && !apiError) setApiError(serverErrorMessage);
      throw new Error(serverErrorMessage);
    }

    return response;
  }, [user, apiError]);

  const fetchUserPermissions = useCallback(async (idEmail: string, email: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/permissions?idEmail=${idEmail}${email ? `&email=${encodeURIComponent(email)}` : ''}`, { cache: 'no-store' });
        
        if (!response.ok) {
           throw new Error(`Servidor respondeu com ${response.status}`);
        }

        const data = await response.json();
        const permissionsList = data.permissions || [];

        if (permissionsList.length === 0) {
            console.warn(`User ${email} has no permissions. Granting default 'financeiro' access.`);
            await fetch(`${API_BASE_URL}/permissions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idEmail: idEmail, email: email, permissions: ["financeiro", "graficos"] }),
            });
            
            const refetchedResponse = await fetch(`${API_BASE_URL}/permissions?idEmail=${idEmail}${email ? `&email=${encodeURIComponent(email)}` : ''}`, { cache: 'no-store' });
            if (refetchedResponse.ok) {
                const refetchedData = await refetchedResponse.json();
                const refetchedPermissionsList = refetchedData.permissions || [];
                const perms = apiToFrontendPermissions(refetchedPermissionsList, email);
                setUserPermissions(perms);
                return perms;
            }
        }

        const perms = apiToFrontendPermissions(permissionsList, email);
        setUserPermissions(perms);
        return perms;

    } catch (error) {
        if ((error as Error).message.includes('404')) {
            console.warn(`No permissions record for ${email} (404). Granting default 'financeiro' access.`);
            try {
                await fetch(`${API_BASE_URL}/permissions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idEmail: idEmail, email: email, permissions: ["financeiro", "graficos"] }),
                });

                const refetchedResponse = await fetch(`${API_BASE_URL}/permissions?idEmail=${idEmail}${email ? `&email=${encodeURIComponent(email)}` : ''}`, { cache: 'no-store' });
                if (refetchedResponse.ok) {
                    const refetchedData = await refetchedResponse.json();
                    const perms = apiToFrontendPermissions(refetchedData.permissions || [], email);
                    setUserPermissions(perms);
                    return perms;
                }
            } catch (grantError) {
                console.error(`Failed to grant permissions after 404 for ${email}, applying fallback.`, grantError);
            }
        } else {
             console.error("Erro ao carregar permissões do usuário (banco de dados ou rede):", error);
        }
        
        setUserPermissions(FALLBACK_PERMISSIONS);
        return FALLBACK_PERMISSIONS;
    }
  }, []);

  const fetchUserCompanyLink = useCallback(async (currentUser: User) => {
    try {
        const idToFetch = currentUser.idEmail || currentUser.id || currentUser.email;
        const response = await apiFetch(`${API_BASE_URL}/rh/company/${idToFetch}`);
        const data = await response.json();
        if (data && Array.isArray(data.employees) && data.employees.length > 0) {
            const activeLink = data.employees.find((emp: any) => emp.status === 'ativo');
            const companyId = activeLink ? activeLink.company : null;
            setLinkedCompanyId(companyId);
            setLinkedId(activeLink.linkId)
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
        const idToFetch = currentUser.idEmail || currentUser.id || currentUser.email;
        const response = await apiFetch(`${API_BASE_URL}/companies/${idToFetch}`);
        const data = await response.json();
        const companiesData = data.companies;
        const companiesArray = Array.isArray(companiesData) ? companiesData : 
                              (companiesData ? [companiesData] : []);
        
        const mapped = companiesArray.map((emp: any) => ({ ...emp, id: emp._id }));
        
        return mapped;
    } catch (error) {
        if (!(error as Error).message.includes('404')) {
          console.error("Falha ao buscar empresas.", error);
        }
        
        return [];
    }
  }, [apiFetch]);

  const refreshCompanies = useCallback(async (user: User) => {
    let companyId = null;
    try {
        companyId = await fetchUserCompanyLink(user);
    } catch (e) {
        console.error("Erro ao buscar link da empresa. Ignorando.", e);
    }

    let ownedEmpresasRaw: any[] = [];
    try {
        ownedEmpresasRaw = await fetchEmpresas(user);
    } catch (e) {
        console.error("Erro ao buscar empresas do usuario.", e);
    }
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
    setAuthMode(null);
  };

  const companiesForManagement = useMemo(() => {
    if (!user || !userPermissions) return [];

    const managedCompanies = new Map<string, Empresa>();
    const owned = empresas.filter(e => e.isOwnedByCurrentUser);
    owned.forEach(e => managedCompanies.set(e.id, e));

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
    const owned = empresas.filter(e => e.isOwnedByCurrentUser);
    owned.forEach(e => approvalCompanies.set(e.id, e));
    
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
        await fetchUserPermissions(user.id || user.email, user.email);
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
    setAuthMode(null);
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
            body: JSON.stringify({ ...empresaData, owner: user.email }),
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
    await fetchUserPermissions(user.id || user.email, user.email);
  }, [user, refreshCompanies, fetchUserPermissions]);
  
  const handlePontoUpdate = useCallback(async () => {
  }, []);

  const handleCurrentUserPermissionsUpdate = useCallback(async () => {
    if (!user) return;
    await fetchUserPermissions(user.id || user.email, user.email);
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
    if (authMode) {
      return <LoginScreen onLoginSuccess={handleLoginSuccess} initialRegisterMode={authMode === 'register'} />;
    }
    return <LandingPage onLoginClick={() => setAuthMode('login')} onRegisterClick={() => setAuthMode('register')} />;
  }
  
  let userCompany = empresas.find(e => e.id === linkedCompanyId);
  if (userCompany) {
    if (!userCompany.linkId && linkedId) {
       userCompany = { ...userCompany, linkId: linkedId };
    }
  } else if (!userCompany && linkedCompanyId) {
    userCompany = {
      id: linkedCompanyId,
      name: 'Empresa Vinculada',
      status: 'ativo',
      owner: 'desconhecido',
      linkId: linkedId || undefined
    };
  }


  const isNotFirebaseUid = user && user.idEmail && user.idEmail.length !== 28;

  return (
    <div className="relative min-h-screen font-sans text-gray-100 bg-gray-900">
      {firebaseChecked && (!isFirebaseUserLogged || isNotFirebaseUid) && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-sm">
            <GoogleLinkModal user={user} onSuccess={handleLoginSuccess} />
        </div>
      )}

      <Sidebar user={user} onLogout={handleLogout} isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} permissions={userPermissions || FALLBACK_PERMISSIONS} activePage={activePage} onNavigate={handleNavigate} canClockIn={canUserClockIn}/>
      <div className="transition-all md:ml-64">
         <header className="flex items-center justify-between p-2 mb-2 md:p-4 md:justify-end relative min-h-[64px] gap-2">
            <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-400 rounded-lg md:hidden hover:bg-gray-700 focus:outline-none z-20 shrink-0" aria-controls="default-sidebar" aria-label="Open sidebar"><span className="sr-only">Open sidebar</span><MenuIcon className="w-6 h-6" /></button>
            <div id="top-header-portal" className="flex-1 min-w-0 flex justify-end md:justify-center z-10 w-full overflow-hidden"></div>
        </header>
        
        <main className={`w-full max-w-full pt-0 mx-auto md:pt-0 ${activePage === 'jornada' ? 'p-0' : 'p-4 md:p-8'}`}>
          {(isLoading || !userPermissions) ? (
            <div className="flex flex-col items-center justify-center pt-24">
              <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-accent"></div>
              <p className="mt-4 text-lg text-white">Carregando dados...</p>
            </div>
          ) : (
            <>
              {activePage === 'home' && <HomePage user={user} permissions={userPermissions} onNavigate={handleNavigate} />}
              {activePage === 'financeiro' && userPermissions.financeiro && <Dashboard user={user} onNavigate={handleNavigate}/>}
              {activePage === 'graficos' && userPermissions.graficos && <GraphicsPage user={user}/>}
              {activePage === 'empresa' && userPermissions.empresa && <EmpresaPage empresas={companiesForManagement} onSave={handleSaveEmpresa} onUpdate={handleUpdateEmpresa} onDelete={handleDeleteEmpresa} onUpdateStatus={handleUpdateEmpresaStatus}/>}
              {activePage === 'lojas' && userPermissions.lojas && <LojasPage user={user} />}
              {activePage === 'rh' && userPermissions.rh && <RHPage user={user} empresas={companiesForManagement} onCurrentUserUpdate={handleCurrentUserUpdate} />}
              {activePage === 'ponto' && userPermissions.ponto && linkedCompanyId && userCompany && <PontoPage user={user} empresa={userCompany} onPontoUpdate={handlePontoUpdate} />}
              {activePage === 'aprovarHoras' && userPermissions.aprovarHoras && <AprovarHorasPage user={user} empresas={companiesForApproval} currentDate={aprovarHorasDate} setCurrentDate={setAprovarHorasDate} />}
              {activePage === 'os' && userPermissions.os && <OSPage user={user} empresas={empresas} userCompany={userCompany} />}
              {activePage === 'chamados' && userPermissions.chamados && <ChamadosPage managedEmpresas={companiesForManagement} user={user} />}
              {activePage === 'listPurcharse' && userPermissions.listPurcharse && <ListPurcharsePage user={user} />}
              {activePage === 'settings' && userPermissions.settings && <SettingsPage currentUser={user} onCurrentUserPermissionsUpdate={handleCurrentUserPermissionsUpdate} />}
              {activePage === 'exemplo' && userPermissions.exemplo && <ExemploPage />}
              {activePage === 'financialManual' && userPermissions.financialManual && <FinancialManualPage />}
              {activePage === 'treino' && userPermissions.treino && <TreinoPage user={user} />}
              {activePage === 'jogoDaVida' && userPermissions.jogoDaVida && <JogoDaVidaPage />}
              {activePage === 'jornada' && userPermissions.jornada && <JornadaPage user={user} />}
              {activePage === 'barbearia' && userPermissions.barbearia && <BarbeirosPage user={user} empresa={userCompany || companiesForManagement[0]} />}
              {activePage === 'caixaBarbearia' && userPermissions.caixaBarbearia && <CaixaBarbeariaPage user={user} empresa={userCompany || companiesForManagement[0]}/>}
              {activePage === 'barbeiroAgenda' && userPermissions.barbeiroAgenda && <BarbeiroAgendaPage user={user} linkId={linkedId} empresa={userCompany || companiesForManagement[0]} isAdmin={userPermissions.barbearia} />}
              {activePage === 'agendamento' && <AgendamentoPage empresa={userCompany || companiesForManagement[0]} empresas={empresas} />}
              
              {/* Lanchonete Modules */}
              {activePage === 'burgerCompany' && userPermissions.burgerCompany && <BurgerCompanyPage user={user} />}
              {activePage === 'burgerProducts' && userPermissions.burgerProducts && <BurgerProductsPage user={user} />}
              {activePage === 'burgerPOS' && userPermissions.burgerPOS && <BurgerPOSPage user={user} />}
              {activePage === 'burgerWaiter' && userPermissions.burgerWaiter && <BurgerWaiterPage />}
              {activePage === 'burgerDelivery' && userPermissions.burgerDelivery && <BurgerDeliveryPage user={user} />}
              {activePage === 'burgerDashboard' && userPermissions.burgerDashboard && <BurgerDashboardPage />}
              {/* Agora o BurgerClientOrderPage é renderizado internamente quando selecionado no menu */}
              {activePage === 'burgerClient' && userPermissions.burgerClient && <BurgerClientOrderPage />}
              
              {activePage === 'simuladorSolar' && <SimuladorSolarPage user={user} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;