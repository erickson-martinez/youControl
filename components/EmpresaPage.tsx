
import React, { useState } from 'react';
import type { Empresa } from '../types';
import EmpresaFormModal from './EmpresaFormModal';
import ConfirmationModal from './ConfirmationModal';
import { PencilIcon, TrashIcon } from './icons';

interface EmpresaPageProps {
  empresas: Empresa[];
  onSave: (empresa: Omit<Empresa, 'id' | 'owner'>) => Promise<void>;
  onUpdate: (id: string, empresa: Partial<Omit<Empresa, 'id' | 'owner'>>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdateStatus: (id: string, status: 'ativo' | 'inativo') => Promise<void>;
}

const StatusBadge: React.FC<{ status: 'ativo' | 'inativo' }> = ({ status }) => {
    const isActive = status === 'ativo';
    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${isActive ? 'bg-green-accent/20 text-green-accent' : 'bg-red-accent/20 text-red-accent'}`}>
            {isActive ? 'Ativo' : 'Inativo'}
        </span>
    );
};

const EmpresaPage: React.FC<EmpresaPageProps> = ({ empresas, onSave, onUpdate, onDelete, onUpdateStatus }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null);
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingEmpresa, setDeletingEmpresa] = useState<Empresa | null>(null);

  const handleOpenModal = (empresa: Empresa | null = null) => {
    setEditingEmpresa(empresa);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingEmpresa(null);
    setIsModalOpen(false);
  };

  const handleSave = async (data: Omit<Empresa, 'id' | 'owner'>) => {
    if (editingEmpresa) {
        const { status, ...updateData } = data;
        await onUpdate(editingEmpresa.id, updateData);
    } else {
        await onSave(data);
    }
    handleCloseModal();
  };

  const handleStartDelete = (empresa: Empresa) => {
      setDeletingEmpresa(empresa);
      setIsConfirmOpen(true);
  };
  
  const handleConfirmDelete = async () => {
      if(deletingEmpresa) {
          await onDelete(deletingEmpresa.id);
      }
      setIsConfirmOpen(false);
      setDeletingEmpresa(null);
  };

  return (
    <>
      <div className="p-4 bg-gray-800 rounded-lg">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Gerenciar Empresas</h1>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-blue-accent hover:bg-blue-accent/90"
          >
            Nova Empresa
          </button>
        </div>

        <div className="space-y-4">
          {empresas.length > 0 ? empresas.map(empresa => (
            <div key={empresa.id} className="p-4 bg-gray-700 rounded-lg">
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-start">
                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-white">{empresa.name}</h3>
                            <StatusBadge status={empresa.status} />
                        </div>
                        {empresa.cnpj && <p className="text-sm text-gray-400">CNPJ: {empresa.cnpj}</p>}
                        {empresa.email && <p className="text-sm text-gray-400">Email: {empresa.email}</p>}
                        {empresa.phone && <p className="text-sm text-gray-400">Telefone: {empresa.phone}</p>}
                    </div>
                    <div className="flex items-center self-end space-x-2 sm:self-start">
                        <label htmlFor={`status-toggle-${empresa.id}`} className="flex items-center cursor-pointer" title={empresa.status === 'ativo' ? 'Desativar' : 'Ativar'}>
                            <div className="relative">
                                <input 
                                    type="checkbox" 
                                    id={`status-toggle-${empresa.id}`} 
                                    className="sr-only" 
                                    checked={empresa.status === 'ativo'}
                                    onChange={(e) => onUpdateStatus(empresa.id, e.target.checked ? 'ativo' : 'inativo')}
                                />
                                <div className="block w-10 h-6 bg-gray-600 rounded-full"></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${empresa.status === 'ativo' ? 'translate-x-4 bg-green-accent' : 'bg-red-accent'}`}></div>
                            </div>
                        </label>
                        <button onClick={() => handleOpenModal(empresa)} className="p-2 text-gray-400 rounded-md hover:bg-gray-600 hover:text-white" title="Editar"><PencilIcon className="w-4 h-4"/></button>
                        <button onClick={() => handleStartDelete(empresa)} className="p-2 text-gray-400 rounded-md hover:bg-gray-600 hover:text-red-accent" title="Excluir"><TrashIcon className="w-4 h-4"/></button>
                    </div>
                </div>
                 {(empresa.address || empresa.city || empresa.state) && (
                    <div className="pt-2 mt-2 text-sm text-gray-400 border-t border-gray-600">
                        <p>{empresa.address}{empresa.city && `, ${empresa.city}`}{empresa.state && ` - ${empresa.state}`}{empresa.zipCode && `, ${empresa.zipCode}`}</p>
                    </div>
                )}
            </div>
          )) : (
            <div className="py-8 text-center bg-gray-700 rounded-lg">
              <p className="text-gray-400">Nenhuma empresa cadastrada.</p>
              <p className="mt-1 text-sm text-gray-500">Clique em "Nova Empresa" para começar.</p>
            </div>
          )}
        </div>
      </div>
      
      {isModalOpen && (
          <EmpresaFormModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSave={handleSave}
            empresaToEdit={editingEmpresa}
          />
      )}

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir a empresa "${deletingEmpresa?.name}"? Esta ação não pode ser desfeita.`}
      />
    </>
  );
};

export default EmpresaPage;
