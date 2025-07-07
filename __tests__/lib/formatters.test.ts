/**
 * Comprehensive formatter utility tests
 * Tests for formatting dates, currencies, numbers, and strings
 */

describe('Format Utilities', () => {
  describe('Date Formatting', () => {
    const formatDate = (date: Date | string): string => {
      const d = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(d.getTime())) {
        return 'Invalid Date';
      }
      return d.toISOString().split('T')[0];
    };

    const formatDateTime = (date: Date | string): string => {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    };

    const formatRelativeDate = (date: Date | string): string => {
      const d = typeof date === 'string' ? new Date(date) : date;
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - d.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
      return `${Math.floor(diffDays / 365)} years ago`;
    };

    it('should format dates consistently', () => {
      const testDate = new Date('2024-01-15T10:30:00Z');
      expect(formatDate(testDate)).toBe('2024-01-15');
      expect(formatDate('2024-01-15T10:30:00Z')).toBe('2024-01-15');
    });

    it('should format datetime with time', () => {
      const testDate = new Date('2024-01-15T10:30:00');
      const formatted = formatDateTime(testDate);
      expect(formatted).toMatch(/2024/);
      expect(formatted).toMatch(/01/);
      expect(formatted).toMatch(/15/);
    });

    it('should format relative dates', () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      expect(formatRelativeDate(today)).toBe('Today');
      expect(formatRelativeDate(yesterday)).toBe('Yesterday');
      expect(formatRelativeDate(weekAgo)).toBe('1 weeks ago');
    });

    it('should handle invalid dates gracefully', () => {
      const invalidDate = new Date('invalid');
      expect(() => formatDate(invalidDate)).not.toThrow();
    });
  });

  describe('Currency Formatting', () => {
    const formatCurrency = (amount: number, currency = 'USD', locale = 'en-US'): string => {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    };

    const formatCurrencyCompact = (amount: number, currency = 'USD'): string => {
      if (Math.abs(amount) >= 1000000) {
        const millions = amount / 1000000;
        return `$${millions.toFixed(2)}M`;
      }
      if (Math.abs(amount) >= 1000) {
        const thousands = amount / 1000;
        return `$${thousands.toFixed(2)}K`;
      }
      return formatCurrency(amount, currency);
    };

    it('should format currency correctly', () => {
      expect(formatCurrency(100)).toBe('$100.00');
      expect(formatCurrency(123.45)).toBe('$123.45');
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(-50.25)).toBe('-$50.25');
    });

    it('should format different currencies', () => {
      expect(formatCurrency(100, 'EUR', 'en-US')).toContain('100.00');
      expect(formatCurrency(100, 'GBP', 'en-US')).toContain('100.00');
      expect(formatCurrency(100, 'JPY', 'en-US')).toContain('100');
    });

    it('should format compact currency amounts', () => {
      expect(formatCurrencyCompact(1500)).toBe('$1.50K');
      expect(formatCurrencyCompact(1500000)).toBe('$1.50M');
      expect(formatCurrencyCompact(500)).toBe('$500.00');
    });

    it('should handle edge cases', () => {
      expect(formatCurrency(0.01)).toBe('$0.01');
      expect(formatCurrency(999999.99)).toBe('$999,999.99');
      expect(formatCurrency(Number.MAX_SAFE_INTEGER)).toContain('$');
    });
  });

  describe('Number Formatting', () => {
    const formatNumber = (num: number, decimals = 2): string => {
      return num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    };

    const formatPercentage = (value: number, total: number): string => {
      const percentage = total > 0 ? (value / total) * 100 : 0;
      return `${percentage.toFixed(1)}%`;
    };

    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return '0 Bytes';
      
      const sign = bytes < 0 ? '-' : '';
      const absBytes = Math.abs(bytes);
      
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(absBytes) / Math.log(k));
      
      return sign + parseFloat((absBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    it('should format numbers with localization', () => {
      expect(formatNumber(1234.56)).toBe('1,234.56');
      expect(formatNumber(1000000)).toBe('1,000,000.00');
      expect(formatNumber(0.123, 3)).toBe('0.123');
    });

    it('should format percentages', () => {
      expect(formatPercentage(25, 100)).toBe('25.0%');
      expect(formatPercentage(33, 100)).toBe('33.0%');
      expect(formatPercentage(1, 3)).toBe('33.3%');
      expect(formatPercentage(0, 100)).toBe('0.0%');
    });

    it('should format file sizes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1073741824)).toBe('1 GB');
      expect(formatFileSize(500)).toBe('500 Bytes');
    });

    it('should handle edge cases', () => {
      expect(formatPercentage(100, 0)).toBe('0.0%');
      expect(formatFileSize(-100)).toBe('-100 Bytes');
      expect(formatNumber(NaN)).toBe('NaN');
    });
  });

  describe('String Formatting', () => {
    const truncateText = (text: string, maxLength: number, suffix = '...'): string => {
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength - suffix.length) + suffix;
    };

    const capitalizeWords = (text: string): string => {
      return text.replace(/\b\w/g, (char) => char.toUpperCase());
    };

    const slugify = (text: string): string => {
      return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    };

    const formatVehicleName = (make: string, model: string, year?: number): string => {
      const parts = [year, make, model].filter(Boolean);
      return parts.join(' ');
    };

    it('should truncate text properly', () => {
      expect(truncateText('Hello World', 5)).toBe('He...');
      expect(truncateText('Short', 10)).toBe('Short');
      expect(truncateText('Long text here', 10, '…')).toBe('Long text…');
    });

    it('should capitalize words', () => {
      expect(capitalizeWords('hello world')).toBe('Hello World');
      expect(capitalizeWords('test string here')).toBe('Test String Here');
      expect(capitalizeWords('ALREADY CAPS')).toBe('ALREADY CAPS');
    });

    it('should create slugs', () => {
      expect(slugify('Hello World')).toBe('hello-world');
      expect(slugify('Test String!')).toBe('test-string');
      expect(slugify('  Multiple   Spaces  ')).toBe('multiple-spaces');
      expect(slugify('Special@#$%Characters')).toBe('specialcharacters');
    });

    it('should format vehicle names', () => {
      expect(formatVehicleName('Toyota', 'Camry', 2020)).toBe('2020 Toyota Camry');
      expect(formatVehicleName('Honda', 'Civic')).toBe('Honda Civic');
      expect(formatVehicleName('Ford', 'F-150', 2019)).toBe('2019 Ford F-150');
    });
  });

  describe('Unit Conversions', () => {
    const convertDistance = (value: number, fromUnit: string, toUnit: string): number => {
      const kmToMiles = 0.621371;
      const milesToKm = 1.609344;

      if (fromUnit === toUnit) return value;
      if (fromUnit === 'km' && toUnit === 'miles') return value * kmToMiles;
      if (fromUnit === 'miles' && toUnit === 'km') return value * milesToKm;
      return value;
    };

    const convertVolume = (value: number, fromUnit: string, toUnit: string): number => {
      const litersToGallons = 0.264172;
      const gallonsToLiters = 3.78541;

      if (fromUnit === toUnit) return value;
      if (fromUnit === 'liters' && toUnit === 'gallons') return value * litersToGallons;
      if (fromUnit === 'gallons' && toUnit === 'liters') return value * gallonsToLiters;
      return value;
    };

    const calculateFuelEfficiency = (distance: number, volume: number, units: string): number => {
      if (volume === 0) return 0;
      return units === 'imperial' ? distance / volume : (volume / distance) * 100;
    };

    it('should convert distances', () => {
      expect(convertDistance(100, 'km', 'miles')).toBeCloseTo(62.14, 2);
      expect(convertDistance(100, 'miles', 'km')).toBeCloseTo(160.93, 2);
      expect(convertDistance(100, 'km', 'km')).toBe(100);
    });

    it('should convert volumes', () => {
      expect(convertVolume(10, 'liters', 'gallons')).toBeCloseTo(2.64, 2);
      expect(convertVolume(10, 'gallons', 'liters')).toBeCloseTo(37.85, 2);
      expect(convertVolume(10, 'liters', 'liters')).toBe(10);
    });

    it('should calculate fuel efficiency', () => {
      expect(calculateFuelEfficiency(100, 10, 'imperial')).toBe(10); // MPG
      expect(calculateFuelEfficiency(100, 10, 'metric')).toBe(10); // L/100km
      expect(calculateFuelEfficiency(100, 0, 'imperial')).toBe(0);
    });
  });

  describe('Validation Helpers', () => {
    const isValidEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    const isValidPhoneNumber = (phone: string): boolean => {
      const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
      return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
    };

    const isValidVIN = (vin: string): boolean => {
      return /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin);
    };

    const isValidLicensePlate = (plate: string): boolean => {
      return /^[A-Z0-9\s\-]{2,8}$/i.test(plate);
    };

    it('should validate email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('invalid.email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
    });

    it('should validate phone numbers', () => {
      expect(isValidPhoneNumber('+1234567890')).toBe(true);
      expect(isValidPhoneNumber('(123) 456-7890')).toBe(true);
      expect(isValidPhoneNumber('123-456-7890')).toBe(true);
      expect(isValidPhoneNumber('123456789')).toBe(false); // Too short
      expect(isValidPhoneNumber('abc123')).toBe(false);
    });

    it('should validate VIN numbers', () => {
      expect(isValidVIN('1HGBH41JXMN109186')).toBe(true);
      expect(isValidVIN('JH4TB2H26CC000000')).toBe(true);
      expect(isValidVIN('12345')).toBe(false); // Too short
      expect(isValidVIN('1HGBH41JXMN10918I')).toBe(false); // Contains I
      expect(isValidVIN('1HGBH41JXMN10918O')).toBe(false); // Contains O
    });

    it('should validate license plates', () => {
      expect(isValidLicensePlate('ABC123')).toBe(true);
      expect(isValidLicensePlate('12-34AB')).toBe(true);
      expect(isValidLicensePlate('TEST 01')).toBe(true);
      expect(isValidLicensePlate('A')).toBe(false); // Too short
      expect(isValidLicensePlate('TOOLONGPLATE')).toBe(false); // Too long
    });
  });
}); 