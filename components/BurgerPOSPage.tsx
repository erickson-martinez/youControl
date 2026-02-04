
import React, { useState, useEffect, useCallback } from 'react';
import { BURGER_API_URL } from '../constants';
import type { BurgerOrder, BurgerProduct, User } from '../types';
import { ChevronDownIcon, ClockIcon, CheckCircleIcon, MapPinIcon, LockClosedIcon, MinusIcon } from './icons';

interface BurgerPOSPageProps {
    user: User;
}

interface CaixaConfig {
    burger: string;
    caixa: string[];
    tables: number;
    pay: string[];
    debit: number;
    credit: number;
    phone: string;
}

const BurgerPOSPage: React.FC<BurgerPOSPageProps> = ({ user }) => {
    const [orders, setOrders] = useState<BurgerOrder[]>([]);
    const [products, setProducts] = useState<BurgerProduct[]>([]);
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const [registerOpenTime, setRegisterOpenTime] = useState<string | null>(null);
    const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
    
    // Auth & Config States
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [config, setConfig] = useState<CaixaConfig | null>(null);

    // Estado para o Modal de Pagamento
    const [paymentModalOrder, setPaymentModalOrder] = useState<BurgerOrder | null>(null);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    // Estado para Abertura de Caixa
    const [isOpeningModalOpen, setIsOpeningModalOpen] = useState(false);
    const [initialCash, setInitialCash] = useState('');
    const [isOpeningRegister, setIsOpeningRegister] = useState(false);

    // Estado para Fechamento de Caixa
    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
    const [isClosingRegister, setIsClosingRegister] = useState(false);

    // Estado para Retirada (Sangria)
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    // Fetch Data defined early to be used in effects
    const fetchData = useCallback(async () => {
        if (!config?.burger) return;

        try {
            const burgerNameEncoded = encodeURIComponent(config.burger);
            const [prodRes, orderRes] = await Promise.all([
                fetch(`${BURGER_API_URL}/api/products/burgers`),
                fetch(`${BURGER_API_URL}/api/orders/${burgerNameEncoded}`)
            ]);
            
            const prodData = await prodRes.json();
            const orderData = await orderRes.json();

            setProducts(prodData.data || []);
            setOrders(Array.isArray(orderData.data) ? orderData.data.sort((a: any, b: any) => b.id - a.id) : []);
        } catch (error) {
            console.error("Erro ao buscar dados POS:", error);
        } finally {
            setIsLoading(false);
        }
    }, [config]);

    // Verify Access and Load Config
    useEffect(() => {
        const verifyAccess = async () => {
            setCheckingAuth(true);
            try {
                const response = await fetch(`${BURGER_API_URL}/api/config/caixa`);
                const json = await response.json();
                
                if (json && json.data) {
                    const data: CaixaConfig = json.data;
                    setConfig(data);

                    const isOwner = data.phone === user.phone;
                    const isCashier = Array.isArray(data.caixa) && data.caixa.includes(user.phone);

                    if (isOwner || isCashier) {
                        setIsAuthorized(true);
                        // fetchData will be triggered by the polling useEffect when config is set
                    } else {
                        setIsAuthorized(false);
                    }
                } else {
                    console.error("Formato de configuração inválido");
                    setIsAuthorized(false);
                }
            } catch (error) {
                console.error("Erro ao verificar permissões de caixa", error);
                setIsAuthorized(false);
            } finally {
                setCheckingAuth(false);
            }
        };

        verifyAccess();
    }, [user.phone]);

    // Polling for orders (only if authorized and config loaded)
    useEffect(() => {
        if (!isAuthorized || !config) return;

        // Note: Removed local storage reliance for 'open' state to prefer server state via orders check
        fetchData(); // Initial fetch
        const interval = setInterval(fetchData, 10000); // Polling every 10s
        return () => clearInterval(interval);
    }, [isAuthorized, config, fetchData]);

    // Sincroniza o estado do caixa com base nos pedidos vindos do servidor
    useEffect(() => {
        if (orders.length > 0) {
            // Procura por um pedido de Abertura de Caixa que esteja com status 'Aberto'
            const activeRegisterOrder = orders.find(o => 
                o.name.includes('ABERTURA DE CAIXA') && 
                o.status === 'Aberto'
            );

            if (activeRegisterOrder) {
                if (!isRegisterOpen) {
                    setIsRegisterOpen(true);
                    setRegisterOpenTime(activeRegisterOrder.time);
                    // Atualiza local storage apenas para persistência offline/refresh rápido
                    localStorage.setItem('cashRegisterOpen', 'true');
                    localStorage.setItem('cashRegisterOpenTime', activeRegisterOrder.time);
                }
            } else {
                // Se não encontrar nenhum aberto no servidor, mas estiver aberto localmente,
                // mantemos a decisão do usuário (pode ter deletado o pedido), 
                // ou poderíamos forçar fechar. Por segurança, não forçamos fechar automaticamente aqui
                // para evitar conflitos de delay, mas confiamos no 'activeRegisterOrder' para bloquear novas aberturas.
            }
        }
    }, [orders, isRegisterOpen]);

    const getTotals = () => {
        if (!isRegisterOpen || !registerOpenTime) {
            return { cash: 0, pix: 0, credit: 0, debit: 0, total: 0 };
        }

        const openTime = new Date(registerOpenTime).getTime();

        // Filtra pedidos que foram pagos E ocorreram depois (ou durante) a abertura do caixa atual
        const sessionOrders = orders.filter(o => {
            if (!o.payment) return false;
            const orderTime = new Date(o.time).getTime();
            // Compara timestamps para garantir que só pegamos pedidos desta sessão
            // Usamos >= para incluir o pedido de abertura (Fundo de Troco) se ele tiver a mesma hora exata
            return orderTime >= openTime;
        });
        
        return sessionOrders.reduce((acc, order) => {
            // Para 'Retirada', o order.total já é negativo, então acc.total += order.total subtrai corretamente.
            // Para 'Dinheiro' também, acc.cash += -valor subtrai do dinheiro em caixa.
            if (order.paymentMethod === 'Dinheiro') acc.cash += order.total;
            else if (order.paymentMethod === 'PIX') acc.pix += order.total;
            else if (order.paymentMethod?.includes('Crédito')) acc.credit += order.total;
            else if (order.paymentMethod?.includes('Débito')) acc.debit += order.total;
            acc.total += order.total;
            return acc;
        }, { cash: 0, pix: 0, credit: 0, debit: 0, total: 0 });
    };

    const handleToggleRegisterClick = async () => {
        if (isRegisterOpen) {
            // Abre o modal de confirmação em vez de usar window.confirm
            setIsCloseModalOpen(true);
        } else {
            // Verificação de segurança antes de abrir modal
            const hasOpenRegister = orders.some(o => o.name.includes('ABERTURA DE CAIXA') && o.status === 'Aberto');
            if (hasOpenRegister) {
                alert("Já existe um caixa aberto no sistema. Feche o caixa anterior antes de abrir um novo.");
                setIsRegisterOpen(true); // Sincroniza a interface
                return;
            }

            setInitialCash('');
            setIsOpeningModalOpen(true);
        }
    };

    const handleConfirmCloseRegister = async () => {
        setIsClosingRegister(true);
        try {
            // 1. Gerar transação financeira para o dono
            const currentTotals = getTotals();
            if (currentTotals.total > 0 && config?.phone) {
                try {
                    await fetch(`${BURGER_API_URL}/transactions/simple`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ownerPhone: config.phone,
                            type: 'revenue',
                            name: `Fechamento Caixa - ${new Date().toLocaleDateString('pt-BR')}`,
                            amount: currentTotals.total,
                            date: new Date().toISOString().split('T')[0],
                            status: 'pago'
                        })
                    });
                } catch (err) {
                    console.error("Erro ao lançar no financeiro:", err);
                    alert("Atenção: Caixa fechado, mas houve erro ao lançar a receita no módulo financeiro.");
                }
            }

            // 2. Tenta encontrar o pedido de abertura atual para mudar o status
            const activeRegisterOrder = orders.find(o => o.name.includes('ABERTURA DE CAIXA') && o.status === 'Aberto');
            
            if (activeRegisterOrder) {
                try {
                    const userNameParam = encodeURIComponent(user.name);
                    await fetch(`${BURGER_API_URL}/api/orders/${activeRegisterOrder.id}/status/${userNameParam}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ newStatus: 'Fechamento', currentStatus: 'Aberto' })
                    });
                } catch (e) {
                    console.error("Erro ao atualizar status de fechamento no servidor", e);
                    alert("Aviso: O status foi atualizado localmente, mas houve erro ao comunicar com o servidor.");
                }
            }

            setIsRegisterOpen(false);
            setRegisterOpenTime(null);
            localStorage.setItem('cashRegisterOpen', 'false');
            localStorage.removeItem('cashRegisterOpenTime');
            fetchData(); // Atualiza a lista para refletir o status 'Fechamento'
            setIsCloseModalOpen(false); // Fecha o modal
        } catch (error) {
            alert("Erro ao fechar caixa.");
        } finally {
            setIsClosingRegister(false);
        }
    };

    const handleConfirmOpenRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Verificação final antes de enviar
        const hasOpenRegister = orders.some(o => o.name.includes('ABERTURA DE CAIXA') && o.status === 'Aberto');
        if (hasOpenRegister) {
            alert("Não foi possível abrir: Já existe um caixa aberto.");
            setIsOpeningModalOpen(false);
            setIsRegisterOpen(true);
            return;
        }

        const amount = parseFloat(initialCash);
        
        if (isNaN(amount) || amount < 0) {
            alert("Por favor, insira um valor válido.");
            return;
        }

        setIsOpeningRegister(true);
        try {
            const now = new Date().toISOString();
            
            // CRIA UM PEDIDO "FANTASMA" PARA REGISTRAR A ENTRADA DE CAIXA
            const openingOrderPayload = {
                id: Date.now(),
                time: now,
                name: `ABERTURA DE CAIXA (${user.name})`,
                items: [],
                total: amount,
                status: 'Aberto', // Status definido como Aberto
                payment: true,
                paymentMethod: 'Dinheiro',
                delivery: false,
                notes: 'Fundo de troco inicial',
                phone: user.phone,
                onclient: false,
                burger: config?.burger // Send burger name
            };

            const response = await fetch(`${BURGER_API_URL}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(openingOrderPayload)
            });

            const responseData = await response.json();

            if (!response.ok || (responseData.success === false)) {
                throw new Error(responseData.message || "Falha ao registrar abertura de caixa.");
            }

            // Abrir caixa localmente
            setIsRegisterOpen(true);
            setRegisterOpenTime(now);
            localStorage.setItem('cashRegisterOpen', 'true');
            localStorage.setItem('cashRegisterOpenTime', now);
            
            // Atualiza a lista para mostrar a entrada
            fetchData();
            setIsOpeningModalOpen(false);
        } catch (error) {
            alert(`Erro ao abrir caixa: ${(error as Error).message}`);
        } finally {
            setIsOpeningRegister(false);
        }
    };

    const handleConfirmWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(withdrawAmount);
        
        if (isNaN(amount) || amount <= 0) {
            alert("Por favor, insira um valor válido para retirada.");
            return;
        }

        setIsWithdrawing(true);
        try {
            const now = new Date().toISOString();
            const nameDescription = 'RETIRADA DE CAIXA';
            
            // 1. Criar pedido "Fantasma" com valor negativo (para abater do total do caixa)
            const withdrawOrderPayload = {
                id: Date.now(),
                time: now,
                name: nameDescription,
                items: [],
                total: -amount, // Valor Negativo
                status: 'Retirada',
                payment: true, // Já considerado como "pago/efetivado"
                paymentMethod: 'Dinheiro',
                delivery: false,
                notes: `Retirada realizada por ${user.name}`,
                phone: user.phone,
                onclient: false,
                burger: config?.burger
            };

            const response = await fetch(`${BURGER_API_URL}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(withdrawOrderPayload)
            });

            if (!response.ok) throw new Error("Falha ao registrar retirada no caixa.");

            // Sangria apenas abate do caixa, não gera transação no financeiro.

            await fetchData();
            setIsWithdrawModalOpen(false);
            setWithdrawAmount('');
        } catch (error) {
            alert(`Erro ao realizar retirada: ${(error as Error).message}`);
        } finally {
            setIsWithdrawing(false);
        }
    };

    const updateStatus = async (orderId: number, newStatus: string, currentStatus: string) => {
        try {
            // Inclui o nome do usuário na URL para satisfazer a rota da API
            const userNameParam = encodeURIComponent(user.name);
            await fetch(`${BURGER_API_URL}/api/orders/${orderId}/status/${userNameParam}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newStatus, currentStatus })
            });
            fetchData();
        } catch (error) {
            alert('Erro ao atualizar status');
        }
    };

    const handleOpenPaymentModal = (order: BurgerOrder) => {
        if (!isRegisterOpen) {
            alert("Caixa fechado! Abra o caixa para realizar recebimentos.");
            return;
        }
        setPaymentModalOrder(order);
    };

    const handleConfirmPayment = async () => {
        if (!paymentModalOrder) return;
        
        setIsProcessingPayment(true);
        try {
            await fetch(`${BURGER_API_URL}/api/orders/${paymentModalOrder.id}/payment`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payment: true })
            });
            await fetchData();
            setPaymentModalOrder(null); // Fecha o modal
        } catch (error) {
            alert('Erro ao confirmar pagamento');
        } finally {
            setIsProcessingPayment(false);
        }
    };

    const totals = getTotals();

    const renderActionButtons = (order: BurgerOrder) => {
        // Não mostrar ações para Abertura de Caixa ou Retirada
        if (order.name.includes('ABERTURA DE CAIXA') || order.status === 'Retirada') return null;

        const actions = [];
        if (!order.payment) {
            actions.push(
                <button 
                    key="pay" 
                    onClick={() => handleOpenPaymentModal(order)} 
                    className={`px-2 py-1 text-xs text-white rounded transition-colors ${isRegisterOpen ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 opacity-70 cursor-not-allowed'}`}
                    title={isRegisterOpen ? "Receber pagamento" : "Caixa fechado"}
                >
                    Receber
                </button>
            );
        }
        
        if (order.status === 'Aguardando') {
            actions.push(<button key="prep" onClick={() => updateStatus(order.id, 'Preparando', order.status)} className="px-2 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700">Preparar</button>);
        } else if (order.status === 'Preparando' || order.status === 'Em preparo') {
            actions.push(<button key="ready" onClick={() => updateStatus(order.id, 'Pronto', order.status)} className="px-2 py-1 text-xs text-white bg-yellow-600 rounded hover:bg-yellow-700">Pronto</button>);
        } else if (order.status === 'Pronto') {
            const next = order.delivery ? 'A caminho' : 'Entregue';
            actions.push(<button key="dlv" onClick={() => updateStatus(order.id, next, order.status)} className="px-2 py-1 text-xs text-white bg-purple-600 rounded hover:bg-purple-700">{order.delivery ? 'Enviar' : 'Entregar'}</button>);
        }

        return <div className="flex gap-2">{actions}</div>;
    };

    if (checkingAuth) {
        return (
            <div className="p-8 text-center bg-gray-800 rounded-lg">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Verificando acesso ao caixa...</p>
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-gray-800 rounded-lg text-center min-h-[50vh]">
                <LockClosedIcon className="w-20 h-20 text-red-500 mb-6" />
                <h2 className="text-2xl font-bold text-white mb-2">Acesso Restrito</h2>
                <p className="text-gray-400 max-w-md">
                    Seu usuário ({user.phone}) não tem permissão de Caixa ou Proprietário nesta loja.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 relative">
            {/* Header / Register Control */}
            <div className="p-4 bg-gray-800 rounded-lg flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-white">Caixa: {config?.burger || 'Lanchonete'}</h1>
                    <p className="text-sm text-gray-400">
                        Status: {isRegisterOpen ? <span className="text-green-400">Aberto ({new Date(registerOpenTime!).toLocaleTimeString()})</span> : <span className="text-red-400">Fechado</span>}
                    </p>
                </div>
                <div className="flex gap-2">
                    {isRegisterOpen && (
                        <button 
                            onClick={() => {
                                setWithdrawAmount('');
                                setIsWithdrawModalOpen(true);
                            }}
                            className="px-4 py-2 font-bold text-white bg-yellow-600 rounded hover:bg-yellow-700 flex items-center gap-2"
                        >
                            <MinusIcon className="w-4 h-4" />
                            Sangria / Retirada
                        </button>
                    )}
                    <button 
                        onClick={handleToggleRegisterClick}
                        className={`px-4 py-2 font-bold text-white rounded ${isRegisterOpen ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                        {isRegisterOpen ? 'Fechar Caixa' : 'Abrir Caixa'}
                    </button>
                </div>
            </div>

            {/* Totals Summary */}
            {isRegisterOpen && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-gray-700 p-3 rounded">
                        <span className="text-gray-400 text-xs">Total Geral (Líquido)</span>
                        <p className="text-xl font-bold text-white">R$ {totals.total.toFixed(2)}</p>
                    </div>
                    <div className="bg-gray-700 p-3 rounded">
                        <span className="text-gray-400 text-xs">Dinheiro (Em Caixa)</span>
                        <p className="text-lg font-bold text-green-400">R$ {totals.cash.toFixed(2)}</p>
                    </div>
                    <div className="bg-gray-700 p-3 rounded">
                        <span className="text-gray-400 text-xs">PIX</span>
                        <p className="text-lg font-bold text-blue-400">R$ {totals.pix.toFixed(2)}</p>
                    </div>
                    <div className="bg-gray-700 p-3 rounded">
                        <span className="text-gray-400 text-xs">Cartão</span>
                        <p className="text-lg font-bold text-yellow-400">R$ {(totals.credit + totals.debit).toFixed(2)}</p>
                    </div>
                </div>
            )}

            {/* Orders List */}
            {isLoading ? (
                <div className="text-center py-10 text-gray-400">Carregando pedidos...</div>
            ) : (
            <div className="bg-gray-800 rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left text-gray-400">
                    <thead className="bg-gray-700 text-gray-200">
                        <tr>
                            <th className="px-4 py-3">Cliente / Descrição</th>
                            <th className="px-4 py-3">Hora</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {orders.length === 0 ? (
                            <tr><td colSpan={4} className="p-4 text-center">Nenhum pedido.</td></tr>
                        ) : orders.map(order => {
                            const isOpening = order.name.includes('ABERTURA DE CAIXA');
                            const isWithdraw = order.status === 'Retirada';
                            return (
                            <React.Fragment key={order.id}>
                                <tr className={`hover:bg-gray-700/50 ${isOpening ? 'bg-green-900/10' : ''} ${isWithdraw ? 'bg-red-900/10' : ''}`}>
                                    <td className="px-4 py-3 font-medium text-white">
                                        {isOpening ? <span className="text-green-300 font-bold">{order.name}</span> : 
                                         isWithdraw ? <span className="text-red-300 font-bold">{order.name}</span> : (
                                            <>
                                                {order.name.split(' ')[0]} 
                                                {order.tableNumber && <span className="ml-2 text-xs bg-gray-600 px-1 rounded">Mesa {order.tableNumber}</span>}
                                            </>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">{new Date(order.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 text-xs rounded ${
                                            order.status === 'Entregue' || order.status === 'Aberto' ? 'bg-green-900 text-green-200' : 
                                            order.status === 'Cancelado' ? 'bg-red-900 text-red-200' :
                                            order.status === 'Retirada' ? 'bg-red-900 text-white' :
                                            'bg-yellow-900 text-yellow-200'
                                        }`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end items-center gap-3">
                                            {/* Render buttons always, regardless of register state */}
                                            {renderActionButtons(order)}
                                            {!isOpening && !isWithdraw && (
                                                <button onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)} className="text-gray-400 hover:text-white">
                                                    <ChevronDownIcon className={`w-5 h-5 transition-transform ${expandedOrder === order.id ? 'rotate-180' : ''}`} />
                                                </button>
                                            )}
                                            {(isOpening || isWithdraw) && (
                                                <span className={`${isWithdraw ? 'text-red-400' : 'text-green-400'} font-bold text-sm`}>
                                                    R$ {Math.abs(order.total).toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                                {expandedOrder === order.id && !isOpening && !isWithdraw && (
                                    <tr className="bg-gray-700/30">
                                        <td colSpan={4} className="p-4">
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <p className="font-bold text-white mb-2">Itens:</p>
                                                    <ul className="space-y-1">
                                                        {order.items.map((item, idx) => {
                                                            const prod = products.find(p => p.id === item.id);
                                                            return (
                                                                <li key={idx} className="flex justify-between text-gray-300">
                                                                    <span>{item.qty}x {prod?.name || `Item ${item.id}`}</span>
                                                                    <span>R$ {(prod ? prod.price * item.qty : 0).toFixed(2)}</span>
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                </div>
                                                <div className="text-sm">
                                                    <p><span className="text-gray-400">Tipo:</span> {order.delivery ? 'Entrega' : 'Retirada'}</p>
                                                    {order.address && (
                                                        <div className="flex items-center gap-2">
                                                            <p><span className="text-gray-400">Endereço:</span> {order.address.address}, {order.address.number}</p>
                                                            <a 
                                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${order.address.address}, ${order.address.number}`)}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-red-500 hover:text-red-400"
                                                                title="Abrir no Maps"
                                                            >
                                                                <MapPinIcon className="w-4 h-4" />
                                                            </a>
                                                        </div>
                                                    )}
                                                    <p><span className="text-gray-400">Pagamento:</span> {order.paymentMethod} - {order.payment ? <span className="text-green-400">Pago</span> : <span className="text-red-400">Pendente</span>}</p>
                                                    <p className="mt-2 text-lg font-bold text-white">Total: R$ {(order.total + (order.deliveryFee || 0)).toFixed(2)}</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        )})}
                    </tbody>
                </table>
            </div>
            )}

            {/* Modal de Abertura de Caixa */}
            {isOpeningModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm px-4">
                    <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-fade-in-up border border-gray-700">
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-white mb-4">Abrir Caixa</h3>
                            <form onSubmit={handleConfirmOpenRegister}>
                                <div className="mb-4">
                                    <label htmlFor="initialCash" className="block text-sm font-medium text-gray-300 mb-1">
                                        Fundo de Troco (R$)
                                    </label>
                                    <input
                                        type="number"
                                        id="initialCash"
                                        step="0.01"
                                        min="0"
                                        required
                                        value={initialCash}
                                        onChange={(e) => setInitialCash(e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                                        placeholder="0.00"
                                        autoFocus
                                    />
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button 
                                        type="button"
                                        onClick={() => setIsOpeningModalOpen(false)}
                                        disabled={isOpeningRegister}
                                        className="px-4 py-2 bg-gray-600 text-gray-300 text-sm font-medium rounded-md hover:bg-gray-500 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={isOpeningRegister}
                                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isOpeningRegister && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                        Abrir
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Fechamento de Caixa */}
            {isCloseModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm px-4">
                    <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up border border-gray-700">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-white mb-4">Fechamento de Caixa</h3>
                            
                            <div className="space-y-4 mb-6">
                                <div className="bg-gray-700 p-3 rounded-lg border border-gray-600">
                                    <p className="text-sm text-gray-400 mb-1">Data do Fechamento</p>
                                    <p className="text-lg font-bold text-white">{new Date().toLocaleDateString('pt-BR')}</p>
                                </div>

                                <div className="bg-gray-700 p-3 rounded-lg border border-gray-600">
                                    <p className="text-sm text-gray-400 mb-2">Resumo de Valores</p>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-300">Dinheiro:</span>
                                            <span className="font-medium text-green-400">R$ {totals.cash.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-300">PIX:</span>
                                            <span className="font-medium text-blue-400">R$ {totals.pix.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-300">Cartão:</span>
                                            <span className="font-medium text-yellow-400">R$ {(totals.credit + totals.debit).toFixed(2)}</span>
                                        </div>
                                        <div className="border-t border-gray-600 mt-2 pt-2 flex justify-between text-base">
                                            <span className="font-bold text-white">Total:</span>
                                            <span className="font-bold text-white">R$ {totals.total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 italic">
                                    Ao confirmar, uma receita no valor total será lançada automaticamente no seu módulo financeiro.
                                </p>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button 
                                    type="button"
                                    onClick={() => setIsCloseModalOpen(false)}
                                    disabled={isClosingRegister}
                                    className="px-4 py-2 bg-gray-600 text-gray-300 text-sm font-medium rounded-md hover:bg-gray-500 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="button"
                                    onClick={handleConfirmCloseRegister}
                                    disabled={isClosingRegister}
                                    className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isClosingRegister && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                    Confirmar Fechamento
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Retirada (Sangria) */}
            {isWithdrawModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm px-4">
                    <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-fade-in-up border border-gray-700">
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-white mb-4">Sangria / Retirada do Caixa</h3>
                            <form onSubmit={handleConfirmWithdraw}>
                                <div className="mb-4">
                                    <label htmlFor="withdrawAmount" className="block text-sm font-medium text-gray-300 mb-1">
                                        Valor da Retirada (R$)
                                    </label>
                                    <input
                                        type="number"
                                        id="withdrawAmount"
                                        step="0.01"
                                        min="0.01"
                                        required
                                        value={withdrawAmount}
                                        onChange={(e) => setWithdrawAmount(e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-white placeholder-gray-400"
                                        placeholder="0.00"
                                        autoFocus
                                    />
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button 
                                        type="button"
                                        onClick={() => setIsWithdrawModalOpen(false)}
                                        disabled={isWithdrawing}
                                        className="px-4 py-2 bg-gray-600 text-gray-300 text-sm font-medium rounded-md hover:bg-gray-500 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={isWithdrawing}
                                        className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isWithdrawing && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                        Retirar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Confirmação de Pagamento */}
            {paymentModalOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm px-4">
                    <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden transform transition-all animate-fade-in-up border border-gray-700">
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-white mb-2">
                                Confirmar Recebimento - Pedido {paymentModalOrder.id}
                            </h3>
                            <p className="text-gray-400 mb-6 text-sm">
                                Confirme o recebimento de <span className="font-bold text-gray-200">R$ {(paymentModalOrder.total + (paymentModalOrder.deliveryFee || 0)).toFixed(2)}</span> de {paymentModalOrder.name}
                            </p>

                            <div className="bg-gray-700 rounded-lg p-4 mb-4 border border-gray-600">
                                <h4 className="text-sm font-bold text-gray-300 mb-2">Detalhes do Pagamento</h4>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Forma de Pagamento:</span>
                                        <span className="font-medium text-white">{paymentModalOrder.paymentMethod}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Valor a Receber:</span>
                                        <span className="font-bold text-white">R$ {(paymentModalOrder.total + (paymentModalOrder.deliveryFee || 0)).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-yellow-900/30 border-l-4 border-yellow-600 p-4 mb-6">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-yellow-400">Verifique antes de confirmar:</h3>
                                        <ul className="mt-2 text-sm text-yellow-200 list-disc list-inside">
                                            <li>O valor recebido está correto</li>
                                            <li>O troco foi dado (se aplicável)</li>
                                            <li>O comprovante foi emitido (para cartões/PIX)</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end">
                                <button 
                                    onClick={() => setPaymentModalOrder(null)} 
                                    disabled={isProcessingPayment}
                                    className="px-4 py-2 bg-gray-600 text-gray-300 text-sm font-medium rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleConfirmPayment}
                                    disabled={isProcessingPayment}
                                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isProcessingPayment && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                    Confirmar Recebimento
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BurgerPOSPage;
