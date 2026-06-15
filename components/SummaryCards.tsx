
import React from 'react';
import { ArrowUpCircleIcon, ArrowDownCircleIcon, CheckCircleIcon, CashIcon, ClipboardCheckIcon } from './icons';

interface SummaryCardsProps {
  revenue: number;
  expenses: number;
  balance: number;
  total: number;
  paid: number;
  isFutureMonth?: boolean;
}

const formatNumber = (value: number) => {
  return value.toLocaleString('pt-br', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const SummaryCard: React.FC<{ title: string; value: number; icon: React.ReactNode; colorclass: string, classname?: string }> = ({ title, value, icon, colorclass, classname = '' }) => (
    <div className={`p-4 bg-gray-800 rounded-lg shadow-md border-l-4 ${colorclass} ${classname}`}>
        <div className="flex items-center space-x-2">
            {icon}
            <p className="text-sm font-medium text-gray-400">{title}</p>
        </div>
        <p className="mt-2 text-lg md:text-2xl font-bold text-white">{formatNumber(value)}</p>
    </div>
);


const SummaryCards: React.FC<SummaryCardsProps> = ({ revenue, expenses, balance, total, paid, isFutureMonth = false }) => {
  const balanceTitle = isFutureMonth ? 'Previsão Saldo' : 'Saldo do Mês';
  const totalTitle = isFutureMonth ? 'Previsão Total' : 'Total';

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-6">
        <SummaryCard 
            title="Receitas"
            value={revenue}
            icon={<ArrowUpCircleIcon className="w-5 h-5 text-green-accent" />}
            colorclass="border-green-accent"
        />
        <SummaryCard 
            title="Despesas"
            value={expenses}
            icon={<ArrowDownCircleIcon className="w-5 h-5 text-red-accent" />}
            colorclass="border-red-accent"
        />
        <SummaryCard 
            title="Pagas"
            value={paid}
            icon={<ClipboardCheckIcon className="w-5 h-5 text-teal-400" />}
            colorclass="border-teal-400"
        />
        <SummaryCard 
            title={balanceTitle}
            value={balance}
            icon={<CheckCircleIcon className="w-5 h-5 text-blue-accent" />}
            colorclass="border-blue-accent"
        />
        <SummaryCard 
            title={totalTitle}
            value={total}
            icon={<CashIcon className="w-5 h-5 text-yellow-accent" />}
            colorclass="border-yellow-accent"
        />
    </div>
  );
};

export default SummaryCards;
