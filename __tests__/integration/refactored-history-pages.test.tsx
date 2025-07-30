import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '../../app/context/AuthContext';
import { LanguageProvider } from '../../app/context/LanguageContext';
import { ThemeProvider } from '../../app/context/ThemeContext';
import FuelHistoryPage from '../../app/fuel-history/page';
import ExpenseHistoryPage from '../../app/expense-history/page';
import FinancialAnalysisPage from '../../app/financial-analysis/page';

// Mock the API calls
global.fetch = jest.fn();

// Mock the required modules
jest.mock('../../app/components/FuelTab', () => {
  return function MockFuelTab({ entries, isLoading }: any) {
    if (isLoading) return <div data-testid="fuel-tab-loading">Loading fuel entries...</div>;
    return (
      <div data-testid="fuel-tab">
        <div>Fuel Tab with {entries?.length || 0} entries</div>
      </div>
    );
  };
});

jest.mock('../../app/components/ExpenseTab', () => {
  return function MockExpenseTab({ entries, isLoading }: any) {
    if (isLoading) return <div data-testid="expense-tab-loading">Loading expense entries...</div>;
    return (
      <div data-testid="expense-tab">
        <div>Expense Tab with {entries?.length || 0} entries</div>
      </div>
    );
  };
});

jest.mock('../../app/components/FinancialAnalysisContent', () => {
  return function MockFinancialAnalysisContent({ isLoading }: any) {
    if (isLoading) return <div data-testid="financial-analysis-loading">Loading analysis...</div>;
    return (
      <div data-testid="financial-analysis-content">
        <div>Financial Analysis Content</div>
      </div>
    );
  };
});

jest.mock('../../app/components/modals', () => ({
  Modals: function MockModals() {
    return <div data-testid="modals">Modals Component</div>;
  }
}));

jest.mock('../../app/hooks/useVehicles', () => ({
  useVehicles: () => ({
    cars: [
      { id: '1', make: 'Toyota', model: 'Camry', year: 2020 }
    ],
    isLoading: false,
    error: null
  })
}));

// Mock user session
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User'
};

// Mock AuthContext to provide user
jest.mock('../../app/context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    isLoading: false,
    error: null
  }),
  AuthProvider: ({ children }: any) => <div>{children}</div>
}));

// Mock other contexts
jest.mock('../../app/context/LanguageContext', () => ({
  LanguageProvider: ({ children }: any) => <div>{children}</div>
}));

jest.mock('../../app/context/ThemeContext', () => ({
  ThemeProvider: ({ children }: any) => <div>{children}</div>
}));

jest.mock('../../app/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: {
      navigation: {
        fuelHistory: 'Fuel History',
        expenseHistory: 'Expense History',
        financialAnalysis: 'Financial Analysis'
      }
    }
  })
}));

const MockProviders = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <LanguageProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </LanguageProvider>
  </AuthProvider>
);

