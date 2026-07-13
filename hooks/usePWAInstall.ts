import { useState, useEffect } from 'react';
import { getDeferredPrompt } from '../src/pwa-prompt';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWAInstall() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(getDeferredPrompt());
  const [isInstallable, setIsInstallable] = useState(!!getDeferredPrompt());

  useEffect(() => {
    const handleInstallable = () => {
      const prompt = getDeferredPrompt();
      setPromptEvent(prompt);
      setIsInstallable(!!prompt);
    };

    if (getDeferredPrompt()) {
      handleInstallable();
    }

    window.addEventListener('pwa-installable', handleInstallable);

    return () => {
      window.removeEventListener('pwa-installable', handleInstallable);
    };
  }, []);

  const installPWA = async () => {
    if (!promptEvent) return;
    try {
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
    } catch (err) {
      console.error('Error with PWA install prompt:', err);
    }
    
    setPromptEvent(null);
    setIsInstallable(false);
  };

  return { isInstallable, installPWA };
}
