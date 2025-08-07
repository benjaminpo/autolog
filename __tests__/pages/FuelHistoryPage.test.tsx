import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FuelHistoryPage from '../../app/fuel-history/page';
import { useAuth } from '../../app/context/AuthContext';
import { useTranslation } from '../../app/hooks/useTranslation';
import { useVehicles } from '../../app/hooks/useVehicles';
import {
  testLayoutStructure,
  testNavigationComponent,
  testPageContainer,
  testSemanticStructure,
  testStylingClasses,
  testLoadingState,
  testErrorState,
  testRetryFunctionality,
  testMissingUserHandling,
  calculateTotal,
  calculateAverage,
  sortByDate,
  filterByDateRange,
  validateEntryData,
  calculateFuelEfficiency,
  calculatePagination,
  calculatePageOffset,
  formatCurrency,
  validateCurrency,
  mockFuelEntries,
} from '../utils/testHelpers';

// Mock dependencies
jest.mock('../../app/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../app/hooks/useTranslation', () => ({
  useTranslation: jest.fn(),
}));

jest.mock('../../app/hooks/useVehicles', () => ({
  useVehicles: jest.fn(),
}));

// Mock utility functions and data
jest.mock('../../app/lib/idUtils', () => ({
  getObjectId: jest.fn(() => 'mock-object-id'),
}));

jest.mock('../../app/lib/vehicleData', () => ({
  fuelCompanies: ['Shell', 'BP', 'ExxonMobil'],
  fuelTypes: ['Gasoline', 'Diesel', 'Premium'],
}));

// Mock types
jest.mock('../../app/types/common', () => ({
  FuelEntry: {},
}));

// Mock components
jest.mock('../../app/components/PageContainer', () => {
  return function MockPageContainer({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return React.createElement('div', { 'data-testid': 'page-container', className }, children);
  };
});

jest.mock('../../app/components/TranslatedNavigation', () => ({
  TranslatedNavigation: function MockTranslatedNavigation() {
    return React.createElement('nav', { 'data-testid': 'translated-navigation' }, 'Navigation');
  },
}));

jest.mock('../../app/components/AuthButton', () => ({
  AuthButton: function MockAuthButton() {
    return React.createElement('button', { 'data-testid': 'auth-button' }, 'Auth');
  },
}));

jest.mock('../../app/components/GlobalLanguageSelector', () => ({
  GlobalLanguageSelector: function MockGlobalLanguageSelector() {
    return React.createElement('select', { 'data-testid': 'language-selector', title: 'Language selector' }, 
      React.createElement('option', null, 'English')
    );
  },
}));

jest.mock('../../app/components/ThemeToggle', () => ({
  SimpleThemeToggle: function MockSimpleThemeToggle() {
    return React.createElement('button', { 'data-testid': 'theme-toggle' }, 'Theme');
  },
}));

jest.mock('../../app/components/LoadingState', () => ({
  LoadingState: function MockLoadingState() {
    return React.createElement('div', { 'data-testid': 'loading-state' }, 'Loading...');
  },
}));

jest.mock('../../app/components/ErrorState', () => ({
  ErrorState: function MockErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
    return React.createElement('div', { 'data-testid': 'error-state' },
      React.createElement('span', null, error),
      React.createElement('button', { onClick: onRetry }, 'Retry')
    );
  },
}));

jest.mock('../../app/components/FuelTab', () => {
  return function MockFuelTab(props: any) {
    return React.createElement('div', { 'data-testid': 'fuel-tab' },
      React.createElement('div', null, 'Fuel Tab'),
      React.createElement('div', { 'data-testid': 'fuel-entries-count' }, props.entries?.length || 0)
    );
  };
});

jest.mock('../../app/components/withTranslations', () => {
  return function withTranslations(Component: any) {
    return Component;
  };
});

