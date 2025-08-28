import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Common mock data
export const mockUser = {
  id: '1',
  email: 'test@example.com',
};

export const mockCars = [
  {
    id: '1',
    name: 'Test Car 1',
    brand: 'Toyota',
    model: 'Camry',
    year: 2020,
    photo: null,
  },
  {
    id: '2',
    name: 'Test Car 2',
    brand: 'Honda',
    model: 'Civic',
    year: 2021,
    photo: 'test-photo.jpg',
  },
];

export const mockTranslation = {
  navigation: {
    financialAnalysis: 'Financial Analysis',
    fuelHistory: 'Fuel History',
  },
  stats: {
    financialAnalysisBreakEven: 'Financial Analysis & Break-Even',
    noVehiclesFound: 'No vehicles found. Add vehicles to see financial analysis.',
    overallFinancialSummary: 'Overall Financial Summary',
    financialTotalIncome: 'Total Income',
    financialTotalCosts: 'Total Costs',
    netProfit: 'Net Profit',
    profitMargin: 'Profit Margin',
    roi: 'ROI',
    profitable: 'Profitable',
    breakEven: 'Break-Even',
    loss: 'Loss',
  },
  common: {
    loading: 'Loading...',
  },
};

export const mockFuelEntries = [
  {
    id: '1',
    carId: '1',
    fuelCompany: 'Shell',
    fuelType: 'Gasoline',
    cost: 50.00,
    currency: 'USD',
    date: '2023-01-01',
    mileage: 10000,
    volume: 40,
  },
  {
    id: '2',
    carId: '2',
    fuelCompany: 'BP',
    fuelType: 'Diesel',
    cost: 60.00,
    currency: 'USD',
    date: '2023-01-02',
    mileage: 20000,
    volume: 45,
  },
];

// Common test utilities
export const testLayoutStructure = async (pageTitle: string) => {
  await waitFor(() => {
    // Check header structure
    expect(screen.getByText(pageTitle)).toBeInTheDocument();
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('language-selector')).toBeInTheDocument();
    expect(screen.getByTestId('auth-button')).toBeInTheDocument();
  });
};

export const testNavigationComponent = async () => {
  await waitFor(() => {
    expect(screen.getByTestId('translated-navigation')).toBeInTheDocument();
  });
};

export const testPageContainer = async () => {
  await waitFor(() => {
    const pageContainers = screen.getAllByTestId('page-container');
    expect(pageContainers.length).toBeGreaterThan(0);
  });
};

export const testSemanticStructure = async () => {
  await waitFor(() => {
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
};

export const testStylingClasses = async () => {
  await waitFor(() => {
    const mainContainer = screen.getByRole('main');
    expect(mainContainer).toHaveClass('flex-grow', 'overflow-auto');
  });
};

export const testLoadingState = () => {
  expect(screen.getByTestId('loading-state')).toBeInTheDocument();
};

export const testErrorState = async () => {
  await waitFor(() => {
    expect(screen.getByTestId('error-state')).toBeInTheDocument();
  });
};

export const testRetryFunctionality = async (mockFetch: jest.Mock) => {
  await waitFor(() => {
    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);
  });

  // Should attempt to retry the data loading
  expect(mockFetch).toHaveBeenCalled();
};

export const testMissingUserHandling = (mockFetch: jest.Mock) => {
  // Should not crash and should not make API calls
  expect(mockFetch).not.toHaveBeenCalled();
};

// Data processing utilities
export const calculateTotal = (entries: any[], field: string) => {
  return entries.reduce((sum, entry) => sum + (entry[field] || 0), 0);
};

export const calculateAverage = (entries: any[], field: string) => {
  if (entries.length === 0) return 0;
  return entries.reduce((sum, entry) => sum + (entry[field] || 0), 0) / entries.length;
};

export const sortByDate = (entries: any[]) => {
  return entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const filterByDateRange = (entries: any[], startDate: Date, endDate: Date) => {
  return entries.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate >= startDate && entryDate <= endDate;
  });
};

export const validateEntryData = (entries: any[]) => {
  return entries.filter(entry => 
    typeof entry.amount === 'number' &&
    entry.amount > 0 &&
    entry.date &&
    typeof entry.date === 'string'
  );
};

export const calculateFuelEfficiency = (entries: any[]) => {
  if (entries.length < 2) return 0;
  const distance = entries[1].odometer - entries[0].odometer;
  return distance / entries[1].amount;
};

