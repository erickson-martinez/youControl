
import React, { useState, useEffect, useCallback } from 'react';
import type { Loja, User } from '../types';
import LojaFormModal from './LojaFormModal';
import ConfirmationModal from './ConfirmationModal';
import { PencilIcon, TrashIcon, PlusIcon } from './icons';
import { API_BASE_URL } from '../constants';

interface LojasPageProps {
  user: User;
}

const STORE_TYPE_LABELS: Record<string, string> = {
  supermarket: 'Supermercado',
  wholesale: 'Atacadista',
  bakery: 'Padaria',
  butcher: 'Açougue',
  pharmacy: 'Farmácia',
  petshop: 'Pet Shop',
  convenience: 'Conveniência',
  hardware: 'Material de Construção',
  restaurant: 'Restaurante',
  other: 'Outro'
};

const LojasPage: React.FC<LojasPageProps> = ({ user }) => {
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLoja, setEditingLoja] = useState<Loja | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingLoja, setDeletingLoja] = useState<Loja | null>(null);
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

  const fetchLojas = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
        const response = await apiFetch(`${API_BASE_URL}/stores`);
        const data = await response.json();
        const mappedLojas: Loja[] = (data || []).map((l: any) => ({
            ...l,
            id: l._id // Map _id to id
        }));
        setLojas(mappedLojas);
    } catch (err) {
        console.error("Falha ao buscar lojas:", err);
        setError((err as Error).message);
    } finally {
        setIsLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchLojas();
  }, [fetchLojas]);

  const handleOpenModal = (loja: Loja | null = null) => {
    setEditingLoja(loja);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingLoja(null);
    setIsModalOpen(false);
  };

  const handleSave = async (data: Omit<Loja, 'id'>) => {
    const payload = { ...data };
    
    if (editingLoja) {
        await apiFetch(`${API_BASE_URL}/stores/${editingLoja.id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });
    } else {
        await apiFetch(`${API_BASE_URL}/stores`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }
    await fetchLojas();
    handleCloseModal();
  };

  const handleUpdateStatus = async (loja: Loja, newStatus: 'active' | 'inactive') => {
      try {
          await apiFetch(`${API_BASE_URL}/stores/${loja.id}`, {
              method: 'PATCH',
              body: JSON.stringify({ status: newStatus }),
          });
          await fetchLojas();
      } catch (err) {
          alert(`Erro ao atualizar status: ${(err as Error).message}`);
      }
  };

  const handleStartDelete = (loja: Loja) => {
      setDeletingLoja(loja);
      setIsConfirmOpen(true);
  };
  
  const handleConfirmDelete = async () => {
      if(deletingLoja) {
          try {
            await apiFetch(`${API_BASE_URL}/stores/${deletingLoja.id}`, {
                method: 'DELETE',
            });
            await fetchLojas();
          } catch (err) {
            alert(`Erro ao excluir: ${(err as Error).message}`);
          }
      }
      setIsConfirmOpen(false);
      setDeletingLoja(null);
  };

  return (
    <>
      <div className="p-4 bg-gray-800 rounded-lg">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Lojas</h1>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-blue-accent hover:bg-blue-accent/90"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Nova Loja
          </button>
        </div>

        {isLoading ? (
            <p className="text-center text-gray-400">Carregando lojas...</p>
        ) : error ? (
            <p className="text-center text-red-accent">Erro: {error}</p>
        ) : (
            <div className="space-y-4">
            {lojas.length > 0 ? lojas.map(loja => (
                <div key={loja.id} className="p-4 bg-gray-700 rounded-lg">
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-start">
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="text-lg font-bold text-white">{loja.organization} - {loja.name}</h3>
                                <button
                                    onClick={() => handleUpdateStatus(loja, loja.status === 'active' ? 'inactive' : 'active')}
                                    className={`px-2 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors ${loja.status === 'active' ? 'bg-green-accent/20 text-green-accent hover:bg-green-accent/30' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                                    title={loja.status === 'active' ? 'Desativar loja' : 'Ativar loja'}
                                >
                                    {loja.status === 'active' ? 'Ativo' : 'Inativo'}
                                </button>
                            </div>
                            <p className="text-sm font-medium text-gray-300 mb-1">
                                {STORE_TYPE_LABELS[loja.type] || loja.type}
                            </p>
                            <p className="text-sm text-gray-400">
                                {loja.address}{loja.number ? `, ${loja.number}` : ''}{loja.district ? ` - ${loja.district}` : ''}
                            </p>
                            <p className="text-sm text-gray-400">
                                {loja.city}/{loja.state} {loja.zip ? `| CEP: ${loja.zip}` : ''}
                            </p>
                        </div>
                        <div className="flex items-center self-end space-x-2 sm:self-start">
                            <button onClick={() => handleOpenModal(loja)} className="p-2 text-gray-400 rounded-md hover:bg-gray-600 hover:text-white" title="Editar"><PencilIcon className="w-4 h-4"/></button>
                            <button onClick={() => handleStartDelete(loja)} className="p-2 text-gray-400 rounded-md hover:bg-gray-600 hover:text-red-accent" title="Excluir"><TrashIcon className="w-4 h-4"/></button>
                        </div>
                    </div>
                </div>
            )) : (
                <div className="py-8 text-center bg-gray-700 rounded-lg">
                <p className="text-gray-400">Nenhuma loja cadastrada.</p>
                </div>
            )}
            </div>
        )}
      </div>
      
      {isModalOpen && (
          <LojaFormModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSave={handleSave}
            lojaToEdit={editingLoja}
          />
      )}

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir a loja "${deletingLoja?.name}"? Esta ação não pode ser desfeita.`}
      />
    </>
  );
};

export default LojasPage;
