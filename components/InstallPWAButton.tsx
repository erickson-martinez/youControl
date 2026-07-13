import React, { useState, useEffect } from 'react';
import { getDeferredPrompt } from '../src/pwa-prompt';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const InstallPWAButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(getDeferredPrompt());

  useEffect(() => {
    const handleInstallable = () => {
      setDeferredPrompt(getDeferredPrompt());
    };

    if (getDeferredPrompt()) {
      handleInstallable();
    }

    window.addEventListener('pwa-installable', handleInstallable);
    
    // Also listen directly just in case
    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    return () => {
      window.removeEventListener('pwa-installable', handleInstallable);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
    } catch (err) {
      console.error('Error with PWA install prompt:', err);
    }
    setDeferredPrompt(null);
  };

  if (!deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[9999] w-11/12 max-w-md">
      <button
        onClick={handleInstallClick}
        className="w-full py-3 px-4 bg-blue-accent hover:bg-blue-600 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all duration-300 animate-bounce"
        style={{ animationIterationCount: 3 }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Instalar App (Acesso Rápido)
      </button>
    </div>
  );
};

export default InstallPWAButton;