export const calculatePagination = (totalEntries: number, pageSize: number) => {
  return Math.ceil(totalEntries / pageSize);
};

export const calculatePageOffset = (currentPage: number, pageSize: number) => {
  return (currentPage - 1) * pageSize;
};

// Currency formatting utilities
export const formatCurrency = (amount: number, currency: string) => {
  return `${currency} ${amount.toFixed(2)}`;
};

export const validateCurrency = (amount: any, currency: any) => {
  return typeof amount === 'number' && 
         typeof currency === 'string' && 
         currency.length === 3;
};

// Shared mock setup patterns (consolidated - use the Mock* exports below instead)
const createMockElement = (tag: string, testId: string, content?: string, extraProps?: any) => {
  return React.createElement(tag, { 'data-testid': testId, ...extraProps }, content);
};

// Shared mock setup patterns
export const createMockComponent = (testId: string, content: string = '') => 
  () => createMockElement('div', testId, content);

export const createMockButton = (testId: string, content: string = '') => 
  () => createMockElement('button', testId, content);

export const createMockSelect = (testId: string, options: string[] = ['English']) => 
  () => createMockElement('select', testId, 
    options.map(option => React.createElement('option', { key: option }, option)),
    { title: 'Language selector' }
  );

export const createMockErrorState = () => {
  return function MockErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
    return createMockElement('div', 'error-state', [
      React.createElement('span', { key: 'error' }, error),
      React.createElement('button', { key: 'retry', onClick: onRetry }, 'Retry')
    ]);
  };
};

export const createMockImage = () => {
  return function MockImage({ src, alt, ...props }: any) {
    return React.createElement('img', { src, alt, ...props, 'data-testid': 'next-image' });
  };
};

// Mock user creation
export const createMockUser = (overrides: any = {}) => {
  return {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    image: null,
    ...overrides,
  };
};

// Mock translations creation
export const createMockTranslations = (overrides: any = {}) => {
  return {
    navigation: {
      financialAnalysis: 'Financial Analysis',
      fuelHistory: 'Fuel History',
      expenseHistory: 'Expense History',
      incomeHistory: 'Income History',
      statistics: 'Statistics',
      export: 'Export',
      import: 'Import',
      profile: 'Profile',
      ...overrides.navigation,
    },
    stats: {
      financialAnalysisBreakEven: 'Financial Analysis & Break-Even',
      noVehiclesFound: 'No vehicles found. Add vehicles to see financial analysis.',
      overallFinancialSummary: 'Overall Financial Summary',
      financialTotalIncome: 'Total Income',
      financialTotalCosts: 'Total Costs',
      netProfit: 'Net Profit',
      profitMargin: 'Profit Margin',
      roi: 'ROI',
      profitable: 'Profitable',
      breakEven: 'Break-Even',
      loss: 'Loss',
      ...overrides.stats,
    },
    common: {
      loading: 'Loading...',
      error: 'Error',
      retry: 'Retry',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      ...overrides.common,
    },
    expenses: {
      title: 'Expenses',
      addExpense: 'Add Expense',
      expenseHistory: 'Expense History',
      ...overrides.expenses,
    },
    fuel: {
      title: 'Fuel',
      addFuel: 'Add Fuel',
      fuelHistory: 'Fuel History',
      ...overrides.fuel,
    },
    income: {
      title: 'Income',
      addIncome: 'Add Income',
      incomeHistory: 'Income History',
      ...overrides.income,
    },
    vehicles: {
      title: 'Vehicles',
      addVehicle: 'Add Vehicle',
      ...overrides.vehicles,
    },
    ...overrides,
  };
};

// Mock language context creation
export const createMockLanguageContext = (language: any = 'en', translations: any = null) => {
  const mockTranslations = translations || createMockTranslations();
  return {
    language: language as any,
    setLanguage: jest.fn(),
    saveLanguagePreference: jest.fn(),
    t: jest.fn((key: string) => {
      // Simple translation lookup
      const keys = key.split('.');
      let value = mockTranslations;
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          return key; // Return key if translation not found
        }
      }
      return typeof value === 'string' ? value : key;
    }),
    translations: mockTranslations,
  };
};

// Mock file change event creation
export const createMockFileChangeEvent = (files: File[]) => {
  return {
    target: {
      files,
    },
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
  } as any;
};

