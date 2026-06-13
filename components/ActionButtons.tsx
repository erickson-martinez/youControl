
import React from 'react';
import { PlusIcon, MinusIcon, UsersIcon, ChartBarIcon, DownloadIcon } from './icons';

interface ActionButtonsProps {
  onAddRevenue: () => void;
  onAddExpense: () => void;
  onShare: () => void;
  onViewReports: () => void;
  onExportPDF: () => void;
  isPastMonth: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ onAddRevenue, onAddExpense, onShare, onViewReports, onExportPDF, isPastMonth }) => {

  return (
    <div className="grid grid-cols-2 md:flex md:flex-wrap md:flex-row gap-2 mb-6 md:gap-4">
      <button
        onClick={onAddRevenue}
        disabled={isPastMonth}
        title={isPastMonth ? "Não é possível adicionar registros a meses anteriores." : "Adicionar receita"}
        className="flex items-center justify-center col-span-1 md:flex-1 px-3 py-2 md:px-4 md:py-2 text-sm md:text-base font-semibold text-white transition-colors rounded-lg bg-green-accent/90 hover:bg-green-accent disabled:bg-gray-600 disabled:cursor-not-allowed"
      >
        <PlusIcon className="w-4 h-4 md:w-5 md:h-5 md:mr-2" />
        <span className="hidden md:inline">Receita</span>
        <span className="md:hidden ml-1">Receita</span>
      </button>
      <button
        onClick={onAddExpense}
        disabled={isPastMonth}
        title={isPastMonth ? "Não é possível adicionar registros a meses anteriores." : "Adicionar despesa"}
        className="flex items-center justify-center col-span-1 md:flex-1 px-3 py-2 md:px-4 md:py-2 text-sm md:text-base font-semibold text-white transition-colors rounded-lg bg-red-accent/90 hover:bg-red-accent disabled:bg-gray-600 disabled:cursor-not-allowed"
      >
        <MinusIcon className="w-4 h-4 md:w-5 md:h-5 md:mr-2" />
        <span className="hidden md:inline">Despesa</span>
        <span className="md:hidden ml-1">Despesa</span>
      </button>
      {!isPastMonth && (
        <button
          onClick={onShare}
          className="flex items-center justify-center col-span-2 md:col-span-1 md:flex-1 px-3 py-2 md:px-4 md:py-2 text-sm md:text-base font-semibold text-white transition-colors rounded-lg bg-blue-accent/90 hover:bg-blue-accent"
        >
          <UsersIcon className="w-4 h-4 md:w-5 md:h-5 mr-2" />
          <span>Compartilhar</span>
        </button>
      )}
      <div className="flex gap-2 col-span-2 md:col-span-auto md:w-auto">
        <button
          onClick={onViewReports}
          className="flex items-center justify-center flex-1 md:flex-initial px-4 py-2 text-white transition-colors bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 hover:text-purple-400"
          title="Ver Relatórios e Gráficos"
        >
          <ChartBarIcon className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <button
          onClick={onExportPDF}
          className="flex items-center justify-center flex-1 md:flex-initial px-4 py-2 text-white transition-colors bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 hover:text-orange-400"
          title="Exportar Relatório PDF (Todos os Meses)"
        >
          <DownloadIcon className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      </div>
    </div>
  );
};

export default ActionButtons;
