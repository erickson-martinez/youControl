import React, { useState, useEffect, useRef } from 'react';
import type { User, MenuPermissions, ActivePage } from '../types';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useNotifications } from '../hooks/useNotifications';
import { DownloadIcon, BellIcon, 
    HomeIcon, CashIcon, UsersIcon, ClipboardListIcon, CogIcon, XIcon, 
    OfficeBuildingIcon, ClockIcon, LogoutIcon, ClipboardCheckIcon, 
    InboxInIcon, DocumentTextIcon, ShoppingCartIcon, BookOpenIcon, 
    BuildingStoreIcon, ChartBarIcon, BurgerIcon, MotorcycleIcon, MonitorIcon, TagIcon, SparklesIcon,
    SunIcon, MoonIcon
} from './icons';

interface SidebarProps {
  user: User;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
  permissions: MenuPermissions;
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  canClockIn: boolean;
}

const NavLink: React.FC<{ page: ActivePage, onNavigate: (page: ActivePage) => void; icon: React.ReactNode; label: string; active?: boolean }> = ({ page, onNavigate, icon, label, active = false }) => (
  <a
    href={`#${page}`}
    onClick={(e) => { e.preventDefault(); onNavigate(page); }}
    className={`flex items-center px-4 py-3 text-sm font-medium transition-colors rounded-lg ${
      active
        ? 'bg-blue-accent text-white'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`}
  >
    {icon}
    <span className="ml-3">{label}</span>
  </a>
);

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout, isOpen, onClose, onOpen, permissions, activePage, onNavigate, canClockIn }) => {
  const [isLightMode, setIsLightMode] = useState(() => {
    return document.documentElement.classList.contains('light');
  });
  const { isInstallable, installPWA } = usePWAInstall();
  const { permission: notifPermission, requestPermission } = useNotifications();

  // Touch gesture state for real-time sliding
  const [touchTranslateX, setTouchTranslateX] = useState<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; isEdge: boolean; isSidebar: boolean } | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (isLightMode) {
      root.classList.add('light');
      localStorage.setItem('theme', 'light');
    } else {
      root.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    }
  }, [isLightMode]);

  useEffect(() => {
     if(localStorage.getItem('theme') === 'light') {
         setIsLightMode(true);
     }
  }, []);

  const toggleTheme = () => setIsLightMode(!isLightMode);

  // Swipe Gesture Handling (Touch devices)
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      const startX = touch.clientX;
      const startY = touch.clientY;

      // Edge swipe: touched within 45px of left screen edge when sidebar is closed
      const isEdge = !isOpen && startX <= 45;
      // Sidebar swipe: touched inside open sidebar (or overlay) when sidebar is open
      const isSidebar = isOpen && (startX <= 280);

      if (isEdge || isSidebar) {
        touchStartRef.current = { x: startX, y: startY, isEdge, isSidebar };
      } else {
        touchStartRef.current = null;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;

      // If vertical movement dominates early on, cancel swipe gesture
      if (Math.abs(deltaY) > Math.abs(deltaX) * 1.2 && Math.abs(deltaX) < 15) {
        touchStartRef.current = null;
        setTouchTranslateX(null);
        return;
      }

      const { isEdge, isSidebar } = touchStartRef.current;

      if (isEdge && deltaX > 0) {
        // Dragging right to open sidebar
        const currentTranslate = Math.min(0, -256 + deltaX);
        setTouchTranslateX(currentTranslate);
      } else if (isSidebar && deltaX < 0) {
        // Dragging left to close sidebar
        const currentTranslate = Math.min(0, deltaX);
        setTouchTranslateX(currentTranslate);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) {
        setTouchTranslateX(null);
        return;
      }

      const touch = e.changedTouches[0];
      if (touch) {
        const deltaX = touch.clientX - touchStartRef.current.x;
        const deltaY = touch.clientY - touchStartRef.current.y;
        const { isEdge, isSidebar } = touchStartRef.current;

        // Check horizontal dominance and threshold (40px)
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) >= 40) {
          if (isEdge && deltaX >= 40 && onOpen) {
            onOpen();
          } else if (isSidebar && deltaX <= -40) {
            onClose();
          }
        }
      }

      touchStartRef.current = null;
      setTouchTranslateX(null);
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isOpen, onOpen, onClose]);

  const getSidebarTransform = () => {
    if (touchTranslateX !== null) {
      return `translateX(${touchTranslateX}px)`;
    }
    return undefined;
  };
  
  return (
    <>
      {/* Overlay para fechar em modo mobile */}
      {(isOpen || touchTranslateX !== null) && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden transition-opacity duration-200" 
          aria-hidden="true" 
          style={{
            opacity: touchTranslateX !== null 
              ? (isOpen ? Math.max(0, (256 + touchTranslateX) / 256) : Math.min(1, (256 + touchTranslateX) / 256))
              : undefined
          }}
        />
      )}

      {/* Indicador sutil de gesto de borda no mobile quando o menu está fechado */}
      {!isOpen && (
        <div 
          className="fixed top-1/2 -translate-y-1/2 left-0 z-30 md:hidden pointer-events-none flex items-center justify-start opacity-60"
          aria-hidden="true"
        >
          <div className="w-1 h-14 bg-blue-500/60 rounded-r-full ml-0.5 animate-pulse shadow-lg" />
        </div>
      )}
      
      <aside 
        id="default-sidebar"
        className={`fixed top-0 left-0 z-40 w-64 h-screen bg-gray-800 ${
          touchTranslateX === null ? 'transition-transform duration-300' : ''
        } ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 shadow-2xl md:shadow-none`}
        style={{
          transform: getSidebarTransform()
        }}
        aria-label="Sidebar"
      >
        <div className="flex flex-col h-full px-3 py-4 overflow-y-auto">
          <div className="flex items-center justify-between pl-2.5 mb-8">
              <span className="self-center text-xl font-semibold whitespace-nowrap text-white">Seu Controle</span>
              <button onClick={onClose} className="p-1 text-gray-400 rounded-full md:hidden hover:bg-gray-700 hover:text-white" aria-label="Fechar menu">
                <XIcon className="w-6 h-6" />
              </button>
          </div>
          <nav className="flex-1">
            <ul className="space-y-2 font-medium">
              <li><NavLink page="home" onNavigate={onNavigate} icon={<HomeIcon className="w-6 h-6" />} label="Início" active={activePage === 'home'} /></li>
              
              {/* Módulo Lanchonete */}
              {(permissions.burgerDashboard || permissions.burgerCompany || permissions.burgerPOS || permissions.burgerProducts || permissions.burgerClient) && (
                  <li className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-500 uppercase">Lanchonete</li>
              )}
              {permissions.burgerDashboard && <li><NavLink page="burgerDashboard" onNavigate={onNavigate} icon={<ChartBarIcon className="w-6 h-6" />} label="Dash Lanchonete" active={activePage === 'burgerDashboard'} /></li>}
              {permissions.burgerCompany && <li><NavLink page="burgerCompany" onNavigate={onNavigate} icon={<OfficeBuildingIcon className="w-6 h-6" />} label="Minha Empresa" active={activePage === 'burgerCompany'} /></li>}
              {permissions.burgerPOS && <li><NavLink page="burgerPOS" onNavigate={onNavigate} icon={<MonitorIcon className="w-6 h-6" />} label="Caixa / Pedidos" active={activePage === 'burgerPOS'} /></li>}
              {permissions.burgerWaiter && <li><NavLink page="burgerWaiter" onNavigate={onNavigate} icon={<UsersIcon className="w-6 h-6" />} label="Garçom" active={activePage === 'burgerWaiter'} /></li>}
              {permissions.burgerProducts && <li><NavLink page="burgerProducts" onNavigate={onNavigate} icon={<TagIcon className="w-6 h-6" />} label="Produtos Burger" active={activePage === 'burgerProducts'} /></li>}
              {permissions.burgerDelivery && <li><NavLink page="burgerDelivery" onNavigate={onNavigate} icon={<MotorcycleIcon className="w-6 h-6" />} label="Entregas" active={activePage === 'burgerDelivery'} /></li>}
              {permissions.burgerClient && <li><NavLink page="burgerClient" onNavigate={onNavigate} icon={<BurgerIcon className="w-6 h-6" />} label="Fazer Pedido (Cardápio)" active={activePage === 'burgerClient'} /></li>}

              <li className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-500 uppercase">Geral</li>
              {permissions.barbearia && <li><NavLink page="barbearia" onNavigate={onNavigate} icon={<UsersIcon className="w-6 h-6" />} label="Barbearia Admin" active={activePage === 'barbearia'} /></li>}
              {permissions.barbeiroAgenda && <li><NavLink page="barbeiroAgenda" onNavigate={onNavigate} icon={<ClipboardListIcon className="w-6 h-6" />} label="Minha Agenda (Barbeiro)" active={activePage === 'barbeiroAgenda'} /></li>}
              {permissions.caixaBarbearia && <li><NavLink page="caixaBarbearia" onNavigate={onNavigate} icon={<CashIcon className="w-6 h-6" />} label="Caixa Barbearia" active={activePage === 'caixaBarbearia'} /></li>}
              {permissions.jornada && <li><NavLink page="jornada" onNavigate={onNavigate} icon={<SparklesIcon className="w-6 h-6" />} label="Minha Jornada" active={activePage === 'jornada'} /></li>}
              {permissions.jogoDaVida && <li><NavLink page="jogoDaVida" onNavigate={onNavigate} icon={<BookOpenIcon className="w-6 h-6" />} label="Jogo da Vida" active={activePage === 'jogoDaVida'} /></li>}
              {permissions.treino && <li><NavLink page="treino" onNavigate={onNavigate} icon={<ClipboardListIcon className="w-6 h-6" />} label="Treino" active={activePage === 'treino'} /></li>}
              {permissions.financeiro && <li><NavLink page="financeiro" onNavigate={onNavigate} icon={<CashIcon className="w-6 h-6" />} label="Financeiro" active={activePage === 'financeiro'} /></li>}
              {permissions.graficos && <li><NavLink page="graficos" onNavigate={onNavigate} icon={<ChartBarIcon className="w-6 h-6" />} label="Relatórios" active={activePage === 'graficos'} /></li>}
              {permissions.financialManual && <li><NavLink page="financialManual" onNavigate={onNavigate} icon={<BookOpenIcon className="w-6 h-6" />} label="Manual Financeiro" active={activePage === 'financialManual'} /></li>}
              {permissions.listPurcharse && <li><NavLink page="listPurcharse" onNavigate={onNavigate} icon={<ShoppingCartIcon className="w-6 h-6" />} label="Lista de Compras" active={activePage === 'listPurcharse'} /></li>}
              {permissions.rh && <li><NavLink page="rh" onNavigate={onNavigate} icon={<UsersIcon className="w-6 h-6" />} label="RH" active={activePage === 'rh'} /></li>}
              {permissions.ponto && canClockIn && <li><NavLink page="ponto" onNavigate={onNavigate} icon={<ClockIcon className="w-6 h-6" />} label="Ponto" active={activePage === 'ponto'} /></li>}
              {permissions.aprovarHoras && <li><NavLink page="aprovarHoras" onNavigate={onNavigate} icon={<ClipboardCheckIcon className="w-6 h-6" />} label="Aprovar Horas" active={activePage === 'aprovarHoras'} /></li>}
              {permissions.os && <li><NavLink page="os" onNavigate={onNavigate} icon={<ClipboardListIcon className="w-6 h-6" />} label="OS" active={activePage === 'os'} /></li>}
              {permissions.chamados && <li><NavLink page="chamados" onNavigate={onNavigate} icon={<InboxInIcon className="w-6 h-6" />} label="Chamados" active={activePage === 'chamados'} /></li>}
              {permissions.empresa && <li><NavLink page="empresa" onNavigate={onNavigate} icon={<OfficeBuildingIcon className="w-6 h-6" />} label="Empresa" active={activePage === 'empresa'} /></li>}
              {permissions.lojas && <li><NavLink page="lojas" onNavigate={onNavigate} icon={<BuildingStoreIcon className="w-6 h-6" />} label="Lojas" active={activePage === 'lojas'} /></li>}
              {permissions.settings && <li><NavLink page="settings" onNavigate={onNavigate} icon={<CogIcon className="w-6 h-6" />} label="Configurações" active={activePage === 'settings'} /></li>}
              {permissions.exemplo && <li><NavLink page="exemplo" onNavigate={onNavigate} icon={<DocumentTextIcon className="w-6 h-6" />} label="Exemplos" active={activePage === 'exemplo'} /></li>}
              
              {user.email === 'ericksonprofissional@gmail.com' && (
                  <li><NavLink page="simuladorSolar" onNavigate={onNavigate} icon={<SparklesIcon className="w-6 h-6" />} label="Simulador Solar" active={activePage === 'simuladorSolar'} /></li>
              )}
            </ul>
          </nav>
          <div className="pt-4 mt-4 border-t border-gray-700 space-y-2">
             <div className="flex items-center justify-between p-2 mb-2 text-gray-300">
                  <div>
                      <div className="font-semibold">{user.name}</div>
                      <div className="text-xs text-gray-400">{user.email}</div>
                  </div>
                  <button 
                     onClick={toggleTheme}
                     className="p-2 rounded-full hover:bg-gray-700 transition-colors"
                     title="Alternar Tema"
                  >
                     {isLightMode ? <MoonIcon className="w-5 h-5 text-gray-900" /> : <SunIcon className="w-5 h-5 text-yellow-400" />}
                  </button>
              </div>
              
              {notifPermission !== 'granted' && (
                <button
                   onClick={requestPermission}
                   className="flex items-center w-full px-4 py-3 text-sm font-medium text-white transition-colors rounded-lg bg-yellow-600 hover:bg-yellow-700 mb-2"
                 >
                   <BellIcon className="w-6 h-6" />
                   <span className="ml-3">Ativar Notificações</span>
                 </button>
              )}
{isInstallable && (
                <button
                   onClick={installPWA}
                   className="flex items-center w-full px-4 py-3 text-sm font-medium text-white transition-colors rounded-lg bg-blue-accent hover:bg-blue-accent/90 mb-2"
                 >
                   <DownloadIcon className="w-6 h-6" />
                   <span className="ml-3">Instalar App</span>
                 </button>
              )}
               <button
                  onClick={onLogout}
                  className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-300 transition-colors rounded-lg hover:bg-red-accent hover:text-white"
                >
                  <LogoutIcon className="w-6 h-6" />
                  <span className="ml-3">Sair</span>
                </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;