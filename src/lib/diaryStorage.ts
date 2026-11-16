/**
 * Diary-specific storage operations with encryption
 */

import { openDatabase } from './storage';
import { encrypt, decrypt } from './crypto';
import type { DiaryEntry } from '../types/crypto';
import { stripExifData, readFileAsArrayBuffer } from './imageProcessing';

/**
 * Save diary entry with encryption
 */
export async function saveDiaryEntry(entry: DiaryEntry, password: string): Promise<void> {
  const db = await openDatabase();
  
  // Encrypt the entry (excluding image blobs)
  const entryToEncrypt = {
    ...entry,
    images: entry.images?.map(img => ({
      id: img.id,
      caption: img.caption,
      encryptedPath: img.encryptedPath,
    })),
  };
  
  const encryptedData = await encrypt(JSON.stringify(entryToEncrypt), password);
  
  // Store encrypted data with metadata
  await db.put('diaryDrafts', {
    date: entry.date,
    id: entry.id,
    encrypted: JSON.stringify(encryptedData),
  });
}

/**
 * Load and decrypt diary entry
 */
export async function loadDiaryEntry(date: string, password: string): Promise<DiaryEntry | undefined> {
  const db = await openDatabase();
  const stored = await db.get('diaryDrafts', date);
  
  if (!stored || !stored.encrypted) {
    return undefined;
  }
  
  try {
    const envelope = JSON.parse(stored.encrypted);
    const decrypted = await decrypt(envelope, password);
    const decoder = new TextDecoder();
    const json = decoder.decode(decrypted);
    return JSON.parse(json);
  } catch {
    throw new Error('Failed to decrypt diary entry');
  }
}

/**
 * Load all diary entries (metadata only, no decryption)
 */
export async function getAllDiaryEntries(): Promise<Array<{ date: string; id: string }>> {
  const db = await openDatabase();
  const entries = await db.getAll('diaryDrafts');
  return entries.map(e => ({ date: e.date, id: e.id }));
}

/**
 * Delete diary entry
 */
export async function deleteDiaryEntry(date: string): Promise<void> {
  const db = await openDatabase();
  await db.delete('diaryDrafts', date);
}

/**
 * Process and encrypt image
 */
export async function processAndEncryptImage(
  file: File,
  password: string
): Promise<{ id: string; encryptedData: string; type: string }> {
  // Strip EXIF
  const cleanBlob = await stripExifData(file);
  
  // Read as ArrayBuffer
  const buffer = await readFileAsArrayBuffer(cleanBlob);
  
  // Encrypt
  const encrypted = await encrypt(buffer, password);
  
  return {
    id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    encryptedData: JSON.stringify(encrypted),
    type: file.type,
  };
}

/**
 * Decrypt image and create blob URL
 */
export async function decryptImageToBlobUrl(
  encryptedData: string,
  password: string,
  type: string = 'image/jpeg'
): Promise<string> {
  const envelope = JSON.parse(encryptedData);
  const decrypted = await decrypt(envelope, password);
  const blob = new Blob([decrypted], { type });
  return URL.createObjectURL(blob);
}
