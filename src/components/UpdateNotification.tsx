/**
 * PWA Update Notification Component
 * 
 * Shows a notification when a new Service Worker version is available.
 * User must click to reload and activate the update.
 * This prevents automatic reload that would lose unsaved data.
 */

import { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';

export function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleUpdate = (reg: ServiceWorkerRegistration) => {
      setRegistration(reg);
      setShowUpdate(true);
    };

    // Listen for waiting SW (new version installed but not activated)
    navigator.serviceWorker.ready.then(reg => {
      if (reg.waiting) {
        handleUpdate(reg);
      }

      // Listen for new SW installation
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available
            handleUpdate(reg);
          }
        });
      });
    });

    // Listen for controllerchange (new SW activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // New SW took control, reload to get new content
      window.location.reload();
    });
  }, []);

  const handleUpdate = () => {
    if (!registration || !registration.waiting) return;

    // Tell waiting SW to skip waiting and activate
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    // Reload will happen automatically when new SW activates (controllerchange event)
  };

  if (!showUpdate) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: 'var(--spacing-lg)',
        right: 'var(--spacing-lg)',
        backgroundColor: 'var(--color-primary)',
        color: 'white',
        padding: 'var(--spacing-md)',
        borderRadius: 'var(--radius-md)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-md)',
        maxWidth: '400px',
        zIndex: 9999,
        animation: 'slideUp 0.3s ease-out'
      }}
    >
      <RefreshCw size={24} />
      <div style={{ flex: 1 }}>
        <strong style={{ display: 'block', marginBottom: '4px' }}>新版本可用</strong>
        <p style={{ margin: 0, fontSize: '0.9em', opacity: 0.9 }}>
          点击更新以获取最新内容
        </p>
      </div>
      <button
        onClick={handleUpdate}
        className="btn btn-secondary"
        style={{
          backgroundColor: 'white',
          color: 'var(--color-primary)',
          padding: '8px 16px'
        }}
      >
        更新
      </button>
      <button
        onClick={() => setShowUpdate(false)}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          padding: '4px'
        }}
        aria-label="关闭"
      >
        <X size={20} />
      </button>
    </div>
  );
}
