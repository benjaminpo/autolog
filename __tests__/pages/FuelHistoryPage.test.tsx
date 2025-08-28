import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FuelHistoryPage from '../../app/fuel-history/page';
import { useAuth } from '../../app/context/AuthContext';
import { useTranslation } from '../../app/hooks/useTranslation';
import { useVehicles } from '../../app/hooks/useVehicles';
import {
  calculateFuelEfficiency,
  mockFuelEntries,
  setupStandardPageTest,
  createStandardLayoutTests,
  createStandardDataProcessingTests,
  createStandardFormattingTests,
  createStandardAccessibilityTests,
} from '../utils/testHelpers';

// Mock dependencies - consolidated
jest.mock('../../app/context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../../app/hooks/useTranslation', () => ({ useTranslation: jest.fn() }));
jest.mock('../../app/hooks/useVehicles', () => ({ useVehicles: jest.fn() }));
jest.mock('../../app/lib/idUtils', () => ({ getObjectId: jest.fn(() => 'mock-object-id') }));
jest.mock('../../app/lib/vehicleData', () => ({ fuelCompanies: ['Shell', 'BP', 'Exxon'], fuelTypes: ['Gasoline', 'Diesel', 'Electric'] }));

jest.mock('../../app/types/common', () => ({
  FuelEntry: {},
}));

// Mock components - compact inline definitions
jest.mock('../../app/components/PageContainer', () => ({ children, className = '' }: any) => React.createElement('div', { 'data-testid': 'page-container', className }, children));
jest.mock('../../app/components/TranslatedNavigation', () => ({ TranslatedNavigation: () => React.createElement('nav', { 'data-testid': 'translated-navigation' }, 'Navigation') }));
jest.mock('../../app/components/AuthButton', () => ({ AuthButton: () => React.createElement('button', { 'data-testid': 'auth-button' }, 'Auth') }));
jest.mock('../../app/components/GlobalLanguageSelector', () => ({ GlobalLanguageSelector: () => React.createElement('select', { 'data-testid': 'language-selector', title: 'Language selector' }, React.createElement('option', null, 'English')) }));
jest.mock('../../app/components/ThemeToggle', () => ({ SimpleThemeToggle: () => React.createElement('button', { 'data-testid': 'theme-toggle' }, 'Theme') }));
jest.mock('../../app/components/LoadingState', () => ({ LoadingState: () => React.createElement('div', { 'data-testid': 'loading-state' }, 'Loading...') }));
jest.mock('../../app/components/ErrorState', () => ({ ErrorState: ({ error, onRetry }: any) => React.createElement('div', { 'data-testid': 'error-state' }, React.createElement('span', null, error), React.createElement('button', { onClick: onRetry }, 'Retry')) }));
jest.mock('../../app/components/FuelTab', () => (props: any) => React.createElement('div', { 'data-testid': 'fuel-tab' }, React.createElement('div', null, 'Fuel Tab'), React.createElement('div', { 'data-testid': 'fuel-entries-count' }, props.entries?.length || 0)));
jest.mock('../../app/components/withTranslations', () => (Component: any) => Component);
jest.mock('../../app/components/modals', () => ({ Modals: () => React.createElement('div', { 'data-testid': 'modals' }, 'Modals') }));
jest.mock('next/image', () => ({ src, alt, ...props }: any) => React.createElement('img', { src, alt, ...props, 'data-testid': 'next-image' }));

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

  describe('Data Loading and Error Handling', () => {
    it('should show loading state initially', () => {
      const { useVehicles } = require('../../app/hooks/useVehicles');
      (useVehicles as jest.Mock).mockReturnValue({
        cars: [],
        isLoading: true,
        error: null,
      });

      render(<FuelHistoryPage />);
      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    });

    it('should show error state when data loading fails', async () => {
      // Mock all fetch calls to fail
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      render(<FuelHistoryPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument();
      });
    });

    it('should retry data loading when retry button is clicked', async () => {
      // Mock all requests to fail initially
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      render(<FuelHistoryPage />);
      
      // Wait for error state to appear
      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument();
      });
      
      // Reset mock and setup success responses for retry
      mockFetch.mockClear();
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
              companies: [{ name: 'Shell' }],
            }),
          });
        }
        if (url.includes('/api/fuel-types')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              types: [{ name: 'Gasoline' }],
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      });
      
      // Click retry button
      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);
      
      // Wait for error state to disappear and content to load
      await waitFor(() => {
        expect(screen.queryByTestId('error-state')).not.toBeInTheDocument();
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('fuel-tab')).toBeInTheDocument();
      });
    });

    it('should handle missing user gracefully', () => {
      const { useAuth } = require('../../app/context/AuthContext');
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false,
      });

      render(<FuelHistoryPage />);
      // When user is null, loadData function returns early, so no error should occur
      expect(screen.queryByTestId('error-state')).not.toBeInTheDocument();
    });
  });

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

  describe('Fuel Entry Data Processing', createStandardDataProcessingTests());

  describe('Fuel Efficiency Calculation', () => {
    it('should calculate fuel efficiency correctly', () => {
      const entries = [
        { odometer: 1000, amount: 40 },
        { odometer: 1500, amount: 45 },
      ];
      
      const efficiency = calculateFuelEfficiency(entries);
      expect(efficiency).toBe(500 / 45);
    });
  });

  describe('Currency and Formatting', createStandardFormattingTests());

  describe('Accessibility', createStandardAccessibilityTests(FuelHistoryPage));
});
