
import React, { useState, useEffect, useRef } from 'react';
import type { Product } from '../types';
import { API_BASE_URL } from '../constants';

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<Product, 'id' | '_id'>) => Promise<void>;
    productToEdit: Product | null;
}

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSave, productToEdit }) => {
    // Campos do formulário
    const [name, setName] = useState('');
    const [brand, setBrand] = useState('');
    const [type, setType] = useState('');
    const [quantity, setQuantity] = useState('');
    const [packQuantity, setPackQuantity] = useState('');
    const [price, setPrice] = useState(''); // Valor Unitário
    const [total, setTotal] = useState('');

    // Estados de controle e busca
    const [isSaving, setIsSaving] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchTimeoutRef = useRef<number | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    // Tipos de produto disponíveis
    const productTypes = ['unidade', 'pacote', 'quilo', 'grama', 'caixa', 'litro', 'metro'];

    useEffect(() => {
        if (isOpen) {
            if (productToEdit) {
                setName(productToEdit.name);
                setBrand(productToEdit.brand || '');
                setType(productToEdit.type || 'unidade');
                setQuantity(String(productToEdit.quantity));
                setPackQuantity(productToEdit.packQuantity ? String(productToEdit.packQuantity) : '');
                setPrice(String(productToEdit.value));
                setTotal(String(productToEdit.total || (productToEdit.value * productToEdit.quantity)));
            } else {
                resetForm();
            }
        }
    }, [productToEdit, isOpen]);

    const resetForm = () => {
        setName('');
        setBrand('');
        setType('');
        setQuantity('');
        setPackQuantity('');
        setPrice('');
        setTotal('');
        setSuggestions([]);
        setShowSuggestions(false);
    };

    // Cálculo automático do total
    useEffect(() => {
        const qty = parseFloat(quantity) || 0;
        const val = parseFloat(price) || 0;
        const calcTotal = qty * val;
        // Atualiza o total visualmente apenas se os valores forem válidos e positivos
        if (!isNaN(calcTotal) && calcTotal >= 0) {
            setTotal(calcTotal.toFixed(2));
        }
    }, [quantity, price]);

    // Lógica de Busca (Debounce)
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setName(val);
        setShowSuggestions(true);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (val.length > 1) {
            searchTimeoutRef.current = window.setTimeout(async () => {
                try {
                    // Endpoint GET para buscar preço/produto existente
                    const response = await fetch(`${API_BASE_URL}/product-price/${encodeURIComponent(val)}/1`);
                    if (response.ok) {
                        const data = await response.json();
                        // A API retorna um array de objetos conforme o exemplo
                        const results = Array.isArray(data) ? data : (data ? [data] : []);
                        setSuggestions(results);
                    } else {
                        setSuggestions([]);
                    }
                } catch (error) {
                    console.error("Erro ao buscar produto", error);
                    setSuggestions([]);
                }
            }, 500);
        } else {
            setSuggestions([]);
        }
    };

    const handleSelectSuggestion = (product: any) => {
        // Mapeia os campos retornados pela API (exemplo fornecido)
        // product = { productName: "Arroz", brand: "Dallas", currentPrice: 13.59, type: "pacote", ... }
        setName(product.productName || product.name);
        setBrand(product.brand || '');
        if (product.type) setType(product.type);
        
        // Preenche o preço se disponível
        if (product.currentPrice !== undefined) {
            setPrice(String(product.currentPrice));
        } else if (product.price !== undefined) {
            setPrice(String(product.price));
        } else if (product.value !== undefined) {
            setPrice(String(product.value));
        }
        
        setShowSuggestions(false);
    };

    const handleCreateNew = () => {
        setShowSuggestions(false);
    };

    // Fecha sugestões ao clicar fora (opcional, mas bom para UX)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
               // setShowSuggestions(false); // Pode conflitar com o clique no item, deixando o onBlur/onClick lidar
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validação Apenas Nome Obrigatório
        if (!name.trim()) {
            alert('Por favor, preencha o nome do produto.');
            return;
        }

        // Default values para campos opcionais
        const numQuantity = quantity ? parseFloat(quantity) : 0;
        const numPrice = price ? parseFloat(price) : 0;
        const numPackQuantity = packQuantity ? parseFloat(packQuantity) : undefined;
        const numTotal = total ? parseFloat(total) : 0;

        setIsSaving(true);
        try {
            await onSave({ 
                name: name.trim(), 
                brand: brand.trim(),
                type: type, // Opcional, passa string vazia se não selecionado
                quantity: isNaN(numQuantity) ? 0 : numQuantity,
                packQuantity: numPackQuantity,
                value: isNaN(numPrice) ? 0 : numPrice,
                total: isNaN(numTotal) ? 0 : numTotal
            });
        } catch (error) {
            alert(`Falha ao salvar: ${(error as Error).message}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
            <div ref={modalRef} className="w-full max-w-md p-6 mx-4 bg-gray-800 rounded-lg shadow-xl relative text-white" onClick={() => setShowSuggestions(false)}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">
                        {productToEdit ? 'Editar Produto' : 'Cadastrar Produto'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl font-bold">&times;</button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4" onClick={(e) => e.stopPropagation()}>
                    <fieldset disabled={isSaving} className="space-y-4">
                        
                        {/* Nome com Autocomplete */}
                        <div className="relative">
                            <label htmlFor="product-name" className="block mb-1 text-sm font-bold text-gray-300">Nome</label>
                            <input 
                                id="product-name" 
                                type="text" 
                                value={name} 
                                onChange={handleNameChange} 
                                onFocus={() => setShowSuggestions(true)}
                                required 
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                                autoComplete="off"
                                placeholder="Digite o nome do produto"
                            />
                            
                            {showSuggestions && name.length > 0 && (
                                <ul className="absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg max-h-48 overflow-y-auto text-gray-800 border border-gray-300">
                                    {/* Opção Fixa de Criação */}
                                    <li 
                                        onMouseDown={handleCreateNew}
                                        className="px-3 py-2 cursor-pointer font-bold text-blue-600 hover:bg-blue-50 border-b border-gray-200"
                                    >
                                        Criar: {name}
                                    </li>
                                    
                                    {/* Sugestões da API */}
                                    {suggestions.map((prod, idx) => {
                                        const marketName = prod.marketId?.name || 'Mercado desconhecido';
                                        const displayPrice = prod.currentPrice !== undefined ? `R$ ${prod.currentPrice.toFixed(2)}` : '';
                                        const displayBrand = prod.brand ? `- ${prod.brand}` : '';
                                        
                                        return (
                                            <li 
                                                key={prod._id || idx}
                                                onMouseDown={() => handleSelectSuggestion(prod)}
                                                className="px-3 py-2 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-0"
                                            >
                                                <div className="text-sm font-medium">
                                                    {prod.productName} {displayBrand} {displayPrice ? `- ${displayPrice}` : ''}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {marketName}
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>

                        {/* Marca */}
                        <div>
                            <label htmlFor="product-brand" className="block mb-1 text-sm font-bold text-gray-300">Marca</label>
                            <input 
                                id="product-brand" 
                                type="text" 
                                value={brand} 
                                onChange={(e) => setBrand(e.target.value)} 
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                            />
                        </div>

                        {/* Tipo */}
                        <div>
                            <label htmlFor="product-type" className="block mb-1 text-sm font-bold text-gray-300">Tipo</label>
                            <select 
                                id="product-type" 
                                value={type} 
                                onChange={(e) => setType(e.target.value)} 
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                            >
                                <option value="" disabled>Selecione uma opção (Opcional)</option>
                                {productTypes.map(t => (
                                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                                ))}
                            </select>
                        </div>

                        {/* Quantidade */}
                        <div>
                            <label htmlFor="product-quantity" className="block mb-1 text-sm font-bold text-gray-300">
                                Quantidade {type ? `(${type})` : ''}
                            </label>
                            <input 
                                id="product-quantity" 
                                type="number" 
                                value={quantity} 
                                onChange={(e) => setQuantity(e.target.value)} 
                                min="0" 
                                step="any" 
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                            />
                        </div>

                        {/* Quantidade no Pacote - Condicional */}
                        {(type === 'pacote' || type === 'caixa') && (
                            <div>
                                <label htmlFor="product-pack-qty" className="block mb-1 text-sm font-bold text-gray-300">Quantidade no Pacote/Caixa</label>
                                <input 
                                    id="product-pack-qty" 
                                    type="number" 
                                    value={packQuantity} 
                                    onChange={(e) => setPackQuantity(e.target.value)} 
                                    min="1" 
                                    step="1" 
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                                />
                            </div>
                        )}

                        {/* Valor Unitário */}
                        <div>
                            <label htmlFor="product-price" className="block mb-1 text-sm font-bold text-gray-300">Valor Unitário</label>
                            <input 
                                id="product-price" 
                                type="number" 
                                value={price} 
                                onChange={(e) => setPrice(e.target.value)} 
                                min="0" 
                                step="0.01" 
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                            />
                        </div>

                        {/* Total */}
                        <div>
                            <label htmlFor="product-total" className="block mb-1 text-sm font-bold text-gray-300">Total</label>
                            <input 
                                id="product-total" 
                                type="number" 
                                value={total} 
                                onChange={(e) => setTotal(e.target.value)} 
                                step="0.01" 
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                            />
                        </div>

                    </fieldset>
                    
                    <div className="flex justify-between pt-4 gap-3">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            disabled={isSaving} 
                            className="px-4 py-2 font-medium text-gray-300 bg-gray-600 rounded-md hover:bg-gray-700 disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSaving} 
                            className="px-6 py-2 font-medium text-white rounded-md bg-blue-accent hover:bg-blue-accent/90 disabled:bg-gray-500 disabled:cursor-wait"
                        >
                            {isSaving ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductModal;
