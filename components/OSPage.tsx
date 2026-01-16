
import React, { useState, useCallback, useEffect } from 'react';
import type { OrdemServico, Empresa, User } from '../types';
import { OSStatus } from '../types';
import AbrirOSModal from './AbrirOSModal';
import { API_BASE_URL } from '../constants';

interface OSPageProps {
    user: User;
    empresas: Empresa[];
    userCompany: Empresa | undefined;
}

const formatDate = (isoString: string) => new Date(isoString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

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
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyles[status] || 'bg-gray-500'}`}>{osStatusDisplayMap[status] || 'Desconhecido'}</span>;
}

const OSPage: React.FC<OSPageProps> = ({ user, empresas, userCompany }) => {
    const [ordensServico, setOrdensServico] = useState<OrdemServico[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
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

    const fetchMyOS = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await apiFetch(`${API_BASE_URL}/os/my?phone=${user.phone}`);
            const data = await response.json();
            const osList = (data.chamados || []).map((os: any) => ({
                ...os,
                id: os._id,
                empresaId: (os.companyId && typeof os.companyId === 'object') ? os.companyId._id : os.companyId,
            }));
            setOrdensServico(osList);
        } catch (err) {
            console.error("Falha ao buscar minhas OS:", err);
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, [user.phone, apiFetch]);

    useEffect(() => {
        fetchMyOS();
    }, [fetchMyOS]);

    const handleSaveOS = async (osData: { title: string; description: string; }) => {
        if (!userCompany) return;
        try {
            await apiFetch(`${API_BASE_URL}/os`, {
                method: 'POST',
                body: JSON.stringify({
                    openerPhone: user.phone,
                    title: osData.title,
                    description: osData.description,
                    empresaId: userCompany.id,
                }),
            });
            await fetchMyOS();
        } catch (error) {
            alert(`Falha ao abrir Ordem de Serviço: ${(error as Error).message}`);
        }
    };

    const sortedOS = [...ordensServico].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const renderContent = () => {
        if (isLoading) {
            return <p className="text-center text-gray-400">Carregando ordens de serviço...</p>;
        }
        if (error) {
            return <p className="text-center text-red-accent">Erro ao carregar: {error}</p>;
        }
        if (sortedOS.length === 0) {
            return <p className="text-center text-gray-400">Nenhuma Ordem de Serviço aberta por você.</p>;
        }
        return sortedOS.map(os => {
            const empresa = empresas.find(e => e.id === os.empresaId);
            return (
                 <div key={os.id} className="p-4 bg-gray-700 rounded-md">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-white">{os.title}</h3>
                            <p className="text-sm text-blue-300">{empresa?.name || 'Empresa desconhecida'}</p>
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

                    <p className="mt-3 text-xs text-right text-gray-500">
                        Aberto por {os.openerPhone} em {formatDate(os.createdAt)}
                    </p>
                </div>
            );
        });
    };

    return (
        <div className="p-4 bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-white">Minhas Ordens de Serviço</h1>
                {userCompany && (
                     <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-blue-accent hover:bg-blue-accent/90"
                    >
                        Abrir OS
                    </button>
                )}
            </div>
            
            <div className="space-y-3">
                {renderContent()}
            </div>

            {userCompany && (
                <AbrirOSModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveOS}
                    userCompany={userCompany}
                />
            )}
        </div>
    );
};

export default OSPage;
