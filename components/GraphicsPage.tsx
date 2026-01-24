
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { User, Transaction } from '../types';
import MonthNavigator from './MonthNavigator';
import { API_BASE_URL } from '../constants';
import { ChartBarIcon, ArrowUpCircleIcon, ArrowDownCircleIcon } from './icons';

interface GraphicsPageProps {
    user: User;
}

const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// Componente simples para Gráfico de Barras (CSS puro)
const BarChart: React.FC<{ revenue: number; expense: number }> = ({ revenue, expense }) => {
    const total = Math.max(revenue, expense, 1); // Evitar divisão por zero
    const revHeight = (revenue / total) * 100;
    const expHeight = (expense / total) * 100;

    return (
        <div className="flex items-end justify-center h-48 gap-8 mt-4">
            <div className="w-16 flex flex-col items-center group">
                <div className="text-xs text-green-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatCurrency(revenue)}
                </div>
                <div 
                    className="w-full bg-green-500 rounded-t-lg transition-all duration-500 hover:bg-green-400" 
                    style={{ height: `${Math.max(revHeight, 2)}%` }}
                ></div>
                <p className="mt-2 text-sm font-bold text-gray-300">Receitas</p>
            </div>
            <div className="w-16 flex flex-col items-center group">
                <div className="text-xs text-red-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatCurrency(expense)}
                </div>
                <div 
                    className="w-full bg-red-500 rounded-t-lg transition-all duration-500 hover:bg-red-400" 
                    style={{ height: `${Math.max(expHeight, 2)}%` }}
                ></div>
                <p className="mt-2 text-sm font-bold text-gray-300">Despesas</p>
            </div>
        </div>
    );
};

