
import React, { useState, useEffect } from 'react';
import { BURGER_API_URL } from '../constants';
import { ChartBarIcon, CashIcon, ShoppingCartIcon, ShareIcon } from './icons';

const BurgerDashboardPage: React.FC = () => {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        avgTicket: 0,
        topItem: '-'
    });

    useEffect(() => {
        // Simulate pulling dashboard stats from orders
        fetch(`${BURGER_API_URL}/orders`)
            .then(res => res.json())
            .then(data => {
                const orders: any[] = data.data || [];
                const totalRev = orders.reduce((acc, o) => acc + (o.total || 0), 0);
                setStats({
                    totalRevenue: totalRev,
                    totalOrders: orders.length,
                    avgTicket: orders.length ? totalRev / orders.length : 0,
                    topItem: '-'
                });
            })
            .catch(console.error);
    }, []);

    const handleShareBurgerDashboard = async () => {
        const shareTitle = "Dashboard Lanchonete - Resumo";
        const shareText = `🍔 *Resumo Dashboard Lanchonete*

💰 *Receita Total:* R$ ${stats.totalRevenue.toFixed(2)}
🛒 *Total de Pedidos:* ${stats.totalOrders}
📊 *Ticket Médio:* R$ ${stats.avgTicket.toFixed(2)}

Acompanhe os resultados da Lanchonete no YouControl!`;

        const shareUrl = window.location.origin || window.location.href;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: shareUrl,
                });
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    console.error('Erro ao compartilhar dashboard:', err);
                }
            }
        } else if (navigator.clipboard) {
            try {
                await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
                alert('Resumo da lanchonete copiado para a área de transferência!');
            } catch (err) {
                alert('Não foi possível compartilhar automaticamente.');
            }
        } else {
            alert('O compartilhamento nativo não é suportado neste navegador.');
        }
    };

    return (
        <div className="p-4 bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-white">Dashboard Lanchonete</h1>
                <button
                    onClick={handleShareBurgerDashboard}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 transition-colors"
                    title="Compartilhar resumo via apps nativos"
                >
                    <ShareIcon className="w-5 h-5 text-green-400" />
                    <span className="hidden sm:inline">Compartilhar</span>
                </button>
            </div>
            
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
