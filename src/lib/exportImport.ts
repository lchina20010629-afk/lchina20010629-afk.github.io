/**
 * Export/Import functionality with encryption
 */

import { openDatabase } from './storage';
import { encrypt, decrypt } from './crypto';
import type { EncryptedEnvelope } from '../types/crypto';

export interface ExportData {
  version: string;
  exportedAt: string;
  encrypted: string; // Encrypted JSON of all data
}

/**
 * Export all data with encryption
 */
export async function exportAllData(password: string): Promise<Blob> {
  const db = await openDatabase();
  
  // Get all data
  const [diaryDrafts, courseDrafts, weeklyDrafts, monthlyDrafts, yearlyDrafts, settingsEntries] = await Promise.all([
    db.getAll('diaryDrafts'),
    db.getAll('courseDrafts'),
    db.getAll('weeklyDrafts'),
    db.getAll('monthlyDrafts'),
    db.getAll('yearlyDrafts'),
    db.getAllKeys('settings'),
  ]);
  
  // Get settings values (excluding password verifier)
  const settings: Array<[string, unknown]> = [];
  for (const key of settingsEntries as string[]) {
    if (key !== 'password_verifier') {
      const value = await db.get('settings', key);
      settings.push([key, value]);
    }
  }
  
  const allData = {
    diaryDrafts,
    courseDrafts,
    weeklyDrafts,
    monthlyDrafts,
    yearlyDrafts,
    settings,
  };
  
  // Encrypt the data
  const encrypted = await encrypt(JSON.stringify(allData), password);
  
  const exportData: ExportData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    encrypted: JSON.stringify(encrypted),
  };
  
  return new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
}

/**
 * Import data from encrypted backup
 * Preserves existing data and only adds/updates entries
 */
export async function importData(
  file: File,
  password: string,
  options: { replaceAll?: boolean } = {}
): Promise<{ imported: number; skipped: number }> {
  const text = await file.text();
  const exportData: ExportData = JSON.parse(text);
  
  // Verify version
  if (exportData.version !== '1.0.0') {
    throw new Error(`Unsupported export version: ${exportData.version}`);
  }
  
  // Decrypt
  const envelope: EncryptedEnvelope = JSON.parse(exportData.encrypted);
  let decrypted: ArrayBuffer;
  try {
    decrypted = await decrypt(envelope, password);
  } catch {
    throw new Error('解密失败：密码错误或数据已损坏');
  }
  
  const decoder = new TextDecoder();
  const json = decoder.decode(decrypted);
  const data = JSON.parse(json);
  
  // Import data
  const db = await openDatabase();
  let imported = 0;
  let skipped = 0;
  
  // Import each type
  const stores = ['diaryDrafts', 'courseDrafts', 'weeklyDrafts', 'monthlyDrafts', 'yearlyDrafts'] as const;
  
  for (const store of stores) {
    const items = data[store] || [];
    for (const item of items) {
      const key = item.date || item.period;
      
      if (!options.replaceAll) {
        // Check if exists
        const existing = await db.get(store, key);
        if (existing) {
          skipped++;
          continue;
        }
      }
      
      await db.put(store, item);
      imported++;
    }
  }
  
  return { imported, skipped };
}

/**
 * Download export file
 */
export function downloadExport(blob: Blob, filename?: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
