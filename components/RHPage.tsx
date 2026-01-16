
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { Empresa, UserCompanyLink, User } from '../types';
import AddCollaboratorModal from './AddCollaboratorModal';
import ConfirmationModal from './ConfirmationModal';
import { TrashIcon } from './icons';
import { API_BASE_URL } from '../constants';

interface RHPageProps {
  user: User;
  empresas: Empresa[];
  onCurrentUserUpdate: () => void;
}

const RHPage: React.FC<RHPageProps> = ({ user, empresas, onCurrentUserUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [userToUnlink, setUserToUnlink] = useState<User | null>(null);
  
  const [userCompanyLinks, setUserCompanyLinks] = useState<UserCompanyLink[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoadingLinks, setIsLoadingLinks] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
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

  const fetchAllCompanyLinks = useCallback(async (currentEmpresas: Empresa[]) => {
      setIsLoadingLinks(true);
      setError(null);
      try {
        const promises = currentEmpresas
          .filter(e => e && e.id)
          .map(empresa =>
            apiFetch(`${API_BASE_URL}/rh/${empresa.id}/employees`)
              .then(res => (res.ok ? res.json() : Promise.resolve({ listEmployees: [] })))
              .then(data => (data.listEmployees || []).map((link: any) => ({...link, empresaId: empresa.id})))
          );
        const results = await Promise.all(promises);
        const allLinksRaw: any[] = results.flat();
        
        const allLinks = allLinksRaw.map(link => ({
            _id: link.empId || link._id,
            userPhone: link.userPhone || link.user?.phone,
            empresaId: link.empresaId,
            status: link.status,
        })).filter(link => link._id && link.userPhone);
        
        setUserCompanyLinks(allLinks);
      } catch (err) {
        console.error("Falha ao buscar vínculos de usuários por empresa.", err);
        setError((err as Error).message);
      } finally {
        setIsLoadingLinks(false);
      }
  }, [apiFetch]);

  useEffect(() => {
    if (empresas.length > 0) {
        fetchAllCompanyLinks(empresas);
    } else {
        setUserCompanyLinks([]);
        setIsLoadingLinks(false);
    }
  }, [empresas, fetchAllCompanyLinks]);

  const handleLinkUser = useCallback(async (userPhone: string, empresaId: string) => {
    try {
      const existingLink = userCompanyLinks.find(link => link.userPhone === userPhone);

      if (empresaId === '') {
        if (!existingLink || !existingLink._id) throw new Error('Vínculo não encontrado.');
        await apiFetch(`${API_BASE_URL}/rh/unlink/${existingLink._id}`, { method: 'DELETE' });
      } else {
        await apiFetch(`${API_BASE_URL}/rh/link-user`, {
          method: 'POST',
          body: JSON.stringify({ userPhone, empresaId, status: 'ativo' }),
        });
      }
      
      await fetchAllCompanyLinks(empresas);
      
      if (user.phone === userPhone) {
        onCurrentUserUpdate();
      }
    } catch (err) {
      alert(`Falha ao vincular/desvincular: ${(err as Error).message}`);
    }
  }, [user.phone, apiFetch, empresas, userCompanyLinks, fetchAllCompanyLinks, onCurrentUserUpdate]);

  const handleSaveCollaborator = async (phone: string, empresaId: string) => {
    await handleLinkUser(phone, empresaId);
    setIsModalOpen(false);
  };
  
  const handleStartUnlink = (user: User) => {
    setUserToUnlink(user);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmUnlink = () => {
    if (userToUnlink) {
      handleLinkUser(userToUnlink.phone, '');
    }
    setIsConfirmModalOpen(false);
    setUserToUnlink(null);
  };

  const usersToDisplay = useMemo(() => {
    const linkedUserPhones = new Set(userCompanyLinks.map(link => link.userPhone));
    const linked = allUsers.filter(u => linkedUserPhones.has(u.phone));
    const unlinked = allUsers.filter(u => !linkedUserPhones.has(u.phone));
    return [...linked, ...unlinked].sort((a,b) => a.name.localeCompare(b.name));
  }, [allUsers, userCompanyLinks]);
  
  const userToUnlinkLink = userToUnlink ? userCompanyLinks.find(link => link.userPhone === userToUnlink.phone) : null;
  const userToUnlinkCompany = userToUnlinkLink ? empresas.find(e => e.id === userToUnlinkLink.empresaId) : null;

  const renderContent = () => {
    if (isLoadingLinks || isLoadingUsers) {
        return <tr><td colSpan={3} className="px-6 py-4 text-center text-gray-400">Carregando dados...</td></tr>;
    }
     if (error) {
        return <tr><td colSpan={3} className="px-6 py-4 text-center text-red-accent">Erro: {error}</td></tr>;
    }
    if (usersToDisplay.length === 0) {
        return <tr><td colSpan={3} className="px-6 py-4 text-center text-gray-500">Nenhum colaborador encontrado.</td></tr>;
    }
    return usersToDisplay.map(u => {
      const userLink = userCompanyLinks.find(link => link.userPhone === u.phone);
      const selectedCompanyId = userLink ? userLink.empresaId : '';
      return (
        <tr key={u.phone} className="bg-gray-800 border-b border-gray-700">
          <td className="px-6 py-4 font-medium text-white">
            <div className="font-semibold">{u.name}</div>
            <div className="text-xs text-gray-500">{u.phone}</div>
          </td>
          <td className="px-6 py-4">
            <select
              value={selectedCompanyId}
              onChange={(e) => handleLinkUser(u.phone, e.target.value)}
              className="px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-blue-500"
            >
              <option value="">Nenhuma</option>
              {empresas.map(empresa => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.name}
                </option>
              ))}
            </select>
          </td>
          <td className="px-6 py-4 text-right">
            {selectedCompanyId && (
                <button
                  onClick={() => handleStartUnlink(u)}
                  className="p-2 text-gray-400 rounded-md hover:bg-gray-700 hover:text-red-accent"
                  title="Desvincular usuário"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
            )}
          </td>
        </tr>
      );
    })
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Gestão de Colaboradores</h1>
          <button 
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-blue-accent hover:bg-blue-accent/90"
          >
              Vincular Colaborador
          </button>
      </div>

      <div className="overflow-x-auto">
        <h2 className="mb-4 text-lg font-semibold text-white">Vincular Usuário a Empresa</h2>
        <table className="min-w-full text-sm text-left text-gray-400">
          <thead className="text-xs text-gray-300 uppercase bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3">Colaborador</th>
              <th scope="col" className="px-6 py-3">Empresa Vinculada</th>
              <th scope="col" className="px-6 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {renderContent()}
          </tbody>
        </table>
      </div>

      <AddCollaboratorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCollaborator}
        empresas={empresas}
      />
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmUnlink}
        title="Confirmar Desvinculação"
        message={`Tem certeza de que deseja desvincular o colaborador "${userToUnlink?.name}" da empresa "${userToUnlinkCompany?.name}"?`}
      />
    </div>
  );
};

export default RHPage;
