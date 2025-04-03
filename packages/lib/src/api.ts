import type { SesamyAPI } from '@sesamy/sesamy-js';

interface SesamyWindow {
  sesamy?: SesamyAPI;
}

// Extend the global Window type with your SesamyWindow interface
declare global {
  interface Window extends SesamyWindow {}
}

export async function getApi(): Promise<SesamyAPI> {
  if (window.sesamy?.isReady()) {
    return window.sesamy;
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (window.sesamy) {
        resolve(window.sesamy);
      } else {
        reject(new Error('sesamyReady event did not occur within the expected time.'));
      }
    }, 5000);

    function onSesamyJsReady() {
      if (!window.sesamy) {
        reject(new Error('Sesamy API is not available'));
      } else {
        clearTimeout(timeout);
        window.removeEventListener('sesamyJsReady', onSesamyJsReady);

        resolve(window.sesamy);
      }
    }

    window.addEventListener('sesamyJsReady', onSesamyJsReady);
  });
}
