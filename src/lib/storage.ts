/**
 * IndexedDB 存储层
 * 
 * 存储策略：
 * - 未初始化保险库：禁止存储个人内容
 * - 已初始化保险库：所有个人内容加密存储
 * - 明确标注"仅保存在当前浏览器，尚未同步"
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

/**
 * 数据库名称和版本
 */
const DB_NAME = 'life-growth-db';
const DB_VERSION = 2; // Bumped: courseDrafts/weeklyDrafts/monthlyDrafts/yearlyDrafts now store encrypted envelopes

/**
 * 数据库 schema
 */
interface LifeGrowthDB extends DBSchema {
  settings: {
    key: string;
    value: string | number | boolean | object;
  };
  diaryDrafts: {
    key: string; // date (YYYY-MM-DD)
    value: {
      date: string;
      id: string;
      encrypted: string; // JSON stringified EncryptedEnvelope
    };
    indexes: { 'by-date': string };
  };
  courseDrafts: {
    key: string; // date (YYYY-MM-DD)
    value: {
      date: string;
      id: string;
      encrypted: string;
    };
    indexes: { 'by-date': string };
  };
  weeklyDrafts: {
    key: string; // period (YYYY-Www)
    value: {
      period: string;
      id: string;
      encrypted: string;
    };
    indexes: { 'by-period': string };
  };
  monthlyDrafts: {
    key: string; // period (YYYY-MM)
    value: {
      period: string;
      id: string;
      encrypted: string;
    };
    indexes: { 'by-period': string };
  };
  yearlyDrafts: {
    key: string; // period (YYYY)
    value: {
      period: string;
      id: string;
      encrypted: string;
    };
    indexes: { 'by-period': string };
  };
}

let dbInstance: IDBPDatabase<LifeGrowthDB> | null = null;

/**
 * 打开数据库
 */
export async function openDatabase(): Promise<IDBPDatabase<LifeGrowthDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<LifeGrowthDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }

      // Diary drafts (v1 format already correct)
      if (!db.objectStoreNames.contains('diaryDrafts')) {
        const diaryStore = db.createObjectStore('diaryDrafts', { keyPath: 'date' });
        diaryStore.createIndex('by-date', 'date');
      }

      // Course/review stores added in v2 with encrypted envelope format
      // No migration needed since they didn't exist in v1
      if (!db.objectStoreNames.contains('courseDrafts')) {
        const courseStore = db.createObjectStore('courseDrafts', { keyPath: 'date' });
        courseStore.createIndex('by-date', 'date');
      }

      if (!db.objectStoreNames.contains('weeklyDrafts')) {
        const weeklyStore = db.createObjectStore('weeklyDrafts', { keyPath: 'period' });
        weeklyStore.createIndex('by-period', 'period');
      }

      if (!db.objectStoreNames.contains('monthlyDrafts')) {
        const monthlyStore = db.createObjectStore('monthlyDrafts', { keyPath: 'period' });
        monthlyStore.createIndex('by-period', 'period');
      }

      if (!db.objectStoreNames.contains('yearlyDrafts')) {
        const yearlyStore = db.createObjectStore('yearlyDrafts', { keyPath: 'period' });
        yearlyStore.createIndex('by-period', 'period');
      }
    },
  });

  return dbInstance;
}

/**
 * 获取设置
 */
export async function getSetting<T = any>(key: string): Promise<T | undefined> {
  const db = await openDatabase();
  return db.get('settings', key) as Promise<T | undefined>;
}

/**
 * 保存设置
 */
export async function setSetting<T extends string | number | boolean | object = any>(key: string, value: T): Promise<void> {
  const db = await openDatabase();
  await db.put('settings', value, key);
}

/**
 * 删除设置
 */
export async function deleteSetting(key: string): Promise<void> {
  const db = await openDatabase();
  await db.delete('settings', key);
}

/**
 * 检查保险库是否已初始化
 */
export async function isVaultInitialized(): Promise<boolean> {
  const initialized = await getSetting<boolean>('vault_initialized');
  return initialized === true;
}

/**
 * 标记保险库为已初始化
 */
export async function markVaultInitialized(): Promise<void> {
  await setSetting('vault_initialized', true);
}

/**
 * 获取主题偏好
 */
export async function getTheme(): Promise<'light' | 'dark' | 'system'> {
  const theme = await getSetting<'light' | 'dark' | 'system'>('theme');
  return theme || 'system';
}

/**
 * 保存主题偏好
 */
export async function setTheme(theme: 'light' | 'dark' | 'system'): Promise<void> {
  await setSetting('theme', theme);
}

// ===== Diary Drafts =====
// Note: Diary operations are now in diaryStorage.ts with encryption

// ===== Course / Review Drafts =====
// Note: Course/review operations now in courseStorage.ts/reviewStorage.ts with encryption

/**
 * 清除所有数据（用于重置）
 */
export async function clearAllData(): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(
    ['settings', 'diaryDrafts', 'courseDrafts', 'weeklyDrafts', 'monthlyDrafts', 'yearlyDrafts'],
    'readwrite'
  );

  await Promise.all([
    tx.objectStore('settings').clear(),
    tx.objectStore('diaryDrafts').clear(),
    tx.objectStore('courseDrafts').clear(),
    tx.objectStore('weeklyDrafts').clear(),
    tx.objectStore('monthlyDrafts').clear(),
    tx.objectStore('yearlyDrafts').clear(),
  ]);

  await tx.done;
}

/**
 * 导出所有草稿数据
 * Note: Diary/course/review exports should use respective storage modules
 */

/**
 * 获取存储统计
 */
export async function getStorageStats() {
  const db = await openDatabase();
  const [diaryCount, courseCount, weeklyCount, monthlyCount, yearlyCount] = await Promise.all([
    db.count('diaryDrafts'),
    db.count('courseDrafts'),
    db.count('weeklyDrafts'),
    db.count('monthlyDrafts'),
    db.count('yearlyDrafts'),
  ]);

  return {
    diaryDrafts: diaryCount,
    courseDrafts: courseCount,
    weeklyDrafts: weeklyCount,
    monthlyDrafts: monthlyCount,
    yearlyDrafts: yearlyCount,
    total: diaryCount + courseCount + weeklyCount + monthlyCount + yearlyCount,
  };
}
