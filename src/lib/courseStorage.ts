/**
 * Course/Learning encrypted storage
 */

import { openDatabase } from './storage';
import { encrypt, decrypt } from './crypto';
import type { EncryptedEnvelope } from '../types/crypto';

export interface CourseRecord {
  id: string;
  date: string; // YYYY-MM-DD
  courses: CourseColumn[];
  totalMinutes: number;
  notes?: string;
  created: string;
  modified: string;
}

export interface CourseColumn {
  name: string; // "English" | "Thai" | "修身养性" | "生财有道案例"
  targetMinutes: number;
  actualMinutes: number;
  completed: boolean;
  materials?: string[]; // Source URLs/titles
  exercises?: string[];
  reflection?: string; // User's encrypted reflection
}

export const COURSE_COLUMNS = [
  { name: 'English', targetMinutes: 10, label: '英语' },
  { name: 'Thai', targetMinutes: 8, label: '泰语' },
  { name: '修身养性', targetMinutes: 6, label: '修身养性' },
  { name: '生财有道案例', targetMinutes: 6, label: '生财有道' },
] as const;

/**
 * Save course record (encrypted)
 */
export async function saveCourseRecord(record: CourseRecord, password: string): Promise<void> {
  const db = await openDatabase();
  
  const json = JSON.stringify(record);
  const encrypted = await encrypt(Buffer.from(json, 'utf-8'), password);
  
  await db.put('courseDrafts', {
    date: record.date,
    id: record.id,
    encrypted: JSON.stringify(encrypted),
  });
}

/**
 * Load course record (decrypt)
 */
export async function loadCourseRecord(date: string, password: string): Promise<CourseRecord | null> {
  const db = await openDatabase();
  const stored = await db.get('courseDrafts', date);
  
  if (!stored || !stored.encrypted) {
    return null;
  }
  
  const envelope: EncryptedEnvelope = JSON.parse(stored.encrypted);
  const decrypted = await decrypt(envelope, password);
  const json = new TextDecoder().decode(decrypted);
  
  return JSON.parse(json);
}

/**
 * Get all course record dates
 */
export async function getAllCourseRecords(): Promise<Array<{ date: string; id: string }>> {
  const db = await openDatabase();
  const keys = await db.getAllKeys('courseDrafts');
  
  return keys.map(date => ({
    date: date as string,
    id: `course-${date}`,
  }));
}

/**
 * Delete course record
 */
export async function deleteCourseRecord(date: string): Promise<void> {
  const db = await openDatabase();
  await db.delete('courseDrafts', date);
}
