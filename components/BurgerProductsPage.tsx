
import React, { useState, useEffect, useCallback } from 'react';
import type { BurgerProduct, User } from '../types';
import { BURGER_API_URL, DEFAULT_BURGER_IMAGE } from '../constants';
import { PlusIcon, PencilIcon, TrashIcon, LockClosedIcon } from './icons';

interface BurgerProductsPageProps {
    user: User;
}

const BurgerProductsPage: React.FC<BurgerProductsPageProps> = ({ user }) => {
    const [products, setProducts] = useState<BurgerProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isOwner, setIsOwner] = useState(false);
    const [checkingOwner, setCheckingOwner] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<BurgerProduct | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Form states
    const [formData, setFormData] = useState({
        image: '',
        name: '',
        price: '',
        description: ''
    });

    useEffect(() => {
        const checkOwnership = async () => {
            try {
                const res = await fetch(`${BURGER_API_URL}/api/config`);
                const data = await res.json();
                const config = data.data || data; // Handle {data: ...} or direct object
                
                if (config && config.phone === user.phone) {
                    setIsOwner(true);
                    fetchProducts();
                } else {
                    setIsOwner(false);
                    setIsLoading(false);
                }
            } catch (err) {
                console.error("Erro ao verificar proprietário", err);
                setIsOwner(false);
                setIsLoading(false);
            } finally {
                setCheckingOwner(false);
            }
        };
        checkOwnership();
    }, [user.phone]);

    const fetchProducts = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${BURGER_API_URL}/api/products/burgers`);
            if (!response.ok) throw new Error('Erro ao carregar produtos');
            const result = await response.json();
            setProducts(result.data || []);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleOpenModal = (product: BurgerProduct | null = null) => {
        setEditingProduct(product);
        if (product) {
            setFormData({
                image: product.image || '',
                name: product.name,
                price: product.price.toString(),
                description: product.description || ''
            });
        } else {
            setFormData({ image: '', name: '', price: '', description: '' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                name: formData.name,
                price: parseFloat(formData.price),
                description: formData.description,
                image: formData.image,
                status: editingProduct ? editingProduct.status : 'Ativo'
            };

            let response;
            if (editingProduct) {
                response = await fetch(`${BURGER_API_URL}/api/products/burgers/${editingProduct.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                // Obter próximo ID (lógica simplificada, idealmente o backend gera)
                const nextId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
                response = await fetch(`${BURGER_API_URL}/api/products/burgers`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...payload, id: nextId })
                });
            }

            if (!response.ok) throw new Error('Erro ao salvar produto');
            await fetchProducts();
            handleCloseModal();
        } catch (err) {
            alert(`Erro: ${(err as Error).message}`);
        }
    };

    const toggleStatus = async (id: number, currentStatus: string) => {
        try {
            const newStatus = currentStatus === 'Ativo' ? 'Inativo' : 'Ativo';
            await fetch(`${BURGER_API_URL}/api/products/burgers/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            await fetchProducts();
        } catch (err) {
            alert('Erro ao atualizar status');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir?')) return;
        try {
            await fetch(`${BURGER_API_URL}/api/products/burgers/${id}`, {
                method: 'DELETE'
            });
            await fetchProducts();
        } catch (err) {
            alert('Erro ao excluir');
        }
    };

    if (checkingOwner) {
        return (
            <div className="p-8 text-center bg-gray-800 rounded-lg">
                <p className="text-gray-400">Verificando permissões...</p>
            </div>
        );
    }

    if (!isOwner) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-gray-800 rounded-lg text-center">
                <LockClosedIcon className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Acesso Restrito</h2>
                <p className="text-gray-400">Apenas o proprietário registrado pode gerenciar os produtos.</p>
            </div>
        );
    }

    return (
        <div className="p-4 bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-white">Gestão de Produtos (Lanchonete)</h1>
                <button 
                    onClick={() => handleOpenModal()}
                    className="flex items-center px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-blue-accent hover:bg-blue-accent/90"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Novo Produto
                </button>
            </div>

            {isLoading ? <p className="text-gray-400">Carregando...</p> : error ? <p className="text-red-500">{error}</p> : (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                            <tr>
                                <th className="px-4 py-3">Imagem</th>
                                <th className="px-4 py-3">Nome</th>
                                <th className="px-4 py-3">Valor</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(product => (
                                <tr key={product.id} className="bg-gray-800 border-b border-gray-700">
                                    <td className="px-4 py-3">
                                        <img src={product.image || DEFAULT_BURGER_IMAGE} alt={product.name} className="w-10 h-10 object-cover rounded" />
                                    </td>
                                    <td className="px-4 py-3 font-medium text-white">{product.name}</td>
                                    <td className="px-4 py-3">R$ {product.price.toFixed(2)}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 text-xs rounded-full ${product.status === 'Ativo' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                                            {product.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => toggleStatus(product.id, product.status)} className="text-blue-400 hover:text-blue-300 text-xs mr-2">
                                                {product.status === 'Ativo' ? 'Desativar' : 'Ativar'}
                                            </button>
                                            <button onClick={() => handleOpenModal(product)} className="text-gray-400 hover:text-white">
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(product.id)} className="text-red-400 hover:text-red-300">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
                    <div className="w-full max-w-md p-6 bg-gray-800 rounded-lg shadow-xl">
                        <h2 className="text-xl font-bold text-white mb-4">{editingProduct ? 'Editar' : 'Criar'} Produto</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">Nome</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">Preço</label>
                                <input type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">URL da Imagem</label>
                                <input type="text" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">Descrição</label>
                                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600" rows={3} />
                            </div>
                            <div className="flex justify-end pt-4 space-x-3">
                                <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-gray-300 hover:text-white">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BurgerProductsPage;
