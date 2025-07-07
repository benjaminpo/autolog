import { RefObject } from 'react';
import { EnhancedTranslationType, Language } from '../../app/translations';

// Local interface for data table filters return type
interface UseDataTableFiltersReturn<T> {
  searchTerm: string;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  showFilters: boolean;
  filters: Record<string, any>;
  filteredData: T[];
  totalCount: number;
  resultCount: number;
  setSearchTerm: (term: string) => void;
  setSortBy: (sortBy: string) => void;
  setSortDirection: (direction: 'asc' | 'desc') => void;
  setShowFilters: (show: boolean) => void;
  updateFilter: (key: string, value: any) => void;
  resetFilters: () => void;
  handleSortChange: (sortBy: string, direction: 'asc' | 'desc') => void;
}

// Enhanced translation mock function that matches EnhancedTranslationType
export const createMockTranslations = (overrides: Record<string, any> = {}): EnhancedTranslationType => {
  const baseTranslations = {
    date: 'Date',
    amount: 'Amount', 
    category: 'Category',
    car: 'Vehicle',
    dateRange: 'Date Range',
    notes: 'Notes',
    currency: 'Currency',
    actions: 'Actions',
    edit: 'Edit',
    delete: 'Delete',
    noExpenses: 'No expenses found',
    loading: 'Loading...',
    expense: {
      labels: {
        maintenance: 'Maintenance',
        fuel: 'Fuel', 
        insurance: 'Insurance',
      },
    },
    ...overrides,
  };

  // Create the mock translation object with utility functions
  const mockTranslation = {
    ...baseTranslations,
    _: jest.fn((key: string, params?: Record<string, any>) => {
      // Simple mock implementation that returns the key or uses params
      if (params && Object.keys(params).length > 0) {
        let result = key;
        Object.entries(params).forEach(([param, value]) => {
          result = result.replace(`{${param}}`, String(value));
        });
        return result;
      }
      return key;
    }),
    _p: jest.fn((count: number, key: string, params?: Record<string, any>) => {
      // Simple mock pluralization
      const base = params?.one || key;
      return count === 1 ? base : `${base}s`;
    })
  };

  return mockTranslation as EnhancedTranslationType;
};

// Mock for useDataTableFilters hook
export const createMockDataTableFiltersReturn = <T>(overrides: Partial<UseDataTableFiltersReturn<T>> = {}): UseDataTableFiltersReturn<T> => ({
  searchTerm: '',
  sortBy: 'date',
  sortDirection: 'desc' as const,
  showFilters: false,
  filteredData: [] as T[],
  totalCount: 0,
  resultCount: 0,
  setSearchTerm: jest.fn(),
  setSortBy: jest.fn(),
  setSortDirection: jest.fn(),
  setShowFilters: jest.fn(),
  updateFilter: jest.fn(),
  resetFilters: jest.fn(),
  handleSortChange: jest.fn(),
  filters: {},
  ...overrides
});

// Mock for useInfiniteScroll hook
export const createMockInfiniteScrollReturn = <T>(overrides: any = {}) => ({
  visibleItems: [] as T[],
  canLoadMore: false,
  loadingRef: { current: null } as RefObject<HTMLDivElement | null>,
  reset: jest.fn(),
  ...overrides
});

// Mock language context type
export const createMockLanguageContext = (language: Language = 'en', translations?: EnhancedTranslationType) => ({
  language,
  t: translations || createMockTranslations(),
  setLanguage: jest.fn(),
  saveLanguagePreference: jest.fn(),
});

// Mock user object
export const createMockUser = (overrides: any = {}) => ({
  id: 'user1',
  name: 'Test User',
  email: 'test@example.com',
  ...overrides
});

