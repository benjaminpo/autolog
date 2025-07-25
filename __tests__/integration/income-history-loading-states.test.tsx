import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import IncomeHistoryPage from '../../app/income-history/page';
import { setupCommonMocks } from '../../test-utils/commonMocks';

// Setup common mocks
setupCommonMocks();

// Helper function to wait for loading to complete
const waitForLoadingToComplete = () =>
  waitFor(() => {
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  }, { timeout: 3000 });

// Add specific mocks for this test
jest.mock('../../app/lib/api', () => ({
  incomeApi: {
    getEntries: jest.fn(),
    getCategories: jest.fn(),
    deleteEntry: jest.fn(),
    updateEntry: jest.fn(),
  },
}));

// Mock the user object more explicitly
jest.mock('../../app/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
    loading: false,
  }),
}));

// Mock the useVehicles hook
jest.mock('../../app/hooks/useVehicles', () => ({
  useVehicles: () => ({
    cars: [
      { _id: '1', name: 'Test Car 1' },
      { _id: '2', name: 'Test Car 2' },
    ],
    loading: false,
    error: null,
  }),
}));

jest.mock('../../app/components/IncomeTab', () => {
  return {
    __esModule: true,
    default: (props: any) => <div data-testid="income-tab">Income Tab Content</div>,
  };
});

describe('IncomeHistoryPage Integration', () => {
  const mockIncomeApi = jest.requireMock('../../app/lib/api').incomeApi;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock fetch for vehicles API
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          vehicles: [
            { _id: '1', name: 'Test Car 1' },
            { _id: '2', name: 'Test Car 2' },
          ]
        })
      })
    ) as jest.Mock;

    // Default successful API responses with immediate resolution
    mockIncomeApi.getEntries.mockResolvedValue({
      success: true,
      entries: [
        {
          _id: '1',
          carId: '1',
          category: 'Ride Sharing',
          amount: 50,
          currency: 'USD',
          date: '2023-01-01',
          notes: 'Test income',
          images: [],
        },
      ],
    });

    mockIncomeApi.getCategories.mockResolvedValue({
      success: true,
      incomeCategories: [
        { _id: '1', name: 'Ride Sharing', userId: 'test-user' },
        { _id: '2', name: 'Delivery Services', userId: 'test-user' },
      ],
    });

    // Mock other API methods
    mockIncomeApi.deleteEntry.mockResolvedValue({ success: true });
    mockIncomeApi.updateEntry.mockResolvedValue({ success: true });
  });

  it('renders LoadingState initially', async () => {
    render(<IncomeHistoryPage />);

    // Initially should show loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Wait for loading to complete
    await waitForLoadingToComplete();
  });

  it('shows ErrorState when API call fails', async () => {
    // Mock API failure
    mockIncomeApi.getEntries.mockRejectedValue(new Error('API Error'));

    render(<IncomeHistoryPage />);

    // Wait for error state to appear
    await waitFor(() => {
      expect(screen.getByText('Failed to load income entries. Please try again.')).toBeInTheDocument();
    });

    // Should show retry button
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('retries loading when retry button is clicked', async () => {
    // Initially fail, then succeed on retry
    mockIncomeApi.getEntries
      .mockRejectedValueOnce(new Error('API Error'))
      .mockResolvedValueOnce({
        success: true,
        entries: [],
      });

    render(<IncomeHistoryPage />);

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText('Failed to load income entries. Please try again.')).toBeInTheDocument();
    });

    // Click retry button
    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);

    // Should show loading again
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Wait for successful load
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(screen.queryByText('Failed to load income entries. Please try again.')).not.toBeInTheDocument();
    });

    // Verify API was called at least twice (initial + retry)
    expect(mockIncomeApi.getEntries).toHaveBeenCalledWith({
      offset: '0',
      limit: '20',
    });
    expect(mockIncomeApi.getEntries.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('renders main content after successful loading', async () => {
    render(<IncomeHistoryPage />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Should show main content
    expect(screen.getByRole('heading', { name: 'Income History' })).toBeInTheDocument();
    expect(screen.getByTestId('income-tab')).toBeInTheDocument();
    expect(screen.getByText('Navigation')).toBeInTheDocument();
  });

  it('handles categories API failure gracefully', async () => {
    // Mock categories API failure but entries success
    mockIncomeApi.getCategories.mockRejectedValue(new Error('Categories Error'));

    render(<IncomeHistoryPage />);

    // Should still render main content (categories failure is handled gracefully)
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(screen.getAllByText('Income History').length).toBeGreaterThan(0);
    });
  });

  it('shows correct loading message from translation', async () => {
    render(<IncomeHistoryPage />);

    // Should show translated loading message
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  it('calls API with correct parameters', async () => {
    render(<IncomeHistoryPage />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(mockIncomeApi.getEntries).toHaveBeenCalledWith({
      limit: '20',
      offset: '0',
    });
    expect(mockIncomeApi.getCategories).toHaveBeenCalled();
  });

  it('does not render LoadingState or ErrorState when content is shown', async () => {
    render(<IncomeHistoryPage />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Should not show loading or error components when main content is displayed
    expect(screen.queryByText('Failed to load income entries. Please try again.')).not.toBeInTheDocument();
    expect(screen.getByTestId('income-tab')).toBeInTheDocument();
  });

  it('maintains consistent UI structure with LoadingState', async () => {
    render(<IncomeHistoryPage />);

    // Check that LoadingState is properly wrapped in the same structure
    const loadingContainer = screen.getByText('Loading...').closest('main');
    expect(loadingContainer).toHaveClass('flex-grow', 'overflow-auto', 'transition-colors');

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  it('maintains consistent UI structure with ErrorState', async () => {
    mockIncomeApi.getEntries.mockRejectedValue(new Error('API Error'));

    render(<IncomeHistoryPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load income entries. Please try again.')).toBeInTheDocument();
    });

    // Check that ErrorState is properly wrapped in the same structure
    const errorContainer = screen.getByText('Failed to load income entries. Please try again.').closest('main');
    expect(errorContainer).toHaveClass('flex-grow', 'overflow-auto', 'transition-colors');
  });
});
