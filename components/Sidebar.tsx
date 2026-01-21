
import React from 'react';
import type { User, MenuPermissions, ActivePage } from '../types';
import { HomeIcon, CashIcon, UsersIcon, ClipboardListIcon, CogIcon, XIcon, OfficeBuildingIcon, ClockIcon, LogoutIcon, ClipboardCheckIcon, InboxInIcon, DocumentTextIcon, ShoppingCartIcon, BookOpenIcon } from './icons';

interface SidebarProps {
  user: User;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
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

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout, isOpen, onClose, permissions, activePage, onNavigate, canClockIn }) => {
  return (
    <>
      {/* Overlay para fechar em modo mobile */}
      {isOpen && <div onClick={onClose} className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden" aria-hidden="true" />}
      
      <aside 
        id="default-sidebar"
        className={`fixed top-0 left-0 z-40 w-64 h-screen bg-gray-800 transition-transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
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
              {permissions.financeiro && <li><NavLink page="financeiro" onNavigate={onNavigate} icon={<CashIcon className="w-6 h-6" />} label="Financeiro" active={activePage === 'financeiro'} /></li>}
              {permissions.financialManual && <li><NavLink page="financialManual" onNavigate={onNavigate} icon={<BookOpenIcon className="w-6 h-6" />} label="Manual Financeiro" active={activePage === 'financialManual'} /></li>}
              {permissions.listPurcharse && <li><NavLink page="listPurcharse" onNavigate={onNavigate} icon={<ShoppingCartIcon className="w-6 h-6" />} label="Lista de Compras" active={activePage === 'listPurcharse'} /></li>}
              {permissions.rh && <li><NavLink page="rh" onNavigate={onNavigate} icon={<UsersIcon className="w-6 h-6" />} label="RH" active={activePage === 'rh'} /></li>}
              {permissions.ponto && canClockIn && <li><NavLink page="ponto" onNavigate={onNavigate} icon={<ClockIcon className="w-6 h-6" />} label="Ponto" active={activePage === 'ponto'} /></li>}
              {permissions.aprovarHoras && <li><NavLink page="aprovar-horas" onNavigate={onNavigate} icon={<ClipboardCheckIcon className="w-6 h-6" />} label="Aprovar Horas" active={activePage === 'aprovar-horas'} /></li>}
              {permissions.os && <li><NavLink page="os" onNavigate={onNavigate} icon={<ClipboardListIcon className="w-6 h-6" />} label="OS" active={activePage === 'os'} /></li>}
              {permissions.chamados && <li><NavLink page="chamados" onNavigate={onNavigate} icon={<InboxInIcon className="w-6 h-6" />} label="Chamados" active={activePage === 'chamados'} /></li>}
              {permissions.empresa && <li><NavLink page="empresa" onNavigate={onNavigate} icon={<OfficeBuildingIcon className="w-6 h-6" />} label="Empresa" active={activePage === 'empresa'} /></li>}
              {permissions.settings && <li><NavLink page="settings" onNavigate={onNavigate} icon={<CogIcon className="w-6 h-6" />} label="Configurações" active={activePage === 'settings'} /></li>}
              {permissions.exemplo && <li><NavLink page="exemplo" onNavigate={onNavigate} icon={<DocumentTextIcon className="w-6 h-6" />} label="Exemplos" active={activePage === 'exemplo'} /></li>}
            </ul>
          </nav>
          <div className="pt-4 mt-4 border-t border-gray-700">
             <div className="flex items-center p-2 mb-2 text-gray-300">
                  <div>
                      <div className="font-semibold">{user.name}</div>
                      <div className="text-xs text-gray-400">{user.phone}</div>
                  </div>
              </div>
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
