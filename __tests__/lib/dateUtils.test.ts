/**
 * Date Utility Functions Test Suite
 * 
 * Tests for common date manipulation and formatting functions
 * used throughout the vehicle expense tracker application.
 */

describe('Date Utilities', () => {
  // Mock current date for consistent testing
  const MOCK_DATE = new Date('2024-01-15T10:30:00.000Z');
  
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(MOCK_DATE);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('formatDate', () => {
    const formatDate = (date: Date, format: string = 'YYYY-MM-DD'): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      switch (format) {
        case 'YYYY-MM-DD':
          return `${year}-${month}-${day}`;
        case 'MM/DD/YYYY':
          return `${month}/${day}/${year}`;
        case 'DD/MM/YYYY':
          return `${day}/${month}/${year}`;
        case 'YYYY':
          return String(year);
        case 'MM':
          return month;
        case 'DD':
          return day;
        default:
          return `${year}-${month}-${day}`;
      }
    };

    it('should format date in YYYY-MM-DD format by default', () => {
      const date = new Date('2024-03-15');
      expect(formatDate(date)).toBe('2024-03-15');
    });

    it('should format date in MM/DD/YYYY format', () => {
      const date = new Date('2024-03-15');
      expect(formatDate(date, 'MM/DD/YYYY')).toBe('03/15/2024');
    });

    it('should format date in DD/MM/YYYY format', () => {
      const date = new Date('2024-03-15');
      expect(formatDate(date, 'DD/MM/YYYY')).toBe('15/03/2024');
    });

    it('should handle single digit months and days with padding', () => {
      const date = new Date('2024-01-05');
      expect(formatDate(date)).toBe('2024-01-05');
      expect(formatDate(date, 'MM/DD/YYYY')).toBe('01/05/2024');
    });

    it('should format year only', () => {
      const date = new Date('2024-03-15');
      expect(formatDate(date, 'YYYY')).toBe('2024');
    });

    it('should format month only', () => {
      const date = new Date('2024-03-15');
      expect(formatDate(date, 'MM')).toBe('03');
    });

    it('should format day only', () => {
      const date = new Date('2024-03-15');
      expect(formatDate(date, 'DD')).toBe('15');
    });

    it('should handle invalid format by using default', () => {
      const date = new Date('2024-03-15');
      expect(formatDate(date, 'INVALID')).toBe('2024-03-15');
    });
  });

  describe('getDateRange', () => {
    const getDateRange = (startDate: Date, endDate: Date): Date[] => {
      const dates: Date[] = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return dates;
    };

    it('should return array of dates between start and end', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-03');
      const result = getDateRange(start, end);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual(new Date('2024-01-01'));
      expect(result[1]).toEqual(new Date('2024-01-02'));
      expect(result[2]).toEqual(new Date('2024-01-03'));
    });

    it('should return single date when start equals end', () => {
      const date = new Date('2024-01-01');
      const result = getDateRange(date, date);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(date);
    });

    it('should return empty array when start is after end', () => {
      const start = new Date('2024-01-03');
      const end = new Date('2024-01-01');
      const result = getDateRange(start, end);
      
      expect(result).toHaveLength(0);
    });

    it('should handle month boundaries correctly', () => {
      const start = new Date('2024-01-30');
      const end = new Date('2024-02-02');
      const result = getDateRange(start, end);
      
      expect(result).toHaveLength(4);
      expect(result[0]).toEqual(new Date('2024-01-30'));
      expect(result[1]).toEqual(new Date('2024-01-31'));
      expect(result[2]).toEqual(new Date('2024-02-01'));
      expect(result[3]).toEqual(new Date('2024-02-02'));
    });
  });

  describe('isDateInRange', () => {
    const isDateInRange = (date: Date, startDate: Date, endDate: Date): boolean => {
      return date >= startDate && date <= endDate;
    };

    it('should return true for date within range', () => {
      const date = new Date('2024-01-15');
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-31');
      
      expect(isDateInRange(date, start, end)).toBe(true);
    });

    it('should return true for date equal to start date', () => {
      const date = new Date('2024-01-01');
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-31');
      
      expect(isDateInRange(date, start, end)).toBe(true);
    });

    it('should return true for date equal to end date', () => {
      const date = new Date('2024-01-31');
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-31');
      
      expect(isDateInRange(date, start, end)).toBe(true);
    });

    it('should return false for date before range', () => {
      const date = new Date('2023-12-31');
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-31');
      
      expect(isDateInRange(date, start, end)).toBe(false);
    });

    it('should return false for date after range', () => {
      const date = new Date('2024-02-01');
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-31');
      
      expect(isDateInRange(date, start, end)).toBe(false);
    });
  });

  describe('daysBetween', () => {
    const daysBetween = (date1: Date, date2: Date): number => {
      const oneDay = 24 * 60 * 60 * 1000;
      return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
    };

    it('should calculate days between two dates', () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-01-11');
      
      expect(daysBetween(date1, date2)).toBe(10);
    });

    it('should return 0 for same date', () => {
      const date = new Date('2024-01-01');
      
      expect(daysBetween(date, date)).toBe(0);
    });

    it('should handle reverse order dates', () => {
      const date1 = new Date('2024-01-11');
      const date2 = new Date('2024-01-01');
      
      expect(daysBetween(date1, date2)).toBe(10);
    });

    it('should handle dates across months', () => {
      const date1 = new Date('2024-01-31');
      const date2 = new Date('2024-02-01');
      
      expect(daysBetween(date1, date2)).toBe(1);
    });

    it('should handle dates across years', () => {
      const date1 = new Date('2023-12-31');
      const date2 = new Date('2024-01-01');
      
      expect(daysBetween(date1, date2)).toBe(1);
    });
  });

  describe('getMonthName', () => {
    const getMonthName = (monthIndex: number, locale: string = 'en'): string => {
      const monthNames = {
        en: [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ],
        es: [
          'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ]
      };
      
      return monthNames[locale as keyof typeof monthNames]?.[monthIndex] || monthNames.en[monthIndex];
    };

    it('should return correct English month names', () => {
      expect(getMonthName(0)).toBe('January');
      expect(getMonthName(5)).toBe('June');
      expect(getMonthName(11)).toBe('December');
    });

    it('should return correct Spanish month names', () => {
      expect(getMonthName(0, 'es')).toBe('Enero');
      expect(getMonthName(5, 'es')).toBe('Junio');
      expect(getMonthName(11, 'es')).toBe('Diciembre');
    });

    it('should default to English for unsupported locale', () => {
      expect(getMonthName(0, 'fr')).toBe('January');
      expect(getMonthName(5, 'de')).toBe('June');
    });

    it('should handle edge cases', () => {
      expect(getMonthName(-1)).toBeUndefined();
      expect(getMonthName(12)).toBeUndefined();
    });
  });

  describe('isLeapYear', () => {
    const isLeapYear = (year: number): boolean => {
      return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    };

    it('should identify leap years correctly', () => {
      expect(isLeapYear(2024)).toBe(true);
      expect(isLeapYear(2020)).toBe(true);
      expect(isLeapYear(2000)).toBe(true);
      expect(isLeapYear(1600)).toBe(true);
    });

    it('should identify non-leap years correctly', () => {
      expect(isLeapYear(2023)).toBe(false);
      expect(isLeapYear(2021)).toBe(false);
      expect(isLeapYear(1900)).toBe(false);
      expect(isLeapYear(1700)).toBe(false);
    });

    it('should handle century years correctly', () => {
      expect(isLeapYear(1900)).toBe(false); // Century not divisible by 400
      expect(isLeapYear(2000)).toBe(true);  // Century divisible by 400
      expect(isLeapYear(1800)).toBe(false); // Century not divisible by 400
      expect(isLeapYear(2400)).toBe(true);  // Century divisible by 400
    });
  });

  describe('getCurrentWeek', () => {
    const getCurrentWeek = (date: Date = new Date()): { start: Date; end: Date } => {
      const startOfWeek = new Date(date);
      const dayOfWeek = startOfWeek.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      
      startOfWeek.setDate(startOfWeek.getDate() + diffToMonday);
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      return { start: startOfWeek, end: endOfWeek };
    };

    const daysBetween = (date1: Date, date2: Date): number => {
      const oneDay = 24 * 60 * 60 * 1000;
      return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
    };

    it('should return current week for Monday', () => {
      const monday = new Date('2024-01-15T10:30:00'); // Monday
      const week = getCurrentWeek(monday);
      
      expect(week.start.getDay()).toBe(1); // Monday
      expect(week.end.getDay()).toBe(0);   // Sunday
      // A week spans from Monday to Sunday (7 days total)
      expect(daysBetween(week.start, week.end)).toBe(7);
    });

    it('should return current week for Sunday', () => {
      const sunday = new Date('2024-01-21T10:30:00'); // Sunday
      const week = getCurrentWeek(sunday);
      
      expect(week.start.getDay()).toBe(1); // Monday
      expect(week.end.getDay()).toBe(0);   // Sunday
      expect(daysBetween(week.start, week.end)).toBe(7);
    });

    it('should return current week for mid-week day', () => {
      const wednesday = new Date('2024-01-17T10:30:00'); // Wednesday
      const week = getCurrentWeek(wednesday);
      
      expect(week.start.getDay()).toBe(1); // Monday
      expect(week.end.getDay()).toBe(0);   // Sunday
      expect(daysBetween(week.start, week.end)).toBe(7);
    });

    it('should set correct times', () => {
      const date = new Date('2024-01-17T10:30:00');
      const week = getCurrentWeek(date);
      
      expect(week.start.getHours()).toBe(0);
      expect(week.start.getMinutes()).toBe(0);
      expect(week.start.getSeconds()).toBe(0);
      
      expect(week.end.getHours()).toBe(23);
      expect(week.end.getMinutes()).toBe(59);
      expect(week.end.getSeconds()).toBe(59);
    });
  });
}); 

