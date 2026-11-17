/**
 * Manifest management with atomic updates
 */

import { readFile, writeFile, rename, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { randomBytes } from 'crypto';
import { PasswordVerifier } from './crypto.js';

export interface ManifestEntry {
  id: string;
  date: string;
  type: 'diary' | 'course' | 'weekly' | 'monthly' | 'yearly';
  encryptedPath: string;
  attachments?: Array<{
    id: string;
    encryptedPath: string;
    type: string;
  }>;
  publishedAt: string;
  lastUpdated?: string;
}

export interface Manifest {
  version: '1.0.0';
  vault: {
    version: '1.0.0';
    verifier: PasswordVerifier;
    createdAt: string;
    description?: string;
  };
  entries: ManifestEntry[];
  generatedAt: string;
}

/**
 * Load manifest from file, or return null if not exists
 */
export async function loadManifest(path: string): Promise<Manifest | null> {
  try {
    const content = await readFile(path, 'utf-8');
    return JSON.parse(content);
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      return null;
    }
    throw err;
  }
}

/**
 * Create new manifest with verifier
 */
export function createManifest(verifier: PasswordVerifier): Manifest {
  return {
    version: '1.0.0',
    vault: {
      version: '1.0.0',
      verifier,
      createdAt: new Date().toISOString(),
      description: 'Published encrypted entries',
    },
    entries: [],
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Save manifest atomically (write to temp, then rename)
 * Prevents corruption if interrupted
 */
export async function saveManifestAtomic(path: string, manifest: Manifest): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  
  // Write to temporary file first
  const tempPath = `${path}.tmp.${randomBytes(4).toString('hex')}`;
  await writeFile(tempPath, JSON.stringify(manifest, null, 2), 'utf-8');
  
  // Atomic rename
  await rename(tempPath, path);
}

/**
 * Upsert entry in manifest (preserves existing entries)
 */
export function upsertEntry(manifest: Manifest, entry: ManifestEntry): void {
  const existingIndex = manifest.entries.findIndex(e => e.id === entry.id);
  
  if (existingIndex >= 0) {
    // Update existing entry, preserve publishedAt, update lastUpdated
    manifest.entries[existingIndex] = {
      ...entry,
      publishedAt: manifest.entries[existingIndex].publishedAt,
      lastUpdated: new Date().toISOString(),
    };
  } else {
    // Add new entry
    manifest.entries.push(entry);
  }
  
  manifest.generatedAt = new Date().toISOString();
}