// Mock data table filters return
export const createMockDataTableFiltersReturn = (overrides: any = {}) => {
  return {
    filteredData: [],
    totalCount: 0,
    resultCount: 0,
    searchTerm: '',
    setSearchTerm: jest.fn(),
    sortBy: 'date',
    setSortBy: jest.fn(),
    sortOrder: 'desc',
    setSortOrder: jest.fn(),
    currentPage: 1,
    setCurrentPage: jest.fn(),
    pageSize: 10,
    setPageSize: jest.fn(),
    filters: {},
    setFilters: jest.fn(),
    clearFilters: jest.fn(),
    ...overrides,
  };
};

// Mock infinite scroll return
export const createMockInfiniteScrollReturn = (overrides: any = {}) => {
  return {
    visibleItems: [],
    canLoadMore: false,
    isLoading: false,
    loadMore: jest.fn(),
    hasMore: false,
    ...overrides,
  };
};

// Simple test to satisfy Jest requirement
describe('testHelpers', () => {
  it('should export all required helper functions', () => {
    expect(createMockUser).toBeDefined();
    expect(createMockTranslations).toBeDefined();
    expect(createMockLanguageContext).toBeDefined();
    expect(createMockFileChangeEvent).toBeDefined();
    expect(createMockDataTableFiltersReturn).toBeDefined();
    expect(createMockInfiniteScrollReturn).toBeDefined();
  });
});

// Common mock setup functions to reduce duplication

// Common Jest mock configurations - these are component factories for reuse
// Note: jest.mock() calls must be at the top level, so use these in individual test files

// Standard component mock factories
export const MockPageContainer = ({ children, className = '' }: { children: React.ReactNode; className?: string }) =>
  React.createElement('div', { 'data-testid': 'page-container', className }, children);

export const MockTranslatedNavigation = () =>
  React.createElement('nav', { 'data-testid': 'translated-navigation' }, 'Navigation');

export const MockAuthButton = () =>
  React.createElement('button', { 'data-testid': 'auth-button' }, 'Auth');

export const MockGlobalLanguageSelector = () =>
  React.createElement('select', { 'data-testid': 'language-selector', title: 'Language selector' }, 
    React.createElement('option', null, 'English')
  );

export const MockSimpleThemeToggle = () =>
  React.createElement('button', { 'data-testid': 'theme-toggle' }, 'Theme');

export const MockLoadingState = () =>
  React.createElement('div', { 'data-testid': 'loading-state' }, 'Loading...');

export const MockErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) =>
  React.createElement('div', { 'data-testid': 'error-state' },
    React.createElement('span', null, error),
    React.createElement('button', { onClick: onRetry }, 'Retry')
  );

export const MockNextImage = ({ src, alt, ...props }: any) =>
  React.createElement('img', { src, alt, ...props, 'data-testid': 'next-image' });

// Helper to reduce duplication in Content Display tests
export const createStandardContentDisplayTests = (PageComponent: React.ComponentType, expectations: {
  noDataMessage?: string;
  hasDataElements?: string[];
  hasImages?: boolean;
}) => {
  const renderComponent = () => render(React.createElement(PageComponent));
  
  return () => {
    if (expectations.noDataMessage) {
      it('should display no data message when no data is available', async () => {
        const { useVehicles } = require('../../app/hooks/useVehicles');
        (useVehicles as jest.Mock).mockReturnValue({
          cars: [],
          isLoading: false,
          error: null,
        });

        renderComponent();

        await waitFor(() => {
          expect(screen.getByText(expectations.noDataMessage!)).toBeInTheDocument();
        });
      });
    }

    if (expectations.hasDataElements) {
      it('should display main content elements when data is available', async () => {
        renderComponent();

        await waitFor(() => {
          expectations.hasDataElements!.forEach(element => {
            expect(screen.getByText(element)).toBeInTheDocument();
          });
        });
      });
    }

    if (expectations.hasImages) {
      it('should display images when available', async () => {
        renderComponent();

        await waitFor(() => {
          const images = screen.getAllByTestId('next-image');
          expect(images.length).toBeGreaterThan(0);
        });
      });
    }
  };
};

