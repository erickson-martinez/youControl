
import React, { useState, useEffect } from 'react';
import type { ShoppingList, Market } from '../types';
import { MapPinIcon } from './icons';

interface ShoppingListModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { name: string, marketId: string, date: string, latitude?: number | null, longitude?: number | null }) => Promise<void>;
    listToEdit: ShoppingList | null;
    markets: Market[];
}

const ShoppingListModal: React.FC<ShoppingListModalProps> = ({ isOpen, onClose, onSave, listToEdit, markets }) => {
    const [name, setName] = useState('');
    const [marketId, setMarketId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    
    // Novos estados para localização
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const [gettingLocation, setGettingLocation] = useState(false);
    
    const [isSaving, setIsSaving] = useState(false);

    // Efeito para gerar o nome automaticamente
    useEffect(() => {
        const todayStr = new Date(date).toLocaleDateString('pt-BR');
        if (marketId) {
            const marketName = markets.find(m => m.id === marketId)?.name || 'Loja';
            setName(`${marketName} - ${todayStr}`);
        } else {
            setName(`Lista de compras - ${todayStr}`);
        }
    }, [marketId, date, markets]);

    useEffect(() => {
        if (isOpen) {
            if (listToEdit) {
                setMarketId(listToEdit.marketId);
                setDate(listToEdit.date || new Date().toISOString().split('T')[0]);
                // Se a lista já tiver localização salva (futuro), poderia ser carregada aqui
                setLatitude(null); 
                setLongitude(null);
            } else {
                setMarketId('');
                setDate(new Date().toISOString().split('T')[0]);
                setLatitude(null);
                setLongitude(null);
            }
        }
    }, [listToEdit, isOpen]);

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocalização não é suportada pelo seu navegador.");
            return;
        }

        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLatitude(position.coords.latitude);
                setLongitude(position.coords.longitude);
                setGettingLocation(false);
            },
            (error) => {
                console.error("Erro ao obter localização", error);
                alert("Não foi possível obter sua localização. Verifique as permissões do navegador.");
                setGettingLocation(false);
            }
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!marketId) {
            alert("Por favor, selecione uma loja.");
            return;
        }

        setIsSaving(true);
        try {
            await onSave({ name, marketId, date, latitude, longitude });
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
                    {listToEdit ? 'Editar Lista' : 'Criar Nova Lista'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <fieldset disabled={isSaving} className="space-y-4">
                        <div>
                            <label htmlFor="list-market" className="block mb-2 text-sm font-medium text-gray-300">Selecione a Loja</label>
                            <select 
                                id="list-market" 
                                value={marketId} 
                                onChange={(e) => setMarketId(e.target.value)} 
                                required 
                                className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 disabled:opacity-50"
                            >
                                <option value="">Selecione...</option>
                                {markets.map(market => (
                                    <option key={market.id} value={market.id}>{market.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="list-date" className="block mb-2 text-sm font-medium text-gray-300">Data</label>
                            <input 
                                id="list-date" 
                                type="date" 
                                value={date} 
                                onChange={(e) => setDate(e.target.value)} 
                                required 
                                className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md disabled:opacity-50"
                            />
                        </div>
                        
                        {/* Seção de Geolocalização */}
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-300">Sua Localização (Opcional)</label>
                            <div className="flex flex-col gap-2">
                                <button 
                                    type="button" 
                                    onClick={handleGetLocation} 
                                    disabled={gettingLocation || isSaving}
                                    className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white transition-colors bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Captura sua posição atual para calcular distâncias futuras"
                                >
                                    <MapPinIcon className="w-4 h-4 mr-2 text-blue-400" />
                                    {gettingLocation ? 'Obtendo localização...' : 'Capturar Localização Atual'}
                                </button>
                                {latitude !== null && longitude !== null && (
                                    <div className="p-2 text-xs text-green-300 bg-green-900/30 border border-green-800 rounded-md flex items-center justify-between">
                                        <span>Lat: {latitude.toFixed(6)}, Long: {longitude.toFixed(6)}</span>
                                        <button 
                                            type="button" 
                                            onClick={() => { setLatitude(null); setLongitude(null); }}
                                            className="text-gray-400 hover:text-white ml-2"
                                            title="Remover localização"
                                        >
                                            &times;
                                        </button>
                                    </div>
                                )}
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                Útil para calcular se vale a pena ir até a loja baseado na distância.
                            </p>
                        </div>

                        <div>
                            <label htmlFor="list-name" className="block mb-2 text-sm font-medium text-gray-300">Nome da Lista (Automático)</label>
                            <input 
                                id="list-name" 
                                type="text" 
                                value={name} 
                                readOnly
                                className="w-full px-3 py-2 text-gray-400 bg-gray-900 border border-gray-700 rounded-md cursor-not-allowed focus:outline-none"
                            />
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

export default ShoppingListModal;
