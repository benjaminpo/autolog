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
  createStandardAccessibilityTests,
  setupLanguageContextMock,
} from '../utils/testHelpers';

// Mock dependencies - consolidated
jest.mock('../../app/context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../../app/hooks/useTranslation', () => ({ useTranslation: jest.fn() }));
jest.mock('../../app/hooks/useVehicles', () => ({ useVehicles: jest.fn() }));
jest.mock('../../app/lib/idUtils', () => ({ getObjectId: jest.fn(() => 'mock-object-id') }));
jest.mock('../../app/lib/vehicleData', () => ({ currencies: ['USD', 'EUR', 'GBP'], distanceUnits: ['km', 'miles'], volumeUnits: ['liters', 'gallons'] }));

// Mock components - compact inline definitions
jest.mock('../../app/components/PageContainer', () => ({ children, className = '' }: any) => React.createElement('div', { 'data-testid': 'page-container', className }, children));
jest.mock('../../app/components/TranslatedNavigation', () => ({ TranslatedNavigation: () => React.createElement('nav', { 'data-testid': 'translated-navigation' }, 'Navigation') }));
jest.mock('../../app/components/AuthButton', () => ({ AuthButton: () => React.createElement('button', { 'data-testid': 'auth-button' }, 'Auth') }));
jest.mock('../../app/components/GlobalLanguageSelector', () => ({ GlobalLanguageSelector: () => React.createElement('select', { 'data-testid': 'language-selector' }, React.createElement('option', null, 'English')) }));
jest.mock('../../app/components/ThemeToggle', () => ({ SimpleThemeToggle: () => React.createElement('button', { 'data-testid': 'theme-toggle' }, 'Theme') }));
jest.mock('../../app/components/LoadingState', () => ({ LoadingState: () => React.createElement('div', { 'data-testid': 'loading-state' }, 'Loading...') }));
jest.mock('../../app/components/ErrorState', () => ({ ErrorState: ({ error, onRetry }: any) => React.createElement('div', { 'data-testid': 'error-state' }, React.createElement('span', null, error), React.createElement('button', { onClick: onRetry }, 'Retry')) }));
jest.mock('next/image', () => ({ src, alt, ...props }: any) => React.createElement('img', { src, alt, ...props, 'data-testid': 'next-image' }));

// Setup language context mock
setupLanguageContextMock();

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

  describe('Accessibility and Responsive Design', createStandardAccessibilityTests(FinancialAnalysisPage));
});
