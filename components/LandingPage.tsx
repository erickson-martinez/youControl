
import React, { useEffect } from 'react';
import { CashIcon, ShoppingCartIcon, UsersIcon, CheckCircleIcon, ArrowUpCircleIcon, ShieldCheckIcon } from './icons';
import { API_BASE_URL } from '../constants';

interface LandingPageProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick, onRegisterClick }) => {
  
  useEffect(() => {
    // Wake up the server as soon as the Landing Page loads
    fetch(API_BASE_URL).catch(err => console.warn('Waking up server...', err));
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans selection:bg-blue-500 selection:text-white">
      {/* Navbar */}
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-green-400">
          Seu Controle
        </div>
        <button
          onClick={onLoginClick}
          className="px-6 py-2 text-sm font-bold text-white transition-all bg-gray-800 rounded-full hover:bg-gray-700 border border-gray-700 hover:border-gray-500"
        >
          Entrar
        </button>
      </nav>

      {/* Hero Section */}
      <header className="container mx-auto px-6 py-16 md:py-24 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
          Planejamento Financeiro & <br />
          <span className="text-blue-500">Compras Inteligentes</span>
        </h1>
        <p className="text-gray-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
          Não apenas registre gastos. Planeje seu futuro financeiro e economize no mercado com uma base de preços alimentada pela comunidade.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={onRegisterClick}
            className="px-8 py-4 text-lg font-bold text-white transition-transform transform bg-blue-600 rounded-lg hover:bg-blue-700 hover:scale-105 shadow-lg shadow-blue-500/20"
          >
            Começar Agora Grátis
          </button>
        </div>
      </header>

      {/* Features Grid */}
      <section className="bg-gray-800 py-20 relative overflow-hidden">
        {/* Decorative Blob */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>

        <div className="container mx-auto px-6 relative z-10">
          <h2 className="text-3xl font-bold text-center mb-16">Funcionalidades Poderosas</h2>
          
          <div className="grid md:grid-cols-2 gap-12">
            {/* Financeiro Feature */}
            <div className="bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-700 hover:border-blue-500/50 transition-colors">
              <div className="w-14 h-14 bg-blue-900/50 rounded-lg flex items-center justify-center mb-6 text-blue-400">
                <CashIcon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Planejamento Financeiro Real</h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Vá além do controle mensal. Nosso módulo financeiro é desenhado para dar visão de longo prazo. Defina metas, visualize projeções futuras e entenda o impacto de suas decisões hoje no seu saldo de amanhã.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center text-gray-300">
                  <ArrowUpCircleIcon className="w-5 h-5 text-green-500 mr-3" />
                  Previsão de saldo futuro
                </li>
                <li className="flex items-center text-gray-300">
                  <CheckCircleIcon className="w-5 h-5 text-blue-500 mr-3" />
                  Controle de contas compartilhadas
                </li>
                <li className="flex items-center text-gray-300">
                  <ShieldCheckIcon className="w-5 h-5 text-yellow-500 mr-3" />
                  Gestão de recorrências
                </li>
              </ul>
            </div>

            {/* Lista de Compras Feature */}
            <div className="bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-700 hover:border-green-500/50 transition-colors">
              <div className="w-14 h-14 bg-green-900/50 rounded-lg flex items-center justify-center mb-6 text-green-400">
                <ShoppingCartIcon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Lista de Compras Colaborativa</h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Nunca mais pague caro. Nossa lista de compras permite compartilhar preços que os próprios usuários preenchem, alimentando continuamente o sistema com informações atualizadas de mercado.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center text-gray-300">
                  <UsersIcon className="w-5 h-5 text-purple-500 mr-3" />
                  Base de preços comunitária
                </li>
                <li className="flex items-center text-gray-300">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3" />
                  Comparativo em tempo real
                </li>
                <li className="flex items-center text-gray-300">
                  <ArrowUpCircleIcon className="w-5 h-5 text-blue-500 mr-3" />
                  Histórico de compras
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works / More Features */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold">Gestão Completa</h2>
          <p className="text-gray-400 mt-4">Uma plataforma única para organizar sua vida pessoal e profissional.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-400">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h4 className="font-bold mb-2">Ponto Eletrônico</h4>
            <p className="text-sm text-gray-500">Registre suas horas de trabalho de forma simples e integrada.</p>
          </div>
          <div className="text-center p-4">
             <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-400">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <h4 className="font-bold mb-2">Gestão de OS</h4>
            <p className="text-sm text-gray-500">Abra e acompanhe Ordens de Serviço rapidamente.</p>
          </div>
          <div className="text-center p-4">
             <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-red-400">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m-1 4h1M4 21V5a2 2 0 012-2h12a2 2 0 012 2v16" /></svg>
            </div>
            <h4 className="font-bold mb-2">Mult-Empresa</h4>
            <p className="text-sm text-gray-500">Gerencie múltiplas empresas e lojas em um só lugar.</p>
          </div>
           <div className="text-center p-4">
             <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-green-400">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <h4 className="font-bold mb-2">RH Simplificado</h4>
            <p className="text-sm text-gray-500">Controle de colaboradores e permissões de acesso.</p>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="bg-gray-950 py-12 border-t border-gray-800 text-center">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl font-bold mb-6">Pronto para assumir o controle?</h2>
          <button
            onClick={onRegisterClick}
            className="px-8 py-3 text-base font-bold text-white transition-all bg-green-600 rounded-full hover:bg-green-700 hover:shadow-lg hover:shadow-green-500/20"
          >
            Criar Minha Conta Grátis
          </button>
          <p className="mt-8 text-gray-600 text-sm">
            © {new Date().getFullYear()} Seu Controle Financeiro. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
