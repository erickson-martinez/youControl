import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Market, ShoppingList, Product, User, SharedUser } from '../types';
import { PlusIcon, PencilIcon, TrashIcon, ChevronDownIcon, ShoppingCartIcon, CheckCircleIcon, ShareIcon } from './icons';
import ConfirmationModal from './ConfirmationModal';
import MarketModal from './MarketModal';
import ShoppingListModal from './ShoppingListModal';
import ProductModal from './ProductModal';
import ShareModal from './ShareModal';
import CompleteListModal from './CompleteListModal';
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
    const [isCompleteModalOpen, setCompleteModalOpen] = useState(false);

    // Edição / Seleção
    const [editingMarket, setEditingMarket] = useState<Market | null>(null);
    const [editingList, setEditingList] = useState<ShoppingList | null>(null);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [selectedListForProduct, setSelectedListForProduct] = useState<ShoppingList | null>(null);
    const [listToShare, setListToShare] = useState<ShoppingList | null>(null);
    const [listToComplete, setListToComplete] = useState<ShoppingList | null>(null);
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
    const handleSaveList = async (listData: { name: string; marketId: string; date: string; latitude?: number | null; longitude?: number | null }) => {
        try {
            const payload = {
                ...listData,
                idUser: user.id,
                products: [], // New lists start empty
                completed: false,
                createdAt: new Date().toISOString() // Or backend handles it
            };

            let createdList: ShoppingList | null = null;

            if (editingList) {
                alert("Edição de cabeçalho de lista ainda não implementada na API de exemplo.");
                return;
            } else {
                // Captura a resposta para obter a lista criada
                const response = await apiFetch(`${API_BASE_URL}/shopping-lists`, { method: 'POST', body: JSON.stringify(payload) });
                const data = await response.json();
                
                // Mapeia o retorno para o objeto ShoppingList
                const rawList = data.shoppingList || data.list || data;
                if (rawList && (rawList._id || rawList.id)) {
                    createdList = {
                        ...rawList,
                        id: rawList._id || rawList.id,
                        products: rawList.products || [],
                        total: 0
                    };
                }
            }
            
            await fetchData();
            setListModalOpen(false);
            setEditingList(null);

            // Se uma nova lista foi criada, abre o modal de produto imediatamente
            if (createdList) {
                setSelectedListForProduct(createdList);
                setEditingProduct(null);
                // Pequeno delay para garantir transição suave de UI
                setTimeout(() => setProductModalOpen(true), 100);
            }

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
    
    // Inicia o processo de conclusão ou reabertura
    const handleToggleListCompleteClick = (list: ShoppingList) => {
        // VALIDAÇÃO: Não permite concluir se a lista não tiver produtos
        if (!list.completed && (!list.products || list.products.length === 0)) {
            alert("Não é possível concluir uma lista sem produtos. Adicione itens antes de finalizar.");
            return;
        }

        if (list.completed) {
            // Se já está completa, apenas reabre (sem gerar despesa negativa)
            updateListStatus(list, false);
        } else {
            // Se vai concluir, abre o modal para gerar despesa
            setListToComplete(list);
            setCompleteModalOpen(true);
        }
    };

    const updateListStatus = async (list: ShoppingList, status: boolean) => {
        if (!user.id) return;
        try {
            await apiFetch(`${API_BASE_URL}/shopping-lists/${list.id}/complete`, {
                method: 'PUT',
                body: JSON.stringify({
                    idUser: user.id,
                    completed: status
                })
            });
            await fetchData();
        } catch (e) {
            alert(`Erro ao atualizar status: ${(e as Error).message}`);
        }
    };

    // Callback do Modal de Conclusão
    const handleConfirmCompleteList = async (financialData: any) => {
        if (!listToComplete) return;

        try {
            // 1. Criar a Transação Financeira (SE NÃO FOR SKIPPED)
            if (!financialData.skipTransaction) {
                if (financialData.mode === 'new') {
                    await apiFetch(`${API_BASE_URL}/transactions/simple`, {
                        method: 'POST',
                        body: JSON.stringify(financialData.data)
                    });
                } else {
                    // Adicionar a existente
                    const { transactionId, ...addValueData } = financialData.data;
                    await apiFetch(`${API_BASE_URL}/transactions/${transactionId}/add-value`, {
                        method: 'PATCH',
                        body: JSON.stringify(addValueData)
                    });
                }
            }

            // 2. Marcar a lista como concluída
            await updateListStatus(listToComplete, true);
            setListToComplete(null);
            
        } catch (e) {
            throw e; // O modal vai capturar e mostrar o alerta
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
            const productPayload = {
                name: productData.name,
                brand: productData.brand,
                type: productData.type,
                quantity: productData.quantity,
                packQuantity: productData.packQuantity,
                value: productData.value,
                total: productData.total,
                _id: undefined as string | undefined
            };

            // Se for edição, anexa o ID do produto
            if (editingProduct) {
                productPayload._id = editingProduct._id || String(editingProduct.id);
            }

            const payload = {
                idUser: user.id,
                listId: selectedListForProduct.id,
                product: productPayload
            };

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

    const handleDeleteProduct = async (product: Product, listId: string) => {
         if (!user.id) return;
         try {
            await apiFetch(`${API_BASE_URL}/shopping-lists/${listId}/products`, {
                method: 'DELETE',
                body: JSON.stringify({
                    idUser: user.id,
                    productId: product._id || product.id
                })
            });
            await fetchData();
         } catch (e) {
             alert(`Erro ao remover produto: ${(e as Error).message}`);
         }
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
        else if (type === 'product') {
            // Para produto, o 'item' foi enriquecido com 'parentListId' antes de abrir o modal
            await handleDeleteProduct(item, item.parentListId);
        }
        
        setConfirmModalOpen(false);
        setDeletingItem(null);
    };

    const toggleList = (listId: string) => {
        setExpandedListId(expandedListId === listId ? null : listId);
    };

    const handleEditProductClick = (list: ShoppingList, product: Product) => {
        setSelectedListForProduct(list);
        setEditingProduct(product);
        setProductModalOpen(true);
    };

    const handleDeleteProductClick = (list: ShoppingList, product: Product) => {
        // Passamos o ID da lista junto com o produto para o estado de deleção
        openConfirmModal('product', { ...product, parentListId: list.id });
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
                                <div key={list.id} className="bg-gray-700 rounded-lg overflow-hidden">
                                    {/* Header */}
                                    <div 
                                        className="p-3 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-gray-600 transition-colors"
                                        onClick={() => toggleList(list.id || '')}
                                    >
                                        <div className="flex-1 flex items-center gap-2 sm:gap-3 min-w-0">
                                            {/* CHECKBOX DE CONCLUSÃO (Substituindo o antigo botão CheckCircle) */}
                                            <label
                                                onClick={(e) => e.stopPropagation()} 
                                                className="flex items-center space-x-1 sm:space-x-2 cursor-pointer z-10 flex-shrink-0"
                                                title={isCompleted ? "Reabrir lista" : "Concluir lista e gerar despesa"}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isCompleted}
                                                    onChange={() => handleToggleListCompleteClick(list)}
                                                    className="w-4 h-4 sm:w-5 sm:h-5 text-green-accent bg-gray-600 border-gray-500 rounded focus:ring-green-accent focus:ring-offset-gray-800"
                                                />
                                                <span className={`text-xs sm:text-sm font-medium ${isCompleted ? 'text-gray-400' : 'text-gray-300'}`}>Concluir</span>
                                            </label>

                                            <h3 className={`font-bold text-base sm:text-lg border-l border-gray-600 pl-2 sm:pl-3 ml-1 truncate ${isCompleted ? 'text-green-accent opacity-70' : 'text-white'}`}>
                                                {list.name}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-2 sm:gap-4 ml-2 flex-shrink-0">
                                            <span className={`font-bold text-sm sm:text-base whitespace-nowrap ${isCompleted ? 'text-gray-400' : 'text-white'}`}>
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
                                                    onClick={() => {
                                                        if (isCompleted) {
                                                            alert("Listas concluídas não podem ser excluídas.");
                                                            return;
                                                        }
                                                        openConfirmModal('list', list);
                                                    }} 
                                                    className={`p-1 rounded-md transition-colors ${isCompleted ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-red-accent'}`}
                                                    title={isCompleted ? "Listas concluídas não podem ser excluídas" : "Excluir Lista"}
                                                    disabled={isCompleted}
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
                                                        <li key={product._id || idx} className="flex justify-between items-center py-2 border-b border-gray-600 last:border-0 group">
                                                            <div 
                                                                className="flex-1 cursor-pointer min-w-0 pr-2"
                                                                onClick={() => handleEditProductClick(list, product)}
                                                                title="Ver detalhes / Editar"
                                                            >
                                                                <p className="text-white font-medium truncate">{product.name} {product.brand ? `- ${product.brand}` : ''}</p>
                                                                <p className="text-sm text-gray-400 truncate">
                                                                    {product.quantity} {product.type || 'un'} x {formatCurrency(product.value)}
                                                                    {product.packQuantity ? ` (Pct: ${product.packQuantity})` : ''}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                                                                <p className="text-white font-bold whitespace-nowrap">{formatCurrency(product.total || 0)}</p>
                                                                
                                                                {/* Botões de Ação do Produto (Sempre visíveis se não concluído) */}
                                                                {!isCompleted && (
                                                                    <div className="flex items-center gap-1 sm:gap-2 pl-1 sm:pl-2">
                                                                        <button 
                                                                            onClick={(e) => { e.stopPropagation(); handleEditProductClick(list, product); }}
                                                                            className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded-md transition-colors"
                                                                            title="Editar Produto"
                                                                        >
                                                                            <PencilIcon className="w-4 h-4" />
                                                                        </button>
                                                                        <button 
                                                                            onClick={(e) => { e.stopPropagation(); handleDeleteProductClick(list, product); }}
                                                                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-md transition-colors"
                                                                            title="Excluir Produto"
                                                                        >
                                                                            <TrashIcon className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                )}
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

            <CompleteListModal 
                isOpen={isCompleteModalOpen}
                onClose={() => { setCompleteModalOpen(false); setListToComplete(null); }}
                onConfirm={handleConfirmCompleteList}
                listName={listToComplete?.name || ''}
                totalAmount={listToComplete?.total || 0}
                userPhone={user.phone}
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