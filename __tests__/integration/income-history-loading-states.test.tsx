import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import IncomeHistoryPage from '../../app/income-history/page';

// Mock all the dependencies
jest.mock('../../app/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
    loading: false,
  }),
}));

jest.mock('../../app/context/LanguageContext', () => ({
  useLanguage: () => {},
}));

jest.mock('../../app/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: {
      navigation: { incomeHistory: 'Income History' },
      common: { loading: 'Loading...' },
      confirmDelete: 'Are you sure you want to delete this income entry?',
    },
  }),
}));

jest.mock('../../app/hooks/useVehicles', () => ({
  useVehicles: () => ({
    cars: [
      { _id: '1', name: 'Test Car 1' },
      { _id: '2', name: 'Test Car 2' },
    ],
    loading: false,
  }),
}));

jest.mock('../../app/lib/api', () => ({
  incomeApi: {
    getEntries: jest.fn(),
    getCategories: jest.fn(),
    deleteEntry: jest.fn(),
    updateEntry: jest.fn(),
  },
}));

jest.mock('../../app/components/PageContainer', () => {
  return {
    __esModule: true,
    default: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <div data-testid="page-container" className={className}>
        {children}
      </div>
    ),
  };
});

jest.mock('../../app/components/IncomeTab', () => {
  return {
    __esModule: true,
    default: (props: any) => <div data-testid="income-tab">Income Tab Content</div>,
  };
});

jest.mock('../../app/components/withTranslations', () => {
  return {
    __esModule: true,
    default: (Component: any) => Component,
  };
});

jest.mock('../../app/components/AuthButton', () => ({
  AuthButton: () => <button data-testid="auth-button">Auth</button>,
}));

jest.mock('../../app/components/TranslatedNavigation', () => ({
  TranslatedNavigation: () => <nav data-testid="navigation">Navigation</nav>,
}));

jest.mock('../../app/components/GlobalLanguageSelector', () => ({
  GlobalLanguageSelector: () => <div data-testid="language-selector">Language</div>,
}));

jest.mock('../../app/components/ThemeToggle', () => ({
  SimpleThemeToggle: () => <button data-testid="theme-toggle">Theme</button>,
}));

jest.mock('../../app/components/ImageUpload', () => {
  return {
    __esModule: true,
    default: (props: any) => <div data-testid="image-upload">Image Upload</div>,
  };
});

describe('IncomeHistoryPage Integration', () => {
  const mockIncomeApi = require('../../app/lib/api').incomeApi;

  beforeEach(() => {
    jest.clearAllMocks();

    // Default successful API responses
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
  });

  it('renders LoadingState initially', async () => {
    render(<IncomeHistoryPage />);

    // Initially should show loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
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
    expect(screen.getByText('Income History')).toBeInTheDocument();
    expect(screen.getByTestId('income-tab')).toBeInTheDocument();
    expect(screen.getByTestId('navigation')).toBeInTheDocument();
  });

  it('handles categories API failure gracefully', async () => {
    // Mock categories API failure but entries success
    mockIncomeApi.getCategories.mockRejectedValue(new Error('Categories Error'));

    render(<IncomeHistoryPage />);

    // Should still render main content (categories failure is handled gracefully)
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(screen.getByText('Income History')).toBeInTheDocument();
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
