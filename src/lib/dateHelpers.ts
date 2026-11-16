/**
 * 日期辅助函数
 * 
 * 时区：统一使用 Asia/Kuala_Lumpur (GMT+8)
 */

import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, getISOWeek, getISOWeekYear } from 'date-fns';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';

/**
 * 目标时区
 */
export const TARGET_TIMEZONE = 'Asia/Kuala_Lumpur';

/**
 * 获取当前时区日期
 */
export function getCurrentDate(): Date {
  return toZonedTime(new Date(), TARGET_TIMEZONE);
}

/**
 * 格式化日期为 ISO 8601 格式 (YYYY-MM-DD)
 */
export function formatDate(date: Date): string {
  return formatInTimeZone(date, TARGET_TIMEZONE, 'yyyy-MM-dd');
}

/**
 * 格式化日期时间为 ISO 8601 格式
 */
export function formatDateTime(date: Date): string {
  return formatInTimeZone(date, TARGET_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

/**
 * 解析 ISO 8601 日期字符串
 */
export function parseDate(dateString: string): Date {
  return toZonedTime(new Date(dateString), TARGET_TIMEZONE);
}

/**
 * 获取周期标识符（周一到周日）
 * 格式: YYYY-Www (例如 "2026-W46")
 */
export function getWeekPeriod(date: Date): string {
  const zonedDate = toZonedTime(date, TARGET_TIMEZONE);
  const year = getISOWeekYear(zonedDate);
  const week = getISOWeek(zonedDate);
  return `${year}-W${week.toString().padStart(2, '0')}`;
}

/**
 * 获取周的开始日期（周一）
 */
export function getWeekStart(date: Date): Date {
  const zonedDate = toZonedTime(date, TARGET_TIMEZONE);
  return startOfWeek(zonedDate, { weekStartsOn: 1 }); // 1 = Monday
}

/**
 * 获取周的结束日期（周日）
 */
export function getWeekEnd(date: Date): Date {
  const zonedDate = toZonedTime(date, TARGET_TIMEZONE);
  return endOfWeek(zonedDate, { weekStartsOn: 1 }); // 1 = Monday
}

/**
 * 从周期标识符解析周的起止日期
 * @param period 格式: "2026-W46"
 */
export function parseWeekPeriod(period: string): { start: Date; end: Date } {
  const match = period.match(/^(\d{4})-W(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid week period format: ${period}`);
  }

  const year = parseInt(match[1], 10);
  const week = parseInt(match[2], 10);

  // 创建该年第一周的日期，然后加上周数
  const jan4 = new Date(year, 0, 4); // ISO week date 使用1月4日作为参考
  const firstMonday = startOfWeek(jan4, { weekStartsOn: 1 });
  const targetMonday = new Date(firstMonday);
  targetMonday.setDate(firstMonday.getDate() + (week - 1) * 7);

  const start = toZonedTime(targetMonday, TARGET_TIMEZONE);
  const end = getWeekEnd(start);

  return { start, end };
}

/**
 * 获取月份周期标识符
 * 格式: YYYY-MM (例如 "2026-11")
 */
export function getMonthPeriod(date: Date): string {
  const zonedDate = toZonedTime(date, TARGET_TIMEZONE);
  return formatInTimeZone(zonedDate, TARGET_TIMEZONE, 'yyyy-MM');
}

/**
 * 获取月份的开始日期
 */
export function getMonthStart(date: Date): Date {
  const zonedDate = toZonedTime(date, TARGET_TIMEZONE);
  return startOfMonth(zonedDate);
}

/**
 * 获取月份的结束日期
 */
export function getMonthEnd(date: Date): Date {
  const zonedDate = toZonedTime(date, TARGET_TIMEZONE);
  return endOfMonth(zonedDate);
}

/**
 * 从月份周期标识符解析月的起止日期
 * @param period 格式: "2026-11"
 */
export function parseMonthPeriod(period: string): { start: Date; end: Date } {
  const match = period.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid month period format: ${period}`);
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1; // JavaScript months are 0-indexed

  const date = new Date(year, month, 1);
  const zonedDate = toZonedTime(date, TARGET_TIMEZONE);
  
  return {
    start: getMonthStart(zonedDate),
    end: getMonthEnd(zonedDate),
  };
}

/**
 * 获取年份周期标识符
 * 格式: YYYY (例如 "2026")
 */
export function getYearPeriod(date: Date): string {
  const zonedDate = toZonedTime(date, TARGET_TIMEZONE);
  return formatInTimeZone(zonedDate, TARGET_TIMEZONE, 'yyyy');
}

/**
 * 获取年份的开始日期（1月1日）
 */
export function getYearStart(date: Date): Date {
  const zonedDate = toZonedTime(date, TARGET_TIMEZONE);
  return new Date(zonedDate.getFullYear(), 0, 1);
}

/**
 * 获取年份的结束日期（12月31日）
 */
export function getYearEnd(date: Date): Date {
  const zonedDate = toZonedTime(date, TARGET_TIMEZONE);
  return new Date(zonedDate.getFullYear(), 11, 31, 23, 59, 59, 999);
}

/**
 * 从年份周期标识符解析年的起止日期
 * @param period 格式: "2026"
 */
export function parseYearPeriod(period: string): { start: Date; end: Date } {
  const year = parseInt(period, 10);
  if (isNaN(year) || year < 1900 || year > 2100) {
    throw new Error(`Invalid year period: ${period}`);
  }

  const date = new Date(year, 0, 1);
  const zonedDate = toZonedTime(date, TARGET_TIMEZONE);
  
  return {
    start: getYearStart(zonedDate),
    end: getYearEnd(zonedDate),
  };
}

/**
 * 判断日期是否在指定周期内
 */
export function isDateInPeriod(date: Date, period: string): boolean {
  if (period.startsWith('W') || period.includes('-W')) {
    const { start, end } = parseWeekPeriod(period);
    return date >= start && date <= end;
  } else if (period.match(/^\d{4}-\d{2}$/)) {
    const { start, end } = parseMonthPeriod(period);
    return date >= start && date <= end;
  } else if (period.match(/^\d{4}$/)) {
    const { start, end } = parseYearPeriod(period);
    return date >= start && date <= end;
  }
  
  throw new Error(`Unknown period format: ${period}`);
}

/**
 * 获取相对日期描述（中文）
 * 例如：今天、昨天、明天、X天前、X天后
 */
export function getRelativeDateDescription(date: Date): string {
  const now = getCurrentDate();
  const targetDate = toZonedTime(date, TARGET_TIMEZONE);
  
  const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  
  const diffDays = Math.round((targetStart.getTime() - nowStart.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return '今天';
  if (diffDays === -1) return '昨天';
  if (diffDays === 1) return '明天';
  if (diffDays < 0) return `${Math.abs(diffDays)} 天前`;
  return `${diffDays} 天后`;
}

/**
 * 生成日历月份的日期网格
 * @param year 年份
 * @param month 月份 (1-12)
 * @returns 日期数组，包括前后月份的日期以填充完整周
 */
export function generateCalendarGrid(year: number, month: number): Date[] {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  
  const firstDayOfWeek = firstDay.getDay();
  const lastDayOfWeek = lastDay.getDay();
  
  const daysInMonth = lastDay.getDate();
  const daysFromPrevMonth = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // 周一开始
  const daysFromNextMonth = lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek;
  
  const grid: Date[] = [];
  
  // 上个月的日期
  for (let i = daysFromPrevMonth; i > 0; i--) {
    const date = new Date(year, month - 1, -i + 1);
    grid.push(toZonedTime(date, TARGET_TIMEZONE));
  }
  
  // 当前月的日期
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month - 1, i);
    grid.push(toZonedTime(date, TARGET_TIMEZONE));
  }
  
  // 下个月的日期
  for (let i = 1; i <= daysFromNextMonth; i++) {
    const date = new Date(year, month, i);
    grid.push(toZonedTime(date, TARGET_TIMEZONE));
  }
  
  return grid;
}
