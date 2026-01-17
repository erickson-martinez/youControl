
import React, { useState, useEffect } from 'react';
import type { Product } from '../types';

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { name: string, quantity: number, price: number }) => Promise<void>;
    productToEdit: Product | null;
}

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSave, productToEdit }) => {
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [price, setPrice] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (productToEdit) {
                setName(productToEdit.name);
                setQuantity(String(productToEdit.quantity));
                setPrice(String(productToEdit.price));
            } else {
                setName('');
                setQuantity('1');
                setPrice('');
            }
        }
    }, [productToEdit, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const numQuantity = parseInt(quantity, 10);
        const numPrice = parseFloat(price);

        if (!name.trim() || isNaN(numQuantity) || numQuantity <= 0 || isNaN(numPrice) || numPrice < 0) {
            alert('Por favor, preencha todos os campos com valores válidos.');
            return;
        }

        setIsSaving(true);
        try {
            await onSave({ name: name.trim(), quantity: numQuantity, price: numPrice });
        } catch (error) {
            alert(`Falha ao salvar: ${(error as Error).message}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
            <div className="w-full max-w-md p-6 mx-4 bg-gray-800 rounded-lg shadow-xl">
                <h2 className="mb-4 text-xl font-bold text-white">
                    {productToEdit ? 'Editar Produto' : 'Adicionar Produto'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <fieldset disabled={isSaving} className="space-y-4">
                        <div>
                            <label htmlFor="product-name" className="block mb-2 text-sm font-medium text-gray-300">Nome do Produto</label>
                            <input id="product-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md disabled:opacity-50"/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="product-quantity" className="block mb-2 text-sm font-medium text-gray-300">Quantidade</label>
                                <input id="product-quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required min="1" step="1" className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md disabled:opacity-50"/>
                            </div>
                            <div>
                                <label htmlFor="product-price" className="block mb-2 text-sm font-medium text-gray-300">Preço (R$)</label>
                                <input id="product-price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required min="0" step="0.01" className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md disabled:opacity-50"/>
                            </div>
                        </div>
                    </fieldset>
                    <div className="flex justify-end pt-4 space-x-3">
                        <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 font-medium text-gray-300 bg-gray-600 rounded-md hover:bg-gray-700 disabled:opacity-50">Cancelar</button>
                        <button type="submit" disabled={isSaving} className="px-4 py-2 font-medium text-white rounded-md bg-blue-accent hover:bg-blue-accent/90 disabled:bg-gray-500 disabled:cursor-wait">
                            {isSaving ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductModal;