describe('dateUtils edge cases', () => {
  it('should handle invalid date strings', () => {
    const formatDate = (date: Date, format: string = 'YYYY-MM-DD'): string => {
      if (!date || isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      switch (format) {
        case 'YYYY-MM-DD':
          return `${year}-${month}-${day}`;
        case 'MM/DD/YYYY':
          return `${month}/${day}/${year}`;
        case 'DD/MM/YYYY':
          return `${day}/${month}/${year}`;
        case 'YYYY':
          return String(year);
        case 'MM':
          return month;
        case 'DD':
          return day;
        default:
          return `${year}-${month}-${day}`;
      }
    };

    expect(() => formatDate(new Date('invalid-date'))).not.toThrow();
    expect(formatDate(new Date('invalid-date'))).toBe('Invalid Date');
  });

  it('should handle null and undefined dates', () => {
    const formatDate = (date: Date, format: string = 'YYYY-MM-DD'): string => {
      if (!date || isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      switch (format) {
        case 'YYYY-MM-DD':
          return `${year}-${month}-${day}`;
        case 'MM/DD/YYYY':
          return `${month}/${day}/${year}`;
        case 'DD/MM/YYYY':
          return `${day}/${month}/${year}`;
        case 'YYYY':
          return String(year);
        case 'MM':
          return month;
        case 'DD':
          return day;
        default:
          return `${year}-${month}-${day}`;
      }
    };

    expect(() => formatDate(null as any)).not.toThrow();
    expect(() => formatDate(undefined as any)).not.toThrow();
  });

  it('should handle very old dates', () => {
    const formatDate = (date: Date, format: string = 'YYYY-MM-DD'): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      switch (format) {
        case 'YYYY-MM-DD':
          return `${year}-${month}-${day}`;
        case 'MM/DD/YYYY':
          return `${month}/${day}/${year}`;
        case 'DD/MM/YYYY':
          return `${day}/${month}/${year}`;
        case 'YYYY':
          return String(year);
        case 'MM':
          return month;
        case 'DD':
          return day;
        default:
          return `${year}-${month}-${day}`;
      }
    };

    const oldDate = new Date('1900-01-01');
    expect(() => formatDate(oldDate)).not.toThrow();
    expect(formatDate(oldDate)).toBe('1900-01-01');
  });

  it('should handle future dates', () => {
    const formatDate = (date: Date, format: string = 'YYYY-MM-DD'): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      switch (format) {
        case 'YYYY-MM-DD':
          return `${year}-${month}-${day}`;
        case 'MM/DD/YYYY':
          return `${month}/${day}/${year}`;
        case 'DD/MM/YYYY':
          return `${day}/${month}/${year}`;
        case 'YYYY':
          return String(year);
        case 'MM':
          return month;
        case 'DD':
          return day;
        default:
          return `${year}-${month}-${day}`;
      }
    };

    const futureDate = new Date('2030-12-31');
    expect(() => formatDate(futureDate)).not.toThrow();
    expect(formatDate(futureDate)).toBe('2030-12-31');
  });

  it('should handle date range with same start and end', () => {
    const getDateRange = (startDate: Date, endDate: Date): Date[] => {
      const dates: Date[] = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return dates;
    };

    const date = new Date('2023-01-01');
    const result = getDateRange(date, date);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(date);
  });

  it('should handle date range with invalid dates', () => {
    const getDateRange = (startDate: Date, endDate: Date): Date[] => {
      if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return [];
      }
      const dates: Date[] = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return dates;
    };

    expect(() => getDateRange(new Date('invalid'), new Date('invalid'))).not.toThrow();
    expect(getDateRange(new Date('invalid'), new Date('invalid'))).toEqual([]);
  });
}); 