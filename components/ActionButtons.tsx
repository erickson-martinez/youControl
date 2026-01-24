
import React from 'react';
import { PlusIcon, MinusIcon, UsersIcon, ChartBarIcon } from './icons';

interface ActionButtonsProps {
  onAddRevenue: () => void;
  onAddExpense: () => void;
  onShare: () => void;
  onViewReports: () => void;
  isPastMonth: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ onAddRevenue, onAddExpense, onShare, onViewReports, isPastMonth }) => {

  return (
    <div className="flex gap-2 mb-6 md:gap-4">
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
      <button
        onClick={onViewReports}
        className="flex items-center justify-center px-4 py-2 text-white transition-colors bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 hover:text-purple-400"
        title="Ver Relatórios e Gráficos"
      >
        <ChartBarIcon className="w-6 h-6" />
      </button>
    </div>
  );
};

export default ActionButtons;
