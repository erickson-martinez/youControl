
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Market, ShoppingList, Product } from '../types';
import { PlusIcon, PencilIcon, TrashIcon, ShoppingCartIcon, ChevronLeftIcon } from './icons';
import ConfirmationModal from './ConfirmationModal';
import MarketModal from './MarketModal';
import ShoppingListModal from './ShoppingListModal';
import ProductModal from './ProductModal';

const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
};

// Hook para interagir com o localStorage
const useLocalStorage = <T,>(key: string, initialValue: T): [T, (value: T) => void] => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const setValue = (value: T) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(error);
        }
    };
    return [storedValue, setValue];
};

const ListPurcharsePage: React.FC = () => {
    const [markets, setMarkets] = useLocalStorage<Market[]>('markets', []);
    const [shoppingLists, setShoppingLists] = useLocalStorage<ShoppingList[]>('shoppingLists', []);
    
    const [selectedList, setSelectedList] = useState<ShoppingList | null>(null);

    // Estados dos modais
    const [isMarketModalOpen, setMarketModalOpen] = useState(false);
    const [isListModalOpen, setListModalOpen] = useState(false);
    const [isProductModalOpen, setProductModalOpen] = useState(false);
    const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);

    // Estados para edição e exclusão
    const [editingMarket, setEditingMarket] = useState<Market | null>(null);
    const [editingList, setEditingList] = useState<ShoppingList | null>(null);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [deletingItem, setDeletingItem] = useState<{ type: 'market' | 'list' | 'product', item: any } | null>(null);
    
    const marketMap = useMemo(() => {
        return markets.reduce((acc, market) => {
            acc[market.id] = market.name;
            return acc;
        }, {} as Record<string, string>);
    }, [markets]);

    // Funções de CRUD para Mercados
    const handleSaveMarket = async (marketData: { name: string }) => {
        if (editingMarket) {
            setMarkets(markets.map(m => m.id === editingMarket.id ? { ...m, ...marketData } : m));
        } else {
            setMarkets([...markets, { id: new Date().toISOString(), ...marketData }]);
        }
        setEditingMarket(null);
        setMarketModalOpen(false);
    };

    const handleDeleteMarket = (marketId: string) => {
        setMarkets(markets.filter(m => m.id !== marketId));
        setShoppingLists(shoppingLists.filter(l => l.marketId !== marketId)); // Remove listas associadas
    };

    // Funções de CRUD para Listas de Compras
    const handleSaveList = async (listData: { name: string; marketId: string; date: string }) => {
        if (editingList) {
            setShoppingLists(shoppingLists.map(l => l.id === editingList.id ? { ...l, ...listData } : l));
        } else {
            setShoppingLists([...shoppingLists, { id: new Date().toISOString(), ...listData, products: [] }]);
        }
        setEditingList(null);
        setListModalOpen(false);
    };

    const handleDeleteList = (listId: string) => {
        setShoppingLists(shoppingLists.filter(l => l.id !== listId));
    };

    // Funções de CRUD para Produtos
    const handleSaveProduct = async (productData: { name: string; quantity: number; price: number }) => {
        if (!selectedList) return;
        
        let updatedProducts: Product[];
        if (editingProduct) {
             updatedProducts = selectedList.products.map(p => p.id === editingProduct.id ? { ...p, ...productData } : p);
        } else {
             updatedProducts = [...selectedList.products, { id: new Date().toISOString(), ...productData }];
        }

        const updatedList = { ...selectedList, products: updatedProducts };
        setShoppingLists(shoppingLists.map(l => l.id === selectedList.id ? updatedList : l));
        setSelectedList(updatedList);
        setEditingProduct(null);
        setProductModalOpen(false);
    };
    
    const handleDeleteProduct = (productId: string) => {
        if (!selectedList) return;
        const updatedProducts = selectedList.products.filter(p => p.id !== productId);
        const updatedList = { ...selectedList, products: updatedProducts };

        setShoppingLists(shoppingLists.map(l => l.id === selectedList.id ? updatedList : l));
        setSelectedList(updatedList);
    };
    
    // Funções de controle de modais
    const openConfirmModal = (type: 'market' | 'list' | 'product', item: any) => {
        setDeletingItem({ type, item });
        setConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingItem) return;
        const { type, item } = deletingItem;
        if (type === 'market') handleDeleteMarket(item.id);
        else if (type === 'list') handleDeleteList(item.id);
        else if (type === 'product') handleDeleteProduct(item.id);
        setConfirmModalOpen(false);
        setDeletingItem(null);
    };

    const totalCost = useMemo(() => {
        if (!selectedList) return 0;
        return selectedList.products.reduce((total, product) => total + product.price * product.quantity, 0);
    }, [selectedList]);

    return (
        <>
            {selectedList ? (
                <div className="p-4 bg-gray-800 rounded-lg">
                    <button onClick={() => setSelectedList(null)} className="flex items-center mb-4 text-sm text-blue-400 hover:text-blue-300">
                        <ChevronLeftIcon className="w-5 h-5 mr-1" />
                        Voltar para Listas
                    </button>
                    <div className="flex flex-col justify-between gap-4 mb-6 md:flex-row md:items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-white">{selectedList.name}</h2>
                            <p className="text-gray-400">{marketMap[selectedList.marketId] || 'Mercado desconhecido'} - {formatDate(selectedList.date)}</p>
                        </div>
                        <div className="p-3 text-right bg-gray-700 rounded-lg">
                            <p className="text-sm text-gray-400">Total da Lista</p>
                            <p className="text-xl font-bold text-green-accent">{formatCurrency(totalCost)}</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Produtos</h3>
                        <button onClick={() => { setEditingProduct(null); setProductModalOpen(true); }} className="flex items-center px-3 py-2 text-sm font-semibold text-white transition-colors rounded-lg bg-blue-accent hover:bg-blue-accent/90">
                            <PlusIcon className="w-4 h-4 mr-1" />
                            Adicionar Produto
                        </button>
                    </div>
                    <div className="space-y-3">
                        {selectedList.products.length > 0 ? (
                            selectedList.products.map(product => (
                                <div key={product.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                                    <div>
                                        <p className="font-semibold text-white">{product.name}</p>
                                        <p className="text-sm text-gray-400">{product.quantity} x {formatCurrency(product.price)}</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <p className="font-bold text-white">{formatCurrency(product.quantity * product.price)}</p>
                                        <button onClick={() => { setEditingProduct(product); setProductModalOpen(true); }} className="p-2 text-gray-400 rounded-md hover:bg-gray-600 hover:text-white"><PencilIcon className="w-4 h-4" /></button>
                                        <button onClick={() => openConfirmModal('product', product)} className="p-2 text-gray-400 rounded-md hover:bg-gray-600 hover:text-red-accent"><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500">Nenhum produto na lista.</p>
                        )}
                    </div>
                </div>
            ) : (
                <div className="p-4 bg-gray-800 rounded-lg">
                    <h1 className="mb-6 text-2xl font-bold text-white">Lista de Compras</h1>
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-white">Mercados</h2>
                            <button onClick={() => { setEditingMarket(null); setMarketModalOpen(true); }} className="flex items-center px-3 py-2 text-sm font-semibold text-white transition-colors rounded-lg bg-blue-accent hover:bg-blue-accent/90">
                                <PlusIcon className="w-4 h-4 mr-1" />
                                Adicionar Mercado
                            </button>
                        </div>
                        <div className="space-y-2">
                            {markets.length > 0 ? (
                                markets.map(market => (
                                    <div key={market.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                                        <p className="font-medium text-white">{market.name}</p>
                                        <div className="space-x-2">
                                            <button onClick={() => { setEditingMarket(market); setMarketModalOpen(true); }} className="p-2 text-gray-400 rounded-md hover:bg-gray-600 hover:text-white"><PencilIcon className="w-4 h-4" /></button>
                                            <button onClick={() => openConfirmModal('market', market)} className="p-2 text-gray-400 rounded-md hover:bg-gray-600 hover:text-red-accent"><TrashIcon className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-center text-gray-500">Nenhum mercado cadastrado.</p>
                            )}
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-white">Minhas Listas</h2>
                            <button onClick={() => { setEditingList(null); setListModalOpen(true); }} disabled={markets.length === 0} className="flex items-center px-3 py-2 text-sm font-semibold text-white transition-colors rounded-lg bg-blue-accent hover:bg-blue-accent/90 disabled:bg-gray-600 disabled:cursor-not-allowed">
                                <PlusIcon className="w-4 h-4 mr-1" />
                                Nova Lista de Compras
                            </button>
                        </div>
                        {markets.length === 0 && <p className="mb-4 text-xs text-center text-yellow-accent">É necessário cadastrar um mercado antes de criar uma lista.</p>}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {shoppingLists.length > 0 ? (
                                shoppingLists.map(list => {
                                    const total = list.products.reduce((sum, p) => sum + p.price * p.quantity, 0);
                                    return (
                                    <div key={list.id} className="flex flex-col justify-between p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600" onClick={() => setSelectedList(list)}>
                                        <div>
                                            <h3 className="font-bold text-white">{list.name}</h3>
                                            <p className="text-sm text-blue-300">{marketMap[list.marketId] || 'Mercado desconhecido'}</p>
                                            <p className="text-xs text-gray-400">{formatDate(list.date)}</p>
                                        </div>
                                        <div className="flex items-end justify-between mt-4">
                                            <div>
                                                <p className="text-sm font-bold text-green-accent">{formatCurrency(total)}</p>
                                            </div>
                                            <div className="flex space-x-1">
                                                <button onClick={(e) => { e.stopPropagation(); setEditingList(list); setListModalOpen(true); }} className="p-2 text-gray-400 rounded-md hover:bg-gray-800 hover:text-white"><PencilIcon className="w-4 h-4" /></button>
                                                <button onClick={(e) => { e.stopPropagation(); openConfirmModal('list', list); }} className="p-2 text-gray-400 rounded-md hover:bg-gray-800 hover:text-red-accent"><TrashIcon className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    </div>
                                )})
                            ) : (
                                <p className="text-sm text-center text-gray-500 md:col-span-3">Nenhuma lista de compras criada.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modais */}
            <MarketModal isOpen={isMarketModalOpen} onClose={() => setMarketModalOpen(false)} onSave={handleSaveMarket} marketToEdit={editingMarket} />
            <ShoppingListModal isOpen={isListModalOpen} onClose={() => setListModalOpen(false)} onSave={handleSaveList} listToEdit={editingList} markets={markets} />
            <ProductModal isOpen={isProductModalOpen} onClose={() => setProductModalOpen(false)} onSave={handleSaveProduct} productToEdit={editingProduct} />
            <ConfirmationModal 
                isOpen={isConfirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title={`Confirmar Exclusão`}
                message={`Tem certeza que deseja excluir "${deletingItem?.item.name}"? Esta ação não pode ser desfeita.`}
            />
        </>
    );
};

export default ListPurcharsePage;
