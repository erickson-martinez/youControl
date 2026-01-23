
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Market, ShoppingList, Product, User, SharedUser } from '../types';
import { PlusIcon, PencilIcon, TrashIcon, ChevronDownIcon, ShoppingCartIcon, CheckCircleIcon, ShareIcon } from './icons';
import ConfirmationModal from './ConfirmationModal';
import MarketModal from './MarketModal';
import ShoppingListModal from './ShoppingListModal';
import ProductModal from './ProductModal';
import ShareModal from './ShareModal';
import { API_BASE_URL } from '../constants';

const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

interface ListPurcharsePageProps {
    user: User;
}

const ListPurcharsePage: React.FC<ListPurcharsePageProps> = ({ user }) => {
    const [markets, setMarkets] = useState<Market[]>([]);
    const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
    
    // UI States
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedListId, setExpandedListId] = useState<string | null>(null);

    // Modais
    const [isMarketModalOpen, setMarketModalOpen] = useState(false);
    const [isListModalOpen, setListModalOpen] = useState(false);
    const [isProductModalOpen, setProductModalOpen] = useState(false);
    const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
    const [isShareModalOpen, setShareModalOpen] = useState(false);

    // Edição / Seleção
    const [editingMarket, setEditingMarket] = useState<Market | null>(null);
    const [editingList, setEditingList] = useState<ShoppingList | null>(null);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [selectedListForProduct, setSelectedListForProduct] = useState<ShoppingList | null>(null);
    const [listToShare, setListToShare] = useState<ShoppingList | null>(null);
    const [deletingItem, setDeletingItem] = useState<{ type: 'market' | 'list' | 'product', item: any } | null>(null);

    // --- API Helpers ---
    const apiFetch = useCallback(async (url: string, options: RequestInit = {}) => {
        const response = await fetch(url, {
            ...options,
            cache: 'no-store',
            headers: { 'Content-Type': 'application/json', ...options.headers },
        });
        if (!response.ok) {
            const errorJson = await response.json().catch(() => ({}));
            const message = errorJson.error || errorJson.message || `Erro do servidor (HTTP ${response.status}).`;
            throw new Error(message);
        }
        return response;
    }, []);

    // --- Fetch Data ---
    const fetchData = useCallback(async () => {
        if (!user.id) {
            setError("ID do usuário não encontrado. Por favor, faça login novamente.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            // Fetch Markets
            const marketsRes = await apiFetch(`${API_BASE_URL}/markets`);
            const marketsData = await marketsRes.json();
            const mappedMarkets = (marketsData || []).map((m: any) => ({ ...m, id: m._id }));
            setMarkets(mappedMarkets);

            // Fetch Shopping Lists
            const listsRes = await apiFetch(`${API_BASE_URL}/shopping-lists/${user.id}`);
            const listsData = await listsRes.json();
            // Map lists and calculate totals
            const mappedLists = (listsData || []).map((list: any) => {
                const products = (list.products || []).map((p: any) => ({
                    ...p,
                    id: p._id,
                    // Garante que value e quantity são números
                    value: Number(p.value || 0),
                    quantity: Number(p.quantity || 0),
                    total: Number(p.total || (Number(p.value || 0) * Number(p.quantity || 0)))
                }));
                
                const total = products.reduce((sum: number, p: Product) => sum + (p.total || 0), 0);

                return {
                    ...list,
                    id: list._id,
                    products,
                    total
                };
            });
            setShoppingLists(mappedLists);

        } catch (err) {
            console.error(err);
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, [apiFetch, user.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Handlers: Markets ---
    const handleSaveMarket = async (marketData: { name: string }) => {
        try {
            if (editingMarket) {
                await apiFetch(`${API_BASE_URL}/markets/${editingMarket.id}`, { method: 'PATCH', body: JSON.stringify({ ...marketData, phone: user.phone }) });
            } else {
                await apiFetch(`${API_BASE_URL}/markets`, { method: 'POST', body: JSON.stringify({ ...marketData, phone: user.phone }) });
            }
            await fetchData();
            setMarketModalOpen(false);
            setEditingMarket(null);
        } catch (e) { alert((e as Error).message); }
    };

    const handleDeleteMarket = async (id: string) => {
        try {
            await apiFetch(`${API_BASE_URL}/markets?id=${id}&phone=${user.phone}`, { method: 'DELETE' });
            await fetchData();
        } catch (e) { alert((e as Error).message); }
    };

    // --- Handlers: Lists ---
    const handleSaveList = async (listData: { name: string; marketId: string; date: string }) => {
        try {
            const payload = {
                ...listData,
                idUser: user.id,
                products: [], // New lists start empty
                completed: false,
                createdAt: new Date().toISOString() // Or backend handles it
            };

            if (editingList) {
                alert("Edição de cabeçalho de lista ainda não implementada na API de exemplo.");
            } else {
                await apiFetch(`${API_BASE_URL}/shopping-lists`, { method: 'POST', body: JSON.stringify(payload) });
            }
            await fetchData();
            setListModalOpen(false);
            setEditingList(null);
        } catch (e) { alert((e as Error).message); }
    };

    const handleDeleteList = async (id: string) => {
        try {
             await apiFetch(`${API_BASE_URL}/shopping-lists/${id}`, { method: 'DELETE' });
             await fetchData();
        } catch(e) {
             console.error(e);
             alert("Erro ao excluir lista.");
        }
    };
    
    const handleToggleListComplete = async (list: ShoppingList) => {
        if (!user.id) return;
        try {
            const newStatus = !list.completed;
            await apiFetch(`${API_BASE_URL}/shopping-lists/${list.id}/complete`, {
                method: 'PUT',
                body: JSON.stringify({
                    idUser: user.id,
                    completed: newStatus
                })
            });
            await fetchData();
        } catch (e) {
            alert(`Erro ao atualizar status: ${(e as Error).message}`);
        }
    };

    const handleShareList = async (sharedUser: SharedUser) => {
        if (!listToShare || !user.id) return;
        try {
            await apiFetch(`${API_BASE_URL}/shopping-lists/${listToShare.id}/share`, {
                method: 'POST',
                body: JSON.stringify({
                    idUser: user.id,
                    sharedWithPhone: sharedUser.phone
                })
            });
            alert(`Lista compartilhada com sucesso com ${sharedUser.phone}!`);
            setListToShare(null);
            setShareModalOpen(false);
        } catch (e) {
            throw e; // Modal will catch and alert
        }
    };

    // --- Handlers: Products ---
    const handleSaveProduct = async (productData: Omit<Product, 'id' | '_id'>) => {
        if (!selectedListForProduct || !user.id) return;
        
        try {
            const payload = {
                idUser: user.id,
                listId: selectedListForProduct.id,
                product: {
                    name: productData.name,
                    brand: productData.brand,
                    type: productData.type,
                    quantity: productData.quantity,
                    packQuantity: productData.packQuantity,
                    value: productData.value,
                    total: productData.total
                }
            };

            if (editingProduct) {
                alert("Edição de item existente requer implementação de endpoint específico.");
                return;
            }

            await apiFetch(`${API_BASE_URL}/shopping-lists/${selectedListForProduct.id}/products`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });

            await fetchData();
            setProductModalOpen(false);
            setEditingProduct(null);
        } catch (e) {
            alert(`Erro ao salvar produto: ${(e as Error).message}`);
        }
    };

    const handleDeleteProduct = (product: Product) => {
         alert("Remoção de produto requer endpoint específico.");
    };

    // --- Modal Controls ---
    const openConfirmModal = (type: 'market' | 'list' | 'product', item: any) => {
        setDeletingItem({ type, item });
        setConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingItem) return;
        const { type, item } = deletingItem;
        if (type === 'market') await handleDeleteMarket(item.id);
        else if (type === 'list') await handleDeleteList(item.id);
        else if (type === 'product') handleDeleteProduct(item);
        
        setConfirmModalOpen(false);
        setDeletingItem(null);
    };

    const toggleList = (listId: string) => {
        setExpandedListId(expandedListId === listId ? null : listId);
    };

    return (
        <div className="p-4 bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-white">Lista de Compras</h1>
                <button 
                    onClick={() => { setEditingList(null); setListModalOpen(true); }}
                    className="flex items-center px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-blue-accent hover:bg-blue-accent/90"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Cadastrar Lista
                </button>
            </div>

            {isLoading ? (
                <p className="text-center text-gray-400">Carregando listas...</p>
            ) : error ? (
                <p className="text-center text-red-accent">Erro: {error}</p>
            ) : (
                <div className="space-y-4">
                    {/* Lista de Compras Accordion */}
                    <div className="space-y-2">
                        {shoppingLists.length > 0 ? shoppingLists.map(list => {
                            const isExpanded = expandedListId === list.id;
                            const isCompleted = list.completed;
                            return (
                                <div key={list.id} className={`bg-gray-700 rounded-lg overflow-hidden border-l-4 ${isCompleted ? 'border-green-accent' : 'border-transparent'}`}>
                                    {/* Header */}
                                    <div 
                                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-600 transition-colors"
                                        onClick={() => toggleList(list.id || '')}
                                    >
                                        <div className="flex-1 flex items-center gap-3">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleToggleListComplete(list); }}
                                                className={`p-1 rounded-full hover:bg-gray-500 transition-colors ${isCompleted ? 'text-green-accent' : 'text-gray-400'}`}
                                                title={isCompleted ? "Reabrir lista" : "Concluir lista"}
                                            >
                                                <CheckCircleIcon className="w-6 h-6" />
                                            </button>
                                            <h3 className={`font-bold text-lg ${isCompleted ? 'text-green-accent line-through opacity-70' : 'text-white'}`}>
                                                {list.name}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-3 sm:gap-4">
                                            <span className={`font-bold whitespace-nowrap ${isCompleted ? 'text-gray-400' : 'text-white'}`}>
                                                {formatCurrency(list.total || 0)}
                                            </span>
                                            
                                            {/* Actions Menu (Prevent accordion toggle) */}
                                            <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                                                <button 
                                                    onClick={() => { setListToShare(list); setShareModalOpen(true); }} 
                                                    className="p-1 text-gray-400 hover:text-blue-accent rounded-md transition-colors"
                                                    title="Compartilhar Lista"
                                                >
                                                    <ShareIcon className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => openConfirmModal('list', list)} 
                                                    className="p-1 text-gray-400 hover:text-red-accent rounded-md transition-colors"
                                                    title="Excluir Lista"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                            
                                            <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                        </div>
                                    </div>

                                    {/* Body (Products) */}
                                    {isExpanded && (
                                        <div className="p-4 bg-gray-750 border-t border-gray-600">
                                            {list.products.length > 0 ? (
                                                <ul className="space-y-2">
                                                    {list.products.map((product, idx) => (
                                                        <li key={product._id || idx} className="flex justify-between items-center py-2 border-b border-gray-600 last:border-0">
                                                            <div>
                                                                <p className="text-white font-medium">{product.name} {product.brand ? `- ${product.brand}` : ''}</p>
                                                                <p className="text-sm text-gray-400">
                                                                    {product.quantity} {product.type || 'un'} x {formatCurrency(product.value)}
                                                                    {product.packQuantity ? ` (Pct: ${product.packQuantity})` : ''}
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-white font-bold">{formatCurrency(product.total || 0)}</p>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-center text-gray-500 py-2">Nenhum produto nesta lista.</p>
                                            )}
                                            
                                            {!isCompleted && (
                                                <div className="mt-4 flex justify-end">
                                                    <button 
                                                        onClick={() => { setSelectedListForProduct(list); setEditingProduct(null); setProductModalOpen(true); }}
                                                        className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center"
                                                    >
                                                        <PlusIcon className="w-4 h-4 mr-1" /> Adicionar Produto
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        }) : (
                            <div className="p-8 text-center bg-gray-700 rounded-lg">
                                <p className="text-gray-400">Nenhuma lista de compras encontrada.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modais */}
            <MarketModal isOpen={isMarketModalOpen} onClose={() => setMarketModalOpen(false)} onSave={handleSaveMarket} marketToEdit={editingMarket} />
            <ShoppingListModal isOpen={isListModalOpen} onClose={() => setListModalOpen(false)} onSave={handleSaveList} listToEdit={editingList} markets={markets} />
            <ProductModal isOpen={isProductModalOpen} onClose={() => setProductModalOpen(false)} onSave={handleSaveProduct} productToEdit={editingProduct} />
            
            <ShareModal 
                isOpen={isShareModalOpen} 
                onClose={() => { setShareModalOpen(false); setListToShare(null); }} 
                onShare={handleShareList}
                showAggregate={false}
            />

            <ConfirmationModal 
                isOpen={isConfirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title={`Confirmar Exclusão`}
                message={`Tem certeza que deseja excluir "${deletingItem?.item.name}"? Esta ação não pode ser desfeita.`}
            />
        </div>
    );
};

export default ListPurcharsePage;
