import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HistoryPageLayout from '../../app/components/HistoryPageLayout';
import { AuthProvider } from '../../app/context/AuthContext';
import { LanguageProvider } from '../../app/context/LanguageContext';
import { ThemeProvider } from '../../app/context/ThemeContext';

// Mock the required modules
jest.mock('../../app/components/PageContainer', () => {
  return function MockPageContainer({ children, className }: any) {
    return <div data-testid="page-container" className={className}>{children}</div>;
  };
});

jest.mock('../../app/components/TranslatedNavigation', () => {
  return function MockTranslatedNavigation() {
    return <nav data-testid="translated-navigation">Navigation</nav>;
  };
});

jest.mock('../../app/components/AuthButton', () => {
  return function MockAuthButton() {
    return <button data-testid="auth-button">Auth</button>;
  };
});

jest.mock('../../app/components/GlobalLanguageSelector', () => {
  return function MockGlobalLanguageSelector() {
    return <select data-testid="language-selector" title="Language Selector"><option>EN</option></select>;
  };
});

jest.mock('../../app/components/ThemeToggle', () => ({
  SimpleThemeToggle: function MockSimpleThemeToggle() {
    return <button data-testid="theme-toggle">Toggle Theme</button>;
  }
}));

jest.mock('../../app/components/LoadingState', () => {
  return function MockLoadingState() {
    return <div data-testid="loading-state">Loading...</div>;
  };
});

jest.mock('../../app/components/ErrorState', () => {
  return function MockErrorState({ error, onRetry }: any) {
    return (
      <div data-testid="error-state">
        <div>Error: {error}</div>
        <button onClick={onRetry} data-testid="retry-button">Retry</button>
      </div>
    );
  };
});

// Mock user for AuthContext
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User'
};

const MockProviders = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <LanguageProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </LanguageProvider>
  </AuthProvider>
);

describe('HistoryPageLayout', () => {
  const defaultProps = {
    title: 'Test History Page',
    isLoading: false,
    error: null,
    onRetry: jest.fn(),
    children: <div data-testid="page-content">Page Content</div>
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the layout with title and navigation', () => {
    render(
      <MockProviders>
        <HistoryPageLayout {...defaultProps} />
      </MockProviders>
    );

    expect(screen.getByText('Test History Page')).toBeInTheDocument();
    expect(screen.getByTestId('translated-navigation')).toBeInTheDocument();
    expect(screen.getByTestId('auth-button')).toBeInTheDocument();
    expect(screen.getByTestId('language-selector')).toBeInTheDocument();
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });

  it('renders children when not loading and no error', () => {
    render(
      <MockProviders>
        <HistoryPageLayout {...defaultProps} />
      </MockProviders>
    );

    expect(screen.getByTestId('page-content')).toBeInTheDocument();
    expect(screen.getByText('Page Content')).toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    render(
      <MockProviders>
        <HistoryPageLayout {...defaultProps} isLoading={true} />
      </MockProviders>
    );

    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByTestId('page-content')).not.toBeInTheDocument();
  });

  it('shows error state when error is present and not loading', () => {
    const errorMessage = 'Something went wrong';
    render(
      <MockProviders>
        <HistoryPageLayout {...defaultProps} error={errorMessage} isLoading={false} />
      </MockProviders>
    );

    expect(screen.getByTestId('error-state')).toBeInTheDocument();
    expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
    expect(screen.queryByTestId('page-content')).not.toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', () => {
    const mockOnRetry = jest.fn();
    render(
      <MockProviders>
        <HistoryPageLayout {...defaultProps} error="Test error" onRetry={mockOnRetry} />
      </MockProviders>
    );

    const retryButton = screen.getByTestId('retry-button');
    fireEvent.click(retryButton);

    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it('does not show error state when loading even if error is present', () => {
    render(
      <MockProviders>
        <HistoryPageLayout {...defaultProps} error="Test error" isLoading={true} />
      </MockProviders>
    );

    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    expect(screen.queryByTestId('error-state')).not.toBeInTheDocument();
  });

  it('handles missing onRetry prop gracefully', () => {
    render(
      <MockProviders>
        <HistoryPageLayout {...defaultProps} error="Test error" onRetry={undefined} />
      </MockProviders>
    );

    expect(screen.getByTestId('error-state')).toBeInTheDocument();

    // Should not throw when retry button is clicked
    const retryButton = screen.getByTestId('retry-button');
    expect(() => fireEvent.click(retryButton)).not.toThrow();
  });

  it('has correct CSS classes for responsive design', () => {
    render(
      <MockProviders>
        <HistoryPageLayout {...defaultProps} />
      </MockProviders>
    );

    const pageContainer = screen.getByTestId('page-container');
    expect(pageContainer).toHaveClass('p-3', 'md:p-6');
  });

  it('shows sticky header with proper positioning', () => {
    render(
      <MockProviders>
        <HistoryPageLayout {...defaultProps} />
      </MockProviders>
    );

    // Check that the header structure is present
    expect(screen.getByText('Test History Page')).toBeInTheDocument();
    expect(screen.getByTestId('auth-button')).toBeInTheDocument();
  });

  it('renders with empty children', () => {
    render(
      <MockProviders>
        <HistoryPageLayout {...defaultProps}>
          {null}
        </HistoryPageLayout>
      </MockProviders>
    );

    expect(screen.getByText('Test History Page')).toBeInTheDocument();
    expect(screen.getByTestId('translated-navigation')).toBeInTheDocument();
  });

  it('handles multiple children correctly', () => {
    const multipleChildren = (
      <>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </>
    );

    render(
      <MockProviders>
        <HistoryPageLayout {...defaultProps}>
          {multipleChildren}
        </HistoryPageLayout>
      </MockProviders>
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
  });
});
