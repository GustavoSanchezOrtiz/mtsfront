/**
 * Registrador del Service Worker para la PWA de MTS Plataforma
 */
export function registerServiceWorker() {
  if ('serviceWorker' in navigator && (import.meta.env.PROD || window.location.protocol === 'https:')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    console.log('[PWA] Nueva versión disponible de MTS Plataforma.');
                  } else {
                    console.log('[PWA] Plataforma MTS lista para funcionamiento offline.');
                  }
                }
              };
            }
          };
        })
        .catch((err) => {
          console.warn('[PWA] Registro de Service Worker no completado:', err);
        });
    });
  }
}
