export const getDeferredPrompt = () => (window as any)._deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  (window as any)._deferredPrompt = e;
  // Dispatch a custom event so React can pick it up
  window.dispatchEvent(new Event('pwa-installable'));
});
