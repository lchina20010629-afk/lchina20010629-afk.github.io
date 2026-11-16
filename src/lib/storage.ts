/**
 * IndexedDB 存储层
 * 
 * 存储策略：
 * - 未初始化保险库：禁止存储个人内容
 * - 已初始化保险库：所有个人内容加密存储
 * - 明确标注"仅保存在当前浏览器，尚未同步"
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type {
  DiaryEntry,
  CourseRecord,
  WeeklyReview,
  MonthlyReview,
  YearlyReview,
} from '../types/crypto';

/**
 * 数据库名称和版本
 */
const DB_NAME = 'life-growth-db';
const DB_VERSION = 1;

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
    value: DiaryEntry;
    indexes: { 'by-date': string };
  };
  courseDrafts: {
    key: string; // date (YYYY-MM-DD)
    value: CourseRecord;
    indexes: { 'by-date': string };
  };
  weeklyDrafts: {
    key: string; // period (YYYY-Www)
    value: WeeklyReview;
    indexes: { 'by-period': string };
  };
  monthlyDrafts: {
    key: string; // period (YYYY-MM)
    value: MonthlyReview;
    indexes: { 'by-period': string };
  };
  yearlyDrafts: {
    key: string; // period (YYYY)
    value: YearlyReview;
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

      // Diary drafts
      if (!db.objectStoreNames.contains('diaryDrafts')) {
        const diaryStore = db.createObjectStore('diaryDrafts', { keyPath: 'date' });
        diaryStore.createIndex('by-date', 'date');
      }

      // Course drafts
      if (!db.objectStoreNames.contains('courseDrafts')) {
        const courseStore = db.createObjectStore('courseDrafts', { keyPath: 'date' });
        courseStore.createIndex('by-date', 'date');
      }

      // Weekly review drafts
      if (!db.objectStoreNames.contains('weeklyDrafts')) {
        const weeklyStore = db.createObjectStore('weeklyDrafts', { keyPath: 'period' });
        weeklyStore.createIndex('by-period', 'period');
      }

      // Monthly review drafts
      if (!db.objectStoreNames.contains('monthlyDrafts')) {
        const monthlyStore = db.createObjectStore('monthlyDrafts', { keyPath: 'period' });
        monthlyStore.createIndex('by-period', 'period');
      }

      // Yearly review drafts
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

export async function saveDiaryDraft(entry: DiaryEntry): Promise<void> {
  if (!await isVaultInitialized()) {
    throw new Error('保险库未初始化，无法保存个人内容。请先初始化保险库。');
  }
  const db = await openDatabase();
  await db.put('diaryDrafts', entry);
}

export async function getDiaryDraft(date: string): Promise<DiaryEntry | undefined> {
  const db = await openDatabase();
  return db.get('diaryDrafts', date);
}

export async function getAllDiaryDrafts(): Promise<DiaryEntry[]> {
  const db = await openDatabase();
  return db.getAll('diaryDrafts');
}

export async function deleteDiaryDraft(date: string): Promise<void> {
  const db = await openDatabase();
  await db.delete('diaryDrafts', date);
}

// ===== Course Drafts =====

export async function saveCourseDraft(record: CourseRecord): Promise<void> {
  if (!await isVaultInitialized()) {
    throw new Error('保险库未初始化，无法保存个人内容。请先初始化保险库。');
  }
  const db = await openDatabase();
  await db.put('courseDrafts', record);
}

export async function getCourseDraft(date: string): Promise<CourseRecord | undefined> {
  const db = await openDatabase();
  return db.get('courseDrafts', date);
}

export async function getAllCourseDrafts(): Promise<CourseRecord[]> {
  const db = await openDatabase();
  return db.getAll('courseDrafts');
}

export async function deleteCourseDraft(date: string): Promise<void> {
  const db = await openDatabase();
  await db.delete('courseDrafts', date);
}

// ===== Weekly Review Drafts =====

export async function saveWeeklyDraft(review: WeeklyReview): Promise<void> {
  if (!await isVaultInitialized()) {
    throw new Error('保险库未初始化，无法保存个人内容。请先初始化保险库。');
  }
  const db = await openDatabase();
  await db.put('weeklyDrafts', review);
}

export async function getWeeklyDraft(period: string): Promise<WeeklyReview | undefined> {
  const db = await openDatabase();
  return db.get('weeklyDrafts', period);
}

export async function getAllWeeklyDrafts(): Promise<WeeklyReview[]> {
  const db = await openDatabase();
  return db.getAll('weeklyDrafts');
}

export async function deleteWeeklyDraft(period: string): Promise<void> {
  const db = await openDatabase();
  await db.delete('weeklyDrafts', period);
}

// ===== Monthly Review Drafts =====

export async function saveMonthlyDraft(review: MonthlyReview): Promise<void> {
  if (!await isVaultInitialized()) {
    throw new Error('保险库未初始化，无法保存个人内容。请先初始化保险库。');
  }
  const db = await openDatabase();
  await db.put('monthlyDrafts', review);
}

export async function getMonthlyDraft(period: string): Promise<MonthlyReview | undefined> {
  const db = await openDatabase();
  return db.get('monthlyDrafts', period);
}

export async function getAllMonthlyDrafts(): Promise<MonthlyReview[]> {
  const db = await openDatabase();
  return db.getAll('monthlyDrafts');
}

export async function deleteMonthlyDraft(period: string): Promise<void> {
  const db = await openDatabase();
  await db.delete('monthlyDrafts', period);
}

// ===== Yearly Review Drafts =====

export async function saveYearlyDraft(review: YearlyReview): Promise<void> {
  if (!await isVaultInitialized()) {
    throw new Error('保险库未初始化，无法保存个人内容。请先初始化保险库。');
  }
  const db = await openDatabase();
  await db.put('yearlyDrafts', review);
}

export async function getYearlyDraft(period: string): Promise<YearlyReview | undefined> {
  const db = await openDatabase();
  return db.get('yearlyDrafts', period);
}

export async function getAllYearlyDrafts(): Promise<YearlyReview[]> {
  const db = await openDatabase();
  return db.getAll('yearlyDrafts');
}

export async function deleteYearlyDraft(period: string): Promise<void> {
  const db = await openDatabase();
  await db.delete('yearlyDrafts', period);
}

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
 */
export async function exportAllDrafts() {
  return {
    diary: await getAllDiaryDrafts(),
    courses: await getAllCourseDrafts(),
    weekly: await getAllWeeklyDrafts(),
    monthly: await getAllMonthlyDrafts(),
    yearly: await getAllYearlyDrafts(),
    exportedAt: new Date().toISOString(),
  };
}

/**
 * 获取存储统计
 */
export async function getStorageStats() {
  const [diaryCount, courseCount, weeklyCount, monthlyCount, yearlyCount] = await Promise.all([
    (await getAllDiaryDrafts()).length,
    (await getAllCourseDrafts()).length,
    (await getAllWeeklyDrafts()).length,
    (await getAllMonthlyDrafts()).length,
    (await getAllYearlyDrafts()).length,
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
