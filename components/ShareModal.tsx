
import React, { useState, useEffect } from 'react';
import type { SharedUser } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (sharedUserInfo: SharedUser) => Promise<void>;
  showAggregate?: boolean;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, onShare, showAggregate = true }) => {
  const [email, setEmail] = useState('');
  const [aggregate, setAggregate] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setAggregate(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
        alert("Por favor, insira um email ou telefone.");
        return;
    }
    
    setIsSharing(true);
    try {
      await onShare({ email: email.trim(), aggregate });
      onClose();
    } catch (error) {
      alert(`Falha ao compartilhar: ${(error as Error).message}`);
    } finally {
      setIsSharing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-lg p-5 sm:p-6 bg-gray-800 rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="mb-3 text-xl sm:text-2xl font-bold text-white">Compartilhar Suas Finanças</h2>
        <p className="mb-4 text-sm text-gray-400">
            Digite o email ou telefone da pessoa que poderá <strong>visualizar</strong> suas transações no painel dela.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="share-email" className="block mb-1 text-sm font-medium text-gray-300">Email ou Telefone do Visualizador</label>
            <input 
                type="text" 
                name="email" 
                id="share-email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                disabled={isSharing}
                className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 disabled:opacity-50" 
                placeholder="Ex: usuario@email.com ou 11987654321"
            />
          </div>

          {showAggregate && (
            <div className="flex items-center">
                <input 
                    type="checkbox" 
                    name="aggregate" 
                    id="aggregate" 
                    checked={aggregate} 
                    onChange={(e) => setAggregate(e.target.checked)} 
                    disabled={isSharing}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 disabled:opacity-50 shrink-0" 
                />
                <label htmlFor="aggregate" className={`ml-2 text-sm text-gray-300 ${isSharing ? 'opacity-50' : ''}`}>Permitir que ela some seus valores ao total dela</label>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 sm:space-x-3">
            <button type="button" onClick={onClose} disabled={isSharing} className="w-full sm:w-auto px-4 py-2 font-medium text-gray-300 bg-gray-600 rounded-md hover:bg-gray-700 disabled:opacity-50">Cancelar</button>
            <button type="submit" disabled={isSharing} className="w-full sm:w-auto px-4 py-2 font-medium text-white rounded-md bg-blue-accent hover:bg-blue-accent/90 disabled:bg-gray-500 disabled:cursor-wait">
                {isSharing ? 'Compartilhando...' : 'Conceder Acesso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShareModal;
