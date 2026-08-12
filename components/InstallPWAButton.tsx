import React, { useState, useEffect } from 'react';
import { getDeferredPrompt } from '../src/pwa-prompt';

const InstallPWAButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(getDeferredPrompt());
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check if already installed
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
    
    // Check if inside iFrame
    try {
      setIsInIframe(window.self !== window.top);
    } catch (e) {
      setIsInIframe(true);
    }

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
    if (deferredPrompt && !isInIframe) {
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
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  const handleCopyUrl = async () => {
    const currentUrl = window.location.href;
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      alert(`URL do app: ${currentUrl}`);
    }
  };

  const handleOpenNewTab = () => {
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
  };

  if (isStandalone) {
    return null; 
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        className={`py-2 px-4 text-sm ${deferredPrompt && !isInIframe ? 'bg-blue-600 hover:bg-blue-500 animate-bounce shadow-blue-500/50' : 'bg-gray-800 hover:bg-gray-700 border border-gray-700'} text-white font-bold rounded-xl shadow flex items-center justify-center gap-2 transition-all duration-300 whitespace-nowrap`}
        style={deferredPrompt && !isInIframe ? { animationIterationCount: 3 } : {}}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span>Instalar App</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-gray-900 border border-gray-700 text-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg bg-gray-800"
            >
              ✕
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-2xl">
                📱
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Instalar Seu Controle</h3>
                <p className="text-xs text-gray-400">Aplicativo Web Progressivo (PWA)</p>
              </div>
            </div>

            {isInIframe && (
              <div className="bg-amber-900/40 border border-amber-600/50 p-3 rounded-xl text-amber-200 text-xs space-y-2">
                <p className="font-semibold flex items-center gap-1.5">
                  <span>⚠️</span> Ambiente de Pré-visualização (iFrame)
                </p>
                <p>
                  Navegadores bloqueiam o prompt automático de instalação dentro de iFrames. Para instalar o app nativamente no seu dispositivo, abra a URL em uma nova aba fora do visualizador:
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleOpenNewTab}
                    className="flex-1 py-1.5 px-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs transition-colors"
                  >
                    🔗 Abrir em Nova Aba
                  </button>
                  <button
                    onClick={handleCopyUrl}
                    className="py-1.5 px-3 bg-gray-800 hover:bg-gray-700 text-amber-300 border border-amber-600/30 font-semibold rounded-lg text-xs transition-colors"
                  >
                    {copied ? '✓ Copiado' : '📋 Copiar Link'}
                  </button>
                </div>
              </div>
            )}

            {isIOS ? (
              <div className="space-y-3 text-sm text-gray-300 bg-gray-800/60 p-4 rounded-xl border border-gray-700/50">
                <p className="font-semibold text-blue-300 flex items-center gap-1.5">
                  <span>🍎</span> No iPhone / iPad (Safari):
                </p>
                <ol className="list-decimal list-inside space-y-2 text-xs text-gray-300">
                  <li>Acesse a URL diretamente pelo navegador <strong>Safari</strong>.</li>
                  <li>Toque no botão de <strong>Compartilhar</strong> (ícone do quadrado com seta para cima).</li>
                  <li>Role as opções e selecione <strong>"Adicionar à Tela de Início"</strong>.</li>
                  <li>Toque em <strong>"Adicionar"</strong> no canto superior direito.</li>
                </ol>
              </div>
            ) : (
              <div className="space-y-4 text-sm text-gray-300 bg-gray-800/60 p-4 rounded-xl border border-gray-700/50">
                <div>
                  <p className="font-semibold text-blue-300 flex items-center gap-1.5 mb-1">
                    <span>🤖</span> No Celular (Android - Chrome):
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs text-gray-300">
                    <li>Acesse a URL diretamente pelo Google Chrome.</li>
                    <li>Toque no menu de três pontos (<strong>⋮</strong>) no canto superior direito.</li>
                    <li>Selecione <strong>"Adicionar à tela inicial"</strong> ou <strong>"Instalar aplicativo"</strong>.</li>
                  </ol>
                </div>

                <div className="pt-2 border-t border-gray-700/50">
                  <p className="font-semibold text-blue-300 flex items-center gap-1.5 mb-1">
                    <span>💻</span> No Computador (Chrome / Edge):
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs text-gray-300">
                    <li>Abra a URL fora de iFrames em uma nova aba do navegador.</li>
                    <li>Clique no menu (três pontos) ou no ícone de instalação na barra de endereços.</li>
                    <li>Selecione <strong>Salvar e Compartilhar &gt; Instalar Seu Controle</strong> (ou "Criar Atalho" abrindo como janela).</li>
                  </ol>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowModal(false)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg text-sm"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default InstallPWAButton;

