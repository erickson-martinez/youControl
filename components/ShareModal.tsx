
import React, { useState, useEffect } from 'react';
import type { SharedUser } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (sharedUserInfo: SharedUser) => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, onShare }) => {
  const [phone, setPhone] = useState('');
  const [aggregate, setAggregate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPhone('');
      setAggregate(false);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.trim()) {
      onShare({ phone: phone.trim(), aggregate });
      onClose();
    } else {
        alert("Por favor, insira um número de telefone.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="w-full max-w-lg p-6 mx-4 bg-gray-800 rounded-lg shadow-xl">
        <h2 className="mb-4 text-2xl font-bold text-white">Compartilhar Finanças</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="share-phone" className="block mb-1 text-sm font-medium text-gray-300">Telefone do Usuário</label>
            <input 
                type="tel" 
                name="phone" 
                id="share-phone" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                required 
                maxLength={11}
                className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-blue-500" 
                placeholder="Ex: 11987654321"
            />
          </div>

          <div className="flex items-center">
            <input 
                type="checkbox" 
                name="aggregate" 
                id="aggregate" 
                checked={aggregate} 
                onChange={(e) => setAggregate(e.target.checked)} 
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500" 
            />
            <label htmlFor="aggregate" className="ml-2 text-sm text-gray-300">Somar valores do usuário compartilhado ao seu saldo</label>
          </div>

          <div className="flex justify-end pt-4 space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 font-medium text-gray-300 bg-gray-600 rounded-md hover:bg-gray-700">Cancelar</button>
            <button type="submit" className="px-4 py-2 font-medium text-white rounded-md bg-blue-accent hover:bg-blue-accent/90">Compartilhar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShareModal;