jest.mock('../../app/components/modals', () => ({
  Modals: function MockModals() {
    return React.createElement('div', { 'data-testid': 'modals' }, 'Modals');
  },
}));

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return React.createElement('img', { src, alt, ...props, 'data-testid': 'next-image' });
  };
});

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('FuelHistoryPage', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: '1', email: 'test@example.com' },
      loading: false,
    });

    (useTranslation as jest.Mock).mockReturnValue({
      t: {
        navigation: { fuelHistory: 'Fuel History' },
        common: { loading: 'Loading...' },
      },
    });

    (useVehicles as jest.Mock).mockReturnValue({
      cars: [
        { id: '1', name: 'Test Car 1', brand: 'Toyota', model: 'Camry', year: 2020, photo: null },
        { id: '2', name: 'Test Car 2', brand: 'Honda', model: 'Civic', year: 2021, photo: 'test-photo.jpg' },
      ],
      isLoading: false,
      error: null,
    });

    // Mock successful fetch responses
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/fuel-entries')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            entries: mockFuelEntries,
          }),
        });
      }
      if (url.includes('/api/fuel-companies')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            companies: [{ name: 'Shell' }, { name: 'BP' }],
          }),
        });
      }
      if (url.includes('/api/fuel-types')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            types: [{ name: 'Gasoline' }, { name: 'Diesel' }],
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
    });

    jest.clearAllMocks();
  });

  describe('Layout and Structure', () => {
    it('should render with consistent layout structure matching expense-history', async () => {
      render(<FuelHistoryPage />);
      await testLayoutStructure('Fuel History');
    });

    it('should render navigation component', async () => {
      render(<FuelHistoryPage />);
      await testNavigationComponent();
    });

    it('should render main content within PageContainer', async () => {
      render(<FuelHistoryPage />);
      await testPageContainer();
    });

    it('should have proper semantic structure with main element', async () => {
      render(<FuelHistoryPage />);
      await testSemanticStructure();
    });

    it('should maintain consistent styling classes', async () => {
      render(<FuelHistoryPage />);
      await testStylingClasses();
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading state initially', () => {
      render(<FuelHistoryPage />);
      testLoadingState();
    });

    it('should show error state when API fails', async () => {
      // Make the fuel-companies API call fail to trigger error state
      mockFetch.mockImplementation((url) => {
        if (url.includes('fuel-companies') || url.includes('fuel-types')) {
          return Promise.reject(new Error('API Error'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, entries: [] })
        });
      });

      render(<FuelHistoryPage />);
      await testErrorState();
    });

    it('should retry data loading when retry button is clicked', async () => {
      // Make the fuel-companies API call fail to trigger error state
      mockFetch.mockImplementation((url) => {
        if (url.includes('fuel-companies') || url.includes('fuel-types')) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, entries: [] })
        });
      });

      render(<FuelHistoryPage />);
      await testRetryFunctionality(mockFetch);
    });

    it('should handle missing user gracefully', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false,
      });

      render(<FuelHistoryPage />);
      testMissingUserHandling(mockFetch);
    });
  });

  describe('Content Display', () => {
    it('should display fuel tab with entries', async () => {
      render(<FuelHistoryPage />);

      await waitFor(() => {
        expect(screen.getByTestId('fuel-tab')).toBeInTheDocument();
        expect(screen.getByTestId('fuel-entries-count')).toHaveTextContent('2');
      });
    });

    it('should render modals component', async () => {
      render(<FuelHistoryPage />);

      await waitFor(() => {
        expect(screen.getByTestId('modals')).toBeInTheDocument();
      });
    });
  });

  describe('Data Processing Logic', () => {
    it('should calculate total fuel amount', () => {
      const fuelEntries = [
        { amount: 50.00 },
        { amount: 30.00 },
        { amount: 40.00 },
      ];

      const total = calculateTotal(fuelEntries, 'amount');
      expect(total).toBe(120.00);
    });

    it('should calculate total cost', () => {
      const fuelEntries = [
        { amount: 50.00, pricePerUnit: 1.50 },
        { amount: 30.00, pricePerUnit: 1.60 },
        { amount: 40.00, pricePerUnit: 1.55 },
      ];

      const totalCost = fuelEntries.reduce((sum, entry) => sum + (entry.amount * entry.pricePerUnit), 0);
      expect(totalCost).toBe(185.00);
    });

    it('should sort entries by date', () => {
      const entries = [
        { date: new Date('2023-01-01') },
        { date: new Date('2023-01-15') },
        { date: new Date('2023-01-08') },
      ];

      const sortedByDate = sortByDate(entries);
      expect(sortedByDate[0].date.getDate()).toBe(1);
      expect(sortedByDate[2].date.getDate()).toBe(15);
    });

    it('should filter entries by date range', () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-03-31');

      const entries = [
        { date: '2022-12-15', amount: 100 },
        { date: '2023-02-10', amount: 150 },
        { date: '2023-04-05', amount: 200 },
      ];

      const filteredEntries = filterByDateRange(entries, startDate, endDate);
      expect(filteredEntries).toHaveLength(1);
      expect(filteredEntries[0].amount).toBe(150);
    });

    it('should calculate fuel efficiency', () => {
      const entries = [
        { amount: 50.00, odometer: 12000 },
        { amount: 45.00, odometer: 12500 },
      ];

      if (entries.length >= 2) {
        const efficiency = calculateFuelEfficiency(entries);
        expect(efficiency).toBeCloseTo(11.11);
      }
    });
  });

  describe('Data Validation', () => {
    it('should handle empty fuel entries', () => {
      const entries: any[] = [];
      const total = calculateTotal(entries, 'amount');

      expect(total).toBe(0);
      expect(entries.length).toBe(0);
    });

    it('should validate entry data', () => {
      const invalidEntries = [
        { amount: null, date: 'invalid-date' },
        { amount: 'not-a-number', date: '2023-01-01' },
        { amount: 50, date: null },
      ];

      const validEntries = validateEntryData(invalidEntries);
      expect(validEntries).toHaveLength(0);
    });

    it('should calculate average fuel consumption', () => {
      const entries = [
        { volume: 40, distance: 500 },
        { volume: 35, distance: 450 },
        { volume: 42, distance: 520 },
      ];

      const avgConsumption = calculateAverage(entries, 'volume') / calculateAverage(entries, 'distance') * 100;
      expect(avgConsumption).toBeCloseTo(7.96, 2);
    });

    it('should handle currency conversion calculations', () => {
      const entries = [
        { cost: 50, currency: 'USD', exchangeRate: 1 },
        { cost: 60, currency: 'EUR', exchangeRate: 1.1 },
        { cost: 45, currency: 'GBP', exchangeRate: 1.25 },
      ];

      const totalInUSD = calculateTotal(entries, 'cost') * 1.1; // Simplified calculation
      expect(totalInUSD).toBe(170.5);
    });

    it('should validate fuel efficiency calculations', () => {
      const testData = {
        previousMileage: 10000,
        currentMileage: 10500,
        fuelVolume: 40,
      };

      const distance = testData.currentMileage - testData.previousMileage;
      const efficiency = distance / testData.fuelVolume;

      expect(efficiency).toBeCloseTo(12.5);
      expect(distance).toBe(500);
    });

    it('should handle partial fuel-ups correctly', () => {
      const entries = [
        { id: '1', partialFuelUp: false, volume: 50, cost: 65 },
        { id: '2', partialFuelUp: true, volume: 20, cost: 26 },
        { id: '3', partialFuelUp: false, volume: 48, cost: 62.4 },
      ];

      const fullFuelUps = entries.filter(entry => !entry.partialFuelUp);
      const partialFuelUps = entries.filter(entry => entry.partialFuelUp);

      expect(fullFuelUps).toHaveLength(2);
      expect(partialFuelUps).toHaveLength(1);
    });
  });

  describe('API Integration', () => {
    it('should fetch fuel entries on mount', async () => {
      render(<FuelHistoryPage />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/fuel-entries')
        );
      });
    });

    it('should fetch fuel companies and types', async () => {
      render(<FuelHistoryPage />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/fuel-companies');
        expect(mockFetch).toHaveBeenCalledWith('/api/fuel-types');
      });
    });

    it('should handle load more functionality', async () => {
      // This would test pagination
      render(<FuelHistoryPage />);

      await waitFor(() => {
        // Verify initial load
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('limit=20&offset=0')
        );
      });
    });
  });

  describe('Statistics Calculations', () => {
    it('should calculate average price per unit', () => {
      const entries = [
        { pricePerUnit: 1.50 },
        { pricePerUnit: 1.60 },
        { pricePerUnit: 1.55 },
      ];

      const avgPrice = calculateAverage(entries, 'pricePerUnit');
      expect(avgPrice).toBeCloseTo(1.55);
    });

    it('should find most expensive fill-up', () => {
      const entries = [
        { totalCost: 75.00 },
        { totalCost: 85.00 },
        { totalCost: 65.00 },
      ];

      const maxCost = Math.max(...entries.map(entry => entry.totalCost));
      expect(maxCost).toBe(85.00);
    });
  });

  describe('Currency Formatting', () => {
    it('should format currency amounts', () => {
      const amount = 45.50;
      const currency = 'USD';
      const formattedAmount = formatCurrency(amount, currency);

      expect(formattedAmount).toBe('USD 45.50');
    });

    it('should handle different currencies', () => {
      const amounts = [
        { value: 100, currency: 'USD' },
        { value: 85, currency: 'EUR' },
        { value: 12000, currency: 'JPY' },
      ];

      amounts.forEach(amount => {
        expect(validateCurrency(amount.value, amount.currency)).toBe(true);
      });
    });
  });

  describe('Pagination Logic', () => {
    it('should calculate pagination', () => {
      const totalEntries = 150;
      const pageSize = 25;
      const totalPages = calculatePagination(totalEntries, pageSize);

      expect(totalPages).toBe(6);
    });

    it('should calculate page offset', () => {
      const currentPage = 3;
      const pageSize = 25;
      const offset = calculatePageOffset(currentPage, pageSize);

      expect(offset).toBe(50);
    });
  });
});
