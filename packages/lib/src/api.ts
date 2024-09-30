import type { Config, SesamyAPI } from "@sesamy/sesamy-js";

interface SesamyWindow {
  sesamy?: SesamyAPI;
}

// Extend the global Window type with your SesamyWindow interface
declare global {
  interface Window extends SesamyWindow {}
}

export async function getApi() {
  if (window.sesamy) {
    return window.sesamy;
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (window.sesamy) {
        resolve(window.sesamy);
      } else {
        reject(
          new Error(
            "sesamyReady event did not occur within the expected time.",
          ),
        );
      }
    }, 5000);

    window.addEventListener("sesamyJsReady", () => {
      clearTimeout(timeout);
      resolve(true);
    });
  });
}
