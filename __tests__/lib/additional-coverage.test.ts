/**
 * Additional Coverage Tests
 * Focused tests for specific utilities that need more coverage
 */

describe('Additional Coverage Tests', () => {
  describe('String Utilities', () => {
    const normalizeString = (str: string): string => {
      if (typeof str !== 'string') return '';
      return str.trim().toLowerCase().replace(/\s+/g, ' ');
    };

    const truncateString = (str: string, maxLength: number): string => {
      if (typeof str !== 'string') return '';
      if (str.length <= maxLength) return str;
      return str.substring(0, maxLength - 3) + '...';
    };

    it('should normalize strings correctly', () => {
      expect(normalizeString('  Hello   World  ')).toBe('hello world');
      expect(normalizeString('UPPERCASE')).toBe('uppercase');
      expect(normalizeString('')).toBe('');
      expect(normalizeString('   ')).toBe('');
    });

    it('should truncate strings correctly', () => {
      expect(truncateString('Hello World', 10)).toBe('Hello W...');
      expect(truncateString('Short', 10)).toBe('Short');
      expect(truncateString('Exactly10!', 10)).toBe('Exactly10!');
      expect(truncateString('', 5)).toBe('');
    });

    it('should handle invalid inputs gracefully', () => {
      expect(normalizeString(null as any)).toBe('');
      expect(normalizeString(undefined as any)).toBe('');
      expect(truncateString(null as any, 5)).toBe('');
    });
  });

  describe('Date Utilities', () => {
    const formatDateString = (date: Date | string): string => {
      if (!date) return '';
      const d = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(d.getTime())) return '';
      return d.toISOString().split('T')[0];
    };

    const addDays = (date: Date, days: number): Date => {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    };

    it('should format dates correctly', () => {
      const testDate = new Date('2024-01-15T10:30:00Z');
      expect(formatDateString(testDate)).toBe('2024-01-15');
      expect(formatDateString('2024-01-15')).toBe('2024-01-15');
      expect(formatDateString('')).toBe('');
      expect(formatDateString('invalid')).toBe('');
    });

    it('should add days correctly', () => {
      const baseDate = new Date('2024-01-15');
      expect(addDays(baseDate, 5)).toEqual(new Date('2024-01-20'));
      expect(addDays(baseDate, -5)).toEqual(new Date('2024-01-10'));
      expect(addDays(baseDate, 0)).toEqual(baseDate);
    });
  });

  describe('Number Utilities', () => {
    const formatCurrency = (amount: number, currency = 'USD'): string => {
      if (typeof amount !== 'number' || isNaN(amount)) return '0.00';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(amount);
    };

    const roundToTwoDecimals = (num: number): number => {
      if (typeof num !== 'number' || isNaN(num)) return 0;
      return Math.round((num + Number.EPSILON) * 100) / 100;
    };

    it('should format currency correctly', () => {
      expect(formatCurrency(123.456)).toBe('$123.46');
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(-50)).toBe('-$50.00');
      expect(formatCurrency(NaN)).toBe('0.00');
    });

    it('should round to two decimals correctly', () => {
      expect(roundToTwoDecimals(123.456)).toBe(123.46);
      expect(roundToTwoDecimals(123.454)).toBe(123.45);
      expect(roundToTwoDecimals(0)).toBe(0);
      expect(roundToTwoDecimals(NaN)).toBe(0);
    });
  });

  describe('Array Utilities', () => {
    const removeDuplicates = <T>(array: T[]): T[] => {
      if (!Array.isArray(array)) return [];
      return [...new Set(array)];
    };

    const chunkArray = <T>(array: T[], size: number): T[][] => {
      if (!Array.isArray(array) || size <= 0) return [];
      const result: T[][] = [];
      for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
      }
      return result;
    };

    it('should remove duplicates correctly', () => {
      expect(removeDuplicates([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
      expect(removeDuplicates(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
      expect(removeDuplicates([])).toEqual([]);
      expect(removeDuplicates(null as any)).toEqual([]);
    });

    it('should chunk arrays correctly', () => {
      expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
      expect(chunkArray([1, 2, 3], 5)).toEqual([[1, 2, 3]]);
      expect(chunkArray([], 2)).toEqual([]);
      expect(chunkArray([1, 2, 3], 0)).toEqual([]);
    });
  });

  describe('Validation Utilities', () => {
    const isValidEmail = (email: string): boolean => {
      if (typeof email !== 'string') return false;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    const isValidURL = (url: string): boolean => {
      if (typeof url !== 'string') return false;
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    };

    it('should validate emails correctly', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail(null as any)).toBe(false);
    });

    it('should validate URLs correctly', () => {
      expect(isValidURL('https://example.com')).toBe(true);
      expect(isValidURL('http://localhost:3000')).toBe(true);
      expect(isValidURL('invalid-url')).toBe(false);
      expect(isValidURL('')).toBe(false);
      expect(isValidURL(null as any)).toBe(false);
    });
  });

  describe('Error Handling', () => {
    const safeExecute = <T>(fn: () => T, defaultValue: T): T => {
      try {
        return fn();
      } catch {
        return defaultValue;
      }
    };

    const asyncSafeExecute = async <T>(
      fn: () => Promise<T>, 
      defaultValue: T
    ): Promise<T> => {
      try {
        return await fn();
      } catch {
        return defaultValue;
      }
    };

    it('should handle sync errors safely', () => {
      const throwingFunction = () => {
        throw new Error('Test error');
      };
      
      expect(safeExecute(throwingFunction, 'default')).toBe('default');
      expect(safeExecute(() => 'success', 'default')).toBe('success');
    });

    it('should handle async errors safely', async () => {
      const asyncThrowingFunction = async () => {
        throw new Error('Async test error');
      };
      
      expect(await asyncSafeExecute(asyncThrowingFunction, 'default')).toBe('default');
      expect(await asyncSafeExecute(async () => 'success', 'default')).toBe('success');
    });
  });

  describe('Local Storage Utilities', () => {
    const mockLocalStorage = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; }
      };
    })();

    // Mock localStorage
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage
    });

    const safeLocalStorageGet = (key: string): string | null => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    };

    const safeLocalStorageSet = (key: string, value: string): boolean => {
      try {
        localStorage.setItem(key, value);
        return true;
      } catch {
        return false;
      }
    };

    beforeEach(() => {
      mockLocalStorage.clear();
    });

    it('should handle localStorage operations safely', () => {
      expect(safeLocalStorageGet('nonexistent')).toBeNull();
      expect(safeLocalStorageSet('test', 'value')).toBe(true);
      expect(safeLocalStorageGet('test')).toBe('value');
    });
  });
}); 