// Mock React ChangeEvent for file inputs
export const createMockFileChangeEvent = (files: File[]): React.ChangeEvent<HTMLInputElement> => ({
  target: { files } as any,
  currentTarget: { files } as any,
  nativeEvent: new Event('change'),
  bubbles: false,
  cancelable: false,
  defaultPrevented: false,
  eventPhase: 0,
  isTrusted: true,
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
  stopImmediatePropagation: jest.fn(),
  isDefaultPrevented: jest.fn().mockReturnValue(false),
  isPropagationStopped: jest.fn().mockReturnValue(false),
  persist: jest.fn(),
  timeStamp: Date.now(),
  type: 'change',
} as React.ChangeEvent<HTMLInputElement>);

// Mock expense data
export const createMockExpense = (overrides: any = {}) => ({
  id: 'expense1',
  carId: 'car1',
  category: 'maintenance',
  amount: 100,
  currency: 'USD',
  date: '2023-10-15',
  notes: 'Test expense',
  ...overrides
});

// Mock vehicle data
export const createMockVehicle = (overrides: any = {}) => ({
  id: 'car1',
  make: 'Toyota',
  model: 'Camry',
  year: 2020,
  licensePlate: 'ABC123',
  ...overrides
});

export default {
  createMockTranslations,
  createMockDataTableFiltersReturn,
  createMockInfiniteScrollReturn,
  createMockLanguageContext,
  createMockUser,
  createMockFileChangeEvent,
  createMockExpense,
  createMockVehicle,
};

// Tests for the helper functions
describe('Test Helpers', () => {
  describe('createMockTranslations', () => {
    it('should create a mock translation object with required utility functions', () => {
      const mockT = createMockTranslations();
      
      expect(mockT).toHaveProperty('_');
      expect(mockT).toHaveProperty('_p');
      expect(typeof mockT._).toBe('function');
      expect(typeof mockT._p).toBe('function');
    });

    it('should include default translations', () => {
      const mockT = createMockTranslations();
      
      expect(mockT.date).toBe('Date');
      expect(mockT.amount).toBe('Amount');
      expect(mockT.category).toBe('Category');
    });

    it('should allow overrides', () => {
      const mockT = createMockTranslations({ date: 'Custom Date' });
      
      expect(mockT.date).toBe('Custom Date');
    });
  });

  describe('createMockDataTableFiltersReturn', () => {
    it('should create a proper mock data table filters return object', () => {
      const mockReturn = createMockDataTableFiltersReturn();
      
      expect(mockReturn).toHaveProperty('searchTerm');
      expect(mockReturn).toHaveProperty('filteredData');
      expect(mockReturn).toHaveProperty('setSearchTerm');
      expect(typeof mockReturn.setSearchTerm).toBe('function');
    });
  });

  describe('createMockInfiniteScrollReturn', () => {
    it('should create a proper mock infinite scroll return object', () => {
      const mockReturn = createMockInfiniteScrollReturn();
      
      expect(mockReturn).toHaveProperty('visibleItems');
      expect(mockReturn).toHaveProperty('canLoadMore');
      expect(mockReturn).toHaveProperty('reset');
      expect(typeof mockReturn.reset).toBe('function');
    });
  });

  describe('createMockLanguageContext', () => {
    it('should create a proper mock language context', () => {
      const mockContext = createMockLanguageContext();
      
      expect(mockContext).toHaveProperty('language');
      expect(mockContext).toHaveProperty('t');
      expect(mockContext).toHaveProperty('setLanguage');
      expect(typeof mockContext.setLanguage).toBe('function');
    });
  });

  describe('createMockUser', () => {
    it('should create a mock user with required properties', () => {
      const mockUser = createMockUser();
      
      expect(mockUser).toHaveProperty('id');
      expect(mockUser).toHaveProperty('name');
      expect(mockUser).toHaveProperty('email');
    });
  });

  describe('createMockFileChangeEvent', () => {
    it('should create a proper mock file change event', () => {
      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const mockEvent = createMockFileChangeEvent([mockFile]);
      
      expect(mockEvent).toHaveProperty('target');
      expect(mockEvent).toHaveProperty('type');
      expect(mockEvent.type).toBe('change');
      expect(mockEvent.target.files).toContain(mockFile);
    });
  });
}); 