
import React from 'react';
import { PlusIcon, MinusIcon, UsersIcon } from './icons';

interface ActionButtonsProps {
  onAddRevenue: () => void;
  onAddExpense: () => void;
  onShare: () => void;
  isPastMonth: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ onAddRevenue, onAddExpense, onShare, isPastMonth }) => {

  return (
    <div className="flex gap-4 mb-6">
      <button
        onClick={onAddRevenue}
        disabled={isPastMonth}
        title={isPastMonth ? "Não é possível adicionar registros a meses anteriores." : "Adicionar receita"}
        className="flex items-center justify-center flex-1 px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-green-accent/90 hover:bg-green-accent disabled:bg-gray-600 disabled:cursor-not-allowed"
      >
        <PlusIcon className="w-5 h-5 mr-2" />
        <span className="hidden md:inline">Receita</span>
        <span className="md:hidden">$</span>
      </button>
      <button
        onClick={onAddExpense}
        disabled={isPastMonth}
        title={isPastMonth ? "Não é possível adicionar registros a meses anteriores." : "Adicionar despesa"}
        className="flex items-center justify-center flex-1 px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-red-accent/90 hover:bg-red-accent disabled:bg-gray-600 disabled:cursor-not-allowed"
      >
        <MinusIcon className="w-5 h-5 mr-2" />
        <span className="hidden md:inline">Despesa</span>
        <span className="md:hidden">$</span>
      </button>
      {!isPastMonth && (
        <button
          onClick={onShare}
          className="flex items-center justify-center flex-1 px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-blue-accent/90 hover:bg-blue-accent"
        >
          <UsersIcon className="w-5 h-5 md:mr-2" />
          <span className="hidden md:inline">Compartilhar</span>
        </button>
      )}
    </div>
  );
};

export default ActionButtons;