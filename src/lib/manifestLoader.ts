/**
 * Load and decrypt published entries from public manifest
 */

import { validateManifest, type PublicManifest, type PublicEntryMetadata } from '../types/manifest';
import { decrypt } from '../lib/crypto';
import type { EncryptedEnvelope } from '../types/crypto';

export interface LoadedEntry {
  id: string;
  date: string;
  type: 'diary' | 'course' | 'weekly' | 'monthly' | 'yearly';
  title: string;
  content: string;
  tags?: string[];
  mood?: string;
  weather?: string;
  progress?: number;
  category?: string;
  images?: Array<{
    id: string;
    blobUrl: string;
    type: string;
  }>;
  isPublished: true; // Mark as read-only published entry
  publishedAt: string;
}

/**
 * Fetch and validate manifest from public data
 */
export async function fetchManifest(baseUrl: string = '/data'): Promise<PublicManifest> {
  const manifestUrl = `${baseUrl}/manifest.json`;
  
  try {
    const response = await fetch(manifestUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch manifest: ${response.status}`);
    }
    
    const manifest = await response.json();
    
    if (!validateManifest(manifest)) {
      throw new Error('Invalid manifest structure or suspicious paths detected');
    }
    
    return manifest;
  } catch (err) {
    if (err instanceof Error && err.message.includes('Failed to fetch')) {
      // No published content yet
      return {
        version: '1.0.0',
        vault: {
          version: '1.0.0',
          verifier: { salt: '', verifier: '', iterations: 600000 },
          createdAt: new Date().toISOString(),
        },
        entries: [],
        generatedAt: new Date().toISOString(),
      };
    }
    throw err;
  }
}

/**
 * Load and decrypt a single published entry
 */
export async function loadPublishedEntry(
  metadata: PublicEntryMetadata,
  password: string,
  baseUrl: string = '/data'
): Promise<LoadedEntry> {
  // Fetch encrypted entry
  const entryUrl = `${baseUrl}/${metadata.encryptedPath}`;
  const response = await fetch(entryUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch entry: ${response.status}`);
  }
  
  const envelope: EncryptedEnvelope = await response.json();
  
  // Decrypt entry content
  let decrypted: ArrayBuffer;
  try {
    decrypted = await decrypt(envelope, password);
  } catch {
    throw new Error('Decryption failed: wrong password or corrupted data');
  }
  
  const decoder = new TextDecoder();
  const json = decoder.decode(decrypted);
  const data = JSON.parse(json);
  
  // Load and decrypt images
  const images: Array<{ id: string; blobUrl: string; type: string }> = [];
  if (metadata.attachments) {
    for (const att of metadata.attachments) {
      try {
        // encryptedPath already includes "data/" prefix, so use root
        const imageUrl = `/${att.encryptedPath}`;
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) continue;
        
        const imageEnvelope: EncryptedEnvelope = await imageResponse.json();
        const imageDecrypted = await decrypt(imageEnvelope, password);
        const blob = new Blob([imageDecrypted], { type: att.type });
        const blobUrl = URL.createObjectURL(blob);
        
        images.push({
          id: att.id,
          blobUrl,
          type: att.type,
        });
      } catch (err) {
        console.error(`Failed to load image ${att.id}:`, err);
      }
    }
  }
  
  return {
    id: metadata.id,
    date: metadata.date,
    type: metadata.type,
    title: data.title,
    content: data.content,
    tags: data.tags,
    mood: data.mood,
    weather: data.weather,
    progress: data.progress,
    category: data.category,
    images: images.length > 0 ? images : undefined,
    isPublished: true,
    publishedAt: metadata.publishedAt,
  };
}

/**
 * Load all published entries of a specific type
 */
export async function loadPublishedEntries(
  type: 'diary' | 'course' | 'weekly' | 'monthly' | 'yearly',
  password: string,
  baseUrl: string = '/data'
): Promise<LoadedEntry[]> {
  const manifest = await fetchManifest(baseUrl);
  const entries = manifest.entries.filter(e => e.type === type);
  
  const loaded: LoadedEntry[] = [];
  for (const metadata of entries) {
    try {
      const entry = await loadPublishedEntry(metadata, password, baseUrl);
      loaded.push(entry);
    } catch (err) {
      console.error(`Failed to load entry ${metadata.id}:`, err);
    }
  }
  
  return loaded;
}

/**
 * Check if published vault matches local vault
 * Returns true if they have the same verifier (same password setup)
 */
export async function checkPublishedVault(baseUrl: string = '/data'): Promise<{
  exists: boolean;
  verifier?: { salt: string; verifier: string; iterations: number };
}> {
  try {
    const manifest = await fetchManifest(baseUrl);
    if (manifest.entries.length === 0) {
      return { exists: false };
    }
    return {
      exists: true,
      verifier: manifest.vault.verifier,
    };
  } catch {
    return { exists: false };
  }
}
