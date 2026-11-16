/**
 * Review (weekly/monthly/yearly) encrypted storage
 */

import { openDatabase } from './storage';
import { encrypt, decrypt } from './crypto';
import type { EncryptedEnvelope } from '../types/crypto';

export interface ReviewRecord {
  id: string;
  period: string; // "2026-W46" | "2026-11" | "2026"
  type: 'weekly' | 'monthly' | 'yearly';
  title: string;
  content: string;
  achievements?: string[];
  challenges?: string[];
  nextGoals?: string[];
  created: string;
  modified: string;
}

/**
 * Save review record (encrypted)
 */
export async function saveReviewRecord(record: ReviewRecord, password: string): Promise<void> {
  const db = await openDatabase();
  const storeName = `${record.type}Drafts` as 'weeklyDrafts' | 'monthlyDrafts' | 'yearlyDrafts';
  
  const json = JSON.stringify(record);
  const encoder = new TextEncoder();
  const encrypted = await encrypt(encoder.encode(json), password);
  
  await db.put(storeName, {
    period: record.period,
    id: record.id,
    encrypted: JSON.stringify(encrypted),
  });
}

/**
 * Load review record (decrypt)
 */
export async function loadReviewRecord(
  period: string,
  type: 'weekly' | 'monthly' | 'yearly',
  password: string
): Promise<ReviewRecord | null> {
  const db = await openDatabase();
  const storeName = `${type}Drafts` as 'weeklyDrafts' | 'monthlyDrafts' | 'yearlyDrafts';
  const stored = await db.get(storeName, period);
  
  if (!stored || !stored.encrypted) {
    return null;
  }
  
  const envelope: EncryptedEnvelope = JSON.parse(stored.encrypted);
  const decrypted = await decrypt(envelope, password);
  const json = new TextDecoder().decode(decrypted);
  
  return JSON.parse(json);
}

/**
 * Get all review periods of a type
 */
export async function getAllReviews(type: 'weekly' | 'monthly' | 'yearly'): Promise<Array<{ period: string; id: string }>> {
  const db = await openDatabase();
  const storeName = `${type}Drafts` as 'weeklyDrafts' | 'monthlyDrafts' | 'yearlyDrafts';
  const keys = await db.getAllKeys(storeName);
  
  return keys.map(period => ({
    period: period as string,
    id: `${type}-${period}`,
  })).sort((a, b) => b.period.localeCompare(a.period)); // Newest first
}

/**
 * Delete review record
 */
export async function deleteReviewRecord(period: string, type: 'weekly' | 'monthly' | 'yearly'): Promise<void> {
  const db = await openDatabase();
  const storeName = `${type}Drafts` as 'weeklyDrafts' | 'monthlyDrafts' | 'yearlyDrafts';
  await db.delete(storeName, period);
}

/**
 * Get current period identifiers
 */
export function getCurrentPeriods(): { weekly: string; monthly: string; yearly: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  // Week number (ISO 8601: Monday is first day, week 1 has Jan 4)
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  
  return {
    weekly: `${year}-W${String(week).padStart(2, '0')}`,
    monthly: `${year}-${month}`,
    yearly: String(year),
  };
}
