import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FuelHistoryPage from '../../app/fuel-history/page';
import { useAuth } from '../../app/context/AuthContext';
import { useTranslation } from '../../app/hooks/useTranslation';
import { useVehicles } from '../../app/hooks/useVehicles';
import {
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
  setupStandardPageTest,
  createStandardLayoutTests,
  createStandardDataLoadingTests,
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

jest.mock('../../app/types/common', () => ({
  FuelEntry: {},
}));

// Mock components using shared utilities
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
  beforeEach(setupStandardPageTest(mockFetch, (mockFetch) => {
    // Custom fetch setup for fuel history
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
  }));

  describe('Layout and Structure', createStandardLayoutTests(FuelHistoryPage, 'Fuel History'));

  describe('Data Loading and Error Handling', createStandardDataLoadingTests(FuelHistoryPage, mockFetch));

  describe('Component Integration', () => {
    it('should render FuelTab component with correct props', async () => {
      render(<FuelHistoryPage />);

      await waitFor(() => {
        expect(screen.getByTestId('fuel-tab')).toBeInTheDocument();
        expect(screen.getByText('Fuel Tab')).toBeInTheDocument();
      });
    });

    it('should pass fuel entries to FuelTab', async () => {
      render(<FuelHistoryPage />);

      await waitFor(() => {
        const entriesCount = screen.getByTestId('fuel-entries-count');
        expect(entriesCount).toBeInTheDocument();
      });
    });

    it('should render modals component', () => {
      render(<FuelHistoryPage />);
      expect(screen.getByTestId('modals')).toBeInTheDocument();
    });
  });

  describe('Fuel Entry Data Processing', () => {
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

    it('should calculate fuel efficiency correctly', () => {
      const entries = [
        { odometer: 1000, amount: 40 },
        { odometer: 1500, amount: 45 },
      ];
      
      const efficiency = calculateFuelEfficiency(entries);
      expect(efficiency).toBe(500 / 45);
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
  });

  describe('Currency and Formatting', () => {
    it('should format currency correctly', () => {
      const formatted = formatCurrency(123.45, 'USD');
      expect(formatted).toBe('USD 123.45');
    });

    it('should validate currency correctly', () => {
      expect(validateCurrency(50, 'USD')).toBe(true);
      expect(validateCurrency('invalid', 'USD')).toBe(false);
      expect(validateCurrency(50, 'INVALID_CURRENCY')).toBe(false);
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', async () => {
      render(<FuelHistoryPage />);

      await waitFor(() => {
        const headings = screen.getAllByRole('heading');
        expect(headings.length).toBeGreaterThan(0);
      });
    });
  });
});
