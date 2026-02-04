
import React, { useState, useEffect } from 'react';
import { BURGER_API_URL } from '../constants';
import { ChartBarIcon, CashIcon, ShoppingCartIcon } from './icons';

const BurgerDashboardPage: React.FC = () => {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        avgTicket: 0,
        topItem: 'Carregando...'
    });

    useEffect(() => {
        // Simulate pulling dashboard stats from orders (since backend endpoints might vary)
        fetch(`${BURGER_API_URL}/api/orders`)
            .then(res => res.json())
            .then(data => {
                const orders: any[] = data.data || [];
                const totalRev = orders.reduce((acc, o) => acc + (o.total || 0), 0);
                setStats({
                    totalRevenue: totalRev,
                    totalOrders: orders.length,
                    avgTicket: orders.length ? totalRev / orders.length : 0,
                    topItem: '-' // Complex to calc without full product map here
                });
            })
            .catch(console.error);
    }, []);

    return (
        <div className="p-4 bg-gray-800 rounded-lg">
            <h1 className="text-2xl font-bold text-white mb-6">Dashboard Lanchonete</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-700 p-6 rounded-lg border-l-4 border-green-500">
                    <div className="flex items-center gap-3 mb-2">
                        <CashIcon className="w-6 h-6 text-green-400" />
                        <span className="text-gray-300">Receita Total</span>
                    </div>
                    <p className="text-2xl font-bold text-white">R$ {stats.totalRevenue.toFixed(2)}</p>
                </div>

                <div className="bg-gray-700 p-6 rounded-lg border-l-4 border-blue-500">
                    <div className="flex items-center gap-3 mb-2">
                        <ShoppingCartIcon className="w-6 h-6 text-blue-400" />
                        <span className="text-gray-300">Total de Pedidos</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.totalOrders}</p>
                </div>

                <div className="bg-gray-700 p-6 rounded-lg border-l-4 border-yellow-500">
                    <div className="flex items-center gap-3 mb-2">
                        <ChartBarIcon className="w-6 h-6 text-yellow-400" />
                        <span className="text-gray-300">Ticket Médio</span>
                    </div>
                    <p className="text-2xl font-bold text-white">R$ {stats.avgTicket.toFixed(2)}</p>
                </div>
            </div>
            
            <div className="mt-8 bg-gray-700 p-6 rounded-lg text-center text-gray-400">
                <p>Gráficos detalhados em breve.</p>
            </div>
        </div>
    );
};

export default BurgerDashboardPage;
