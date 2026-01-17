
import React, { useState, useEffect, useMemo } from 'react';
import type { User, MenuPermissions, ActivePage } from '../types';
import { 
    CashIcon, UsersIcon, ClockIcon, ClipboardCheckIcon, ClipboardListIcon, 
    InboxInIcon, OfficeBuildingIcon, ShoppingCartIcon, CogIcon, LockClosedIcon, 
    DocumentTextIcon, ChevronLeftIcon, ChevronRightIcon
} from './icons';

interface HomePageProps {
    user: User;
    permissions: MenuPermissions | null;
    onNavigate: (page: ActivePage) => void;
}

interface Feature {
    key: ActivePage;
    title: string;
    description: string;
    icon: React.ReactNode;
    permissionKey: keyof MenuPermissions;
}

const features: Feature[] = [
    {
        key: 'financeiro',
        title: 'Controle Financeiro',
        description: 'Gerencie suas receitas e despesas, compartilhe finanças e tenha uma visão clara do seu dinheiro.',
        icon: <CashIcon className="w-8 h-8 text-green-accent" />,
        permissionKey: 'financeiro'
    },
    {
        key: 'listPurcharse',
        title: 'Lista de Compras',
        description: 'Crie e gerencie suas listas de compras de forma colaborativa e organizada.',
        icon: <ShoppingCartIcon className="w-8 h-8 text-yellow-accent" />,
        permissionKey: 'listPurcharse'
    },
    {
        key: 'ponto',
        title: 'Ponto Eletrônico',
        description: 'Registre suas horas de trabalho de forma simples e eficiente, integrado à sua empresa.',
        icon: <ClockIcon className="w-8 h-8 text-blue-accent" />,
        permissionKey: 'ponto'
    },
    {
        key: 'rh',
        title: 'Gestão de RH',
        description: 'Administre colaboradores, vincule a empresas e gerencie permissões de acesso ao sistema.',
        icon: <UsersIcon className="w-8 h-8 text-yellow-accent" />,
        permissionKey: 'rh'
    },
    {
        key: 'aprovar-horas',
        title: 'Aprovação de Horas',
        description: 'Revise e aprove ou rejeite os registros de ponto dos colaboradores da sua equipe.',
        icon: <ClipboardCheckIcon className="w-8 h-8 text-green-accent" />,
        permissionKey: 'aprovarHoras'
    },
    {
        key: 'os',
        title: 'Ordens de Serviço',
        description: 'Abra e acompanhe ordens de serviço para suas empresas, detalhando problemas e solicitações.',
        icon: <ClipboardListIcon className="w-8 h-8 text-yellow-accent" />,
        permissionKey: 'os'
    },
    {
        key: 'chamados',
        title: 'Caixa de Chamados',
        description: 'Receba, gerencie e responda às ordens de serviço que foram abertas para você resolver.',
        icon: <InboxInIcon className="w-8 h-8 text-blue-accent" />,
        permissionKey: 'chamados'
    },
    {
        key: 'empresa',
        title: 'Gestão de Empresas',
        description: 'Cadastre e gerencie os dados das suas empresas diretamente no sistema.',
        icon: <OfficeBuildingIcon className="w-8 h-8 text-blue-accent" />,
        permissionKey: 'empresa'
    },
    {
        key: 'settings',
        title: 'Configurações',
        description: 'Ajuste as permissões de acesso para cada usuário do sistema de forma granular.',
        icon: <CogIcon className="w-8 h-8 text-gray-400" />,
        permissionKey: 'settings'
    },
    {
        key: 'exemplo',
        title: 'Página de Exemplos',
        description: 'Visualize exemplos de componentes e layouts da aplicação com os últimos ajustes.',
        icon: <DocumentTextIcon className="w-8 h-8 text-blue-accent" />,
        permissionKey: 'exemplo'
    },
];

