
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

// Componente de Gráfico de Rosca (Donut) usando CSS conic-gradient
const DonutChart: React.FC<{ revenue: number; expense: number }> = ({ revenue, expense }) => {
    const total = revenue + expense;
    
    // Fallback se não houver dados
    if (total === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="w-40 h-40 rounded-full border-4 border-gray-700 flex items-center justify-center">
                    Sem dados
                </div>
            </div>
        );
    }

    const revenuePercent = (revenue / total) * 100;
    const balance = revenue - expense;
    
    return (
        <div className="flex flex-col items-center justify-center py-6">
            <div className="relative w-56 h-56">
                {/* Círculo do Gráfico */}
                <div 
                    className="w-full h-full rounded-full shadow-2xl transition-all duration-1000 ease-out"
                    style={{
                        background: `conic-gradient(#22c55e 0% ${revenuePercent}%, #ef4444 ${revenuePercent}% 100%)`
                    }}
                ></div>
                {/* Buraco do Donut (Centro) */}
                <div className="absolute inset-0 flex flex-col items-center justify-center m-auto bg-gray-800 rounded-full w-44 h-44">
                    <span className="text-sm text-gray-400">Saldo Líquido</span>
                    <span className={`text-xl font-bold ${balance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                        {formatCurrency(balance)}
                    </span>
                </div>
            </div>

            {/* Legenda */}
            <div className="flex justify-center gap-8 mt-8 w-full">
                <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-3 h-3 rounded-full bg-red-accent shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                        <span className="text-xs font-bold text-red-400 uppercase tracking-wide">Despesas</span>
                    </div>
                    <span className="text-lg font-bold text-white">{formatCurrency(expense)}</span>
                    <span className="text-xs text-gray-500">{(100 - revenuePercent).toFixed(1)}%</span>
                </div>
                <div className="w-px bg-gray-700 h-12"></div>
                <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-3 h-3 rounded-full bg-green-accent shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                        <span className="text-xs font-bold text-green-400 uppercase tracking-wide">Receitas</span>
                    </div>
                    <span className="text-lg font-bold text-white">{formatCurrency(revenue)}</span>
                    <span className="text-xs text-gray-500">{(revenuePercent).toFixed(1)}%</span>
                </div>
            </div>
        </div>
    );
};

// Componente para Gráfico de Colunas de Transações Diárias (SVG)
const TransactionColumnChart: React.FC<{ dailyData: { day: number, value: number }[] }> = ({ dailyData }) => {
    if (dailyData.length === 0) return <p className="text-center text-gray-500 py-8">Sem dados suficientes.</p>;

    const height = 250;
    const values = dailyData.map(d => d.value);
    const maxVal = Math.max(...values, 0);
    const minVal = Math.min(...values, 0);
    
    // Total range with padding
    const range = (maxVal - minVal) * 1.1; 
    const effectiveRange = range === 0 ? 100 : range;
    
    // Zero line Y position
    const zeroY = height - ((0 - minVal * 1.1) / effectiveRange) * height; // Adjusted for padding

    return (
        <div className="w-full h-72 flex flex-col pt-4">
            <div className="flex-1 relative w-full overflow-hidden">
                <svg 
                    width="100%" 
                    height="100%" 
                    viewBox={`0 0 ${dailyData.length * 12} ${height}`} 
                    preserveAspectRatio="none"
                    className="overflow-visible"
                >
                    {/* Linhas de Grade (opcional) */}
                    <line x1="0" y1={zeroY} x2={dailyData.length * 12} y2={zeroY} stroke="#4B5563" strokeWidth="1" strokeDasharray="4" />
                    
                    {dailyData.map((d, i) => {
                        const barHeight = (Math.abs(d.value) / effectiveRange) * height;
                        const y = d.value >= 0 ? zeroY - barHeight : zeroY;
                        const color = d.value >= 0 ? '#22c55e' : '#ef4444';
                        // Width calculation: 12 units per day, bar width 8, spacing 4
                        const x = i * 12 + 2; 
                        
                        return (
                            <g key={i} className="group">
                                {/* Invisible hover target for easier tooltip access */}
                                <rect x={x - 2} y="0" width="12" height={height} fill="transparent" />
                                
                                <rect
                                    x={x}
                                    y={y}
                                    width={8}
                                    height={Math.max(barHeight, 2)} 
                                    fill={color}
                                    rx="2"
                                    className="opacity-80 group-hover:opacity-100 transition-all duration-300 ease-out"
                                />
                                <title>{`Dia ${d.day}: ${formatCurrency(d.value)}`}</title>
                            </g>
                        );
                    })}
                </svg>
            </div>
            {/* X Axis Labels */}
            <div className="flex justify-between mt-2 text-xs text-gray-500 px-2 border-t border-gray-700 pt-2">
                <span>Dia 1</span>
                <span>Meio do Mês</span>
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

    // Dados Processados
    const dailyMovement = useMemo(() => {
        const daysMap: Record<number, number> = {};
        const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        
        for (let i = 1; i <= daysInMonth; i++) daysMap[i] = 0;

        transactions.forEach(t => {
            const day = parseInt(t.date.split('-')[2]);
            const val = t.type === 'revenue' ? t.amount : -t.amount;
            if (daysMap[day] !== undefined) {
                daysMap[day] += val;
            }
        });

        const result = [];
        for (let i = 1; i <= daysInMonth; i++) {
            result.push({ day: i, value: daysMap[i] });
        }
        return result;
    }, [transactions, currentDate]);

    const topExpenses = useMemo(() => {
        const expenses = transactions.filter(t => t.type === 'expense');
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
        <div className="space-y-6 animate-fade-in">
            <div className="p-4 bg-gray-800 rounded-lg flex justify-between items-center shadow-lg border border-gray-700/50">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-900/30 rounded-full">
                        <ChartBarIcon className="w-8 h-8 text-blue-accent" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">Relatórios Mensais</h1>
                        <p className="text-sm text-gray-400">Análise detalhada das suas finanças</p>
                    </div>
                </div>
            </div>

            <MonthNavigator currentDate={currentDate} setCurrentDate={setCurrentDate} />

            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-12 bg-gray-800 rounded-lg shadow-lg">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-400">Carregando gráficos...</p>
                </div>
            ) : error ? (
                <div className="p-8 text-center bg-gray-800 rounded-lg text-red-400 border border-red-900/50">
                    <p className="font-bold">Ocorreu um erro</p>
                    <p className="text-sm mt-2">{error}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Gráfico 1: Balanço (Pizza/Rosca) */}
                    <div className="p-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700/50">
                        <h3 className="text-lg font-bold text-white mb-2 text-center">Visão Geral</h3>
                        <p className="text-xs text-center text-gray-500 mb-4">Distribuição de Receitas e Despesas</p>
                        <DonutChart revenue={summary.revenue} expense={summary.expenses} />
                    </div>

                    {/* Gráfico 2: Top Despesas (Barras Horizontais) */}
                    <div className="p-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700/50 flex flex-col">
                        <h3 className="text-lg font-bold text-white mb-2">Maiores Despesas</h3>
                        <p className="text-xs text-gray-500 mb-6">Onde seu dinheiro está indo</p>
                        
                        <div className="flex-1 flex flex-col justify-center">
                            {topExpenses.length > 0 ? (
                                <div className="space-y-5">
                                    {topExpenses.map((item, idx) => {
                                        const percentage = Math.min((item.value / summary.expenses) * 100, 100);
                                        return (
                                            <div key={idx} className="group">
                                                <div className="flex justify-between text-sm mb-1.5">
                                                    <span className="text-gray-200 font-medium truncate w-2/3">{item.name}</span>
                                                    <span className="text-white font-bold">{formatCurrency(item.value)}</span>
                                                </div>
                                                <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden">
                                                    <div 
                                                        className="h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_10px_rgba(239,68,68,0.4)]"
                                                        style={{ width: `${Math.max(percentage, 1)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <div className="inline-block p-4 rounded-full bg-gray-700/30 mb-3">
                                        <ArrowDownCircleIcon className="w-8 h-8 text-gray-500" />
                                    </div>
                                    <p className="text-gray-400">Nenhuma despesa registrada neste mês.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Gráfico 3: Movimentação Diária (Barras Verticais) */}
                    <div className="p-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700/50 md:col-span-2">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-white">Fluxo Diário</h3>
                                <p className="text-xs text-gray-500">Saldo do dia (Entradas - Saídas)</p>
                            </div>
                            <div className="flex gap-4 text-xs">
                                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-full"></div>Positivo</div>
                                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500 rounded-full"></div>Negativo</div>
                            </div>
                        </div>
                        <TransactionColumnChart dailyData={dailyMovement} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default GraphicsPage;
