import { useState, useEffect } from 'react';
import { Download, RefreshCw, X } from 'lucide-react';
import { isStandalone, getInstallInstructions, activateUpdate, checkForUpdates } from '../lib/sw';

export function PWAPrompt() {
  const [showInstall, setShowInstall] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const [installInstructions, setInstallInstructions] = useState<{ platform: string; instructions: string } | null>(null);

  useEffect(() => {
    // Check if already installed
    if (isStandalone()) {
      setShowInstall(false);
      return;
    }

    // Show install instructions after a short delay
    const timer = setTimeout(() => {
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setInstallInstructions(getInstallInstructions());
        setShowInstall(true);
      }
    }, 5000);

    // Listen for service worker updates
    const checkUpdate = () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(reg => {
          if (reg && reg.waiting) {
            setShowUpdate(true);
          }
        });
      }
    };

    window.addEventListener('focus', checkUpdate);
    checkUpdate();

    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', checkUpdate);
    };
  }, []);

  const handleInstallDismiss = () => {
    setShowInstall(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  const handleUpdate = () => {
    activateUpdate();
    setShowUpdate(false);
  };

  const handleUpdateLater = () => {
    setShowUpdate(false);
  };

  const handleCheckUpdate = async () => {
    await checkForUpdates();
    setTimeout(() => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(reg => {
          if (reg && reg.waiting) {
            setShowUpdate(true);
          }
        });
      }
    }, 1000);
  };

  return (
    <>
      {/* Install Prompt */}
      {showInstall && installInstructions && (
        <div className="pwa-prompt pwa-install">
          <div className="pwa-prompt-content">
            <Download size={24} className="pwa-prompt-icon" />
            <div className="pwa-prompt-text">
              <h3>安装应用到{installInstructions.platform}</h3>
              <p>{installInstructions.instructions}</p>
            </div>
            <button 
              onClick={handleInstallDismiss}
              className="pwa-prompt-close"
              aria-label="关闭"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Update Prompt */}
      {showUpdate && (
        <div className="pwa-prompt pwa-update">
          <div className="pwa-prompt-content">
            <RefreshCw size={24} className="pwa-prompt-icon" />
            <div className="pwa-prompt-text">
              <h3>新版本可用</h3>
              <p>发现应用更新，立即更新以获取最新功能和修复。</p>
            </div>
            <div className="pwa-prompt-actions">
              <button onClick={handleUpdate} className="btn btn-primary btn-sm">
                立即更新
              </button>
              <button onClick={handleUpdateLater} className="btn btn-ghost btn-sm">
                稍后提醒
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Update Check (in Settings) */}
      {!showUpdate && (
        <button 
          onClick={handleCheckUpdate}
          className="btn btn-ghost update-check-btn"
          title="检查更新"
        >
          <RefreshCw size={16} />
          检查更新
        </button>
      )}

      <style>{`
        .pwa-prompt {
          position: fixed;
          bottom: var(--spacing-lg);
          left: var(--spacing-lg);
          right: var(--spacing-lg);
          z-index: 1000;
          max-width: 600px;
          margin: 0 auto;
        }

        @media (min-width: 768px) {
          .pwa-prompt {
            left: auto;
            right: var(--spacing-xl);
            max-width: 400px;
          }
        }

        .pwa-prompt-content {
          display: flex;
          align-items: flex-start;
          gap: var(--spacing-md);
          padding: var(--spacing-lg);
          background-color: var(--color-bg-primary);
          border: 2px solid var(--color-accent);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-xl);
        }

        .pwa-install .pwa-prompt-content {
          border-color: var(--color-info);
        }

        .pwa-update .pwa-prompt-content {
          border-color: var(--color-success);
        }

        .pwa-prompt-icon {
          flex-shrink: 0;
          color: var(--color-accent);
        }

        .pwa-install .pwa-prompt-icon {
          color: var(--color-info);
        }

        .pwa-update .pwa-prompt-icon {
          color: var(--color-success);
        }

        .pwa-prompt-text {
          flex: 1;
          min-width: 0;
        }

        .pwa-prompt-text h3 {
          font-size: var(--font-size-base);
          font-weight: 600;
          margin: 0 0 var(--spacing-xs);
          color: var(--color-text-primary);
        }

        .pwa-prompt-text p {
          font-size: var(--font-size-sm);
          margin: 0;
          color: var(--color-text-secondary);
          line-height: 1.5;
        }

        .pwa-prompt-close {
          flex-shrink: 0;
          padding: var(--spacing-xs);
          background: transparent;
          border: none;
          cursor: pointer;
          color: var(--color-text-secondary);
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
        }

        .pwa-prompt-close:hover {
          background-color: var(--color-bg-secondary);
          color: var(--color-text-primary);
        }

        .pwa-prompt-actions {
          display: flex;
          gap: var(--spacing-sm);
          margin-top: var(--spacing-sm);
          flex-wrap: wrap;
        }

        .btn-sm {
          padding: var(--spacing-xs) var(--spacing-md);
          font-size: var(--font-size-sm);
        }

        .update-check-btn {
          position: fixed;
          bottom: var(--spacing-xl);
          right: var(--spacing-xl);
          z-index: 999;
          box-shadow: var(--shadow-lg);
        }

        @media (max-width: 768px) {
          .update-check-btn {
            display: none;
          }
        }
      `}</style>
    </>
  );
}
