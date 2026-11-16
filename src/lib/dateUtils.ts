/**
 * Date and period validation utilities
 */

/**
 * Validate ISO 8601 week format: YYYY-Www where ww is 01-53
 */
export function isValidISOWeek(period: string): boolean {
  const match = period.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return false;
  
  const year = parseInt(match[1], 10);
  const week = parseInt(match[2], 10);
  
  // ISO weeks are 01-53 (week 53 only exists in some years)
  if (week < 1 || week > 53) return false;
  
  return year >= 1000 && year <= 9999;
}

/**
 * Validate ISO 8601 month format: YYYY-MM where MM is 01-12
 */
export function isValidISOMonth(period: string): boolean {
  const match = period.match(/^(\d{4})-(\d{2})$/);
  if (!match) return false;
  
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  
  if (month < 1 || month > 12) return false;
  return year >= 1000 && year <= 9999;
}

/**
 * Validate ISO 8601 year format: YYYY
 */
export function isValidISOYear(period: string): boolean {
  const match = period.match(/^(\d{4})$/);
  if (!match) return false;
  
  const year = parseInt(match[1], 10);
  return year >= 1000 && year <= 9999;
}