const FeatureCard: React.FC<{ feature: Feature; hasPermission: boolean; onNavigate: (page: ActivePage) => void; }> = ({ feature, hasPermission, onNavigate }) => {
    
    const cardClasses = `relative flex flex-col h-full justify-between p-6 bg-gray-800 rounded-lg shadow-lg group transition-all duration-300 ${
        hasPermission 
            ? 'cursor-pointer hover:bg-gray-700 hover:shadow-xl hover:-translate-y-1' 
            : 'opacity-60 cursor-not-allowed'
    }`;
    
    const handleClick = () => {
        if (hasPermission) {
            onNavigate(feature.key);
        }
    };

    return (
        <div 
            className={cardClasses} 
            onClick={handleClick}
            title={hasPermission ? `Acessar o módulo de ${feature.title}` : 'Contate o representante para liberar o acesso.'}
        >
            <div>
                <div className="flex items-center justify-between">
                    {feature.icon}
                    {!hasPermission && <LockClosedIcon className="w-6 h-6 text-gray-500" />}
                </div>
                <h3 className="mt-4 text-lg font-bold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm text-gray-400">{feature.description}</p>
            </div>
            {/* This div is always present to maintain card height */}
            <div className="mt-4 text-sm font-semibold text-blue-400">
                {hasPermission ? 'Acessar Módulo \u2192' : '\u00A0'}
            </div>
        </div>
    );
};


const HomePage: React.FC<HomePageProps> = ({ user, permissions, onNavigate }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(window.innerWidth < 768 ? 1 : 3);

    useEffect(() => {
        const handleResize = () => {
            const newItemsPerPage = window.innerWidth < 768 ? 1 : 3;
            setItemsPerPage(newItemsPerPage);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const slides = useMemo(() => {
        const result = [];
        for (let i = 0; i < features.length; i += itemsPerPage) {
            result.push(features.slice(i, i + itemsPerPage));
        }
        return result;
    }, [itemsPerPage]);

    const numSlides = slides.length;
    
    useEffect(() => {
        setCurrentIndex(0);
    }, [numSlides]);

    useEffect(() => {
        if (numSlides <= 1) return;

        const timer = setTimeout(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % numSlides);
        }, 15000); // 15 seconds

        return () => clearTimeout(timer);
    }, [currentIndex, numSlides]);

    const goToPrevious = () => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + numSlides) % numSlides);
    };

    const goToNext = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % numSlides);
    };
    
    const goToSlide = (slideIndex: number) => {
        setCurrentIndex(slideIndex);
    };

    if (!permissions) {
        return (
             <div className="p-4 text-center bg-gray-800 rounded-lg">
                <p className="text-gray-400">Carregando permissões...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white">Bem-vindo(a) ao FinControl, {user.name}!</h1>
                <p className="mt-2 text-gray-400">Aqui está um resumo das soluções que oferecemos. Acesse os módulos aos quais você tem permissão ou contate um administrador para solicitar acesso a outros.</p>
            </div>

            <div className="relative">
                <div className="overflow-hidden">
                    <div
                        className="flex transition-transform duration-700 ease-in-out"
                        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                    >
                        {slides.map((slideFeatures, index) => (
                            <div key={index} className="flex-shrink-0 w-full">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                    {slideFeatures.map(feature => (
                                        <FeatureCard
                                            key={feature.key}
                                            feature={feature}
                                            hasPermission={permissions[feature.permissionKey]}
                                            onNavigate={onNavigate}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {numSlides > 1 && (
                    <>
                        <button
                            onClick={goToPrevious}
                            className="absolute top-1/2 -translate-y-1/2 left-0 z-10 p-2 -ml-4 text-white bg-gray-800 rounded-full shadow-lg opacity-75 hover:opacity-100"
                            aria-label="Anterior"
                        >
                            <ChevronLeftIcon className="w-6 h-6" />
                        </button>
                        <button
                            onClick={goToNext}
                            className="absolute top-1/2 -translate-y-1/2 right-0 z-10 p-2 -mr-4 text-white bg-gray-800 rounded-full shadow-lg opacity-75 hover:opacity-100"
                            aria-label="Próximo"
                        >
                            <ChevronRightIcon className="w-6 h-6" />
                        </button>
                        
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                            {slides.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => goToSlide(index)}
                                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                                        currentIndex === index ? 'bg-blue-accent' : 'bg-gray-600 hover:bg-gray-500'
                                    }`}
                                    aria-label={`Ir para o slide ${index + 1}`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default HomePage;
