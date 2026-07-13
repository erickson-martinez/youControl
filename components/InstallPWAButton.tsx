import React, { useState, useEffect } from 'react';
import { getDeferredPrompt } from '../src/pwa-prompt';

const InstallPWAButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(getDeferredPrompt());
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
    
    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    const handleInstallable = () => {
      setDeferredPrompt(getDeferredPrompt());
    };

    if (getDeferredPrompt()) {
      handleInstallable();
    }

    window.addEventListener('pwa-installable', handleInstallable);
    
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('pwa-installable', handleInstallable);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('Error with PWA install prompt:', err);
        alert('Erro ao tentar instalar: ' + (err as Error).message);
      }
    } else if (isIOS) {
      alert('Para instalar no iOS: Toque em "Compartilhar" (ícone do quadrado com a seta) e depois em "Adicionar à Tela de Início".');
    } else {
      alert('A instalação direta pelo botão não está disponível. O app pode já estar instalado ou o navegador bloqueia o prompt automático (ex: em pré-visualizações). Instale através do menu do navegador ("Adicionar à tela inicial" ou "Instalar aplicativo").');
    }
  };

  if (isStandalone) {
    return null; 
  }

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[9999] w-11/12 max-w-md">
      <button
        onClick={handleInstallClick}
        className={`w-full py-3 px-4 ${deferredPrompt ? 'bg-blue-accent hover:bg-blue-600 animate-bounce shadow-blue-500/50' : 'bg-gray-700 hover:bg-gray-600 border border-gray-600 shadow-gray-900/50'} text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all duration-300`}
        style={deferredPrompt ? { animationIterationCount: 3 } : {}}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {deferredPrompt ? 'Instalar App (Acesso Rápido)' : isIOS ? 'Como Instalar no iOS' : 'Instalar App (Manual)'}
      </button>
    </div>
  );
};

export default InstallPWAButton;
