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

// Shared mock setup patterns
export const createMockComponent = (testId: string, content: string = '') => {
  return function MockComponent(props: any) {
    return React.createElement('div', { 'data-testid': testId }, content);
  };
};

export const createMockButton = (testId: string, content: string = '') => {
  return function MockButton(props: any) {
    return React.createElement('button', { 'data-testid': testId }, content);
  };
};

export const createMockSelect = (testId: string, options: string[] = ['English']) => {
  return function MockSelect(props: any) {
    return React.createElement('select', { 'data-testid': testId, title: 'Language selector' }, 
      options.map(option => React.createElement('option', { key: option }, option))
    );
  };
};

export const createMockErrorState = () => {
  return function MockErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
    return React.createElement('div', { 'data-testid': 'error-state' },
      React.createElement('span', null, error),
      React.createElement('button', { onClick: onRetry }, 'Retry')
    );
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

// Common Jest mock configurations
export const createCommonComponentMocks = () => {
  // PageContainer mock
  jest.mock('../../app/components/PageContainer', () => {
    return function MockPageContainer({ children, className = '' }: { children: React.ReactNode; className?: string }) {
      return React.createElement('div', { 'data-testid': 'page-container', className }, children);
    };
  });

  // TranslatedNavigation mock
  jest.mock('../../app/components/TranslatedNavigation', () => ({
    TranslatedNavigation: function MockTranslatedNavigation() {
      return React.createElement('nav', { 'data-testid': 'translated-navigation' }, 'Navigation');
    },
  }));

  // AuthButton mock
  jest.mock('../../app/components/AuthButton', () => ({
    AuthButton: function MockAuthButton() {
      return React.createElement('button', { 'data-testid': 'auth-button' }, 'Auth');
    },
  }));

  // GlobalLanguageSelector mock
  jest.mock('../../app/components/GlobalLanguageSelector', () => ({
    GlobalLanguageSelector: function MockGlobalLanguageSelector() {
      return React.createElement('select', { 'data-testid': 'language-selector', title: 'Language selector' }, 
        React.createElement('option', null, 'English')
      );
    },
  }));

  // ThemeToggle mock
  jest.mock('../../app/components/ThemeToggle', () => ({
    SimpleThemeToggle: function MockSimpleThemeToggle() {
      return React.createElement('button', { 'data-testid': 'theme-toggle' }, 'Theme');
    },
  }));

  // LoadingState mock
  jest.mock('../../app/components/LoadingState', () => ({
    LoadingState: function MockLoadingState() {
      return React.createElement('div', { 'data-testid': 'loading-state' }, 'Loading...');
    },
  }));

  // ErrorState mock
  jest.mock('../../app/components/ErrorState', () => ({
    ErrorState: function MockErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
      return React.createElement('div', { 'data-testid': 'error-state' },
        React.createElement('span', null, error),
        React.createElement('button', { onClick: onRetry }, 'Retry')
      );
    },
  }));

  // Next.js Image mock
  jest.mock('next/image', () => {
    return function MockImage({ src, alt, ...props }: any) {
      return React.createElement('img', { src, alt, ...props, 'data-testid': 'next-image' });
    };
  });
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
  return () => {
    it('should render with consistent layout structure', async () => {
      render(React.createElement(PageComponent));
      await testLayoutStructure(pageTitle);
    });

    it('should render navigation component', async () => {
      render(React.createElement(PageComponent));
      await testNavigationComponent();
    });

    it('should render main content within PageContainer', async () => {
      render(React.createElement(PageComponent));
      await testPageContainer();
    });

    it('should have proper semantic structure with main element', async () => {
      render(React.createElement(PageComponent));
      await testSemanticStructure();
    });

    it('should maintain consistent styling classes', async () => {
      render(React.createElement(PageComponent));
      await testStylingClasses();
    });
  };
};

// Standard loading/error test suite
export const createStandardDataLoadingTests = (PageComponent: React.ComponentType, mockFetch: jest.Mock) => {
  return () => {
    it('should show loading state initially', () => {
      const { useVehicles } = require('../../app/hooks/useVehicles');
      (useVehicles as jest.Mock).mockReturnValue({
        cars: [],
        isLoading: true,
        error: null,
      });

      render(React.createElement(PageComponent));
      testLoadingState();
    });

    it('should show error state when there is an error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      render(React.createElement(PageComponent));
      await testErrorState();
    });

    it('should retry data loading when retry button is clicked', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      render(React.createElement(PageComponent));
      await testRetryFunctionality(mockFetch);
    });

    it('should handle missing user gracefully', () => {
      const { useAuth } = require('../../app/context/AuthContext');
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false,
      });

      render(React.createElement(PageComponent));
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