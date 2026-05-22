import React, { useState, useRef, useEffect } from 'react';

const ptBRMonths = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const ptBRWeekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const fullWeekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export const CustomDatePicker = ({ 
  selectedDate, 
  onChange,
  onMonthChange,
  allowPast = false,
  allowedDaysOfWeek
}: { 
  selectedDate: string; 
  onChange: (d: string) => void;
  onMonthChange?: () => void;
  allowPast?: boolean;
  allowedDaysOfWeek?: string[];
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [baseDate, setBaseDate] = useState(() => {
    if (selectedDate) return new Date(selectedDate + "T00:00:00");
    const d = new Date();
    d.setHours(0,0,0,0);
    return d;
  });

  useEffect(() => {
    if (selectedDate) {
      setBaseDate(new Date(selectedDate + "T00:00:00"));
    }
  }, [selectedDate]);

  useEffect(() => {
    if (scrollRef.current) {
      const selectedEl = scrollRef.current.querySelector('[data-selected="true"]');
      if (selectedEl) {
         selectedEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedDate, baseDate]);

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

  const prevDay = () => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() - 1);
    
    const today = new Date();
    today.setHours(0,0,0,0);
    
    if (!allowPast && d.getTime() < today.getTime()) {
      return;
    }
    
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
  };

  const nextDay = () => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + 1);
    
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
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
    <div className="w-full bg-gray-800/80 rounded-xl border border-gray-700/50 overflow-hidden shadow-lg relative">
      <div className="flex items-center justify-between p-2 bg-gray-900 border-b border-gray-800">
        <button type="button" onClick={prevMonth} className={`p-1.5 rounded-lg transition-colors ${(!allowPast && baseDate.getMonth() === today.getMonth() && baseDate.getFullYear() === today.getFullYear()) ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="font-bold text-white text-base capitalize">{currentMonthName} <span className="font-normal text-gray-400">{currentYear}</span></span>
        <button type="button" onClick={nextMonth} className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      <div className="relative flex items-center">
        <button type="button" onClick={prevDay} className="absolute left-0 z-10 p-1 h-full bg-gradient-to-r from-gray-900 via-gray-900/80 to-transparent text-gray-400 hover:text-white flex items-center justify-center transition-colors">
          <svg className="w-5 h-5 drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div ref={scrollRef} className="flex overflow-x-auto px-8 py-3 gap-2 custom-scrollbar snap-x w-full">
          {days.length === 0 ? (
            <p className="text-gray-500 text-sm text-center w-full py-4">Nenhum dia disponível</p>
          ) : (
            days.map((d, i) => {
              const yyyy = d.getFullYear();
              const mm = String(d.getMonth() + 1).padStart(2, '0');
              const dd = String(d.getDate()).padStart(2, '0');
              const dateStr = `${yyyy}-${mm}-${dd}`;
              const isSelected = selectedDate === dateStr;
              const fullDayName = fullWeekdays[d.getDay()];
              const isDisabled = Boolean(allowedDaysOfWeek && allowedDaysOfWeek.length > 0 && !allowedDaysOfWeek.includes(fullDayName));

              return (
                <button
                  key={i}
                  type="button"
                  data-selected={isSelected}
                  onClick={() => !isDisabled && handleSelectDay(d)}
                  disabled={isDisabled}
                  className={`flex-shrink-0 w-14 h-16 rounded-xl border flex flex-col items-center justify-center transition-all snap-center focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                    isDisabled
                      ? 'bg-gray-800/50 border-gray-700/30 text-gray-600 cursor-not-allowed opacity-50'
                      : isSelected 
                      ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20 scale-105 relative z-0' 
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white hover:border-gray-500'
                  }`}
                >
                  <span className={`text-[10px] font-semibold mb-0.5 uppercase ${isSelected ? 'text-blue-200' : 'text-gray-500'}`}>
                    {ptBRWeekdays[d.getDay()]}
                  </span>
                  <span className="text-xl font-bold">
                    {d.getDate()}
                  </span>
                </button>
              );
            })
          )}
        </div>
        <button type="button" onClick={nextDay} className="absolute right-0 z-10 p-1 h-full bg-gradient-to-l from-gray-900 via-gray-900/80 to-transparent text-gray-400 hover:text-white flex items-center justify-center transition-colors">
          <svg className="w-5 h-5 drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  );
}
