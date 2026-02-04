import React, { useState, useEffect, useCallback } from 'react';
import { BURGER_API_URL, DEFAULT_BURGER_IMAGE } from '../constants';
import type { BurgerProduct } from '../types';
import { PlusIcon, MinusIcon } from './icons';

interface Table {
    id: number;
    occupied: boolean;
}

interface OrderFormData {
    clientName: string;
    clientPhone: string;
    notes: string;
    isTakeout: boolean;
    paymentMethod: string;
}

const BurgerWaiterPage: React.FC = () => {
    const [tables, setTables] = useState<Table[]>([]);
    const [selectedTable, setSelectedTable] = useState<number | null>(null);
    const [products, setProducts] = useState<BurgerProduct[]>([]);
    const [cart, setCart] = useState<Record<number, number>>({});
    const [config, setConfig] = useState<any>({ TABLE_COUNT: 6, PAYMENT_METHODS: ['Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'PIX'] });

    // Modal States
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<OrderFormData>({
        clientName: '',
        clientPhone: '',
        notes: '',
        isTakeout: false,
        paymentMethod: 'Dinheiro'
    });

    // Initialize
    useEffect(() => {
        // Load config
        fetch(`${BURGER_API_URL}/api/config`)
            .then(res => res.json())
            .then(data => {
                if (data.data) {
                    setConfig(data.data);
                    // Init tables based on config
                    const storedTables = localStorage.getItem('tables');
                    if (storedTables) {
                        setTables(JSON.parse(storedTables));
                    } else {
                        const count = data.data.TABLE_COUNT || 6;
                        setTables(Array.from({ length: count }, (_, i) => ({ id: i + 1, occupied: false })));
                    }
                }
            })
            .catch(console.error);

        // Load Products
        fetch(`${BURGER_API_URL}/api/products/burgers`)
            .then(res => res.json())
            .then(res => setProducts(res.data || []));
            
    }, []);

    const updateCart = (productId: number, delta: number) => {
        setCart(prev => {
            const current = prev[productId] || 0;
            const next = Math.max(0, current + delta);
            return { ...prev, [productId]: next };
        });
    };

    const handleTableClick = (tableId: number) => {
        setSelectedTable(tableId);
        setCart({});
        // Reset form data when opening a new table
        setFormData({
            clientName: '',
            clientPhone: '',
            notes: '',
            isTakeout: false,
            paymentMethod: 'Dinheiro'
        });
    };

    const getCartTotal = () => {
        return Object.entries(cart).reduce((sum, [id, qty]) => {
            const p = products.find(prod => prod.id === parseInt(id));
            return sum + (p ? p.price * (qty as number) : 0);
        }, 0);
    };

    const handleOpenConfirmModal = () => {
        const hasItems = Object.values(cart).some((qty: number) => qty > 0);
        if (!hasItems) {
            alert("Selecione itens para o pedido.");
            return;
        }
        setIsConfirmModalOpen(true);
    };

    const handleFinalizeOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTable) return;
        
        setIsSubmitting(true);

        const items = Object.entries(cart)
            .filter(([_, qty]) => (qty as number) > 0)
            .map(([id, qty]) => ({ id: parseInt(id), qty: qty as number }));

        const total = items.reduce((sum, item) => {
            const p = products.find(prod => prod.id === item.id);
            return sum + (p ? p.price * item.qty : 0);
        }, 0);

        const orderPayload = {
            id: Date.now(),
            time: new Date().toISOString(),
            name: formData.clientName ? `${formData.clientName} (Mesa ${selectedTable})` : `Mesa ${selectedTable}`,
            phone: formData.clientPhone,
            tableNumber: selectedTable.toString(),
            items,
            total,
            status: 'Aguardando', // Vai para a cozinha
            payment: false,
            delivery: false,
            paymentMethod: formData.paymentMethod,
            notes: `${formData.isTakeout ? '[PARA VIAGEM] ' : ''}${formData.notes}`,
            onclient: false // Required by backend to indicate waiter/internal order
        };

        try {
            const res = await fetch(`${BURGER_API_URL}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderPayload)
            });
            
            const responseData = await res.json();

            if (res.ok && responseData.success !== false) {
                // Mark table occupied locally
                const newTables = tables.map(t => t.id === selectedTable ? { ...t, occupied: true } : t);
                setTables(newTables);
                localStorage.setItem('tables', JSON.stringify(newTables));
                
                alert("Pedido enviado para a cozinha!");
                setIsConfirmModalOpen(false);
                setSelectedTable(null);
                setCart({});
            } else {
                throw new Error(responseData.message || 'Falha na API');
            }
        } catch (e) {
            alert(`Erro ao enviar pedido: ${(e as Error).message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (selectedTable) {
        // Product Selection View
        return (
            <div className="p-4 bg-gray-800 rounded-lg min-h-screen relative">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">Mesa {selectedTable}</h2>
                    <button onClick={() => setSelectedTable(null)} className="text-sm text-gray-400 hover:text-white">Voltar</button>
                </div>
                
                <div className="space-y-3 pb-24">
                    {products.map(product => (
                        <div key={product.id} className="flex justify-between items-center bg-gray-700 p-3 rounded shadow border border-gray-600">
                            <div className="flex items-center gap-3">
                                <img src={product.image || DEFAULT_BURGER_IMAGE} className="w-16 h-16 rounded object-cover bg-gray-600" alt={product.name} />
                                <div>
                                    <p className="font-bold text-white">{product.name}</p>
                                    <p className="text-green-400 text-sm">R$ {product.price.toFixed(2)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => updateCart(product.id, -1)} className="p-2 bg-red-600 hover:bg-red-700 rounded text-white transition-colors"><MinusIcon className="w-4 h-4"/></button>
                                <span className="text-white w-6 text-center font-bold">{cart[product.id] || 0}</span>
                                <button onClick={() => updateCart(product.id, 1)} className="p-2 bg-green-600 hover:bg-green-700 rounded text-white transition-colors"><PlusIcon className="w-4 h-4"/></button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900 border-t border-gray-700 md:relative md:bg-transparent md:border-0 z-10">
                    <div className="flex justify-between items-center mb-2 text-white px-1">
                        <span className="text-gray-400">Total estimado:</span>
                        <span className="text-xl font-bold">R$ {getCartTotal().toFixed(2)}</span>
                    </div>
                    <button 
                        onClick={handleOpenConfirmModal}
                        className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-500 transition-colors"
                    >
                        Revisar e Enviar
                    </button>
                </div>

                {/* Modal de Preenchimento do Garçom */}
                {isConfirmModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm px-4">
                        <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden border border-gray-700 animate-fade-in-up max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-white mb-4">Confirmar Pedido</h3>
                                <p className="text-gray-400 text-sm mb-4">
                                    Mesa {selectedTable} • Total: <span className="text-green-400 font-bold">R$ {getCartTotal().toFixed(2)}</span>
                                </p>

                                <form onSubmit={handleFinalizeOrder} className="space-y-4">
                                    <div className="flex items-center mb-4">
                                        <input
                                            type="checkbox"
                                            id="isTakeout"
                                            checked={formData.isTakeout}
                                            onChange={(e) => setFormData({...formData, isTakeout: e.target.checked})}
                                            className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                                        />
                                        <label htmlFor="isTakeout" className="ml-2 text-sm font-medium text-white">
                                            Embalar para viagem
                                        </label>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Nome do Cliente (Opcional)</label>
                                        <input
                                            type="text"
                                            value={formData.clientName}
                                            onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
                                            placeholder="Nome do cliente"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Telefone (Opcional)</label>
                                        <input
                                            type="tel"
                                            value={formData.clientPhone}
                                            onChange={(e) => setFormData({...formData, clientPhone: e.target.value})}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
                                            placeholder="(XX) 9XXXX-XXXX"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Observações</label>
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
                                            placeholder="Ex: Sem cebola, bem passado..."
                                            rows={2}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Forma de Pagamento</label>
                                        <select
                                            value={formData.paymentMethod}
                                            onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                                        >
                                            {config.PAYMENT_METHODS ? (
                                                config.PAYMENT_METHODS.map((method: string, idx: number) => (
                                                    <option key={idx} value={method}>{method}</option>
                                                ))
                                            ) : (
                                                <option value="Dinheiro">Dinheiro</option>
                                            )}
                                        </select>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button 
                                            type="button"
                                            onClick={() => setIsConfirmModalOpen(false)}
                                            disabled={isSubmitting}
                                            className="flex-1 px-4 py-2 bg-gray-600 text-gray-300 font-medium rounded-md hover:bg-gray-500 transition-colors disabled:opacity-50"
                                        >
                                            Cancelar
                                        </button>
                                        <button 
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                            Enviar
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Table Selection View
    return (
        <div className="p-4 bg-gray-800 rounded-lg">
            <h1 className="text-2xl font-bold text-white mb-6">Controle de Mesas</h1>
            <div className="grid grid-cols-3 gap-4">
                {tables.map(table => (
                    <div 
                        key={table.id}
                        onClick={() => handleTableClick(table.id)}
                        className={`aspect-square flex items-center justify-center rounded-lg text-2xl font-bold cursor-pointer transition-transform hover:scale-105 shadow-lg ${table.occupied ? 'bg-red-600 text-white ring-2 ring-red-400' : 'bg-green-600 text-white hover:bg-green-500'}`}
                    >
                        {table.id}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BurgerWaiterPage;