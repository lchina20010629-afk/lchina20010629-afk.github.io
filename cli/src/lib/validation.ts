/**
 * Input validation for entries
 */

import { basename } from 'path';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const WEEKLY_REGEX = /^\d{4}-W\d{2}$/;
const MONTHLY_REGEX = /^\d{4}-\d{2}$/;
const YEARLY_REGEX = /^\d{4}$/;

export interface DiaryEntry {
  title: string;
  content: string;
  tags?: string[];
  mood?: string;
  weather?: string;
  images?: string[];
}

export interface CourseEntry {
  courses: Array<{
    name: string;
    targetMinutes: number;
    actualMinutes: number;
    completed: boolean;
    materials?: string[];
    exercises?: string[];
    reflection?: string;
  }>;
  totalMinutes: number;
  notes?: string;
}

export interface ReviewEntry {
  period: string;
  type: 'weekly' | 'monthly' | 'yearly';
  summary: string;
  highlights?: string[];
  challenges?: string[];
  nextSteps?: string[];
}

/**
 * Validate date format (YYYY-MM-DD)
 */
export function validateDate(date: string): void {
  if (!DATE_REGEX.test(date)) {
    throw new Error(`Invalid date format: ${date} (expected YYYY-MM-DD)`);
  }
  
  const [year, month, day] = date.split('-').map(Number);
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month: ${month}`);
  }
  if (day < 1 || day > 31) {
    throw new Error(`Invalid day: ${day}`);
  }
}

/**
 * Validate period format
 */
export function validatePeriod(period: string, type: string): void {
  if (type === 'weekly') {
    if (!WEEKLY_REGEX.test(period)) {
      throw new Error(`Invalid weekly period: ${period} (expected YYYY-WXX)`);
    }
    const week = parseInt(period.split('-W')[1]);
    if (week < 1 || week > 53) {
      throw new Error(`Invalid week number: ${week}`);
    }
  } else if (type === 'monthly') {
    if (!MONTHLY_REGEX.test(period)) {
      throw new Error(`Invalid monthly period: ${period} (expected YYYY-MM)`);
    }
    const month = parseInt(period.split('-')[1]);
    if (month < 1 || month > 12) {
      throw new Error(`Invalid month: ${month}`);
    }
  } else if (type === 'yearly') {
    if (!YEARLY_REGEX.test(period)) {
      throw new Error(`Invalid yearly period: ${period} (expected YYYY)`);
    }
  }
}

/**
 * Validate course entry matches 4-column UI schema
 */
export function validateCourseEntry(data: any): CourseEntry {
  if (!data.courses || !Array.isArray(data.courses)) {
    throw new Error('Course entry must have "courses" array');
  }
  
  if (data.courses.length === 0) {
    throw new Error('Course entry must have at least one course');
  }
  
  for (const course of data.courses) {
    if (!course.name || typeof course.name !== 'string') {
      throw new Error('Course must have "name" string');
    }
    if (typeof course.targetMinutes !== 'number') {
      throw new Error(`Course "${course.name}" must have "targetMinutes" number`);
    }
    if (typeof course.actualMinutes !== 'number') {
      throw new Error(`Course "${course.name}" must have "actualMinutes" number`);
    }
    if (typeof course.completed !== 'boolean') {
      throw new Error(`Course "${course.name}" must have "completed" boolean`);
    }
  }
  
  if (typeof data.totalMinutes !== 'number') {
    throw new Error('Course entry must have "totalMinutes" number');
  }
  
  return data as CourseEntry;
}

/**
 * Validate file path (prevent directory traversal)
 */
export function validateFilePath(path: string): void {
  const normalized = basename(path);
  if (normalized !== path) {
    throw new Error(`Invalid file path: ${path} (contains directory traversal)`);
  }
  if (path.includes('..') || path.includes('/') || path.includes('\\')) {
    throw new Error(`Invalid file path: ${path} (contains path separators)`);
  }
}
