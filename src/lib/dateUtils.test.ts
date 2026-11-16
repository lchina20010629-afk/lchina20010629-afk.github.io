import { describe, it, expect } from 'vitest';
import { isValidISOWeek, isValidISOMonth, isValidISOYear } from './dateUtils';

describe('ISO Period Validation', () => {
  describe('ISO Week Format', () => {
    it('accepts valid ISO weeks', () => {
      expect(isValidISOWeek('2024-W01')).toBe(true);
      expect(isValidISOWeek('2024-W11')).toBe(true);
      expect(isValidISOWeek('2024-W52')).toBe(true);
      expect(isValidISOWeek('2024-W53')).toBe(true);
      expect(isValidISOWeek('2099-W01')).toBe(true);
    });
    
    it('rejects invalid ISO week numbers', () => {
      expect(isValidISOWeek('2024-W00')).toBe(false); // Week 0 invalid
      expect(isValidISOWeek('2024-W54')).toBe(false); // Week 54 invalid
      expect(isValidISOWeek('2099-W99')).toBe(false); // Week 99 invalid
    });
    
    it('rejects malformed ISO week formats', () => {
      expect(isValidISOWeek('2024-W1')).toBe(false);  // Single digit
      expect(isValidISOWeek('2024W11')).toBe(false);  // Missing hyphen
      expect(isValidISOWeek('2024-11')).toBe(false);  // Missing W prefix
      expect(isValidISOWeek('24-W11')).toBe(false);   // Short year
    });
  });
  
  describe('ISO Month Format', () => {
    it('accepts valid ISO months', () => {
      expect(isValidISOMonth('2024-01')).toBe(true);
      expect(isValidISOMonth('2024-03')).toBe(true);
      expect(isValidISOMonth('2024-12')).toBe(true);
    });
    
    it('rejects invalid ISO month numbers', () => {
      expect(isValidISOMonth('2024-00')).toBe(false);
      expect(isValidISOMonth('2024-13')).toBe(false);
      expect(isValidISOMonth('2024-99')).toBe(false);
    });
    
    it('rejects malformed ISO month formats', () => {
      expect(isValidISOMonth('2024-1')).toBe(false);   // Single digit
      expect(isValidISOMonth('202403')).toBe(false);   // Missing hyphen
      expect(isValidISOMonth('24-03')).toBe(false);    // Short year
    });
  });
  
  describe('ISO Year Format', () => {
    it('accepts valid ISO years', () => {
      expect(isValidISOYear('2024')).toBe(true);
      expect(isValidISOYear('1000')).toBe(true);
      expect(isValidISOYear('9999')).toBe(true);
    });
    
    it('rejects malformed ISO year formats', () => {
      expect(isValidISOYear('24')).toBe(false);      // Too short
      expect(isValidISOYear('024')).toBe(false);     // Leading zero
      expect(isValidISOYear('10000')).toBe(false);   // Too long
      expect(isValidISOYear('999')).toBe(false);     // Three digits
    });
  });
});
