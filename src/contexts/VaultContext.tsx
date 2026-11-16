import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { isVaultInitialized, getSetting, setSetting } from '../lib/storage';
import { verifyPassword, createPasswordVerifier } from '../lib/crypto';
import type { PasswordVerifier } from '../types/crypto';

interface VaultContextType {
  isInitialized: boolean;
  isUnlocked: boolean;
  unlock: (password: string) => Promise<boolean>;
  lock: () => void;
  initialize: (password: string) => Promise<void>;
  password: string | null;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export function useVault() {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within VaultProvider');
  }
  return context;
}

export function VaultProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkVaultStatus();
  }, []);

  const checkVaultStatus = async () => {
    const initialized = await isVaultInitialized();
    setIsInitialized(initialized);
    // Note: No session restoration - full page reload requires re-entering password
    // In-memory password state preserved only during client-side navigation
    setLoading(false);
  };

  const initialize = async (pwd: string) => {
    // Create password verifier (only non-secret verifier persists)
    const verifier = await createPasswordVerifier(pwd);
    await setSetting('password_verifier', verifier);
    await setSetting('vault_initialized', true);
    
    setIsInitialized(true);
    setPassword(pwd);
    setIsUnlocked(true);
    // Password kept IN MEMORY ONLY - no sessionStorage/localStorage persistence
  };

  const unlock = async (pwd: string): Promise<boolean> => {
    const verifier = await getSetting<PasswordVerifier>('password_verifier');
    if (!verifier) {
      return false;
    }

    const valid = await verifyPassword(pwd, verifier);
    if (valid) {
      setPassword(pwd);
      setIsUnlocked(true);
      // Password kept IN MEMORY ONLY - survives client-side navigation, lost on reload
      return true;
    }
    return false;
  };

  const lock = () => {
    // Clear password from memory only (never persisted anywhere)
    setPassword(null);
    setIsUnlocked(false);
    
    // Revoke all blob URLs
    // TODO: Track and revoke all active blob URLs
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <VaultContext.Provider value={{ isInitialized, isUnlocked, unlock, lock, initialize, password }}>
      {children}
    </VaultContext.Provider>
  );
}