// Helper to reduce duplication in data processing tests
export const createStandardDataProcessingTests = () => {
  return () => {
    it('should calculate total costs correctly', () => {
      const entries = [
        { cost: 50, currency: 'USD' },
        { cost: 75, currency: 'USD' },
        { cost: 30, currency: 'USD' },
      ];
      
      const total = calculateTotal(entries, 'cost');
      expect(total).toBe(155);
    });

    it('should calculate average costs correctly', () => {
      const entries = [
        { cost: 50 },
        { cost: 60 },
        { cost: 70 },
      ];
      
      const average = calculateAverage(entries, 'cost');
      expect(average).toBe(60);
    });

    it('should sort entries by date correctly', () => {
      const entries = [
        { date: '2023-01-03' },
        { date: '2023-01-01' },
        { date: '2023-01-02' },
      ];
      
      const sorted = sortByDate(entries);
      expect(sorted[0].date).toBe('2023-01-01');
      expect(sorted[2].date).toBe('2023-01-03');
    });

    it('should filter entries by date range correctly', () => {
      const entries = [
        { date: '2023-01-01' },
        { date: '2023-01-15' },
        { date: '2023-02-01' },
      ];
      
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');
      const filtered = filterByDateRange(entries, startDate, endDate);
      
      expect(filtered).toHaveLength(2);
    });

    it('should validate entry data correctly', () => {
      const entries = [
        { amount: 50, date: '2023-01-01' },
        { amount: -10, date: '2023-01-02' },
        { amount: 'invalid', date: '2023-01-03' },
        { amount: 30, date: null },
      ];
      
      const valid = validateEntryData(entries);
      expect(valid).toHaveLength(1);
    });

    it('should calculate pagination correctly', () => {
      const totalEntries = 127;
      const pageSize = 10;
      const pages = calculatePagination(totalEntries, pageSize);
      expect(pages).toBe(13);
    });

    it('should calculate page offset correctly', () => {
      const currentPage = 3;
      const pageSize = 10;
      const offset = calculatePageOffset(currentPage, pageSize);
      expect(offset).toBe(20);
    });
  };
};

// Helper to reduce duplication in currency/formatting tests
export const createStandardFormattingTests = () => {
  return () => {
    it('should format currency correctly', () => {
      const formatted = formatCurrency(123.45, 'USD');
      expect(formatted).toBe('USD 123.45');
    });

    it('should validate currency correctly', () => {
      expect(validateCurrency(50, 'USD')).toBe(true);
      expect(validateCurrency('invalid', 'USD')).toBe(false);
      expect(validateCurrency(50, 'INVALID_CURRENCY')).toBe(false);
    });
  };
};

// Common hook mocks setup
export const setupCommonHookMocks = () => {
  jest.mock('../../app/context/AuthContext', () => ({
    useAuth: jest.fn(),
  }));

  jest.mock('../../app/hooks/useTranslation', () => ({
    useTranslation: jest.fn(),
  }));

  jest.mock('../../app/hooks/useVehicles', () => ({
    useVehicles: jest.fn(),
  }));

  jest.mock('../../app/lib/idUtils', () => ({
    getObjectId: jest.fn(() => 'mock-object-id'),
  }));
};

// Common language context mock setup
export const setupLanguageContextMock = (translations: any = null) => {
  const mockTranslations = translations || createMockTranslations();
  jest.mock('../../app/context/LanguageContext', () => ({
    useLanguage: jest.fn(() => ({
      language: 'en',
      t: mockTranslations,
      setLanguage: jest.fn(),
      saveLanguagePreference: jest.fn(),
    })),
  }));
  return mockTranslations;
};

// Standard mock returns for common hooks
export const createStandardAuthMock = () => ({
  user: mockUser,
  loading: false,
});

export const createStandardVehiclesMock = () => ({
  cars: mockCars,
  isLoading: false,
  error: null,
});

export const createStandardTranslationMock = () => ({
  t: mockTranslation,
});

// Standard beforeEach setup for page tests
export const setupStandardPageTest = (mockFetch: jest.Mock, additionalMockFetchSetup?: (mockFetch: jest.Mock) => void) => {
  return () => {
    const { useAuth } = require('../../app/context/AuthContext');
    const { useTranslation } = require('../../app/hooks/useTranslation');
    const { useVehicles } = require('../../app/hooks/useVehicles');

    (useAuth as jest.Mock).mockReturnValue(createStandardAuthMock());
    (useTranslation as jest.Mock).mockReturnValue(createStandardTranslationMock());
    (useVehicles as jest.Mock).mockReturnValue(createStandardVehiclesMock());

    // Default fetch mock setup
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        vehicles: mockCars,
        entries: mockFuelEntries,
      }),
    });

    // Allow additional custom mock fetch setup
    if (additionalMockFetchSetup) {
      additionalMockFetchSetup(mockFetch);
    }

    jest.clearAllMocks();
  };
};