describe('Refactored History Pages Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ entries: [], hasMore: false })
    });
  });

  describe('FuelHistoryPage', () => {
    it('renders with HistoryPageLayout structure', async () => {
      render(
        <MockProviders>
          <FuelHistoryPage />
        </MockProviders>
      );

      // Should show the page title
      expect(screen.getByText('Fuel History')).toBeInTheDocument();

      // Should render the navigation and controls
      expect(screen.getByTestId('translated-navigation')).toBeInTheDocument();
      expect(screen.getByTestId('auth-button')).toBeInTheDocument();

      // Should show loading initially
      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toBeInTheDocument();
      });
    });

    it('shows fuel content after loading', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          entries: [
            { id: '1', date: '2024-01-01', volume: 50, cost: 75 }
          ],
          hasMore: false
        })
      });

      render(
        <MockProviders>
          <FuelHistoryPage />
        </MockProviders>
      );

      await waitFor(() => {
        expect(screen.getByTestId('fuel-tab')).toBeInTheDocument();
      });
    });

    it('handles API errors correctly', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

      render(
        <MockProviders>
          <FuelHistoryPage />
        </MockProviders>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument();
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
      });
    });
  });

  describe('ExpenseHistoryPage', () => {
    it('renders with HistoryPageLayout structure', async () => {
      render(
        <MockProviders>
          <ExpenseHistoryPage />
        </MockProviders>
      );

      // Should show the page title
      expect(screen.getByText('Expense History')).toBeInTheDocument();

      // Should render the navigation and controls
      expect(screen.getByTestId('translated-navigation')).toBeInTheDocument();
      expect(screen.getByTestId('auth-button')).toBeInTheDocument();
    });

    it('shows expense content after loading', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          entries: [
            { id: '1', date: '2024-01-01', description: 'Oil change', cost: 50 }
          ],
          hasMore: false
        })
      });

      render(
        <MockProviders>
          <ExpenseHistoryPage />
        </MockProviders>
      );

      await waitFor(() => {
        expect(screen.getByTestId('expense-tab')).toBeInTheDocument();
      });
    });
  });

  describe('FinancialAnalysisPage', () => {
    it('renders with HistoryPageLayout structure', async () => {
      render(
        <MockProviders>
          <FinancialAnalysisPage />
        </MockProviders>
      );

      // Should show the page title
      expect(screen.getByText('Financial Analysis')).toBeInTheDocument();

      // Should render the navigation and controls
      expect(screen.getByTestId('translated-navigation')).toBeInTheDocument();
      expect(screen.getByTestId('auth-button')).toBeInTheDocument();
    });

    it('shows financial analysis content after loading', async () => {
      // Mock multiple API calls for financial analysis
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ entries: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ entries: [] })
        });

      render(
        <MockProviders>
          <FinancialAnalysisPage />
        </MockProviders>
      );

      await waitFor(() => {
        expect(screen.getByTestId('financial-analysis-content')).toBeInTheDocument();
      });
    });
  });

  describe('Shared Layout Functionality', () => {
    it('retry functionality works across all pages', async () => {
      // Test with FuelHistoryPage
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network Error'));

      render(
        <MockProviders>
          <FuelHistoryPage />
        </MockProviders>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument();
      });

      // Mock successful retry
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ entries: [], hasMore: false })
      });

      // Click retry button
      const retryButton = screen.getByTestId('retry-button');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toBeInTheDocument();
      });
    });

    it('responsive design elements are present', () => {
      render(
        <MockProviders>
          <FuelHistoryPage />
        </MockProviders>
      );

      // Check that page container has responsive classes
      const pageContainer = screen.getByTestId('page-container');
      expect(pageContainer).toHaveClass('p-3', 'md:p-6');
    });

    it('all essential UI components are rendered', () => {
      render(
        <MockProviders>
          <ExpenseHistoryPage />
        </MockProviders>
      );

      // Verify all shared UI components are present
      expect(screen.getByTestId('auth-button')).toBeInTheDocument();
      expect(screen.getByTestId('language-selector')).toBeInTheDocument();
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
      expect(screen.getByTestId('translated-navigation')).toBeInTheDocument();
    });
  });

  describe('Code Duplication Elimination Verification', () => {
    it('all pages use the same layout structure', () => {
      const pages = [
        { component: FuelHistoryPage, title: 'Fuel History' },
        { component: ExpenseHistoryPage, title: 'Expense History' },
        { component: FinancialAnalysisPage, title: 'Financial Analysis' }
      ];

      pages.forEach(({ component: PageComponent, title }) => {
        const { unmount } = render(
          <MockProviders>
            <PageComponent />
          </MockProviders>
        );

        // Each page should have the same structure
        expect(screen.getByText(title)).toBeInTheDocument();
        expect(screen.getByTestId('auth-button')).toBeInTheDocument();
        expect(screen.getByTestId('translated-navigation')).toBeInTheDocument();
        expect(screen.getByTestId('language-selector')).toBeInTheDocument();
        expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();

        unmount();
      });
    });

    it('consistent loading states across all pages', async () => {
      const pages = [FuelHistoryPage, ExpenseHistoryPage, FinancialAnalysisPage];

      for (const PageComponent of pages) {
        const { unmount } = render(
          <MockProviders>
            <PageComponent />
          </MockProviders>
        );

        // All pages should show consistent loading state
        await waitFor(() => {
          expect(screen.getByTestId('loading-state')).toBeInTheDocument();
        });

        unmount();
      }
    });

    it('consistent error handling across all pages', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Consistent Error'));

      const pages = [FuelHistoryPage, ExpenseHistoryPage, FinancialAnalysisPage];

      for (const PageComponent of pages) {
        const { unmount } = render(
          <MockProviders>
            <PageComponent />
          </MockProviders>
        );

        // All pages should show consistent error state
        await waitFor(() => {
          expect(screen.getByTestId('error-state')).toBeInTheDocument();
          expect(screen.getByTestId('retry-button')).toBeInTheDocument();
        });

        unmount();
      }
    });
  });
});