// Componente simples para Tendência Diária (SVG Polyline)
const TrendChart: React.FC<{ dailyData: { day: number, balance: number }[] }> = ({ dailyData }) => {
    if (dailyData.length === 0) return <p className="text-center text-gray-500">Sem dados suficientes.</p>;

    const height = 150;
    const width = 300;
    const maxVal = Math.max(...dailyData.map(d => d.balance));
    const minVal = Math.min(...dailyData.map(d => d.balance));
    const range = maxVal - minVal || 1;

    // Normaliza os pontos
    const points = dailyData.map((d, index) => {
        const x = (index / (dailyData.length - 1)) * width;
        // Inverte Y porque SVG 0 é topo
        const y = height - ((d.balance - minVal) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="w-full overflow-hidden">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto text-blue-500 stroke-current" style={{ minHeight: '150px' }}>
                <polyline
                    fill="none"
                    strokeWidth="3"
                    points={points}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Dia 1</span>
                <span>Fim do Mês</span>
            </div>
        </div>
    );
};

const GraphicsPage: React.FC<GraphicsPageProps> = ({ user }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [summary, setSummary] = useState({ revenue: 0, expenses: 0, balance: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const apiFetch = useCallback(async (url: string, options: RequestInit = {}) => {
        if (!user) throw new Error("Usuário não está logado.");
        const response = await fetch(url, {
            ...options,
            cache: 'no-store',
            headers: { 'Content-Type': 'application/json', ...options.headers },
        });
        if (!response.ok) throw new Error('Erro na requisição');
        return response;
    }, [user]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const month = currentDate.getMonth() + 1;
            const year = currentDate.getFullYear();
            const response = await apiFetch(`${API_BASE_URL}/transactions?phone=${user.phone}&includeShared=true&month=${month}&year=${year}`);
            const data = await response.json();

            const mappedTransactions = (data.transactions || []).map((tx: any) => ({
                id: tx._id, ownerPhone: tx.ownerPhone, type: tx.type, name: tx.name, amount: tx.amount,
                date: new Date(tx.date).toISOString().split('T')[0],
                status: tx.status
            }));
            
            setTransactions(mappedTransactions);
            
            // Recalcula resumo baseando-se nas transações retornadas (para garantir consistência visual)
            let rev = 0;
            let exp = 0;
            mappedTransactions.forEach((t: Transaction) => {
                if (t.type === 'revenue') rev += t.amount;
                else exp += t.amount;
            });
            
            setSummary({
                revenue: rev,
                expenses: exp,
                balance: rev - exp
            });

        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, [currentDate, user.phone, apiFetch]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Dados Processados para os Gráficos
    const dailyBalance = useMemo(() => {
        // Agrupa por dia
        const daysMap: Record<number, number> = {};
        const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        
        // Inicializa com 0
        for (let i = 1; i <= daysInMonth; i++) daysMap[i] = 0;

        // Acumula saldo dia a dia
        let accumulated = 0;
        // Ordena por data
        const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        sorted.forEach(t => {
            const day = parseInt(t.date.split('-')[2]);
            const val = t.type === 'revenue' ? t.amount : -t.amount;
            // Simplificação: Soma tudo no dia
            if (daysMap[day] !== undefined) {
                daysMap[day] += val;
            }
        });

        // Transforma em saldo acumulado
        const result = [];
        for (let i = 1; i <= daysInMonth; i++) {
            accumulated += daysMap[i];
            result.push({ day: i, balance: accumulated });
        }
        return result;
    }, [transactions, currentDate]);

    const topExpenses = useMemo(() => {
        const expenses = transactions.filter(t => t.type === 'expense');
        // Agrupa por nome para simular "categoria"
        const grouped: Record<string, number> = {};
        expenses.forEach(t => {
            grouped[t.name] = (grouped[t.name] || 0) + t.amount;
        });
        
        return Object.entries(grouped)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Top 5
    }, [transactions]);

    return (
        <div className="space-y-6">
            <div className="p-4 bg-gray-800 rounded-lg flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <ChartBarIcon className="w-8 h-8 text-blue-accent" />
                    <div>
                        <h1 className="text-xl font-bold text-white">Relatórios Mensais</h1>
                        <p className="text-sm text-gray-400">Visão gráfica das suas finanças</p>
                    </div>
                </div>
            </div>

            <MonthNavigator currentDate={currentDate} setCurrentDate={setCurrentDate} />

            {isLoading ? (
                <div className="p-8 text-center bg-gray-800 rounded-lg">Carregando gráficos...</div>
            ) : error ? (
                <div className="p-8 text-center bg-gray-800 rounded-lg text-red-400">Erro: {error}</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Gráfico 1: Balanço */}
                    <div className="p-6 bg-gray-800 rounded-lg shadow-lg">
                        <h3 className="text-lg font-bold text-white mb-4 text-center">Entradas vs Saídas</h3>
                        <div className="flex justify-between items-center mb-2 px-4">
                            <span className="text-green-400 font-bold flex items-center"><ArrowUpCircleIcon className="w-4 h-4 mr-1"/> {formatCurrency(summary.revenue)}</span>
                            <span className="text-red-400 font-bold flex items-center"><ArrowDownCircleIcon className="w-4 h-4 mr-1"/> {formatCurrency(summary.expenses)}</span>
                        </div>
                        <BarChart revenue={summary.revenue} expense={summary.expenses} />
                        <p className={`text-center mt-4 font-bold ${summary.balance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                            Saldo: {formatCurrency(summary.balance)}
                        </p>
                    </div>

                    {/* Gráfico 2: Top Despesas */}
                    <div className="p-6 bg-gray-800 rounded-lg shadow-lg">
                        <h3 className="text-lg font-bold text-white mb-4">Onde você mais gastou</h3>
                        {topExpenses.length > 0 ? (
                            <div className="space-y-4">
                                {topExpenses.map((item, idx) => (
                                    <div key={idx}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-300 truncate w-2/3">{item.name}</span>
                                            <span className="text-white font-bold">{formatCurrency(item.value)}</span>
                                        </div>
                                        <div className="w-full bg-gray-700 rounded-full h-2.5">
                                            <div 
                                                className="bg-red-500 h-2.5 rounded-full" 
                                                style={{ width: `${(item.value / summary.expenses) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-8">Nenhuma despesa registrada.</p>
                        )}
                    </div>

                    {/* Gráfico 3: Evolução do Saldo (Full Width) */}
                    <div className="p-6 bg-gray-800 rounded-lg shadow-lg md:col-span-2">
                        <h3 className="text-lg font-bold text-white mb-2">Evolução do Saldo Acumulado (Mês)</h3>
                        <p className="text-xs text-gray-400 mb-6">Visualização da trajetória do seu saldo dia a dia.</p>
                        <TrendChart dailyData={dailyBalance} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default GraphicsPage;
