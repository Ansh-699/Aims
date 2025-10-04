import { useEffect, useCallback } from 'react';

export function useServiceWorker() {
  const registerServiceWorker = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('[SW] Service worker registered:', registration);
        
        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data.type === 'BACKGROUND_FETCH_ATTENDANCE') {
            // Trigger background fetch in the app
            window.dispatchEvent(new CustomEvent('background-fetch-attendance'));
          }
        });
        
        // Register for background sync if supported
        if ('sync' in registration) {
          await (registration as any).sync.register('background-attendance-sync');
        }
        
        return registration;
      } catch (error) {
        console.error('[SW] Service worker registration failed:', error);
      }
    }
  }, []);

  const unregisterServiceWorker = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }
  }, []);

  useEffect(() => {
    registerServiceWorker();
    
    return () => {
      // Cleanup on unmount
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', () => {});
      }
    };
  }, [registerServiceWorker]);

  return {
    registerServiceWorker,
    unregisterServiceWorker
  };
}