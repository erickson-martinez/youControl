
import React from 'react';
import { ArrowUpCircleIcon, ArrowDownCircleIcon, CheckCircleIcon, CashIcon, ClipboardCheckIcon } from './icons';

interface SummaryCardsProps {
  revenue: number;
  expenses: number;
  balance: number;
  total: number;
  paid: number;
  investments: number;
  isFutureMonth?: boolean;
}

const formatNumber = (value: number) => {
  return value.toLocaleString('pt-br', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const SummaryCard: React.FC<{ title: string; value: number; colorclass: string, classname?: string }> = ({ title, value, colorclass, classname = '' }) => (
    <div className={`flex-1 min-w-[140px] md:min-w-[160px] p-4 bg-gray-800 rounded-lg shadow-md border-l-4 ${colorclass} ${classname}`}>
        <div className="flex items-center space-x-2">
            <p className="text-xs sm:text-sm font-medium text-gray-400 whitespace-nowrap truncate">{title}</p>
        </div>
        <p className="mt-2 text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white truncate">{formatNumber(value)}</p>
    </div>
);

const SummaryCards: React.FC<SummaryCardsProps> = ({ revenue, expenses, balance, total, paid, investments, isFutureMonth = false }) => {
  const balanceTitle = isFutureMonth ? 'Previsão Saldo' : 'Saldo do Mês';
  const totalTitle = isFutureMonth ? 'Previsão Total' : 'Total Geral';

  return (
    <div className="flex flex-wrap gap-3 md:gap-4 mb-6">
        <SummaryCard 
            title="Receitas"
            value={revenue}
            colorclass="border-green-accent"
        />
        <SummaryCard 
            title="Despesas"
            value={expenses}
            colorclass="border-red-accent"
        />
        <SummaryCard 
            title="Pagas"
            value={paid}
            colorclass="border-teal-400"
        />
        <SummaryCard 
            title="Investimentos"
            value={investments}
            colorclass="border-yellow-accent text-yellow-100"
            classname="bg-yellow-900/20"
        />
        <SummaryCard 
            title={balanceTitle}
            value={balance}
            colorclass="border-blue-accent"
        />
        <SummaryCard 
            title={totalTitle}
            value={total}
            colorclass="border-purple-400"
        />
    </div>
  );
};

export default SummaryCards;
