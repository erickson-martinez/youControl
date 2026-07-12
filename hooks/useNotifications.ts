import { useState, useEffect, useCallback } from 'react';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      alert('Seu navegador não suporta notificações.');
      return false;
    }
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        sendNotification('Notificações Ativadas!', {
          body: 'Você receberá alertas importantes sobre suas finanças e listas de compras.',
        });
      }
      return result === 'granted';
    } catch (e) {
      console.error(e);
      return false;
    }
  }, []);

  const sendNotification = useCallback(async (title: string, options?: NotificationOptions) => {
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          if (registration && registration.showNotification) {
             await registration.showNotification(title, {
                icon: '/pwa-192x192.png',
                badge: '/mask-icon.svg',
                vibrate: [200, 100, 200],
                ...options
              });
             return;
          }
        }
        
        // Fallback to basic Notification API
        new Notification(title, {
          icon: '/pwa-192x192.png',
          ...options
        });
      } catch (error) {
        console.error('Error showing notification', error);
        // Final fallback
        new Notification(title, {
          icon: '/pwa-192x192.png',
          ...options
        });
      }
    }
  }, []);

  return { permission, requestPermission, sendNotification };
}
