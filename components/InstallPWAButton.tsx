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
    
      <button
        onClick={handleInstallClick}
        className={`py-2 px-4 text-sm ${deferredPrompt ? 'bg-blue-accent hover:bg-blue-600 animate-bounce shadow-blue-500/50' : 'bg-gray-700 hover:bg-gray-600 border border-gray-600'} text-white font-bold rounded-lg shadow flex items-center justify-center gap-2 transition-all duration-300 whitespace-nowrap`}
        style={deferredPrompt ? { animationIterationCount: 3 } : {}}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {deferredPrompt ? 'Instalar App' : isIOS ? 'Instalar iOS' : 'Instalar App'}
      </button>
    
  );
};

export default InstallPWAButton;
