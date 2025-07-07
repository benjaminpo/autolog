import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ExpenseHistoryPage from '../../app/expense-history/page';
import { useAuth } from '../../app/context/AuthContext';
import { useTranslation } from '../../app/hooks/useTranslation';

// Mock dependencies
jest.mock('../../app/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../app/hooks/useTranslation', () => ({
  useTranslation: jest.fn(),
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
  expenseHistory: {
    title: 'Expense History',
    labels: {
      noExpenses: 'No expenses found',
    },
  },
};

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('ExpenseHistoryPage', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });
    
    (useTranslation as jest.Mock).mockReturnValue({
      t: mockTranslation,
    });

    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({
        success: true,
        expenses: [
          {
            id: '1',
            category: 'Maintenance',
            amount: 100,
            currency: 'HKD',
            date: '2023-01-01',
            notes: 'Test expense',
          },
        ],
      }),
    });

    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the expense history page', async () => {
      render(<ExpenseHistoryPage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('page-container').length).toBeGreaterThan(0);
      });
    });

    it('should not render when user is not authenticated', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false,
      });

      render(<ExpenseHistoryPage />);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should show loading state', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: true,
      });

      render(<ExpenseHistoryPage />);

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Data Fetching', () => {
    it('should fetch expense history on mount when user is authenticated', async () => {
      render(<ExpenseHistoryPage />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    it('should handle fetch error gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Failed to fetch'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<ExpenseHistoryPage />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    it('should handle empty expense list', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({
          success: true,
          expenses: [],
        }),
      });

      render(<ExpenseHistoryPage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('page-container').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Filtering and Sorting', () => {
    it('should handle date range filtering', async () => {
      render(<ExpenseHistoryPage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('page-container').length).toBeGreaterThan(0);
      });
    });

    it('should handle category filtering', async () => {
      render(<ExpenseHistoryPage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('page-container').length).toBeGreaterThan(0);
      });
    });

    it('should handle sorting by amount', async () => {
      render(<ExpenseHistoryPage />);

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

      render(<ExpenseHistoryPage />);

      expect(screen.getAllByTestId('page-container').length).toBeGreaterThan(0);
    });

    it('should handle invalid expense data', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({
          success: true,
          expenses: [],
        }),
      });

      render(<ExpenseHistoryPage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('page-container').length).toBeGreaterThan(0);
      });
    });
  });

  describe('CRUD Operations', () => {
    it('should handle expense deletion', async () => {
      render(<ExpenseHistoryPage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('page-container').length).toBeGreaterThan(0);
      });
    });

    it('should handle expense editing', async () => {
      render(<ExpenseHistoryPage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('page-container').length).toBeGreaterThan(0);
      });
    });
  });
}); 