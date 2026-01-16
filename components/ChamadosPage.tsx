
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { OrdemServico, Empresa, User } from '../types';
import { OSStatus } from '../types';
import ResolverOSModal from './ResolverOSModal';
import { API_BASE_URL } from '../constants';

interface ChamadosPageProps {
    managedEmpresas: Empresa[];
    user: User;
}

const formatDate = (isoString: string) => new Date(isoString).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

const osStatusDisplayMap: Record<OSStatus, string> = {
    [OSStatus.ABERTO]: 'Aberto',
    [OSStatus.EM_ANDAMENTO]: 'Em Andamento',
    [OSStatus.FECHADO]: 'Resolvido',
    [OSStatus.CANCELADO]: 'Cancelado',
};

const StatusBadge: React.FC<{ status: OSStatus }> = ({ status }) => {
    const statusStyles: Record<OSStatus, string> = {
        [OSStatus.ABERTO]: 'bg-yellow-600 text-yellow-100',
        [OSStatus.EM_ANDAMENTO]: 'bg-blue-600 text-blue-100',
        [OSStatus.FECHADO]: 'bg-green-600 text-green-100',
        [OSStatus.CANCELADO]: 'bg-gray-500 text-gray-100'
    };
    return <span className={`self-start px-2 py-1 text-xs font-medium rounded-full sm:self-center ${statusStyles[status] || 'bg-gray-500'}`}>{osStatusDisplayMap[status] || 'Desconhecido'}</span>;
}

const ChamadosPage: React.FC<ChamadosPageProps> = ({ managedEmpresas, user }) => {
    const [chamados, setChamados] = useState<OrdemServico[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [isLoadingChamados, setIsLoadingChamados] = useState(true);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [resolvingOS, setResolvingOS] = useState<OrdemServico | null>(null);

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

    const fetchChamados = useCallback(async () => {
        if (!user || managedEmpresas.length === 0) {
            setChamados([]);
            setIsLoadingChamados(false);
            return;
        }
        setIsLoadingChamados(true);
        setError(null);

        try {
            const companyOsPromises = managedEmpresas.map(empresa =>
                apiFetch(`${API_BASE_URL}/os/company?empresaId=${empresa.id}&phone=${user.phone}`)
                    .then(res => res.json())
                    .then(data => data.chamados || [])
                    .catch(err => {
                        console.warn(`Não foi possível buscar OS para a empresa ${empresa.name} (${empresa.id}):`, err.message);
                        return [];
                    })
            );

            const results = await Promise.all(companyOsPromises);
            const allOsRaw: any[] = results.flat();
            
            const osMap = new Map<string, OrdemServico>();
            allOsRaw.forEach((os: any) => {
                if (os && os._id && !osMap.has(os._id)) {
                     osMap.set(os._id, {
                        ...os,
                        id: os._id,
                        empresaId: (os.companyId && typeof os.companyId === 'object') ? os.companyId._id : os.companyId,
                     });
                }
            });
            setChamados(Array.from(osMap.values()));
        } catch (error) {
            console.error("Falha ao buscar chamados:", error);
            setError((error as Error).message);
        } finally {
            setIsLoadingChamados(false);
        }
    }, [user, managedEmpresas, apiFetch]);

    useEffect(() => {
        fetchChamados();
    }, [fetchChamados]);

    const handleResolveOS = async (osId: string, resolution: string) => {
        try {
            await apiFetch(`${API_BASE_URL}/os/${osId}/resolve`, {
                method: 'PATCH',
                body: JSON.stringify({ resolverPhone: user.phone, resolution }),
            });
            await fetchChamados();
        } catch (error) {
            alert(`Falha ao resolver chamado: ${(error as Error).message}`);
        }
    };
    
    const userMap = useMemo(() => {
        return allUsers.reduce((acc, u) => {
          acc[u.phone] = u.name;
          return acc;
        }, {} as Record<string, string>);
    }, [allUsers]);

    const sortedChamados = [...chamados].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const renderContent = () => {
        if (isLoadingChamados || isLoadingUsers) {
            return <p className="text-center text-gray-400">Carregando chamados...</p>;
        }
        if (error) {
            return <p className="text-center text-red-accent">Erro ao carregar chamados: {error}</p>;
        }
        if (sortedChamados.length === 0) {
            return <p className="text-center text-gray-400">Nenhum chamado encontrado para suas empresas.</p>;
        }
        return sortedChamados.map(os => {
            const empresa = managedEmpresas.find(e => e.id === os.empresaId);
            return (
                <div key={os.id} className="p-4 bg-gray-700 rounded-lg">
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                        <div>
                            <p className="text-sm font-semibold text-blue-300">{empresa?.name || 'Empresa desconhecida'}</p>
                            <h3 className="text-lg font-bold text-white">{os.title}</h3>
                        </div>
                        <StatusBadge status={os.status} />
                    </div>
                    <p className="mt-2 text-sm text-gray-300 whitespace-pre-wrap">{os.description}</p>
                    
                    {os.status === OSStatus.FECHADO && os.resolution && (
                        <div className="p-3 mt-3 text-sm bg-gray-600 border-l-4 border-green-accent rounded-r-md">
                            <p className="font-semibold text-green-300">Solução:</p>
                            <p className="mt-1 text-gray-300 whitespace-pre-wrap">{os.resolution}</p>
                        </div>
                    )}

                    <div className="flex items-end justify-between pt-2 mt-3 border-t border-gray-600">
                        <div className="text-xs text-gray-400">
                            <p>Aberto por: {userMap[os.openerPhone] || os.openerPhone}</p>
                            <p>Em: {formatDate(os.createdAt)}</p>
                        </div>
                        {os.status === OSStatus.ABERTO && (
                            <button 
                                onClick={() => setResolvingOS(os)}
                                className="px-3 py-1 text-sm font-semibold text-white transition-colors rounded-md bg-blue-accent hover:bg-blue-accent/90"
                            >
                                Resolver
                            </button>
                        )}
                    </div>
                </div>
            );
        })
    };


    return (
        <>
            <div className="p-4 bg-gray-800 rounded-lg">
                <h1 className="mb-6 text-2xl font-bold text-white">Caixa de Entrada de Chamados</h1>

                <div className="space-y-4">
                    {renderContent()}
                </div>
            </div>
            
            <ResolverOSModal 
                isOpen={!!resolvingOS}
                onClose={() => setResolvingOS(null)}
                os={resolvingOS}
                onResolve={handleResolveOS}
            />
        </>
    );
};

export default ChamadosPage;
