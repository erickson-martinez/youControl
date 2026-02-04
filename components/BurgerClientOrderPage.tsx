
import React, { useState, useEffect, useCallback } from 'react';
import { BURGER_API_URL, DEFAULT_BURGER_IMAGE } from '../constants';
import type { BurgerProduct, BurgerOrder } from '../types';
import { ShoppingCartIcon, MotorcycleIcon, BuildingStoreIcon, ClipboardListIcon, ChevronDownIcon, ClockIcon, CheckCircleIcon, MapPinIcon } from './icons';

interface StoreConfig {
    TAXA_POR_KM: number;
    latitude: string;
    longitude: string;
    PAYMENT_METHODS: string[];
    burgerName?: string;
}

const BurgerClientOrderPage: React.FC = () => {
    const [products, setProducts] = useState<BurgerProduct[]>([]);
    const [cart, setCart] = useState<Record<number, number>>({});
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [config, setConfig] = useState<StoreConfig | null>(null);
    
    // Form States
    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    
    // Orders List States
    const [myOrders, setMyOrders] = useState<BurgerOrder[]>([]);
    const [isOrdersListOpen, setIsOrdersListOpen] = useState(false);
    const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);

    // Delivery & Pickup States
    const [isDelivery, setIsDelivery] = useState(false); // Checkbox state
    const [pickupTime, setPickupTime] = useState(''); // Radio selection for pickup
    
    // Address Details
    const [addressStreet, setAddressStreet] = useState('');
    const [addressNumber, setAddressNumber] = useState('');
    const [addressNeighborhood, setAddressNeighborhood] = useState('');
    
    // Financials & Delivery
    const [deliveryFee, setDeliveryFee] = useState(0);
    const [distance, setDistance] = useState(0);
    const [isCalculating, setIsCalculating] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('');

    const fetchMyOrders = useCallback(async (phone: string) => {
        if (!phone || phone.length < 8) return;
        setIsLoadingOrders(true);
        try {
            // Remove caracteres não numéricos para garantir compatibilidade
            const cleanPhone = phone.replace(/\D/g, '');
            const response = await fetch(`${BURGER_API_URL}/api/orders/phone/${cleanPhone}`);
            if (response.ok) {
                const data = await response.json();
                // Suporta retorno { data: [...] } ou array direto, dependendo da API
                const list = Array.isArray(data) ? data : (data.data || data.orders || []);
                setMyOrders(list.sort((a: BurgerOrder, b: BurgerOrder) => new Date(b.time).getTime() - new Date(a.time).getTime()));
            }
        } catch (error) {
            console.error("Erro ao buscar pedidos", error);
        } finally {
            setIsLoadingOrders(false);
        }
    }, []);

    useEffect(() => {
        // Carregar Produtos
        fetch(`${BURGER_API_URL}/api/products/burgers`)
            .then(res => res.json())
            .then(data => setProducts(data.data || []));

        // Carregar Configurações da Loja (Taxas, Localização, Pagamentos) usando novo endpoint
        fetch(`${BURGER_API_URL}/api/config/product`)
            .then(res => res.json())
            .then(data => {
                if(data.data) {
                    setConfig({
                        TAXA_POR_KM: data.data.taxa || 1.5,
                        latitude: data.data.lat,
                        longitude: data.data.long,
                        PAYMENT_METHODS: data.data.pay || [],
                        burgerName: data.data.burger
                    });
                }
            })
            .catch(err => console.error("Erro ao carregar config", err));

        // Carregar dados do usuário se estiver logado
        try {
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                const user = JSON.parse(savedUser);
                if (user.name) setClientName(user.name);
                if (user.phone) {
                    setClientPhone(user.phone);
                    // Busca pedidos iniciais se tiver telefone salvo
                    fetchMyOrders(user.phone);
                }
            }
        } catch (e) {
            console.error("Erro ao carregar usuário salvo", e);
        }
    }, [fetchMyOrders]);

    // Busca pedidos sempre que o telefone mudar e tiver tamanho válido (ex: debounce manual ou blur)
    useEffect(() => {
        if (clientPhone.length >= 10) {
            const timer = setTimeout(() => {
                fetchMyOrders(clientPhone);
            }, 800); // Debounce de 800ms
            return () => clearTimeout(timer);
        }
    }, [clientPhone, fetchMyOrders]);

    // Função para calcular distância (Haversine Formula)
    const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Raio da terra em km
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c;
        return d;
    };

    const handleCalculateDelivery = async () => {
        if (!config) return alert("Erro: Configurações da loja não carregadas.");
        if (!addressStreet || !addressNumber) {
            return alert("Preencha o Endereço e o Número para calcular.");
        }

        setIsCalculating(true);
        setDeliveryFee(0);
        setDistance(0);

        try {
            // Monta a query de busca. Adicionamos "Brasil" para garantir contexto.
            const query = `${addressStreet}, ${addressNumber}, ${addressNeighborhood}, Campo Grande, MS, Brasil`; 
            const encodedQuery = encodeURIComponent(query);
            
            const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&addressdetails=1&limit=1`);
            const data = await response.json();

            if (data && data.length > 0) {
                const clientLat = parseFloat(data[0].lat);
                const clientLon = parseFloat(data[0].lon);
                const storeLat = parseFloat(config.latitude);
                const storeLon = parseFloat(config.longitude);

                if (isNaN(storeLat) || isNaN(storeLon)) {
                    alert("Erro na configuração de localização da loja. Contate o estabelecimento.");
                    return;
                }

                const distanceKm = getDistanceFromLatLonInKm(storeLat, storeLon, clientLat, clientLon);
                
                // Armazena a distância calculada
                setDistance(parseFloat(distanceKm.toFixed(2)));

                // Cálculo: Distância * Taxa por KM
                // Cobra no mínimo 1km se for muito perto
                const calculatedFee = Math.max(distanceKm, 1) * (config.TAXA_POR_KM || 1.5);
                
                setDeliveryFee(parseFloat(calculatedFee.toFixed(2)));
            } else {
                alert("Endereço não encontrado no mapa. Verifique se o nome da rua e número estão corretos.");
            }
        } catch (error) {
            console.error("Erro ao calcular frete", error);
            alert("Erro ao conectar com serviço de mapas.");
        } finally {
            setIsCalculating(false);
        }
    };

    const updateCart = (id: number, delta: number) => {
        setCart(prev => {
            const next = Math.max(0, (prev[id] || 0) + delta);
            return { ...prev, [id]: next };
        });
    };

    // Cálculos do carrinho
    const cartTotalCount = Object.values(cart).reduce<number>((sum, qty) => sum + (qty as number), 0);
    const cartTotalPrice = Object.entries(cart).reduce<number>((sum, [id, qty]) => {
        const p = products.find(x => x.id === Number(id));
        return sum + (p ? p.price * (qty as number) : 0);
    }, 0);

    const finalTotal = cartTotalPrice + (isDelivery ? deliveryFee : 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const items = Object.entries(cart).filter(([_, q]) => (q as number) > 0).map(([id, qty]) => ({ id: Number(id), qty: Number(qty) }));
        
        if(items.length === 0) return alert("Carrinho vazio!");

        if (isDelivery) {
            if (!addressStreet.trim() || !addressNumber.trim()) {
                return alert("Por favor, preencha o endereço completo.");
            }
            if (deliveryFee === 0) {
                return alert("Por favor, clique em 'Calcular entrega' antes de finalizar.");
            }
        } else {
            // Validação para Retirada
            if (!pickupTime) {
                return alert("Por favor, selecione um horário de retirada.");
            }
        }

        if (!paymentMethod || paymentMethod === 'Selecione') {
            return alert("Por favor, selecione uma forma de pagamento.");
        }

        try {
            const response = await fetch(`${BURGER_API_URL}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: Date.now(),
                    time: new Date().toISOString(),
                    name: clientName,
                    phone: clientPhone,
                    items,
                    total: cartTotalPrice, // Total dos produtos
                    deliveryFee: isDelivery ? deliveryFee : 0, 
                    status: 'Aguardando',
                    payment: false,
                    paymentMethod: paymentMethod,
                    delivery: isDelivery,
                    // Envia objeto de endereço estruturado se for entrega
                    address: isDelivery ? { 
                        address: addressStreet, 
                        number: addressNumber, 
                        neighborhood: addressNeighborhood 
                    } : null,
                    onclient: true, // Campo obrigatório
                    distancia: isDelivery ? distance : 0,
                    pickupTime: isDelivery ? undefined : pickupTime, // Envia o horário escolhido se for retirada
                    burger: config?.burgerName, // Envia o nome da hamburgueria (propriedade correta)
                    buger: config?.burgerName // Envia com typo para compatibilidade com erro de validação do backend relatado
                })
            });

            const data = await response.json();

            if (!data.success && data.message) {
                throw new Error(data.message);
            }

            alert("Pedido realizado com sucesso!");
            
            // Atualiza a lista de pedidos
            fetchMyOrders(clientPhone);

            setCart({});
            setIsCartOpen(false);
            setAddressStreet('');
            setAddressNumber('');
            setAddressNeighborhood('');
            setDeliveryFee(0);
            setDistance(0);
            setPickupTime('');
            setIsDelivery(false); // Reseta para retirada por padrão
            
            // Abre a lista de pedidos para o cliente ver o status
            setIsOrdersListOpen(true);

        } catch(err) {
            alert(`Erro ao enviar pedido: ${(err as Error).message}`);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Aguardando': return 'text-yellow-400';
            case 'Preparando': return 'text-blue-400';
            case 'Pronto': return 'text-purple-400';
            case 'A caminho': return 'text-purple-400';
            case 'Entregue': return 'text-green-400';
            case 'Cancelado': return 'text-red-400';
            default: return 'text-gray-400';
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 pb-20 font-sans">
            <header className="p-4 bg-gray-800 shadow sticky top-0 z-10 flex justify-between items-center border-b border-gray-700">
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="text-2xl">🍔</span> {config?.burgerName || 'Cardápio'}
                </h1>
                <div className="flex gap-3">
                    <button 
                        onClick={() => { fetchMyOrders(clientPhone); setIsOrdersListOpen(true); }} 
                        className="relative p-2 text-white bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
                        title="Meus Pedidos"
                    >
                        <ClipboardListIcon className="w-6 h-6" />
                    </button>
                    <button 
                        onClick={() => setIsCartOpen(true)} 
                        disabled={cartTotalCount === 0}
                        className={`relative p-2 rounded-full transition-colors ${cartTotalCount === 0 ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50' : 'text-white bg-gray-700 hover:bg-gray-600'}`}
                    >
                        <ShoppingCartIcon className="w-6 h-6" />
                        {cartTotalCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce">{cartTotalCount}</span>}
                    </button>
                </div>
            </header>

            <main className="p-4 space-y-4 max-w-2xl mx-auto">
                {products.map(product => (
                    <div key={product.id} className="bg-gray-800 p-4 rounded-xl flex gap-4 shadow-lg border border-gray-700/50">
                        <img 
                            src={product.image || DEFAULT_BURGER_IMAGE} 
                            className="w-24 h-24 object-cover rounded-lg bg-gray-700 shadow-md flex-shrink-0" 
                            alt={product.name} 
                        />
                        <div className="flex-1 flex flex-col justify-between">
                            <div>
                                <h3 className="font-bold text-white text-lg leading-tight">{product.name}</h3>
                                <p className="text-gray-400 text-sm line-clamp-2 mt-1">{product.description}</p>
                            </div>
                            <div className="flex justify-between items-end mt-3">
                                <span className="text-green-400 font-bold text-lg">R$ {product.price.toFixed(2)}</span>
                                <div className="flex items-center gap-3 bg-gray-900 rounded-lg px-2 py-1 border border-gray-700">
                                    <button onClick={() => updateCart(product.id, -1)} className="text-red-400 font-bold w-8 h-8 flex items-center justify-center hover:bg-gray-800 rounded">-</button>
                                    <span className="text-white w-6 text-center font-bold">{cart[product.id] || 0}</span>
                                    <button onClick={() => updateCart(product.id, 1)} className="text-green-400 font-bold w-8 h-8 flex items-center justify-center hover:bg-gray-800 rounded">+</button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </main>

            {/* Cart Modal */}
            {isCartOpen && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-end sm:items-center justify-center backdrop-blur-sm">
                    <div className="bg-gray-800 w-full max-w-lg p-6 rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-700">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                            <h2 className="text-2xl font-bold text-white">Seu Pedido</h2>
                            <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
                        </div>
                        
                        {Object.keys(cart).length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <ShoppingCartIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>Seu carrinho está vazio.</p>
                            </div>
                        ) : (
                            <ul className="space-y-2 mb-6 bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                                {Object.entries(cart).filter(([_, q]) => (q as number) > 0).map(([id, qty]) => {
                                    const p = products.find(x => x.id === Number(id));
                                    if(!p) return null;
                                    return (
                                        <li key={id} className="flex justify-between text-gray-300 border-b border-gray-700 pb-2 last:border-0 last:pb-0">
                                            <span><span className="font-bold text-white">{Number(qty)}x</span> {p.name}</span>
                                            <span className="font-mono">R$ {(p.price * Number(qty)).toFixed(2)}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                        
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Identificação */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1 ml-1 uppercase">Seu Nome</label>
                                    <input 
                                        type="text" placeholder="Nome" required 
                                        value={clientName} onChange={e => setClientName(e.target.value)}
                                        className="w-full p-3 bg-gray-700 rounded-lg text-white border border-gray-600 focus:border-blue-500 focus:outline-none placeholder-gray-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1 ml-1 uppercase">Seu Telefone</label>
                                    <input 
                                        type="tel" placeholder="(XX) 9XXXX-XXXX" required 
                                        value={clientPhone} onChange={e => setClientPhone(e.target.value)}
                                        className="w-full p-3 bg-gray-700 rounded-lg text-white border border-gray-600 focus:border-blue-500 focus:outline-none placeholder-gray-500"
                                    />
                                </div>
                            </div>

                            {/* Tipo de Entrega / Retirada */}
                            <div>
                                <p className="block text-gray-400 text-sm mb-2 font-medium">Preencha os dados para finalizar o pedido</p>
                                
                                <label className="flex items-center space-x-3 cursor-pointer mb-4 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                                    <input 
                                        type="checkbox" 
                                        checked={isDelivery} 
                                        onChange={(e) => {
                                            setIsDelivery(e.target.value === 'on' || e.target.checked);
                                            if (!e.target.checked) {
                                                setDeliveryFee(0);
                                                setDistance(0);
                                            }
                                        }}
                                        className="w-5 h-5 rounded border-gray-500 bg-gray-600 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-white font-medium">Entrega (se não marcado, será retirada)</span>
                                </label>

                                {!isDelivery && (
                                    <div className="bg-gray-750 p-3 rounded-xl border border-gray-700 space-y-3 animate-fade-in-up">
                                        <label className="block text-gray-400 text-sm mb-2 font-medium">Horário de Retirada (selecione uma opção)</label>
                                        <div className="flex flex-wrap gap-4">
                                            {['15 min', '30 min', '45 min', '60 min'].map((time) => (
                                                <label key={time} className="flex items-center space-x-2 cursor-pointer bg-gray-700 px-3 py-2 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors">
                                                    <input 
                                                        type="radio" 
                                                        name="pickupTime" 
                                                        value={time}
                                                        checked={pickupTime === time}
                                                        onChange={(e) => setPickupTime(e.target.value)}
                                                        className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 focus:ring-blue-500"
                                                    />
                                                    <span className="text-white text-sm">{time}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Endereço Condicional (Design Atualizado) */}
                            {isDelivery && (
                                <div className="bg-gray-750 p-3 rounded-xl border border-gray-700 space-y-3 animate-fade-in-up">
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1 ml-1">Endereço (Ex: Dom Aquino ou Rua Dom Aquino)</label>
                                        <input 
                                            type="text" 
                                            placeholder="Digite o nome da rua" 
                                            required={isDelivery}
                                            value={addressStreet} 
                                            onChange={e => setAddressStreet(e.target.value)}
                                            className="w-full p-3 bg-gray-900 rounded-lg text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="w-1/3">
                                            <label className="block text-xs text-gray-400 mb-1 ml-1">Número</label>
                                            <input 
                                                type="text" 
                                                placeholder="123" 
                                                required={isDelivery}
                                                value={addressNumber} 
                                                onChange={e => setAddressNumber(e.target.value)}
                                                className="w-full p-3 bg-gray-900 rounded-lg text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                                            />
                                        </div>
                                        <div className="w-2/3">
                                            <label className="block text-xs text-gray-400 mb-1 ml-1">Bairro (opcional)</label>
                                            <input 
                                                type="text" 
                                                placeholder="Bairro" 
                                                value={addressNeighborhood} 
                                                onChange={e => setAddressNeighborhood(e.target.value)}
                                                className="w-full p-3 bg-gray-900 rounded-lg text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                    
                                    <button 
                                        type="button"
                                        onClick={handleCalculateDelivery}
                                        disabled={isCalculating}
                                        className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isCalculating ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Calculando...
                                            </>
                                        ) : (
                                            <>
                                                <MapPinIcon className="w-4 h-4" />
                                                Calcular entrega
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {/* Resumo Financeiro */}
                            <div className="bg-gray-900 p-4 rounded-xl space-y-1 border border-gray-700">
                                <div className="flex justify-between text-gray-400 text-sm">
                                    <span>Valor dos Itens:</span>
                                    <span>R$ {cartTotalPrice.toFixed(2)}</span>
                                </div>
                                {isDelivery && (
                                    <div className="flex justify-between text-gray-400 text-sm">
                                        <span>Taxa de Entrega ({distance} km):</span>
                                        <span>R$ {deliveryFee.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-white text-lg font-bold border-t border-gray-700 pt-2 mt-2">
                                    <span>Valor Total:</span>
                                    <span>R$ {finalTotal.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Método de Pagamento */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1 ml-1 uppercase">Pagamento</label>
                                <select 
                                    value={paymentMethod} 
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full p-3 bg-gray-700 rounded-lg text-white border border-gray-600 focus:border-blue-500 focus:outline-none appearance-none"
                                    required
                                >
                                    {config?.PAYMENT_METHODS ? (
                                        config.PAYMENT_METHODS.map((method, idx) => (
                                            <option key={idx} value={method}>{method}</option>
                                        ))
                                    ) : (
                                        <>
                                            <option value="">Carregando...</option>
                                        </>
                                    )}
                                </select>
                            </div>

                            <div className="pt-2">
                                <button 
                                    type="submit" 
                                    disabled={isDelivery && deliveryFee === 0}
                                    className="w-full py-4 text-white bg-blue-600 rounded-lg font-bold text-lg hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-transform active:scale-95 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:shadow-none"
                                >
                                    Enviar Pedido
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* My Orders List Modal */}
            {isOrdersListOpen && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-end sm:items-center justify-center backdrop-blur-sm">
                    <div className="bg-gray-800 w-full max-w-lg p-6 rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-700 flex flex-col h-3/4 sm:h-auto">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                            <h2 className="text-2xl font-bold text-white">Meus Pedidos</h2>
                            <button onClick={() => setIsOrdersListOpen(false)} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {isLoadingOrders ? (
                                <p className="text-center text-gray-400 py-4">Carregando pedidos...</p>
                            ) : myOrders.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <ClipboardListIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>Nenhum pedido encontrado para o telefone informado.</p>
                                </div>
                            ) : (
                                <ul className="space-y-4">
                                    {myOrders.map(order => (
                                        <li key={order.id} className="bg-gray-700 rounded-xl p-4 shadow-md border border-gray-600">
                                            <div 
                                                className="flex justify-between items-start cursor-pointer"
                                                onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                                            >
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold text-white text-lg">#{order.id}</span>
                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-gray-900 border border-gray-600 ${getStatusColor(order.status)}`}>
                                                            {order.status}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-gray-400 flex items-center gap-1">
                                                        <ClockIcon className="w-3 h-3" />
                                                        {new Date(order.time).toLocaleString()}
                                                    </div>
                                                    <div className="text-sm text-gray-300 mt-1">
                                                        {order.delivery ? 'Entrega' : 'Retirada'} • {order.payment ? 'Pago' : 'Pagamento Pendente'}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="font-bold text-green-400 text-lg">
                                                        R$ {(order.total + (order.deliveryFee || 0)).toFixed(2)}
                                                    </span>
                                                    <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform mt-2 ${expandedOrderId === order.id ? 'rotate-180' : ''}`} />
                                                </div>
                                            </div>

                                            {/* Accordion Content (Items) */}
                                            {expandedOrderId === order.id && (
                                                <div className="mt-4 pt-3 border-t border-gray-600 animate-fade-in">
                                                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Itens do Pedido</h4>
                                                    <ul className="space-y-2">
                                                        {order.items.map((item, idx) => {
                                                            const product = products.find(p => p.id === item.id);
                                                            return (
                                                                <li key={idx} className="flex justify-between text-sm">
                                                                    <span className="text-gray-300">
                                                                        <span className="font-bold text-white">{item.qty}x</span> {product?.name || `Item ${item.id}`}
                                                                    </span>
                                                                    <span className="text-gray-400 font-mono">
                                                                        R$ {(product ? product.price * item.qty : 0).toFixed(2)}
                                                                    </span>
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                    {order.delivery && order.address && (
                                                        <div className="mt-3 pt-2 border-t border-gray-600/50">
                                                            <p className="text-xs text-gray-400">Endereço: {order.address.address}, {order.address.number}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BurgerClientOrderPage;
