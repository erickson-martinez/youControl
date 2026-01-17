
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
  const [linkedUsers, setLinkedUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (empresas.length === 0) {
      setLinkedUsers([]);
      setUserCompanyLinks([]);
      setIsLoading(false);
      return;
    }

    try {
      // 1. Fetch all users in the system to resolve names from phones.
      const usersResponse = await apiFetch(`${API_BASE_URL}/users`);
      const usersData = await usersResponse.json();
      const allUsersList: User[] = (Array.isArray(usersData) ? usersData : usersData.users) || [];
      const userMap = allUsersList.reduce((acc, u) => {
        acc[u.phone] = u.name;
        return acc;
      }, {} as Record<string, string>);

      // 2. Fetch all employee links for the managed companies.
      const linkPromises = empresas
        .filter(e => e && e.id)
        .map(empresa =>
          apiFetch(`${API_BASE_URL}/rh/${empresa.id}/employees`)
            .then(res => (res.ok ? res.json() : Promise.resolve({ listEmployees: [] })))
            .then(data => (data.listEmployees || []).map((link: any) => ({ ...link, empresaId: empresa.id })))
        );
      
      const linkResults = await Promise.all(linkPromises);
      const allLinksRaw: any[] = linkResults.flat();

      const links: UserCompanyLink[] = [];
      const currentLinkedUsers: User[] = [];
      const seenPhones = new Set<string>();

      allLinksRaw.forEach(link => {
        const userPhone = link.userPhone;
        if (userPhone && userMap[userPhone]) { // Ensure the user exists in our map
          links.push({
            _id: link.empId || link._id,
            userPhone: userPhone,
            empresaId: link.empresaId,
            status: link.status,
          });
          
          if (!seenPhones.has(userPhone)) {
            currentLinkedUsers.push({ name: userMap[userPhone], phone: userPhone });
            seenPhones.add(userPhone);
          }
        }
      });

      setUserCompanyLinks(links);
      setLinkedUsers(currentLinkedUsers.sort((a, b) => a.name.localeCompare(b.name)));

    } catch (err) {
      console.error("Falha ao buscar dados de RH:", err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [apiFetch, empresas]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


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
      
      await fetchData();
      
      if (user.phone === userPhone) {
        onCurrentUserUpdate();
      }
    } catch (err) {
      alert(`Falha ao vincular/desvincular: ${(err as Error).message}`);
    }
  }, [user.phone, apiFetch, userCompanyLinks, fetchData, onCurrentUserUpdate]);

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
  
  const userToUnlinkLink = userToUnlink ? userCompanyLinks.find(link => link.userPhone === userToUnlink.phone) : null;
  const userToUnlinkCompany = userToUnlinkLink ? empresas.find(e => e.id === userToUnlinkLink.empresaId) : null;

  const renderContent = () => {
    if (isLoading) {
        return <tr><td colSpan={3} className="px-6 py-4 text-center text-gray-400">Carregando colaboradores...</td></tr>;
    }
     if (error) {
        return <tr><td colSpan={3} className="px-6 py-4 text-center text-red-accent">Erro: {error}</td></tr>;
    }
    if (linkedUsers.length === 0) {
        return <tr><td colSpan={3} className="px-6 py-4 text-center text-gray-500">Nenhum colaborador vinculado encontrado.</td></tr>;
    }
    return linkedUsers.map(u => {
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
        <h2 className="mb-4 text-lg font-semibold text-white">Colaboradores Vinculados</h2>
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
        linkedUserPhones={userCompanyLinks.map(link => link.userPhone)}
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
