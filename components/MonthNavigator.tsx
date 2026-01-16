import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

interface MonthNavigatorProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  disablePrev?: boolean;
  disableNext?: boolean;
}

const MonthNavigator: React.FC<MonthNavigatorProps> = ({ currentDate, setCurrentDate, disablePrev = false, disableNext = false }) => {
  const changeMonth = (amount: number) => {
    const newDate = new Date(currentDate.getTime());
    newDate.setDate(1); // Set to the first of the month to avoid day overflow issues
    newDate.setMonth(newDate.getMonth() + amount);
    setCurrentDate(newDate);
  };

  const monthName = currentDate.toLocaleString('pt-BR', { month: 'long' });
  const year = currentDate.getFullYear();

  return (
    <div className="flex items-center justify-between px-4 py-2 mb-4 bg-gray-800 rounded-lg">
      <button
        onClick={() => changeMonth(-1)}
        disabled={disablePrev}
        className="p-2 text-gray-400 transition-colors rounded-full hover:bg-gray-700 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        aria-label="Mês anterior"
      >
        <ChevronLeftIcon className="w-6 h-6" />
      </button>
      <div className="text-lg font-semibold text-center text-white capitalize">
        {monthName} <span className="text-gray-400">{year}</span>
      </div>
      <button
        onClick={() => changeMonth(1)}
        disabled={disableNext}
        className="p-2 text-gray-400 transition-colors rounded-full hover:bg-gray-700 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        aria-label="Próximo mês"
      >
        <ChevronRightIcon className="w-6 h-6" />
      </button>
    </div>
  );
};

export default MonthNavigator;