
import React, { useState, useEffect } from 'react';
import type { Loja } from '../types';
import { MapPinIcon, MagnifyingGlassIcon } from './icons';

interface LojaFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<Loja, 'id'>) => Promise<void>;
    lojaToEdit: Loja | null;
}

const initialState = {
    name: '',
    address: '',
    number: '',
    zip: '',
    latitude: null as number | null,
    longitude: null as number | null,
    status: 'active' as 'active' | 'inactive',
};

const LojaFormModal: React.FC<LojaFormModalProps> = ({ isOpen, onClose, onSave, lojaToEdit }) => {
    const [formData, setFormData] = useState(initialState);
    const [isSaving, setIsSaving] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [isGeocoding, setIsGeocoding] = useState(false);

    useEffect(() => {
        if (lojaToEdit) {
            setFormData({
                name: lojaToEdit.name || '',
                address: lojaToEdit.address || '',
                number: lojaToEdit.number || '',
                zip: lojaToEdit.zip || '',
                latitude: lojaToEdit.latitude || null,
                longitude: lojaToEdit.longitude || null,
                status: lojaToEdit.status,
            });
        } else {
            setFormData(initialState);
        }
    }, [lojaToEdit, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocalização não é suportada pelo seu navegador.");
            return;
        }

        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData(prev => ({
                    ...prev,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                }));
                setGettingLocation(false);
            },
            (error) => {
                console.error("Erro ao obter localização", error);
                alert("Não foi possível obter sua localização. Verifique as permissões.");
                setGettingLocation(false);
            }
        );
    };

    const handleGeocodeFromAddress = async () => {
        if (!formData.address) {
            alert("Preencha ao menos o endereço para buscar a localização.");
            return;
        }

        setIsGeocoding(true);
        try {
            // Constroi a string de busca: Rua, Numero, CEP, Pais
            const queryParts = [];
            if (formData.address) queryParts.push(formData.address);
            if (formData.number) queryParts.push(formData.number);
            // Embora não tenhamos campos de cidade/estado no formulário atual, 
            // o CEP ajuda muito o Nominatim a resolver corretamente
            if (formData.zip) queryParts.push(formData.zip);
            queryParts.push("Brasil");

            const query = queryParts.join(', ');
            const encodedQuery = encodeURIComponent(query);
            const url = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&addressdetails=1&limit=1`;

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'SeuControleFinanceiroApp/1.0' // Nominatim exige User-Agent
                }
            });

            if (!response.ok) throw new Error("Erro na resposta do serviço de mapas.");

            const data = await response.json();

            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                setFormData(prev => ({
                    ...prev,
                    latitude: parseFloat(lat),
                    longitude: parseFloat(lon)
                }));
            } else {
                alert("Endereço não encontrado no mapa. Verifique os dados e tente novamente.");
            }
        } catch (error) {
            console.error("Erro ao geocodificar endereço:", error);
            alert("Ocorreu um erro ao buscar o endereço no mapa.");
        } finally {
            setIsGeocoding(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave(formData);
        } catch (error) {
            console.error("Falha ao salvar loja:", error);
            alert(`Ocorreu um erro ao salvar: ${(error as Error).message}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
            <div className="w-full max-w-lg p-6 mx-4 bg-gray-800 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
                <h2 className="mb-4 text-2xl font-bold text-white">
                    {lojaToEdit ? 'Editar Loja' : 'Cadastrar Nova Loja'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <fieldset disabled={isSaving} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block mb-1 text-sm text-gray-300">Nome da Loja*</label>
                            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md disabled:opacity-50"/>
                        </div>
                        <div>
                            <label htmlFor="address" className="block mb-1 text-sm text-gray-300">Endereço</label>
                            <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md disabled:opacity-50"/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label htmlFor="number" className="block mb-1 text-sm text-gray-300">Número</label>
                                <input type="text" name="number" id="number" value={formData.number} onChange={handleChange} className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md disabled:opacity-50"/>
                            </div>
                             <div>
                                <label htmlFor="zip" className="block mb-1 text-sm text-gray-300">CEP</label>
                                <input type="text" name="zip" id="zip" value={formData.zip} onChange={handleChange} className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md disabled:opacity-50"/>
                            </div>
                        </div>
                        
                        <div>
                            <label className="block mb-2 text-sm text-gray-300">Localização (GPS)</label>
                            <div className="flex flex-col gap-2">
                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <button 
                                        type="button" 
                                        onClick={handleGetLocation} 
                                        disabled={gettingLocation || isGeocoding || isSaving}
                                        className="flex items-center justify-center flex-1 px-4 py-2 text-sm font-medium text-white transition-colors bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Usa o GPS do dispositivo"
                                    >
                                        <MapPinIcon className="w-4 h-4 mr-2 text-blue-400" />
                                        {gettingLocation ? 'Obtendo...' : 'Capturar GPS Atual'}
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={handleGeocodeFromAddress} 
                                        disabled={gettingLocation || isGeocoding || isSaving}
                                        className="flex items-center justify-center flex-1 px-4 py-2 text-sm font-medium text-white transition-colors bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Busca coordenadas baseadas no endereço preenchido"
                                    >
                                        <MagnifyingGlassIcon className="w-4 h-4 mr-2 text-green-400" />
                                        {isGeocoding ? 'Buscando...' : 'Buscar pelo Endereço'}
                                    </button>
                                </div>
                                {formData.latitude !== null && formData.longitude !== null && (
                                    <div className="flex items-center justify-between p-2 text-xs text-green-300 border border-green-800 rounded-md bg-green-900/30">
                                        <span>Lat: {formData.latitude.toFixed(6)}, Long: {formData.longitude.toFixed(6)}</span>
                                        <button 
                                            type="button" 
                                            onClick={() => setFormData(prev => ({ ...prev, latitude: null, longitude: null }))}
                                            className="ml-2 text-gray-400 hover:text-white"
                                            title="Limpar localização"
                                        >
                                            &times;
                                        </button>
                                    </div>
                                )}
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

export default LojaFormModal;
