
import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

interface MonthNavigatorProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  disablePrev?: boolean;
  disableNext?: boolean;
  rightAction?: React.ReactNode;
}

const MonthNavigator: React.FC<MonthNavigatorProps> = ({ currentDate, setCurrentDate, disablePrev = false, disableNext = false, rightAction }) => {
  const changeMonth = (amount: number) => {
    const newDate = new Date(currentDate.getTime());
    newDate.setDate(1); // Set to the first of the month to avoid day overflow issues
    newDate.setMonth(newDate.getMonth() + amount);
    setCurrentDate(newDate);
  };

  const monthName = currentDate.toLocaleString('pt-BR', { month: 'long' });
  const year = currentDate.getFullYear();

  return (
    <div className="flex items-center justify-between px-4 py-2 mb-4 bg-gray-800 rounded-lg shadow-sm border border-gray-700/50">
      <button
        onClick={() => changeMonth(-1)}
        disabled={disablePrev}
        className="p-2 text-gray-400 transition-colors rounded-lg hover:bg-gray-700 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        aria-label="Mês anterior"
      >
        <ChevronLeftIcon className="w-5 h-5" />
      </button>
      
      <div className="flex-1 text-lg font-bold text-center text-white capitalize">
        {monthName} <span className="text-gray-400 font-normal">{year}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
            onClick={() => changeMonth(1)}
            disabled={disableNext}
            className="p-2 text-gray-400 transition-colors rounded-lg hover:bg-gray-700 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            aria-label="Próximo mês"
        >
            <ChevronRightIcon className="w-5 h-5" />
        </button>
        
        {rightAction && (
            <div className="flex items-center pl-2 ml-1 border-l border-gray-700">
                {rightAction}
            </div>
        )}
      </div>
    </div>
  );
};

export default MonthNavigator;
