
import React from 'react';
import { PlusIcon, MinusIcon, UsersIcon, ChartBarIcon, DownloadIcon, BellIcon, ShareIcon } from './icons';

interface ActionButtonsProps {
  onAddRevenue: () => void;
  onAddExpense: () => void;
  onAddInvestment: () => void;
  onShare: () => void;
  onWebShare?: () => void;
  onViewReports: () => void;
  onExportPDF: () => void;
  onOpenNotifications?: () => void;
  notificationCount?: number;
  isPastMonth: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onAddRevenue,
  onAddExpense,
  onAddInvestment,
  onShare,
  onWebShare,
  onViewReports,
  onExportPDF,
  onOpenNotifications,
  notificationCount = 0,
  isPastMonth,
}) => {

  return (
    <div className="grid grid-cols-3 md:flex md:flex-wrap md:flex-row gap-2 mb-6 md:gap-4">
      <button
        onClick={onAddRevenue}
        disabled={isPastMonth}
        title={isPastMonth ? "Não é possível adicionar registros a meses anteriores." : "Adicionar receita"}
        className="flex items-center justify-center col-span-1 md:flex-1 px-2 py-2 md:px-4 md:py-2 text-sm md:text-base font-semibold text-white transition-colors rounded-lg bg-green-accent/90 hover:bg-green-accent disabled:bg-gray-600 disabled:cursor-not-allowed"
      >
        <PlusIcon className="w-4 h-4 md:w-5 md:h-5 md:mr-2" />
        <span className="hidden md:inline">Receita</span>
        <span className="md:hidden ml-1 text-xs sm:text-sm">Receita</span>
      </button>
      <button
        onClick={onAddExpense}
        disabled={isPastMonth}
        title={isPastMonth ? "Não é possível adicionar registros a meses anteriores." : "Adicionar despesa"}
        className="flex items-center justify-center col-span-1 md:flex-1 px-2 py-2 md:px-4 md:py-2 text-sm md:text-base font-semibold text-white transition-colors rounded-lg bg-red-accent/90 hover:bg-red-accent disabled:bg-gray-600 disabled:cursor-not-allowed"
      >
        <MinusIcon className="w-4 h-4 md:w-5 md:h-5 md:mr-2" />
        <span className="hidden md:inline">Despesa</span>
        <span className="md:hidden ml-1 text-xs sm:text-sm">Despesa</span>
      </button>
      <button
        onClick={onAddInvestment}
        disabled={isPastMonth}
        title={isPastMonth ? "Não é possível adicionar registros a meses anteriores." : "Adicionar investimento"}
        className="flex items-center justify-center col-span-1 md:flex-1 px-2 py-2 md:px-4 md:py-2 text-sm md:text-base font-semibold text-white transition-colors rounded-lg bg-yellow-accent/90 hover:bg-yellow-accent disabled:bg-gray-600 disabled:cursor-not-allowed"
      >
        <PlusIcon className="w-4 h-4 md:w-5 md:h-5 md:mr-2" />
        <span className="hidden md:inline">Investir</span>
        <span className="md:hidden ml-1 text-xs sm:text-sm">Investir</span>
      </button>
      <div className="flex gap-2 col-span-3 md:col-span-auto md:w-auto md:flex-1">
        {onOpenNotifications && (
          <button
            onClick={onOpenNotifications}
            className="relative flex items-center justify-center flex-1 md:flex-initial px-4 py-2 text-white transition-colors bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 hover:text-blue-400"
            title="Central de Notificações"
          >
            <BellIcon className="w-5 h-5 md:w-6 md:h-6" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-md animate-pulse">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>
        )}

        <button
          onClick={onViewReports}
          className="flex items-center justify-center flex-1 md:flex-initial px-4 py-2 text-white transition-colors bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 hover:text-purple-400"
          title="Ver Relatórios e Gráficos"
        >
          <ChartBarIcon className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        
        {onWebShare && (
          <button
            onClick={onWebShare}
            className="flex items-center justify-center flex-1 md:flex-initial px-4 py-2 text-white transition-colors bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 hover:text-green-400"
            title="Compartilhar Resumo Financeiro via Apps"
          >
            <ShareIcon className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        )}

        {!isPastMonth && (
          <button
            onClick={onShare}
            className="flex items-center justify-center flex-1 md:flex-initial px-4 py-2 text-white transition-colors bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 hover:text-blue-300"
            title="Gerenciar Usuários Compartilhados"
          >
            <UsersIcon className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        )}
        
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
