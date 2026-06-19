import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const calculateInvestmentValue = (tx: any, targetDate: Date = new Date()): number => {
      if (!tx.investment) return Number(tx.amount || 0);

      const amount = Number(tx.amount || 0);
      const safeDateStr = tx.date.includes('T') ? tx.date.split('T')[0] : tx.date;
      const startDate = new Date(safeDateStr + "T00:00:00");
      let end = new Date(targetDate);
      
      if ((tx.status === 'pago' || tx.status === 'PAID') && tx.updatedAt) {
          const updatedDate = new Date(tx.updatedAt);
          if (updatedDate < end) {
              end = updatedDate;
          }
      }
      
      startDate.setHours(0,0,0,0);
      end.setHours(23,59,59,999);

      if (startDate > end) return amount;

      let businessDays = 0;
      let curDate = new Date(startDate);
      curDate.setDate(curDate.getDate() + 1);
      while (curDate <= end) {
          const dayOfWeek = curDate.getDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) businessDays++;
          curDate.setDate(curDate.getDate() + 1);
      }

      if (businessDays === 0) return amount;

      let renderDay = tx.investment.renderDay ? Number(tx.investment.renderDay) : 0;
      if (!renderDay || renderDay <= 0) {
          if (tx.investment.percentage) {
              const pct = Number(tx.investment.percentage);
              renderDay = amount * 0.00034 * (pct / 100);
          }
          if (!renderDay || renderDay <= 0) renderDay = 0.01;
      }
      
      const dailyRate = renderDay / amount;
      return amount * Math.pow(1 + dailyRate, businessDays);
};

interface InvestmentReportProps {
  transactions: any[];
  currentDate: Date;
}

const InvestmentReport: React.FC<InvestmentReportProps> = ({ transactions, currentDate }) => {

  const data = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Find the min date and max date to build the chart
    const today = new Date();
    
    const isPast = year < today.getFullYear() || (year === today.getFullYear() && month < today.getMonth());
    const isFuture = year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth());
    
    // Always show the full month to see the future projections
    let lastDay = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 1; i <= lastDay; i++) {
        const targetDate = new Date(year, month, i, 23, 59, 59);
        let total = 0;
        transactions.forEach(tx => {
            const txDateStr = tx.date.includes('T') ? tx.date.split('T')[0] : tx.date;
            const txDate = new Date(txDateStr + "T00:00:00");
            if (txDate <= targetDate) {
                 total += calculateInvestmentValue(tx, targetDate);
            }
        });
        
        days.push({
            day: i,
            dateLabel: `${i.toString().padStart(2, '0')}/${(month + 1).toString().padStart(2, '0')}`,
            total: total
        });
    }
    
    return days.filter(d => d.total > 0);
  }, [transactions, currentDate]);

  if (transactions.length === 0) return null;

  return (
    <div className="w-full h-64 mt-4 mb-8 bg-gray-800 p-4 rounded-xl border border-gray-700">
        <h3 className="text-white font-semibold mb-4 text-center">Evolução dos Investimentos</h3>
        <ResponsiveContainer width="100%" height="80%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="dateLabel" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis 
                    stroke="#9CA3AF" 
                    fontSize={12} 
                    tickFormatter={(val) => `R$ ${val}`} 
                    width={80}
                    tickLine={false} 
                    axisLine={false} 
                    domain={[(dataMin: number) => Math.max(0, Math.floor(dataMin * 0.999)), (dataMax: number) => Math.ceil(dataMax * 1.001)]}
                />
                <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Total']}
                    labelFormatter={(label) => `Data: ${label}`}
                    contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff', borderRadius: '0.5rem' }}
                    itemStyle={{ color: '#FCD34D', fontWeight: 'bold' }}
                />
                <Bar dataKey="total" fill="#FCD34D" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    </div>
  );
};

export default InvestmentReport;
