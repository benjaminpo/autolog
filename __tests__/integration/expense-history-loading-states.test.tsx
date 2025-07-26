import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { setupCommonMocks } from '../../test-utils/commonMocks';

// Mock the page component
const ExpenseHistoryPage = React.lazy(() => import('../../app/expense-history/page'));

// Setup common mocks
setupCommonMocks();

// Add specific mocks for this test
jest.mock('../../app/lib/api', () => ({
  expenseApi: {
    getEntries: jest.fn(),
    getCategories: jest.fn(),
    deleteEntry: jest.fn(),
    updateEntry: jest.fn(),
  },
}));

jest.mock('../../app/components/ExpenseTab', () => {
  return {
    __esModule: true,
    default: (props: any) => <div data-testid="expense-tab">Expense Tab Content</div>,
  };
});

describe('ExpenseHistoryPage Loading States Integration', () => {
  const mockExpenseApi = jest.requireMock('../../app/lib/api').expenseApi;

  beforeEach(() => {
    jest.clearAllMocks();

    // Default successful API responses
    mockExpenseApi.getEntries.mockResolvedValue({
      success: true,
      entries: [
        {
          _id: '1',
          carId: '1',
          category: 'Fuel',
          amount: 45.50,
          currency: 'USD',
          date: '2023-01-01',
          notes: 'Gas station fill-up',
          images: [],
        },
      ],
    });

    mockExpenseApi.getCategories.mockResolvedValue({
      success: true,
      expenseCategories: [
        { _id: '1', name: 'Fuel', userId: 'test-user' },
        { _id: '2', name: 'Maintenance', userId: 'test-user' },
      ],
    });
  });

  it('renders LoadingState with correct message', async () => {
    const { container } = render(
      <React.Suspense fallback={<div>Loading Component...</div>}>
        <ExpenseHistoryPage />
      </React.Suspense>
    );

    // Initially should show loading state
    await waitFor(() => {
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading expenses...')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows ErrorState when expense entries API fails', async () => {
    // Mock API failure
    mockExpenseApi.getEntries.mockRejectedValue(new Error('Failed to fetch expenses'));

    render(
      <React.Suspense fallback={<div>Loading Component...</div>}>
        <ExpenseHistoryPage />
      </React.Suspense>
    );

    // Wait for error state to appear
    await waitFor(() => {
      expect(screen.getByText(/Failed to load expenses/)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Should show retry button
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('retries loading when retry button is clicked in expense page', async () => {
    // Initially fail, then succeed on retry
    mockExpenseApi.getEntries
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        success: true,
        entries: [],
      });

    render(
      <React.Suspense fallback={<div>Loading Component...</div>}>
        <ExpenseHistoryPage />
      </React.Suspense>
    );

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText(/Failed to load expenses/)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Click retry button
    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);

    // Should show loading again
    await waitFor(() => {
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    // Wait for successful load
    await waitFor(() => {
      expect(screen.queryByText('Loading expenses...')).not.toBeInTheDocument();
      expect(screen.queryByText(/Failed to load expense entries/)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Verify API was called at least twice (initial + retry)
    expect(mockExpenseApi.getEntries).toHaveBeenCalledWith({
      offset: '0',
      limit: '20',
    });
    expect(mockExpenseApi.getEntries.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('renders main content after successful loading', async () => {
    render(
      <React.Suspense fallback={<div>Loading Component...</div>}>
        <ExpenseHistoryPage />
      </React.Suspense>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading expenses...')).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Should show main content
    await waitFor(() => {
      expect(screen.getByText('Expense History')).toBeInTheDocument();
      expect(screen.getByTestId('expense-tab')).toBeInTheDocument();
    });
  });

  it('handles partial API failures gracefully', async () => {
    // Mock categories API failure but entries success
    mockExpenseApi.getCategories.mockRejectedValue(new Error('Categories Error'));

    render(
      <React.Suspense fallback={<div>Loading Component...</div>}>
        <ExpenseHistoryPage />
      </React.Suspense>
    );

    // Should still render main content (categories failure is handled gracefully)
    await waitFor(() => {
      expect(screen.queryByText('Loading expenses...')).not.toBeInTheDocument();
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(screen.getByText('Expense History')).toBeInTheDocument();
    });
  });

  it('maintains loading state UI consistency', async () => {
    render(
      <React.Suspense fallback={<div>Loading Component...</div>}>
        <ExpenseHistoryPage />
      </React.Suspense>
    );

    await waitFor(() => {
      const loadingText = screen.getByText('Loading...');
      const loadingContainer = loadingText.closest('main');
      expect(loadingContainer).toHaveClass('flex-grow', 'overflow-auto');
    });

    await waitFor(() => {
      expect(screen.queryByText('Loading expenses...')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('maintains error state UI consistency', async () => {
    mockExpenseApi.getEntries.mockRejectedValue(new Error('API Error'));

    render(
      <React.Suspense fallback={<div>Loading Component...</div>}>
        <ExpenseHistoryPage />
      </React.Suspense>
    );

    await waitFor(() => {
      const errorText = screen.getByText(/Failed to load expenses/);
      const errorContainer = errorText.closest('main');
      expect(errorContainer).toHaveClass('flex-grow', 'overflow-auto');
    }, { timeout: 3000 });
  });

  it('calls expense API with correct parameters', async () => {
    render(
      <React.Suspense fallback={<div>Loading Component...</div>}>
        <ExpenseHistoryPage />
      </React.Suspense>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading expenses...')).not.toBeInTheDocument();
    }, { timeout: 3000 });

    expect(mockExpenseApi.getEntries).toHaveBeenCalledWith({
      limit: '20',
      offset: '0',
    });
    expect(mockExpenseApi.getCategories).toHaveBeenCalled();
  });

  it('error state shows appropriate retry button styling', async () => {
    mockExpenseApi.getEntries.mockRejectedValue(new Error('Network failure'));

    render(
      <React.Suspense fallback={<div>Loading Component...</div>}>
        <ExpenseHistoryPage />
      </React.Suspense>
    );

    await waitFor(() => {
      const retryButton = screen.getByText('Try Again');
      expect(retryButton).toHaveClass(
        'px-4', 'py-2', 'bg-blue-600', 'text-white', 'rounded-lg',
        'hover:bg-blue-700', 'dark:bg-blue-500', 'dark:hover:bg-blue-600'
      );
    }, { timeout: 3000 });
  });

  it('loading state shows spinner with correct styling', async () => {
    render(
      <React.Suspense fallback={<div>Loading Component...</div>}>
        <ExpenseHistoryPage />
      </React.Suspense>
    );

    await waitFor(() => {
      const loadingText = screen.getByText('Loading...');
      const spinner = loadingText.previousElementSibling;
      expect(spinner).toHaveClass(
        'animate-spin',
        'rounded-full',
        'h-12',
        'w-12',
        'border-t-2',
        'border-b-2',
        'border-blue-600'
      );
    });    await waitFor(() => {
      expect(screen.queryByText('Loading expenses...')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
