
import React, { useState, useEffect } from 'react';
import { TransactionType, PaymentStatus, type Transaction } from '../types';

type FormDataType = {
  name: string;
  amount: string;
  date: string;
  paid: boolean;
  isControlled: boolean;
  counterpartyPhone: string;
  repeat: boolean;
  repeatCount: string;
};

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: (Omit<Transaction, 'id' | 'ownerPhone' | 'controlId'> | Transaction) & { repeatCount?: number }) => void;
  type: TransactionType;
  transactionToEdit?: Transaction | null;
  currentDateForForm: Date;
}

const TransactionFormModal: React.FC<TransactionFormModalProps> = ({ isOpen, onClose, onSubmit, type, transactionToEdit, currentDateForForm }) => {
  const [formData, setFormData] = useState<FormDataType>({
    name: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paid: true,
    isControlled: false,
    counterpartyPhone: '',
    repeat: false,
    repeatCount: '1',
  });

  const isExpense = type === TransactionType.EXPENSE;
  const isEditing = !!transactionToEdit;

  useEffect(() => {
    if (transactionToEdit) {
      setFormData({
        name: transactionToEdit.name,
        amount: String(transactionToEdit.amount),
        date: transactionToEdit.date,
        paid: transactionToEdit.status === PaymentStatus.PAID,
        isControlled: transactionToEdit.isControlled,
        counterpartyPhone: transactionToEdit.counterpartyPhone || '',
        repeat: false,
        repeatCount: '1',
      });
    } else {
      const dateForForm = new Date(currentDateForForm);
      const year = dateForForm.getFullYear();
      const month = String(dateForForm.getMonth() + 1).padStart(2, '0');
      const day = String(dateForForm.getDate()).padStart(2, '0');

      setFormData({
        name: '',
        amount: '',
        date: `${year}-${month}-${day}`,
        paid: false,
        isControlled: false,
        counterpartyPhone: '',
        repeat: false,
        repeatCount: '1',
      });
    }
  }, [transactionToEdit, isOpen, isExpense, currentDateForForm]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const repeatCount = formData.repeat ? parseInt(formData.repeatCount, 10) : 0;
    
    if (isEditing && transactionToEdit) {
        const updatedTransaction: Transaction = {
            ...transactionToEdit,
            name: formData.name,
            amount: parseFloat(formData.amount),
            date: formData.date,
            status: formData.paid ? PaymentStatus.PAID : PaymentStatus.UNPAID,
        };
        onSubmit(updatedTransaction);
    } else {
        const submissionData = {
            name: formData.name,
            amount: parseFloat(formData.amount),
            date: formData.date,
            type,
            isControlled: formData.isControlled,
            counterpartyPhone: formData.counterpartyPhone || undefined,
            status: formData.isControlled ? PaymentStatus.UNPAID : (formData.paid ? PaymentStatus.PAID : PaymentStatus.UNPAID),
            repeatCount: repeatCount > 0 ? repeatCount : undefined,
        };
        onSubmit(submissionData);
    }
  };

  if (!isOpen) return null;

  const title = isEditing 
    ? (isExpense ? 'Editar Despesa' : 'Editar Receita')
    : (isExpense ? 'Registrar Despesa' : 'Registrar Receita');
  const controlLabel = isExpense ? 'Pagar para' : 'Cobrar de';
  const submitButtonColor = isExpense ? 'bg-red-accent hover:bg-red-accent/90' : 'bg-green-accent hover:bg-green-accent/90';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="w-full max-w-lg p-6 mx-4 bg-gray-800 rounded-lg shadow-xl">
        <h2 className="mb-4 text-2xl font-bold text-white">{title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block mb-1 text-sm font-medium text-gray-300">Nome</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="amount" className="block mb-1 text-sm font-medium text-gray-300">Valor (R$)</label>
              <input type="number" name="amount" id="amount" value={formData.amount} onChange={handleChange} required step="0.01" min="0.01" className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="date" className="block mb-1 text-sm font-medium text-gray-300">Data</label>
              <input type="date" name="date" id="date" value={formData.date} onChange={handleChange} required className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-blue-500" />
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center">
                <input type="checkbox" name="paid" id="paid" checked={formData.paid} onChange={handleChange} disabled={formData.isControlled} className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 disabled:opacity-50" />
                <label htmlFor="paid" className={`ml-2 text-sm text-gray-300 ${formData.isControlled ? 'opacity-50' : ''}`}>Pago</label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" name="isControlled" id="isControlled" checked={formData.isControlled} onChange={handleChange} disabled={isEditing} className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 disabled:opacity-50" />
              <label htmlFor="isControlled" className={`ml-2 text-sm text-gray-300 ${isEditing ? 'opacity-50' : ''}`}>{controlLabel}</label>
            </div>
             {!isEditing && (
              <div className="flex items-center">
                <input type="checkbox" name="repeat" id="repeat" checked={formData.repeat} onChange={handleChange} className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500" />
                <label htmlFor="repeat" className="ml-2 text-sm text-gray-300">Repetir +</label>
              </div>
            )}
          </div>

          {formData.isControlled && (
            <div>
              <label htmlFor="counterpartyPhone" className="block mb-1 text-sm font-medium text-gray-300">Telefone</label>
              <input type="tel" name="counterpartyPhone" id="counterpartyPhone" value={formData.counterpartyPhone} onChange={handleChange} required maxLength={11} disabled={isEditing} className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 disabled:opacity-50" placeholder="(XX) XXXXX-XXXX" />
            </div>
          )}

          {!isEditing && formData.repeat && (
            <div>
              <label htmlFor="repeatCount" className="block mb-1 text-sm font-medium text-gray-300">Repetir por quantos meses?</label>
              <input type="number" name="repeatCount" id="repeatCount" value={formData.repeatCount} onChange={handleChange} required min="1" className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-blue-500" placeholder="Ex: 11 (total de 12x)" />
            </div>
          )}

          <div className="flex justify-end pt-4 space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 font-medium text-gray-300 bg-gray-600 rounded-md hover:bg-gray-700">Cancelar</button>
            <button type="submit" className={`px-4 py-2 font-medium text-white rounded-md ${submitButtonColor}`}>{isEditing ? 'Salvar Alterações' : 'Registrar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionFormModal;
