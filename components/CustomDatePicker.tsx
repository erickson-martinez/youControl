import React, { useState } from 'react';

const ptBRMonths = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const ptBRWeekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const CustomDatePicker = ({ 
  selectedDate, 
  onChange,
  onMonthChange,
  allowPast = false
}: { 
  selectedDate: string; 
  onChange: (d: string) => void;
  onMonthChange?: () => void;
  allowPast?: boolean;
}) => {
  const [baseDate, setBaseDate] = useState(() => {
    if (selectedDate) return new Date(selectedDate + "T00:00:00");
    const d = new Date();
    d.setHours(0,0,0,0);
    return d;
  });

  const nextMonth = () => {
    const newD = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1);
    setBaseDate(newD);
    onMonthChange && onMonthChange();
  };

  const prevMonth = () => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const newD = new Date(baseDate.getFullYear(), baseDate.getMonth() - 1, 1);
    
    if (!allowPast && (newD.getFullYear() < today.getFullYear() || 
       (newD.getFullYear() === today.getFullYear() && newD.getMonth() < today.getMonth()))) {
      return;
    }
    setBaseDate(newD);
    onMonthChange && onMonthChange();
  };

  const currentMonthName = ptBRMonths[baseDate.getMonth()];
  const currentYear = baseDate.getFullYear();

  const today = new Date();
  today.setHours(0,0,0,0);
  
  const daysInMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0).getDate();
  const generateDays = () => {
    const days = [];
    for(let i=1; i<=daysInMonth; i++) {
        const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), i);
        if (allowPast || d.getTime() >= today.getTime()) {
            days.push(d);
        }
    }
    return days;
  }

  const days = generateDays();

  const handleSelectDay = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
  };

  return (
    <div className="w-full bg-gray-800/80 rounded-xl border border-gray-700/50 overflow-hidden shadow-lg">
      <div className="flex items-center justify-between p-3 bg-gray-900 border-b border-gray-800">
        <button type="button" onClick={prevMonth} className={`p-2 rounded-lg transition-colors ${(!allowPast && baseDate.getMonth() === today.getMonth() && baseDate.getFullYear() === today.getFullYear()) ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="font-bold text-white text-lg capitalize">{currentMonthName} <span className="font-normal text-gray-400">{currentYear}</span></span>
        <button type="button" onClick={nextMonth} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      <div className="flex overflow-x-auto p-4 gap-3 custom-scrollbar snap-x">
        {days.length === 0 ? (
          <p className="text-gray-500 text-sm text-center w-full py-4">Nenhum dia disponível neste mês</p>
        ) : (
          days.map((d, i) => {
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const dateStr = `${yyyy}-${mm}-${dd}`;
            const isSelected = selectedDate === dateStr;

            return (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectDay(d)}
                className={`flex-shrink-0 w-16 h-20 rounded-2xl border flex flex-col items-center justify-center transition-all snap-center focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                  isSelected 
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20 scale-105' 
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white hover:border-gray-500'
                }`}
              >
                <span className={`text-xs font-semibold mb-1 uppercase ${isSelected ? 'text-blue-200' : 'text-gray-500'}`}>
                  {ptBRWeekdays[d.getDay()]}
                </span>
                <span className="text-2xl font-bold">
                  {d.getDate()}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
