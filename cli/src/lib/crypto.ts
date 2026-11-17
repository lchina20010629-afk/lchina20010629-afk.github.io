/**
 * Encryption utilities
 */

import { createHash, pbkdf2Sync, randomBytes } from 'crypto';

export const ITERATIONS = 600000;

export interface EncryptedEnvelope {
  version: 'v1';
  algorithm: 'AES-256-GCM';
  kdf: 'PBKDF2-SHA256';
  salt: string;
  iv: string;
  iterations: number;
  ciphertext: string;
  authTag: string;
}

export interface PasswordVerifier {
  salt: string;
  verifier: string;
  iterations: number;
}

/**
 * Derive encryption key from password
 */
export function deriveKey(password: string, salt: Buffer): Buffer {
  return pbkdf2Sync(password, salt, ITERATIONS, 32, 'sha256');
}

/**
 * Create password verifier for manifest
 */
export function createPasswordVerifier(password: string): PasswordVerifier {
  const salt = randomBytes(32);
  const key = deriveKey(password, salt);
  const verifier = createHash('sha256').update(key).digest('hex');
  
  return {
    salt: salt.toString('hex'),
    verifier,
    iterations: ITERATIONS,
  };
}

/**
 * Verify password against stored verifier
 * Returns true if valid, false if empty vault (not initialized)
 */
export function verifyPassword(password: string, verifier: PasswordVerifier): boolean {
  // Empty vault (placeholder) - not yet initialized
  if (!verifier.salt || !verifier.verifier || verifier.salt === '' || verifier.verifier === '') {
    return false; // Empty vault, not an error
  }
  
  const salt = Buffer.from(verifier.salt, 'hex');
  const key = deriveKey(password, salt);
  const computedVerifier = createHash('sha256').update(key).digest('hex');
  
  return computedVerifier === verifier.verifier;
}

/**
 * Encrypt data with AES-256-GCM
 */
export async function encrypt(data: Buffer, password: string): Promise<EncryptedEnvelope> {
  const { webcrypto } = await import('crypto');
  
  const salt = randomBytes(32);
  const iv = randomBytes(12);
  const key = deriveKey(password, salt);
  
  const cryptoKey = await webcrypto.subtle.importKey(
    'raw',
    key,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  const encrypted = await webcrypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    data
  );
  
  const encryptedArray = new Uint8Array(encrypted);
  const ciphertext = encryptedArray.slice(0, -16);
  const authTag = encryptedArray.slice(-16);
  
  return {
    version: 'v1',
    algorithm: 'AES-256-GCM',
    kdf: 'PBKDF2-SHA256',
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    iterations: ITERATIONS,
    ciphertext: Buffer.from(ciphertext).toString('hex'),
    authTag: Buffer.from(authTag).toString('hex'),
  };
}
