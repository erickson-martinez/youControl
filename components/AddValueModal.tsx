
import React, { useState, useEffect } from 'react';
import { TransactionType } from '../types';

interface AddValueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string, value: number }) => Promise<void>;
  transactionType: TransactionType;
}

const AddValueModal: React.FC<AddValueModalProps> = ({ isOpen, onClose, onSubmit, transactionType }) => {
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setValue('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericValue = parseFloat(value);
    if (!name.trim() || isNaN(numericValue) || numericValue <= 0) {
      alert("Por favor, preencha um nome válido e um valor numérico positivo.");
      return;
    }

    setIsSaving(true);
    try {
        await onSubmit({ name: name.trim(), value: numericValue });
    } catch (error) {
        console.error("Falha ao adicionar valor:", error);
        alert(`Ocorreu um erro ao adicionar o valor: ${(error as Error).message}`);
    } finally {
        setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const isExpense = transactionType === TransactionType.EXPENSE;
  const title = isExpense ? 'Adicionar Despesa' : 'Adicionar Receita';
  const submitButtonColor = isExpense ? 'bg-red-accent hover:bg-red-accent/90' : 'bg-green-accent hover:bg-green-accent/90';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="w-full max-w-md p-6 mx-4 bg-gray-800 rounded-lg shadow-xl">
        <h2 className="mb-4 text-xl font-bold text-white">{title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
            <fieldset disabled={isSaving}>
              <div>
                <label htmlFor="add-value-name" className="block mb-1 text-sm font-medium text-gray-300">Descrição</label>
                <input
                  type="text"
                  id="add-value-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md disabled:opacity-50"
                  placeholder="Ex: Compra no mercado"
                />
              </div>
              <div>
                <label htmlFor="add-value-amount" className="block mb-1 text-sm font-medium text-gray-300">Valor (R$)</label>
                <input
                  type="number"
                  id="add-value-amount"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                  step="0.01"
                  min="0.01"
                  className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md disabled:opacity-50"
                  placeholder="Ex: 150.25"
                />
              </div>
            </fieldset>
          <div className="flex justify-end pt-4 space-x-3">
            <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 font-medium text-gray-300 bg-gray-600 rounded-md hover:bg-gray-700 disabled:opacity-50">Cancelar</button>
            <button type="submit" disabled={isSaving} className={`px-4 py-2 font-medium text-white rounded-md ${submitButtonColor} disabled:bg-gray-500 disabled:cursor-wait`}>
                {isSaving ? 'Adicionando...' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddValueModal;
