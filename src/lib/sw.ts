/**
 * Service Worker registration and update management
 * 
 * Features:
 * - Register service worker
 * - Detect and handle updates
 * - Check for updates on app start, focus, and manual refresh
 * - Notify user about available updates
 */

export interface ServiceWorkerUpdate {
  available: boolean;
  registration: ServiceWorkerRegistration | null;
}

type UpdateCallback = (update: ServiceWorkerUpdate) => void;

let updateCallback: UpdateCallback | null = null;
let registration: ServiceWorkerRegistration | null = null;

/**
 * Register service worker and set up update detection
 */
export async function registerServiceWorker(onUpdate?: UpdateCallback): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported');
    return;
  }

  if (onUpdate) {
    updateCallback = onUpdate;
  }

  try {
    registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('[PWA] Service Worker registered:', registration.scope);

    // Check for updates on registration
    await checkForUpdates();

    // Set up update detection
    registration.addEventListener('updatefound', () => {
      const newWorker = registration!.installing;
      console.log('[PWA] Update found, installing...');

      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker installed, update available
            console.log('[PWA] New version installed, update available');
            notifyUpdate(true, registration!);
          }
        });
      }
    });

    // Listen for controller change (new SW activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[PWA] New service worker activated');
      // Reload page to get new version
      if (!window.location.hash.includes('/edit')) {
        window.location.reload();
      }
    });

    // Check for updates periodically (every 5 minutes)
    setInterval(() => {
      checkForUpdates();
    }, 5 * 60 * 1000);

    // Check for updates when app gains focus
    window.addEventListener('focus', () => {
      checkForUpdates();
    });

    // Check for updates when online
    window.addEventListener('online', () => {
      checkForUpdates();
    });

  } catch (error) {
    console.error('[PWA] Service Worker registration failed:', error);
  }
}

/**
 * Check for service worker updates
 */
export async function checkForUpdates(): Promise<void> {
  if (!registration) {
    return;
  }

  try {
    await registration.update();
    console.log('[PWA] Checked for updates');
  } catch (error) {
    console.error('[PWA] Update check failed:', error);
  }
}

/**
 * Activate waiting service worker immediately
 */
export function activateUpdate(): void {
  if (!registration || !registration.waiting) {
    console.warn('[PWA] No waiting service worker to activate');
    return;
  }

  console.log('[PWA] Activating new service worker...');
  registration.waiting.postMessage({ type: 'SKIP_WAITING' });
}

/**
 * Clear all service worker caches
 */
export async function clearCache(): Promise<void> {
  if (!registration || !registration.active) {
    return;
  }

  return new Promise((resolve) => {
    const messageChannel = new MessageChannel();
    
    messageChannel.port1.onmessage = (event) => {
      if (event.data && event.data.type === 'CACHE_CLEARED') {
        console.log('[PWA] Cache cleared');
        resolve();
      }
    };

    registration!.active!.postMessage(
      { type: 'CLEAR_CACHE' },
      [messageChannel.port2]
    );
  });
}

/**
 * Unregister service worker (for development/testing)
 */
export async function unregisterServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  
  for (const registration of registrations) {
    await registration.unregister();
    console.log('[PWA] Service Worker unregistered');
  }

  // Clear all caches
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  console.log('[PWA] All caches cleared');
}

/**
 * Check if app is running in standalone mode (installed PWA)
 */
export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true || // iOS
    document.referrer.includes('android-app://') // Android TWA
  );
}

/**
 * Check if app is installable
 */
export function canInstall(): boolean {
  return 'BeforeInstallPromptEvent' in window;
}

/**
 * Get install instructions based on platform
 */
export function getInstallInstructions(): { platform: string; instructions: string } {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return {
      platform: 'iOS',
      instructions: '点击分享按钮，然后选择"添加到主屏幕"即可安装此应用。'
    };
  }
  
  if (/android/.test(userAgent)) {
    return {
      platform: 'Android',
      instructions: '点击浏览器菜单，选择"安装应用"或"添加到主屏幕"即可安装。'
    };
  }
  
  return {
    platform: 'Desktop',
    instructions: '点击地址栏右侧的安装图标，或在浏览器菜单中选择"安装应用"。'
  };
}

// Internal: Notify about update
function notifyUpdate(available: boolean, reg: ServiceWorkerRegistration): void {
  if (updateCallback) {
    updateCallback({ available, registration: reg });
  }
}
