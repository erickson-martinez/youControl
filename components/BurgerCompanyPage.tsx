import React, { useState, useEffect, useCallback } from 'react';
import type { User, BurgerConfig } from '../types';
import { BURGER_API_URL } from '../constants';
import { OfficeBuildingIcon, LockClosedIcon, PlusIcon, TrashIcon, PencilIcon, ChevronLeftIcon, CheckCircleIcon, XCircleIcon, ClockIcon, CashIcon, MapPinIcon } from './icons';

interface BurgerCompanyPageProps {
    user: User;
}

const initialConfigState: BurgerConfig = {
    BURGER: '',
    CNPJ: '',
    phone: '',
    CAIXA: [],
    GARCOM: [],
    DELIVERY: [],
    TABLE_COUNT: 6,
    PAYMENT_METHODS: ['Dinheiro', 'PIX', 'Cartão Débito', 'Cartão Crédito'],
    DEBIT_CARD_FEE_RATE: 0.02,
    CREDIT_CARD_FEE_RATE: 0.05,
    TAXA_POR_KM: 1.5,
    PREFIXOS_LOGRADOURO: ['Rua', 'Avenida', 'Travessa', 'Alameda', 'Praça'],
    PERIOD: [],
    latitude: '',
    longitude: '',
    TAXA_DELIVERY_FIXA: 0,
    DELIVERY_FEE: 0,
    STATUS: 'active'
};

