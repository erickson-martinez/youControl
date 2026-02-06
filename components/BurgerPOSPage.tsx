import React, { useState, useEffect, useCallback } from 'react';
import { BURGER_API_URL } from '../constants';
import type { BurgerOrder, BurgerProduct, User } from '../types';
import { ChevronDownIcon, LockClosedIcon, MinusIcon, XCircleIcon, MapPinIcon, PrinterIcon } from './icons';

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
    const [openingName, setOpeningName] = useState(''); 
    const [isOpeningRegister, setIsOpeningRegister] = useState(false);

    // Estado para Fechamento de Caixa
    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
    const [isClosingRegister, setIsClosingRegister] = useState(false);

    // Estado para Modal de Bloqueio (Pendências)
    const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);
    const [blockingOrders, setBlockingOrders] = useState<BurgerOrder[]>([]);

    // Estado para Retirada (Sangria)
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawName, setWithdrawName] = useState(''); 
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
                // Agora passa o telefone do usuário na rota para verificar permissão no backend
                const response = await fetch(`${BURGER_API_URL}/api/config/caixa/${user.phone}`);
                const json = await response.json();
                
                if (json && json.data) {
                    const data: CaixaConfig = json.data;
                    setConfig(data);

                    const isOwner = data.phone === user.phone;
                    const isCashier = Array.isArray(data.caixa) && data.caixa.includes(user.phone);

                    if (isOwner || isCashier) {
                        setIsAuthorized(true);
                    } else {
                        setIsAuthorized(false);
                    }
                } else {
                    console.error("Formato de configuração inválido ou acesso negado");
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

        fetchData(); 
        const interval = setInterval(fetchData, 10000); 
        return () => clearInterval(interval);
    }, [isAuthorized, config, fetchData]);

    // Sincroniza o estado do caixa com base nos pedidos vindos do servidor
    useEffect(() => {
        if (orders.length > 0) {
            const activeRegisterOrder = orders.find(o => 
                o.name.includes('ABERTURA DE CAIXA') && 
                o.status === 'Aberto'
            );

            if (activeRegisterOrder) {
                if (!isRegisterOpen) {
                    setIsRegisterOpen(true);
                    setRegisterOpenTime(activeRegisterOrder.time);
                    localStorage.setItem('cashRegisterOpen', 'true');
                    localStorage.setItem('cashRegisterOpenTime', activeRegisterOrder.time);
                }
            }
        }
    }, [orders, isRegisterOpen]);

    const getTotals = () => {
        if (!isRegisterOpen || !registerOpenTime) {
            return { cash: 0, pix: 0, credit: 0, debit: 0, total: 0, withdrawals: 0, deliveryFees: 0 };
        }

        const openTime = new Date(registerOpenTime).getTime();

        const sessionOrders = orders.filter(o => {
            if (!o.payment) return false;
            const orderTime = new Date(o.time).getTime();
            return orderTime >= openTime;
        });
        
        return sessionOrders.reduce((acc, order) => {
            if (order.status === 'Retirada') {
                acc.withdrawals += Math.abs(order.total);
            }

            let effectiveTotal = order.total;
            const fee = order.deliveryFee || 0;

            if (order.status !== 'Retirada' && !order.name.includes('ABERTURA DE CAIXA')) {
                effectiveTotal += fee;
                acc.deliveryFees += fee;
            }

            if (order.paymentMethod === 'Dinheiro') acc.cash += effectiveTotal;
            else if (order.paymentMethod === 'PIX') acc.pix += effectiveTotal;
            else if (order.paymentMethod?.includes('Crédito')) acc.credit += effectiveTotal;
            else if (order.paymentMethod?.includes('Débito')) acc.debit += effectiveTotal;
            
            acc.total += effectiveTotal;
            return acc;
        }, { cash: 0, pix: 0, credit: 0, debit: 0, total: 0, withdrawals: 0, deliveryFees: 0 });
    };

    const handleToggleRegisterClick = async () => {
        if (isRegisterOpen) {
            const pendingOrders = orders.filter(o => {
                if (o.name.includes('ABERTURA DE CAIXA') || o.status === 'Retirada' || o.name.includes('FECHAMENTO DE CAIXA')) return false;
                if (!o.payment) return true;
                const isFinalStatus = ['Entregue', 'Cancelado', 'Recebido'].includes(o.status);
                if (!isFinalStatus) return true;
                return false;
            });

            if (pendingOrders.length > 0) {
                setBlockingOrders(pendingOrders);
                setIsBlockedModalOpen(true);
                return;
            }

            setIsCloseModalOpen(true);
        } else {
            const hasOpenRegister = orders.some(o => o.name.includes('ABERTURA DE CAIXA') && o.status === 'Aberto');
            if (hasOpenRegister) {
                alert("Já existe um caixa aberto no sistema. Feche o caixa anterior antes de abrir um novo.");
                setIsRegisterOpen(true);
                return;
            }

            setInitialCash('');
            setOpeningName(`ABERTURA DE CAIXA (${user.name})`);
            setIsOpeningModalOpen(true);
        }
    };

    const handleConfirmCloseRegister = async () => {
        setIsClosingRegister(true);
        try {
            const currentTotals = getTotals();
            const activeRegisterOrder = orders.find(o => o.name.includes('ABERTURA DE CAIXA') && o.status === 'Aberto');
            const openingAmount = activeRegisterOrder ? activeRegisterOrder.total : 0;
            const realSalesRevenue = (currentTotals.total - openingAmount) + currentTotals.withdrawals;

            // 1. Lança no financeiro (mantido conforme solicitado)
            if (realSalesRevenue > 0) {
                try {
                    await fetch(`${BURGER_API_URL}/transactions/simple`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ownerPhone: user.phone,
                            type: 'revenue',
                            name: `Fechamento Caixa - ${new Date().toLocaleDateString('pt-BR')}`,
                            amount: realSalesRevenue,
                            date: new Date().toISOString().split('T')[0],
                            status: 'pago'
                        })
                    });
                } catch (err) {
                    console.error("Erro ao lançar no financeiro:", err);
                    alert("Atenção: Caixa fechado, mas houve erro ao lançar a receita no módulo financeiro.");
                }
            }

            // 2. Fecha o status do pedido de abertura para evitar reabertura automática
            if (activeRegisterOrder) {
                 const userNameParam = encodeURIComponent(user.name);
                 try {
                    await fetch(`${BURGER_API_URL}/api/orders/${activeRegisterOrder.id}/status/${userNameParam}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ newStatus: 'Fechado', currentStatus: 'Aberto' })
                    });
                 } catch (err) {
                     console.error("Erro ao fechar status do pedido de abertura", err);
                 }
            }

            // 3. Gera registros individuais para o histórico do caixa
            const now = new Date().toISOString();
            
            // Subtrai o valor da abertura do dinheiro para o registro visual
            const cashForRecord = currentTotals.cash - (openingAmount - currentTotals.withdrawals) ;

            // Array com os registros que devem ser criados
            const recordsToCreate = [
                { type: 'Cartão', value: currentTotals.credit + currentTotals.debit },
                { type: 'Pix', value: currentTotals.pix },
                { type: 'Dinheiro', value: cashForRecord }, // Valor ajustado (Vendas - Retiradas)
                { type: 'Taxa de Entrega', value: currentTotals.deliveryFees }
            ];

            // Itera e cria apenas os que têm valor diferente de 0
            for (let i = 0; i < recordsToCreate.length; i++) {
                const record = recordsToCreate[i];
                if (record.value !== 0) {
                    try {
                        const closingOrderPayload = {
                            id: Date.now() + i, // Incrementa ID para evitar colisão
                            time: now,
                            name: `FECHAMENTO DE CAIXA - ${record.type}`,
                            items: [],
                            total: record.value,
                            status: 'Fechamento',
                            payment: true,
                            paymentMethod: 'Sistema',
                            delivery: false,
                            notes: `Fechamento parcial: ${record.type}`,
                            phone: user.phone,
                            onclient: false,
                            burger: config?.burger
                        };

                        await fetch(`${BURGER_API_URL}/api/orders`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(closingOrderPayload)
                        });
                    } catch (err) {
                        console.error(`Erro ao criar registro de fechamento para ${record.type}`, err);
                    }
                }
            }

            setIsRegisterOpen(false);
            setRegisterOpenTime(null);
            localStorage.setItem('cashRegisterOpen', 'false');
            localStorage.removeItem('cashRegisterOpenTime');
            fetchData(); 
            setIsCloseModalOpen(false); 
        } catch (error) {
            alert("Erro ao fechar caixa.");
        } finally {
            setIsClosingRegister(false);
        }
    };

    const handleConfirmOpenRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        
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

        if (!openingName.trim()) {
            alert("Por favor, insira uma descrição para a abertura.");
            return;
        }

        setIsOpeningRegister(true);
        try {
            const now = new Date().toISOString();
            
            const openingOrderPayload = {
                id: Date.now(),
                time: now,
                name: openingName, 
                items: [],
                total: amount,
                status: 'Aberto', 
                payment: true,
                paymentMethod: 'Dinheiro',
                delivery: false,
                notes: 'Fundo de troco inicial',
                phone: user.phone,
                onclient: false,
                burger: config?.burger 
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

            try {
                await fetch(`${BURGER_API_URL}/transactions/simple`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ownerPhone: user.phone,
                        type: 'revenue',
                        name: `Abertura de Caixa - ${new Date().toLocaleDateString('pt-BR')}`,
                        amount: amount,
                        date: new Date().toISOString().split('T')[0],
                        status: 'pago'
                    })
                });
            } catch (finErr) {
                console.error("Erro ao criar transação financeira de abertura", finErr);
                alert("Caixa aberto, mas falhou ao criar receita no financeiro.");
            }

            setIsRegisterOpen(true);
            setRegisterOpenTime(now);
            localStorage.setItem('cashRegisterOpen', 'true');
            localStorage.setItem('cashRegisterOpenTime', now);
            
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

        if (!withdrawName.trim()) {
            alert("Por favor, informe um nome/motivo para a sangria.");
            return;
        }

        setIsWithdrawing(true);
        try {
            const now = new Date().toISOString();
            const nameDescription = `Retirada - ${withdrawName}`;
            
            const withdrawOrderPayload = {
                id: Date.now(),
                time: now,
                name: nameDescription,
                items: [],
                total: -amount,
                status: 'Retirada',
                payment: true, 
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

            try {
                await fetch(`${BURGER_API_URL}/transactions/simple`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ownerPhone: user.phone, 
                        type: 'expense',
                        name: nameDescription,
                        amount: amount,
                        date: new Date().toISOString().split('T')[0],
                        status: 'pago'
                    })
                });
            } catch (finErr) {
                console.error("Erro ao criar transação financeira da sangria", finErr);
                alert("Sangria registrada no caixa, mas falhou ao criar despesa no financeiro.");
            }

            await fetchData();
            setIsWithdrawModalOpen(false);
            setWithdrawAmount('');
            setWithdrawName('');
        } catch (error) {
            alert(`Erro ao realizar retirada: ${(error as Error).message}`);
        } finally {
            setIsWithdrawing(false);
        }
    };

    const updateStatus = async (orderId: number, newStatus: string, currentStatus: string) => {
        try {
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
            setPaymentModalOrder(null); 
        } catch (error) {
            alert('Erro ao confirmar pagamento');
        } finally {
            setIsProcessingPayment(false);
        }
    };

    const handlePrintOrder = (order: BurgerOrder) => {
        const printWindow = window.open('', '_blank', 'width=300,height=600');
        if (!printWindow) {
            alert("Permita pop-ups para imprimir.");
            return;
        }

        const itemsHtml = order.items.map(item => {
            const prod = products.find(p => p.id === item.id);
            const totalItem = (prod ? prod.price * item.qty : 0);
            return `
                <tr>
                    <td colspan="3" style="font-size: 11px; font-weight: bold;">${prod?.name || `Item ${item.id}`}</td>
                </tr>
                <tr style="border-bottom: 1px dashed #444;">
                    <td style="font-size: 11px;">${item.qty}x</td>
                    <td style="font-size: 11px; text-align: right;">${(prod?.price || 0).toFixed(2)}</td>
                    <td style="font-size: 11px; text-align: right; font-weight: bold;">${totalItem.toFixed(2)}</td>
                </tr>
            `;
        }).join('');

        const dateStr = new Date(order.time).toLocaleString('pt-BR');
        const total = (order.total + (order.deliveryFee || 0)).toFixed(2);
        
        const content = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Cupom #${order.id}</title>
                <style>
                    @page { margin: 0; size: 58mm auto; }
                    body { 
                        font-family: 'Courier New', Courier, monospace; 
                        width: 58mm; 
                        margin: 0; 
                        padding: 5px 2px; 
                        color: #000; 
                        background: #fff;
                        font-size: 11px;
                        line-height: 1.2;
                    }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    .bold { font-weight: bold; }
                    .border-bottom { border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 5px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 5px; }
                    td { vertical-align: top; }
                </style>
            </head>
            <body>
                <div class="text-center bold border-bottom" style="font-size: 14px;">${config?.burger || 'Lanchonete'}</div>
                
                <div class="border-bottom">
                    <div>Data: ${dateStr}</div>
                    <div>Pedido: #${order.id}</div>
                    ${order.tableNumber ? `<div>Mesa: <span class="bold">${order.tableNumber}</span></div>` : ''}
                    <div>Cliente: ${order.name}</div>
                    ${order.phone ? `<div>Tel: ${order.phone}</div>` : ''}
                </div>

                <table class="border-bottom">
                    ${itemsHtml}
                </table>

                <div class="text-right bold" style="font-size: 14px;">TOTAL: R$ ${total}</div>
                <div class="text-right">Pagamento: ${order.paymentMethod}</div>
                
                ${order.delivery && order.address ? `
                <div class="border-bottom" style="margin-top: 5px; padding-top: 5px; border-top: 1px dashed #000;">
                    <div class="bold">ENTREGA:</div>
                    <div>${order.address.address}, ${order.address.number}</div>
                    <div>${order.address.neighborhood || ''}</div>
                    ${order.deliveryFee ? `<div>Taxa: R$ ${order.deliveryFee.toFixed(2)}</div>` : ''}
                </div>
                ` : ''}

                ${order.notes ? `
                <div style="margin-top: 5px; padding: 5px; border: 1px solid #000; font-weight: bold;">
                    OBS: ${order.notes}
                </div>
                ` : ''}

                <div class="text-center" style="margin-top: 10px; font-size: 10px;">
                    *** NÃO É DOCUMENTO FISCAL ***
                </div>
                <br/><br/>
            </body>
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function(){ window.close(); }, 500);
                }
            </script>
            </html>
        `;

        printWindow.document.write(content);
        printWindow.document.close();
    };

    const totals = getTotals();

    const renderActionButtons = (order: BurgerOrder) => {
        if (order.name.includes('ABERTURA DE CAIXA') || order.name.includes('FECHAMENTO DE CAIXA') || order.status === 'Retirada') return null;

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

        // Add Print Button
        actions.push(
            <button
                key="print"
                onClick={() => handlePrintOrder(order)}
                className="px-2 py-1 text-xs text-white bg-gray-600 rounded hover:bg-gray-500"
                title="Imprimir Cupom"
            >
                <PrinterIcon className="w-4 h-4" />
            </button>
        );

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
                                setWithdrawName('');
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
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div className="bg-gray-700 p-3 rounded">
                        <span className="text-gray-400 text-xs">Total</span>
                        <p className="text-xl font-bold text-white">R$ {totals.total.toFixed(2)}</p>
                    </div>
                    <div className="bg-gray-700 p-3 rounded">
                        <span className="text-gray-400 text-xs">Dinheiro</span>
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
                    <div className="bg-gray-700 p-3 rounded border border-red-900/50">
                        <span className="text-gray-400 text-xs">Retirada</span>
                        <p className="text-lg font-bold text-red-500">R$ {totals.withdrawals.toFixed(2)}</p>
                    </div>
                    <div className="bg-gray-700 p-3 rounded border border-gray-600">
                        <span className="text-gray-400 text-xs text-red-400">Taxa de Entrega</span>
                        <p className="text-lg font-bold text-gray-300">R$ {totals.deliveryFees.toFixed(2)}</p>
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
                            const isClosing = order.name.includes('FECHAMENTO DE CAIXA');
                            const isWithdraw = order.status === 'Retirada';

                            return (
                            <React.Fragment key={order.id}>
                                <tr className={`hover:bg-gray-700/50 ${isOpening ? 'bg-green-900/10' : ''} ${isWithdraw ? 'bg-red-900/10' : ''} ${isClosing ? 'bg-blue-900/10' : ''}`}>
                                    <td className="px-4 py-3 font-medium text-white">
                                        {isOpening ? <span className="text-green-300 font-bold">{order.name}</span> : 
                                         isWithdraw ? <span className="text-red-300 font-bold">{order.name}</span> : 
                                         isClosing ? (
                                            <span className="text-blue-300 font-bold">{order.name}</span>
                                         ) : (
                                            <>
                                                {order.name.split(' ')[0]} 
                                                {order.tableNumber && <span className="ml-2 text-xs bg-gray-600 px-1 rounded">Mesa {order.tableNumber}</span>}
                                            </>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 align-top">{new Date(order.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                    <td className="px-4 py-3 align-top">
                                        <span className={`px-2 py-1 text-xs rounded ${
                                            order.status === 'Entregue' || order.status === 'Aberto' || order.status === 'Fechamento' ? 'bg-green-900 text-green-200' : 
                                            order.status === 'Cancelado' ? 'bg-red-900 text-red-200' :
                                            order.status === 'Retirada' ? 'bg-red-900 text-white' :
                                            'bg-yellow-900 text-yellow-200'
                                        }`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right align-top">
                                        <div className="flex justify-end items-center gap-3">
                                            {renderActionButtons(order)}
                                            {!isOpening && !isWithdraw && !isClosing && (
                                                <button onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)} className="text-gray-400 hover:text-white">
                                                    <ChevronDownIcon className={`w-5 h-5 transition-transform ${expandedOrder === order.id ? 'rotate-180' : ''}`} />
                                                </button>
                                            )}
                                            {(isOpening || isWithdraw || isClosing) && (
                                                <span className={`${isWithdraw ? 'text-red-400' : isClosing ? 'text-blue-400' : 'text-green-400'} font-bold text-sm`}>
                                                    R$ {Math.abs(order.total).toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                                {expandedOrder === order.id && !isOpening && !isWithdraw && !isClosing && (
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

            {/* Modal de Bloqueio (Pendências) */}
            {isBlockedModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm px-4">
                    <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up border border-red-900/50">
                        <div className="p-6 text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-900/30 mb-4">
                                <XCircleIcon className="h-8 w-8 text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Não é possível fechar o caixa!</h3>
                            <p className="text-gray-300 mb-6">
                                Existem <span className="font-bold text-white">{blockingOrders.length}</span> pedidos pendentes (não pagos ou em andamento).
                                <br/>Finalize ou cancele todos os pedidos antes de fechar.
                            </p>
                            
                            <div className="text-left bg-gray-900/50 rounded p-3 mb-6 max-h-40 overflow-y-auto border border-gray-700">
                                <ul className="space-y-2 text-sm">
                                    {blockingOrders.map(o => (
                                        <li key={o.id} className="flex justify-between text-gray-400 border-b border-gray-700 last:border-0 pb-1 last:pb-0">
                                            <span>#{o.id} - {o.name.split(' ')[0]}</span>
                                            <span className={`font-bold ${!o.payment ? 'text-red-400' : 'text-yellow-400'}`}>
                                                {!o.payment ? 'Não Pago' : o.status}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <button 
                                onClick={() => setIsBlockedModalOpen(false)}
                                className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-md transition-colors"
                            >
                                Entendi
                            </button>
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

            {/* Modal de Abertura de Caixa */}
            {isOpeningModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm px-4">
                    <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-fade-in-up border border-gray-700">
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-white mb-4">Abrir Caixa</h3>
                            <form onSubmit={handleConfirmOpenRegister}>
                                <div className="mb-4">
                                    <label htmlFor="openingName" className="block text-sm font-medium text-gray-300 mb-1">
                                        Nome do Caixa / Operador
                                    </label>
                                    <input
                                        type="text"
                                        id="openingName"
                                        required
                                        value={openingName}
                                        onChange={(e) => setOpeningName(e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                                        placeholder="Ex: Caixa Manhã - João"
                                        autoFocus
                                    />
                                </div>
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
                                        <div className="flex justify-between text-sm text-red-300">
                                            <span>Retiradas:</span>
                                            <span>R$ {totals.withdrawals.toFixed(2)}</span>
                                        </div>
                                        <div className="border-t border-gray-600 mt-2 pt-2 flex justify-between text-base">
                                            <span className="font-bold text-white">Total Líquido:</span>
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
                                    <label htmlFor="withdrawName" className="block text-sm font-medium text-gray-300 mb-1">
                                        Nome/Motivo
                                    </label>
                                    <input
                                        type="text"
                                        id="withdrawName"
                                        required
                                        value={withdrawName}
                                        onChange={(e) => setWithdrawName(e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-white placeholder-gray-400"
                                        placeholder="Ex: Pagamento Fornecedor"
                                        autoFocus
                                    />
                                </div>
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
        </div>
    );
};

export default BurgerPOSPage;