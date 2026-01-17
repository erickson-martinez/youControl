
import React, { useState } from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  const [isConfirming, setIsConfirming] = useState(false);
  
  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
    } catch (error) {
        // A notificação de erro deve ser tratada no local da chamada (componente pai)
        console.error("Falha na ação de confirmação:", error);
    } finally {
        setIsConfirming(false);
        // O fechamento do modal é responsabilidade do componente pai para garantir que o estado seja atualizado corretamente após a API.
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" aria-modal="true" role="dialog">
      <div className="w-full max-w-md p-6 mx-4 bg-gray-800 rounded-lg shadow-xl">
        <h2 className="mb-4 text-xl font-bold text-white">{title}</h2>
        <p className="mb-6 text-gray-300">{message}</p>
        <div className="flex justify-end space-x-3">
          <button 
            type="button" 
            onClick={onClose} 
            disabled={isConfirming}
            className="px-4 py-2 font-medium text-gray-300 bg-gray-600 rounded-md hover:bg-gray-700 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button 
            type="button" 
            onClick={handleConfirm} 
            disabled={isConfirming}
            className="px-4 py-2 font-medium text-white bg-red-accent rounded-md hover:bg-red-accent/90 disabled:bg-gray-500 disabled:cursor-wait"
          >
            {isConfirming ? 'Confirmando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
