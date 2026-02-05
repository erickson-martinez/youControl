import React, { useState, useEffect, useCallback } from 'react';
import { BURGER_API_URL } from '../constants';
import type { BurgerOrder, BurgerProduct, User } from '../types';
import { MotorcycleIcon, MapPinIcon, CheckCircleIcon, XCircleIcon, LockClosedIcon, ClipboardListIcon, CashIcon } from './icons';

interface BurgerDeliveryPageProps {
    user: User;
}

interface DeliveryConfig {
    burger: string;
    delivery: string[];
    pay: string[];
    debit: number;
    credit: number;
    phone: string; // Owner phone
    taxa_delivery_fixa?: number;
}

const BurgerDeliveryPage: React.FC<BurgerDeliveryPageProps> = ({ user }) => {
    const [deliveries, setDeliveries] = useState<BurgerOrder[]>([]);
    const [myDeliveries, setMyDeliveries] = useState<BurgerOrder[]>([]);
    const [products, setProducts] = useState<BurgerProduct[]>([]);
    const [config, setConfig] = useState<DeliveryConfig | null>(null);
    const [canDeliver, setCanDeliver] = useState(false);
    const [isLoadingConfig, setIsLoadingConfig] = useState(true);
    const [activeTab, setActiveTab] = useState<'available' | 'mine'>('available');
    
    // Estado do Modal
    const [deliveryModalOrder, setDeliveryModalOrder] = useState<BurgerOrder | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // 1. Carregar Configuração e Produtos
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoadingConfig(true);
            try {
                // Carregar Produtos
                fetch(`${BURGER_API_URL}/api/products/burgers`)
                    .then(res => res.json())
                    .then(data => setProducts(data.data || []))
                    .catch(err => console.error("Erro ao carregar produtos", err));

                // Carregar Configuração de Delivery
                const configResponse = await fetch(`${BURGER_API_URL}/api/config/delivery`);
                const configJson = await configResponse.json();
                
                if (configJson && configJson.data) {
                    const data: DeliveryConfig = configJson.data;
                    setConfig(data);

                    // Verificar Permissões (Dono ou Entregador Autorizado)
                    // Normaliza telefones removendo caracteres não numéricos para comparação segura
                    const cleanUserPhone = user.phone.replace(/\D/g, '');
                    const cleanOwnerPhone = data.phone.replace(/\D/g, '');
                    const deliveryPhones = Array.isArray(data.delivery) ? data.delivery.map(p => p.replace(/\D/g, '')) : [];

                    const isOwner = cleanUserPhone === cleanOwnerPhone;
                    const isAuthorizedDriver = deliveryPhones.includes(cleanUserPhone);

                    setCanDeliver(isOwner || isAuthorizedDriver);
                }
            } catch (error) {
                console.error("Erro ao carregar configurações de delivery", error);
            } finally {
                setIsLoadingConfig(false);
            }
        };

        loadInitialData();
    }, [user.phone]);
    
    // 2. Buscar Pedidos Disponíveis
    const fetchDeliveries = useCallback(async () => {
        if (!config?.burger) return;

        try {
            const burgerNameEncoded = encodeURIComponent(config.burger);
            const res = await fetch(`${BURGER_API_URL}/api/orders/delivery/${burgerNameEncoded}`);
            const data = await res.json();
            const list = Array.isArray(data.data) ? data.data : (data.data ? [data.data] : []);
            setDeliveries(list);
        } catch (e) {
            console.error("Erro ao buscar entregas disponíveis:", e);
        }
    }, [config]);

    // 3. Buscar Minhas Entregas
    const fetchMyDeliveries = useCallback(async () => {
        // Se user.name for indefinido, não busca
        if (!config?.burger || !user.name) return;

        try {
            const burgerNameEncoded = encodeURIComponent(config.burger);
            const userNameEncoded = encodeURIComponent(user.name);
            const res = await fetch(`${BURGER_API_URL}/api/orders/my-delivery/${burgerNameEncoded}/${userNameEncoded}`);
            const data = await res.json();
            const list = Array.isArray(data.data) ? data.data : (data.data ? [data.data] : []);
            // Ordena por data decrescente
            setMyDeliveries(list.sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime()));
        } catch (e) {
            console.error("Erro ao buscar minhas entregas:", e);
        }
    }, [config, user.name]);

    useEffect(() => {
        if (config) {
            // Busca inicial
            fetchDeliveries();
            fetchMyDeliveries();

            // Polling a cada 15s para atualizar ambas as listas
            const interval = setInterval(() => {
                fetchDeliveries();
                // Apenas busca histórico se estiver na aba
                if (activeTab === 'mine') {
                    fetchMyDeliveries();
                }
            }, 15000);
            return () => clearInterval(interval);
        }
    }, [fetchDeliveries, fetchMyDeliveries, config, activeTab]);

    // Atualiza minhas entregas quando muda para a aba 'mine'
    useEffect(() => {
        if (activeTab === 'mine') {
            fetchMyDeliveries();
        } else {
            fetchDeliveries();
        }
    }, [activeTab, fetchMyDeliveries, fetchDeliveries]);

    const handleConfirmDelivery = async () => {
        if (!deliveryModalOrder) return;
        setIsProcessing(true);
        try {
            // Encode user name to safely append to URL
            const userNameParam = encodeURIComponent(user.name);
            await fetch(`${BURGER_API_URL}/api/orders/${deliveryModalOrder.id}/status/${userNameParam}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newStatus: 'Entregue', currentStatus: 'A caminho' })
            });
            fetchDeliveries();
            fetchMyDeliveries(); 
            setDeliveryModalOrder(null);
        } catch(e) { 
            alert("Erro ao confirmar entrega"); 
        } finally {
            setIsProcessing(false);
        }
    };

    const getProductDetails = (itemId: number) => {
        return products.find(p => p.id === itemId);
    };

    const renderOrderList = (orders: BurgerOrder[], isHistory: boolean) => {
        if (orders.length === 0) {
            return (
                <div className="py-12 text-center">
                    <p className="text-gray-400">
                        {isHistory 
                            ? "Você ainda não realizou entregas." 
                            : `Nenhuma entrega pendente para ${config?.burger}.`}
                    </p>
                </div>
            );
        }

        const fixedFee = config?.taxa_delivery_fixa || 0;

        return orders.map(order => {
            const distanceFee = order.deliveryFee || 0;
            const totalDriverFee = distanceFee + fixedFee;

            return (
                <div key={order.id} className={`p-4 rounded-lg flex flex-col md:flex-row justify-between items-center gap-4 border border-gray-700 ${isHistory ? 'bg-gray-800/50' : 'bg-gray-700'}`}>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            {order.name}
                            {isHistory && order.status === 'Entregue' && <CheckCircleIcon className="w-4 h-4 text-green-500" />}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-gray-300 text-sm">
                                {order.address ? `${order.address.address}, ${order.address.number}` : 'Endereço não informado'}
                            </span>
                            {order.address && (
                                <a 
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${order.address.address}, ${order.address.number}`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-red-500 hover:text-red-400 p-1 rounded hover:bg-gray-600 transition-colors"
                                    title="Abrir no Google Maps"
                                >
                                    <MapPinIcon className="w-4 h-4" />
                                </a>
                            )}
                        </div>
                        <p className="text-gray-400 text-xs mt-1">
                            Pedido #{order.id} • {new Date(order.time).toLocaleTimeString()} 
                            {isHistory && <span className="ml-2 px-2 py-0.5 rounded bg-gray-900 text-gray-400">{order.status}</span>}
                        </p>
                    </div>
                    <div className="text-right">
                        {/* Display Total Order Value */}
                        <p className="text-sm text-gray-400">Total Pedido: R$ {(order.total + distanceFee).toFixed(2)}</p>
                        
                        {/* Display Driver Earnings for this order - Only shown in 'Available' tab */}
                        {!isHistory && (
                            <div className="flex flex-col items-end">
                                <span className="text-xs text-gray-500">Sua taxa:</span>
                                <p className="text-lg font-bold text-green-400">
                                    R$ {totalDriverFee.toFixed(2)}
                                </p>
                            </div>
                        )}
                        
                        <p className={`text-xs mt-1 ${order.payment ? 'text-green-500' : 'text-red-400'}`}>
                            {order.payment ? 'Pedido Pago' : 'Cobrar na Entrega'}
                        </p>
                    </div>
                    {!isHistory && order.status === 'A caminho' && (
                        canDeliver ? (
                            <button 
                                onClick={() => setDeliveryModalOrder(order)}
                                className="w-full md:w-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-bold transition-colors"
                            >
                                Entregue
                            </button>
                        ) : (
                            <span className="text-gray-500 text-xs italic bg-gray-800 px-2 py-1 rounded">Sem permissão</span>
                        )
                    )}
                    {!isHistory && order.status === 'Pronto' && (
                         <span className="text-yellow-400 font-medium text-sm">Aguardando Motoboy</span>
                    )}
                </div>
            );
        });
    };

    if (isLoadingConfig) {
        return <div className="p-8 text-center text-gray-400">Carregando configurações...</div>;
    }

    const fixedFeeTotal = config?.taxa_delivery_fixa || 0;
    const totalEarnings = myDeliveries
        .filter(o => o.status === 'Entregue')
        .reduce((acc, order) => acc + (order.deliveryFee || 0) + fixedFeeTotal, 0);

    return (
        <div className="p-4 bg-gray-800 rounded-lg relative min-h-[80vh]">
            <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <MotorcycleIcon className="w-8 h-8 text-blue-400" />
                    <div>
                        <h1 className="text-2xl font-bold text-white">Entregas</h1>
                        {config && <p className="text-xs text-gray-400">{config.burger}</p>}
                    </div>
                </div>
                {!canDeliver && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-red-900/30 border border-red-800 rounded text-red-300 text-xs">
                        <LockClosedIcon className="w-3 h-3" />
                        <span>Apenas Visualização</span>
                    </div>
                )}
            </div>

            {/* Abas de Navegação */}
            <div className="flex mb-6 border-b border-gray-700">
                <button
                    onClick={() => setActiveTab('available')}
                    className={`flex-1 py-3 px-4 text-center font-medium text-sm transition-colors relative ${
                        activeTab === 'available' 
                            ? 'text-blue-400 border-b-2 border-blue-400' 
                            : 'text-gray-400 hover:text-gray-200'
                    }`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <MotorcycleIcon className="w-4 h-4" />
                        Disponíveis ({deliveries.length})
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('mine')}
                    className={`flex-1 py-3 px-4 text-center font-medium text-sm transition-colors relative ${
                        activeTab === 'mine' 
                            ? 'text-blue-400 border-b-2 border-blue-400' 
                            : 'text-gray-400 hover:text-gray-200'
                    }`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <ClipboardListIcon className="w-4 h-4" />
                        Minhas Entregas ({myDeliveries.length})
                    </div>
                </button>
            </div>

            <div className="space-y-4">
                {activeTab === 'available' ? (
                    renderOrderList(deliveries, false)
                ) : (
                    <>
                        <div className="bg-gray-700 p-4 rounded-lg border-l-4 border-green-500 flex flex-col md:flex-row justify-between items-center shadow-md mb-6 gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-green-900/30 rounded-full">
                                    <CashIcon className="w-6 h-6 text-green-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">Ganhos Totais (Entregues)</p>
                                    <p className="text-xs text-gray-500">
                                        {myDeliveries.filter(o => o.status === 'Entregue').length} entregas realizadas
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-3xl font-bold text-green-400 block">
                                    R$ {totalEarnings.toFixed(2)}
                                </span>
                                {config?.taxa_delivery_fixa ? (
                                    <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded inline-block mt-1">
                                        Incluindo taxa fixa de R$ {config.taxa_delivery_fixa.toFixed(2)}
                                    </span>
                                ) : null}
                            </div>
                        </div>
                        {renderOrderList(myDeliveries, true)}
                    </>
                )}
            </div>

            {/* Modal de Confirmação de Entrega */}
            {deliveryModalOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden transform transition-all animate-fade-in-up">
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                                Confirmar Entrega - Pedido #{deliveryModalOrder.id}
                            </h3>
                            <p className="text-gray-500 text-sm mb-4">
                                Confirme a entrega para {deliveryModalOrder.name}
                            </p>

                            <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-100 text-sm">
                                <h4 className="font-bold text-gray-800 mb-3">Detalhes do Pedido</h4>
                                <div className="grid grid-cols-2 gap-4 mb-3">
                                    <div>
                                        <p className="font-semibold text-gray-700">Forma de Pagamento:</p>
                                        <div className="flex items-center gap-1 mt-1">
                                            <span className="text-gray-900">{deliveryModalOrder.paymentMethod}</span>
                                            {deliveryModalOrder.payment ? (
                                                <span className="flex items-center text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded border border-green-200">
                                                    <CheckCircleIcon className="w-3 h-3 mr-1" /> Pago
                                                </span>
                                            ) : (
                                                <span className="flex items-center text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded border border-red-200">
                                                    <XCircleIcon className="w-3 h-3 mr-1" /> Pendente
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-700">Valor Total a Cobrar:</p>
                                        <p className="mt-1 text-gray-900 font-bold">R$ {(deliveryModalOrder.total + (deliveryModalOrder.deliveryFee || 0)).toFixed(2)}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-700">Endereço de Entrega:</p>
                                    <p className="text-gray-900 mt-1">
                                        {deliveryModalOrder.address 
                                            ? `${deliveryModalOrder.address.address}, ${deliveryModalOrder.address.number}` 
                                            : 'Retirada no Balcão'}
                                    </p>
                                </div>
                            </div>

                            <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-100 text-gray-700 font-semibold border-b border-gray-200">
                                        <tr>
                                            <th className="px-3 py-2">Item</th>
                                            <th className="px-3 py-2 text-center">Qtd</th>
                                            <th className="px-3 py-2 text-right">Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {deliveryModalOrder.items.map((item, idx) => {
                                            const prod = getProductDetails(item.id);
                                            return (
                                                <tr key={idx} className="text-gray-600">
                                                    <td className="px-3 py-2">{prod?.name || `Item ${item.id}`}</td>
                                                    <td className="px-3 py-2 text-center">{item.qty}</td>
                                                    <td className="px-3 py-2 text-right">R$ {(prod ? prod.price * item.qty : 0).toFixed(2)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-yellow-800">Verifique com o cliente antes de confirmar:</h3>
                                        <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                                            <li>Recebimento de todos os itens</li>
                                            <li>Forma de pagamento ({deliveryModalOrder.paymentMethod})</li>
                                            <li>Satisfação com o pedido</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end">
                                <button 
                                    onClick={() => setDeliveryModalOrder(null)} 
                                    disabled={isProcessing}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleConfirmDelivery}
                                    disabled={isProcessing}
                                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isProcessing && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                    Salvar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BurgerDeliveryPage;