const DAYS_OF_WEEK = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const BurgerCompanyPage: React.FC<BurgerCompanyPageProps> = ({ user }) => {
    const [view, setView] = useState<'list' | 'form'>('list');
    const [companies, setCompanies] = useState<BurgerConfig[]>([]);
    const [config, setConfig] = useState<BurgerConfig>({ ...initialConfigState, phone: user.phone });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Inputs temporários
    const [newCaixa, setNewCaixa] = useState('');
    const [newGarcom, setNewGarcom] = useState('');
    const [newDelivery, setNewDelivery] = useState('');
    const [newPaymentMethod, setNewPaymentMethod] = useState('');
    const [newPrefix, setNewPrefix] = useState('');
    
    // Inputs temporários para Período
    const [newPeriodDay, setNewPeriodDay] = useState('Segunda');
    const [newPeriodStart, setNewPeriodStart] = useState('18:00');
    const [newPeriodEnd, setNewPeriodEnd] = useState('23:00');

    const fetchCompanies = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Busca configurações filtrando pelo telefone do usuário na URL
            const response = await fetch(`${BURGER_API_URL}/api/config/${user.phone}`);
            if (response.ok) {
                const json = await response.json();
                const data = json.data || json;
                
                let loadedCompanies: BurgerConfig[] = [];

                if (Array.isArray(data)) {
                    loadedCompanies = data;
                } else if (data && typeof data === 'object') {
                    if (Object.keys(data).length > 0) {
                        loadedCompanies = [data];
                    }
                }
                setCompanies(loadedCompanies);
            } else {
                if (response.status === 404) {
                    setCompanies([]);
                } else {
                    setError("Não foi possível carregar as empresas.");
                }
            }
        } catch (err) {
            console.error("Erro ao buscar configs:", err);
            setError("Erro ao conectar com o servidor.");
        } finally {
            setIsLoading(false);
        }
    }, [user.phone]);

    useEffect(() => {
        fetchCompanies();
    }, [fetchCompanies]);

    const handleCreateNew = () => {
        setConfig({ ...initialConfigState, phone: user.phone });
        setView('form');
        setError(null);
    };

    const handleEdit = (company: BurgerConfig) => {
        setConfig({
            ...initialConfigState, // Garante campos novos
            ...company,
            PERIOD: company.PERIOD || [],
            PAYMENT_METHODS: company.PAYMENT_METHODS || initialConfigState.PAYMENT_METHODS,
            PREFIXOS_LOGRADOURO: company.PREFIXOS_LOGRADOURO || initialConfigState.PREFIXOS_LOGRADOURO
        });
        setView('form');
        setError(null);
    };

    const handleBackToList = () => {
        setView('list');
        setError(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const fetchUrl = config._id 
                ? `${BURGER_API_URL}/api/config/${config._id}` 
                : `${BURGER_API_URL}/api/config`;

            const finalMethod = config._id ? 'PATCH' : 'POST';

            const response = await fetch(fetchUrl, {
                method: finalMethod,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            const result = await response.json();
            
            if (response.ok) {
                alert("Configuração salva com sucesso!");
                await fetchCompanies();
                setView('list');
            } else {
                throw new Error(result.message || "Erro ao salvar.");
            }
        } catch (err) {
            // Fallback para POST se PATCH falhar
            if (config._id) {
                 try {
                    const responseFallback = await fetch(`${BURGER_API_URL}/api/config`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(config)
                    });
                    if (responseFallback.ok) {
                        alert("Configuração salva com sucesso!");
                        await fetchCompanies();
                        setView('list');
                        return;
                    }
                 } catch (e) { /* ignore */ }
            }
            alert(`Erro ao salvar: ${(err as Error).message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleArrayAdd = (field: keyof BurgerConfig, value: string, setter: (v: string) => void) => {
        if (!value.trim()) return;
        const cleanVal = value.trim();
        const currentArray = (config[field] as string[]) || [];
        if (currentArray.includes(cleanVal)) {
            alert("Este item já existe na lista.");
            return;
        }
        setConfig(prev => ({ ...prev, [field]: [...currentArray, cleanVal] }));
        setter('');
    };

    const handleArrayRemove = (field: keyof BurgerConfig, value: string) => {
        setConfig(prev => ({ ...prev, [field]: (prev[field] as string[]).filter(item => item !== value) }));
    };

    const handleAddPeriod = () => {
        if (!newPeriodDay || !newPeriodStart || !newPeriodEnd) return;
        const newEntry = { day: newPeriodDay, start: newPeriodStart, end: newPeriodEnd };
        setConfig(prev => ({ ...prev, PERIOD: [...(prev.PERIOD || []), newEntry] }));
    };

    const handleRemovePeriod = (index: number) => {
        setConfig(prev => ({ ...prev, PERIOD: (prev.PERIOD || []).filter((_, i) => i !== index) }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setConfig(prev => ({
            ...prev,
            [name]: e.target.type === 'number' ? parseFloat(value) : value
        }));
    };

    if (isLoading && view === 'list' && companies.length === 0) {
        return <div className="p-8 text-center text-gray-400">Carregando configurações...</div>;
    }

    // --- VISÃO DE LISTA ---
    if (view === 'list') {
        return (
            <div className="p-4 bg-gray-800 rounded-lg min-h-[80vh]">
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-3">
                        <OfficeBuildingIcon className="w-8 h-8 text-blue-accent" />
                        <div>
                            <h1 className="text-2xl font-bold text-white">Minhas Empresas</h1>
                            <p className="text-sm text-gray-400">Gerencie as configurações das suas hamburguerias</p>
                        </div>
                    </div>
                    <button
                        onClick={handleCreateNew}
                        className="flex items-center px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-green-600 hover:bg-green-700 shadow-md"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Nova Empresa
                    </button>
                </div>

                {error && (
                    <div className="p-4 mb-4 text-center text-red-400 border border-red-900/50 rounded-lg bg-red-900/20">
                        {error}
                    </div>
                )}

                {companies.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-700/30 rounded-xl border-2 border-dashed border-gray-600">
                        <OfficeBuildingIcon className="w-16 h-16 text-gray-500 mb-4" />
                        <h3 className="text-xl font-bold text-gray-300">Nenhuma empresa encontrada</h3>
                        <p className="text-gray-400 mt-2 mb-6">Cadastre sua primeira hamburgueria para começar.</p>
                        <button
                            onClick={handleCreateNew}
                            className="px-6 py-2 font-bold text-gray-800 bg-blue-400 rounded-full hover:bg-blue-300 transition-colors"
                        >
                            Cadastrar Agora
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {companies.map((company, idx) => (
                            <div key={company._id || idx} className="bg-gray-700 rounded-xl p-5 shadow-lg border border-gray-600 hover:border-blue-500/50 transition-all group relative overflow-hidden">
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-gray-800 rounded-lg shadow-inner">
                                            <OfficeBuildingIcon className="w-8 h-8 text-blue-400" />
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-bold uppercase rounded-full border ${company.STATUS === 'active' ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-red-900/30 text-red-400 border-red-800'}`}>
                                            {company.STATUS === 'active' ? 'Ativa' : 'Inativa'}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold text-white mb-1 truncate" title={company.BURGER}>{company.BURGER}</h3>
                                    <p className="text-sm text-gray-400 mb-4 font-mono">{company.CNPJ || 'CNPJ não informado'}</p>

                                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-300 mb-6 bg-gray-800/50 p-3 rounded-lg">
                                        <div>
                                            <span className="block text-gray-500 mb-0.5">Mesas</span>
                                            <span className="font-semibold">{company.TABLE_COUNT}</span>
                                        </div>
                                        <div>
                                            <span className="block text-gray-500 mb-0.5">Equipe</span>
                                            <span className="font-semibold">{(company.CAIXA?.length || 0) + (company.GARCOM?.length || 0) + (company.DELIVERY?.length || 0)} membros</span>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => handleEdit(company)}
                                        className="w-full py-2 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                                    >
                                        <PencilIcon className="w-4 h-4" />
                                        Gerenciar / Editar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // --- VISÃO DE FORMULÁRIO ---
    return (
        <div className="p-4 bg-gray-800 rounded-lg animate-fade-in">
            <div className="flex items-center justify-between mb-6 border-b border-gray-700 pb-4">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleBackToList}
                        className="p-2 text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-full transition-colors"
                        title="Voltar para a lista"
                    >
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white">
                            {config._id ? `Editar: ${config.BURGER}` : 'Nova Empresa'}
                        </h1>
                        <p className="text-xs text-gray-400">Preencha os dados abaixo</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-8 max-w-5xl mx-auto">
                
                {/* Dados Gerais */}
                <section className="bg-gray-700/30 p-6 rounded-xl border border-gray-700">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <OfficeBuildingIcon className="w-5 h-5 text-blue-400" />
                        Dados Gerais
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Nome da Hamburgueria</label>
                            <input 
                                type="text" name="BURGER" value={config.BURGER} onChange={handleChange} required 
                                className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-600 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                                placeholder="Ex: Burger Kingo"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">CNPJ</label>
                            <input 
                                type="text" name="CNPJ" value={config.CNPJ} onChange={handleChange} required 
                                className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-600 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                                placeholder="00.000.000/0001-00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Telefone do Proprietário</label>
                            <input 
                                type="text" name="phone" value={config.phone} onChange={handleChange} required readOnly
                                className="w-full px-4 py-2 bg-gray-900 rounded-lg border border-gray-700 text-gray-500 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Status da Loja</label>
                            <select 
                                name="STATUS" value={config.STATUS} onChange={handleChange}
                                className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-600 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            >
                                <option value="active">Ativa</option>
                                <option value="inactive">Inativa</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* Equipe */}
                <section className="bg-gray-700/30 p-6 rounded-xl border border-gray-700">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <LockClosedIcon className="w-5 h-5 text-yellow-400" />
                        Equipe e Permissões
                    </h2>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Caixas */}
                        <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                            <label className="block text-sm font-bold text-gray-300 mb-2">Caixas</label>
                            <div className="flex gap-2 mb-3">
                                <input type="text" value={newCaixa} onChange={e => setNewCaixa(e.target.value)} placeholder="Tel" className="flex-1 px-3 py-1.5 bg-gray-700 rounded border border-gray-500 text-white text-sm" />
                                <button type="button" onClick={() => handleArrayAdd('CAIXA', newCaixa, setNewCaixa)} className="px-3 bg-blue-600 text-white rounded hover:bg-blue-500"><PlusIcon className="w-4 h-4"/></button>
                            </div>
                            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                                {config.CAIXA.map(phone => (
                                    <span key={phone} className="px-2 py-1 bg-blue-900/40 border border-blue-800 rounded-md text-xs text-blue-200 flex items-center gap-1">{phone} <button type="button" onClick={() => handleArrayRemove('CAIXA', phone)} className="text-red-400 hover:text-red-300 ml-1"><XCircleIcon className="w-3 h-3"/></button></span>
                                ))}
                            </div>
                        </div>

                        {/* Garçons */}
                        <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                            <label className="block text-sm font-bold text-gray-300 mb-2">Garçons</label>
                            <div className="flex gap-2 mb-3">
                                <input type="text" value={newGarcom} onChange={e => setNewGarcom(e.target.value)} placeholder="Tel" className="flex-1 px-3 py-1.5 bg-gray-700 rounded border border-gray-500 text-white text-sm" />
                                <button type="button" onClick={() => handleArrayAdd('GARCOM', newGarcom, setNewGarcom)} className="px-3 bg-blue-600 text-white rounded hover:bg-blue-500"><PlusIcon className="w-4 h-4"/></button>
                            </div>
                            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                                {config.GARCOM.map(phone => (
                                    <span key={phone} className="px-2 py-1 bg-yellow-900/40 border border-yellow-800 rounded-md text-xs text-yellow-200 flex items-center gap-1">{phone} <button type="button" onClick={() => handleArrayRemove('GARCOM', phone)} className="text-red-400 hover:text-red-300 ml-1"><XCircleIcon className="w-3 h-3"/></button></span>
                                ))}
                            </div>
                        </div>

                        {/* Delivery */}
                        <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                            <label className="block text-sm font-bold text-gray-300 mb-2">Entregadores</label>
                            <div className="flex gap-2 mb-3">
                                <input type="text" value={newDelivery} onChange={e => setNewDelivery(e.target.value)} placeholder="Tel" className="flex-1 px-3 py-1.5 bg-gray-700 rounded border border-gray-500 text-white text-sm" />
                                <button type="button" onClick={() => handleArrayAdd('DELIVERY', newDelivery, setNewDelivery)} className="px-3 bg-blue-600 text-white rounded hover:bg-blue-500"><PlusIcon className="w-4 h-4"/></button>
                            </div>
                            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                                {config.DELIVERY.map(phone => (
                                    <span key={phone} className="px-2 py-1 bg-green-900/40 border border-green-800 rounded-md text-xs text-green-200 flex items-center gap-1">{phone} <button type="button" onClick={() => handleArrayRemove('DELIVERY', phone)} className="text-red-400 hover:text-red-300 ml-1"><XCircleIcon className="w-3 h-3"/></button></span>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Pagamento e Prefixos */}
                <section className="bg-gray-700/30 p-6 rounded-xl border border-gray-700">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <CashIcon className="w-5 h-5 text-green-400" />
                        Configurações de Pagamento e Endereço
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Métodos de Pagamento */}
                        <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                            <label className="block text-sm font-bold text-gray-300 mb-2">Métodos de Pagamento</label>
                            <div className="flex gap-2 mb-3">
                                <input type="text" value={newPaymentMethod} onChange={e => setNewPaymentMethod(e.target.value)} placeholder="Ex: Ticket" className="flex-1 px-3 py-1.5 bg-gray-700 rounded border border-gray-500 text-white text-sm" />
                                <button type="button" onClick={() => handleArrayAdd('PAYMENT_METHODS', newPaymentMethod, setNewPaymentMethod)} className="px-3 bg-green-600 text-white rounded hover:bg-green-500"><PlusIcon className="w-4 h-4"/></button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {config.PAYMENT_METHODS.map(method => (
                                    <span key={method} className="px-2 py-1 bg-gray-600 rounded-md text-xs text-white flex items-center gap-1">{method} <button type="button" onClick={() => handleArrayRemove('PAYMENT_METHODS', method)} className="text-red-400 hover:text-red-300 ml-1"><XCircleIcon className="w-3 h-3"/></button></span>
                                ))}
                            </div>
                        </div>

                        {/* Prefixos Logradouro */}
                        <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                            <label className="block text-sm font-bold text-gray-300 mb-2">Prefixos de Logradouro (Removidos na busca)</label>
                            <div className="flex gap-2 mb-3">
                                <input type="text" value={newPrefix} onChange={e => setNewPrefix(e.target.value)} placeholder="Ex: Rua" className="flex-1 px-3 py-1.5 bg-gray-700 rounded border border-gray-500 text-white text-sm" />
                                <button type="button" onClick={() => handleArrayAdd('PREFIXOS_LOGRADOURO', newPrefix, setNewPrefix)} className="px-3 bg-blue-600 text-white rounded hover:bg-blue-500"><PlusIcon className="w-4 h-4"/></button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {config.PREFIXOS_LOGRADOURO.map(prefix => (
                                    <span key={prefix} className="px-2 py-1 bg-gray-600 rounded-md text-xs text-white flex items-center gap-1">{prefix} <button type="button" onClick={() => handleArrayRemove('PREFIXOS_LOGRADOURO', prefix)} className="text-red-400 hover:text-red-300 ml-1"><XCircleIcon className="w-3 h-3"/></button></span>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Horários */}
                <section className="bg-gray-700/30 p-6 rounded-xl border border-gray-700">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <ClockIcon className="w-5 h-5 text-blue-300" />
                        Horários de Funcionamento
                    </h2>
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-600 mb-4">
                        <div className="flex flex-wrap gap-2 items-end mb-2">
                            <div className="flex-1 min-w-[120px]">
                                <label className="block text-xs text-gray-400 mb-1">Dia</label>
                                <select 
                                    value={newPeriodDay} 
                                    onChange={e => setNewPeriodDay(e.target.value)}
                                    className="w-full px-2 py-1.5 bg-gray-700 rounded border border-gray-500 text-white text-sm"
                                >
                                    {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div className="w-24">
                                <label className="block text-xs text-gray-400 mb-1">Início</label>
                                <input type="time" value={newPeriodStart} onChange={e => setNewPeriodStart(e.target.value)} className="w-full px-2 py-1.5 bg-gray-700 rounded border border-gray-500 text-white text-sm" />
                            </div>
                            <div className="w-24">
                                <label className="block text-xs text-gray-400 mb-1">Fim</label>
                                <input type="time" value={newPeriodEnd} onChange={e => setNewPeriodEnd(e.target.value)} className="w-full px-2 py-1.5 bg-gray-700 rounded border border-gray-500 text-white text-sm" />
                            </div>
                            <button type="button" onClick={handleAddPeriod} className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-500 text-sm h-[34px]">Adicionar</button>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        {(config.PERIOD || []).map((period, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-gray-800 px-4 py-2 rounded border border-gray-600">
                                <span className="text-white text-sm">
                                    <strong className="text-blue-300 w-20 inline-block">{period.day}</strong> {period.start} - {period.end}
                                </span>
                                <button type="button" onClick={() => handleRemovePeriod(idx)} className="text-red-400 hover:text-red-300">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {(config.PERIOD || []).length === 0 && <p className="text-gray-500 text-sm italic">Nenhum horário cadastrado.</p>}
                    </div>
                </section>

                {/* Operacional & Financeiro */}
                <section className="bg-gray-700/30 p-6 rounded-xl border border-gray-700">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <CheckCircleIcon className="w-5 h-5 text-green-400" />
                        Operacional & Financeiro
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Qtd. Mesas</label>
                            <input type="number" name="TABLE_COUNT" value={config.TABLE_COUNT} onChange={handleChange} className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-600 text-white focus:border-blue-500 focus:outline-none"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Taxa Entrega Fixa (R$)</label>
                            <input type="number" step="0.01" name="TAXA_DELIVERY_FIXA" value={config.TAXA_DELIVERY_FIXA} onChange={handleChange} className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-600 text-white focus:border-blue-500 focus:outline-none"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Taxa por KM (R$)</label>
                            <input type="number" step="0.01" name="TAXA_POR_KM" value={config.TAXA_POR_KM} onChange={handleChange} className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-600 text-white focus:border-blue-500 focus:outline-none"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Taxa Cartão Débito (%)</label>
                            <input type="number" step="0.001" name="DEBIT_CARD_FEE_RATE" value={config.DEBIT_CARD_FEE_RATE} onChange={handleChange} className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-600 text-white focus:border-blue-500 focus:outline-none"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Taxa Cartão Crédito (%)</label>
                            <input type="number" step="0.001" name="CREDIT_CARD_FEE_RATE" value={config.CREDIT_CARD_FEE_RATE} onChange={handleChange} className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-600 text-white focus:border-blue-500 focus:outline-none"/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Taxa Padrão App (R$)</label>
                            <input type="number" step="0.01" name="DELIVERY_FEE" value={config.DELIVERY_FEE} onChange={handleChange} className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-600 text-white focus:border-blue-500 focus:outline-none"/>
                        </div>
                    </div>
                </section>

                {/* Localização */}
                <section className="bg-gray-700/30 p-6 rounded-xl border border-gray-700">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <MapPinIcon className="w-5 h-5 text-red-400" />
                        Localização da Loja
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Latitude</label>
                            <input type="text" name="latitude" value={config.latitude} onChange={handleChange} className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-600 text-white focus:border-blue-500 focus:outline-none"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Longitude</label>
                            <input type="text" name="longitude" value={config.longitude} onChange={handleChange} className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-600 text-white focus:border-blue-500 focus:outline-none"/>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Dica: Use o Google Maps para copiar as coordenadas exatas. Elas são essenciais para o cálculo de frete.</p>
                </section>

                <div className="flex justify-end pt-4 gap-4 sticky bottom-0 bg-gray-800 py-4 border-t border-gray-700">
                    <button 
                        type="button" 
                        onClick={handleBackToList}
                        disabled={isSaving}
                        className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 font-bold rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        disabled={isSaving}
                        className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-wait flex items-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Salvando...
                            </>
                        ) : 'Salvar Empresa'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BurgerCompanyPage;