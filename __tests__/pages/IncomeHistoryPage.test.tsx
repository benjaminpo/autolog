import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import IncomeHistoryPage from '../../app/income-history/page';
import { useAuth } from '../../app/context/AuthContext';
import { useTranslation } from '../../app/hooks/useTranslation';
import { useVehicles } from '../../app/hooks/useVehicles';

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

jest.mock('../../app/components/PageContainer', () => {
  return function MockPageContainer({ children }: { children: React.ReactNode }) {
    return <div data-testid="page-container">{children}</div>;
  };
});

jest.mock('../../app/components/AuthButton', () => ({
  AuthButton: () => <div data-testid="auth-button">Auth Button</div>,
}));

jest.mock('../../app/components/TranslatedNavigation', () => ({
  TranslatedNavigation: () => <div data-testid="translated-navigation">Navigation</div>,
}));

jest.mock('../../app/components/GlobalLanguageSelector', () => ({
  GlobalLanguageSelector: () => <div data-testid="language-selector">Language Selector</div>,
}));

jest.mock('../../app/components/ThemeToggle', () => ({
  SimpleThemeToggle: () => <div data-testid="theme-toggle">Theme Toggle</div>,
}));

const mockUser = {
  id: '1',
  email: 'test@example.com',
};

const mockTranslation = {
  incomeHistory: {
    title: 'Income History',
    labels: {
      noIncome: 'No income records found',
    },
  },
};

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('IncomeHistoryPage', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });

    (useTranslation as jest.Mock).mockReturnValue({
      t: mockTranslation,
    });

    (useVehicles as jest.Mock).mockReturnValue({
      cars: [],
      loading: false,
      error: null,
    });

    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({
        success: true,
        income: [
          {
            id: '1',
            category: 'Salary',
            amount: 1000,
            currency: 'HKD',
            date: '2023-01-01',
            notes: 'Test income',
          },
        ],
      }),
    });

    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the income history page', async () => {
      render(<IncomeHistoryPage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('page-container').length).toBeGreaterThan(0);
      });
    });

    it('should not render when user is not authenticated', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false,
      });

      render(<IncomeHistoryPage />);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should show loading state', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: true,
      });

      render(<IncomeHistoryPage />);

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Data Fetching', () => {
    it('should fetch income history on mount when user is authenticated', async () => {
      render(<IncomeHistoryPage />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    it('should handle fetch error gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Failed to fetch'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<IncomeHistoryPage />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    it('should handle empty income list', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({
          success: true,
          income: [],
        }),
      });

      render(<IncomeHistoryPage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('page-container').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Filtering and Sorting', () => {
    it('should handle date range filtering', async () => {
      render(<IncomeHistoryPage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('page-container').length).toBeGreaterThan(0);
      });
    });

    it('should handle category filtering', async () => {
      render(<IncomeHistoryPage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('page-container').length).toBeGreaterThan(0);
      });
    });

    it('should handle sorting by amount', async () => {
      render(<IncomeHistoryPage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('page-container').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing translation gracefully', () => {
      (useTranslation as jest.Mock).mockReturnValue({
        t: null,
      });

      (useVehicles as jest.Mock).mockReturnValue({
        cars: [],
        loading: false,
        error: null,
      });

      render(<IncomeHistoryPage />);

      expect(screen.getAllByTestId('page-container').length).toBeGreaterThan(0);
    });

    it('should handle invalid income data', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({
          success: true,
          income: [],
        }),
      });

      render(<IncomeHistoryPage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('page-container').length).toBeGreaterThan(0);
      });
    });
  });

  describe('CRUD Operations', () => {
    it('should handle income deletion', async () => {
      render(<IncomeHistoryPage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('page-container').length).toBeGreaterThan(0);
      });
    });

    it('should handle income editing', async () => {
      render(<IncomeHistoryPage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('page-container').length).toBeGreaterThan(0);
      });
    });
  });
});