// Standard layout test suite
export const createStandardLayoutTests = (PageComponent: React.ComponentType, pageTitle: string) => {
  const renderComponent = () => render(React.createElement(PageComponent));
  
  return () => {
    it('should render with consistent layout structure', async () => {
      renderComponent();
      await testLayoutStructure(pageTitle);
    });

    it('should render navigation component', async () => {
      renderComponent();
      await testNavigationComponent();
    });

    it('should render main content within PageContainer', async () => {
      renderComponent();
      await testPageContainer();
    });

    it('should have proper semantic structure with main element', async () => {
      renderComponent();
      await testSemanticStructure();
    });

    it('should maintain consistent styling classes', async () => {
      renderComponent();
      await testStylingClasses();
    });
  };
};

// Standard loading/error test suite
export const createStandardDataLoadingTests = (PageComponent: React.ComponentType, mockFetch: jest.Mock) => {
  const renderComponent = () => render(React.createElement(PageComponent));
  
  return () => {
    it('should show loading state initially', () => {
      const { useVehicles } = require('../../app/hooks/useVehicles');
      (useVehicles as jest.Mock).mockReturnValue({
        cars: [],
        isLoading: true,
        error: null,
      });

      renderComponent();
      testLoadingState();
    });

    it('should show error state when there is an error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      renderComponent();
      await testErrorState();
    });

    it('should retry data loading when retry button is clicked', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      renderComponent();
      await testRetryFunctionality(mockFetch);
    });

    it('should handle missing user gracefully', () => {
      const { useAuth } = require('../../app/context/AuthContext');
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false,
      });

      renderComponent();
      testMissingUserHandling(mockFetch);
    });
  };
};

// Helper for ExpenseTab-like component mock setups
export const setupTabComponentMocks = (
  mockUseLanguage: any,
  mockUseDataTableFilters: any,
  mockUseInfiniteScroll: any,
  translations?: any,
  filteredData: any[] = [],
  visibleItems: any[] = []
) => {
  const mockTranslations = translations || createMockTranslations();
  const mockFilterHookReturn = createMockDataTableFiltersReturn({
    filteredData,
    totalCount: filteredData.length,
    resultCount: filteredData.length,
  });
  const mockScrollHookReturn = createMockInfiniteScrollReturn({
    visibleItems,
    canLoadMore: false,
  });

  mockUseLanguage.mockReturnValue(createMockLanguageContext('en', mockTranslations));
  mockUseDataTableFilters.mockReturnValue(mockFilterHookReturn);
  mockUseInfiniteScroll.mockReturnValue(mockScrollHookReturn);

  return { mockFilterHookReturn, mockScrollHookReturn, mockTranslations };
};

// Helper to create custom mock setups for specific test scenarios
export const createCustomMockSetup = (overrides: {
  filterHookOverrides?: any;
  scrollHookOverrides?: any;
  languageOverrides?: any;
}) => {
  const baseFilterReturn = createMockDataTableFiltersReturn();
  const baseScrollReturn = createMockInfiniteScrollReturn();
  const baseLanguageContext = createMockLanguageContext();

  return {
    filterHookReturn: { ...baseFilterReturn, ...overrides.filterHookOverrides },
    scrollHookReturn: { ...baseScrollReturn, ...overrides.scrollHookOverrides },
    languageContext: { ...baseLanguageContext, ...overrides.languageOverrides },
  };
};

// Helper for reducing render call duplication in component tests
export const createComponentRenderer = (Component: React.ComponentType<any>, defaultProps: any) => {
  return (overrideProps: any = {}) => {
    const props = { ...defaultProps, ...overrideProps };
    return render(React.createElement(Component, props));
  };
};

// Helper to create a comprehensive page test setup that reduces duplication
export const createPageTestSetup = (customFetchSetup?: (mockFetch: jest.Mock) => void) => {
  return setupStandardPageTest(jest.fn(), customFetchSetup);
};

// Helper to reduce duplication in accessibility tests
export const createStandardAccessibilityTests = (PageComponent: React.ComponentType) => {
  return () => {
    it('should have proper heading structure', async () => {
      render(React.createElement(PageComponent));

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      });
    });
  };
}; 