import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FinancialAnalysisPage from '../../app/financial-analysis/page';
import { useAuth } from '../../app/context/AuthContext';
import { useTranslation } from '../../app/hooks/useTranslation';
import { useVehicles } from '../../app/hooks/useVehicles';
import {
  mockUser,
  mockTranslation,
  mockCars,
  setupStandardPageTest,
  createStandardLayoutTests,
  createStandardDataLoadingTests,
  createStandardContentDisplayTests,
  setupLanguageContextMock,
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
  currencies: ['USD', 'EUR', 'GBP'],
  distanceUnits: ['km', 'miles'],
  volumeUnits: ['liters', 'gallons'],
}));

// Setup language context mock
setupLanguageContextMock();

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
    return React.createElement('select', { 'data-testid': 'language-selector' }, 
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

jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return React.createElement('img', { src, alt, ...props, 'data-testid': 'next-image' });
  };
});

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('FinancialAnalysisPage', () => {
  beforeEach(setupStandardPageTest(mockFetch, (mockFetch) => {
    // Custom fetch setup for financial analysis
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        vehicles: mockCars,
        entries: [
          {
            id: '1',
            carId: '1',
            cost: 50.00,
            currency: 'USD',
            date: '2023-01-01',
          },
        ],
        expenses: [
          {
            id: '1',
            carId: '1',
            amount: 25.00,
            currency: 'USD',
            date: '2023-01-01',
          },
        ],
      }),
    });
  }));

  describe('Layout and Structure', createStandardLayoutTests(FinancialAnalysisPage, 'Financial Analysis'));

  describe('Content Display', createStandardContentDisplayTests(FinancialAnalysisPage, {
    noDataMessage: 'No vehicles found. Add vehicles to see financial analysis.',
    hasDataElements: [
      'Financial Analysis & Break-Even',
      'Overall Financial Summary',
      'Total Income',
      'Total Costs',
      'Net Profit',
      'Profit Margin',
      'ROI'
    ],
    hasImages: true
  }));

  describe('Data Loading and Error Handling', createStandardDataLoadingTests(FinancialAnalysisPage, mockFetch));

  describe('Accessibility and Responsive Design', () => {
    it('should have proper heading structure', async () => {
      render(<FinancialAnalysisPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      });
    });
  });
});
