import { render, screen, fireEvent } from '@testing-library/react';
import HistoryPageLayout from '../../app/components/HistoryPageLayout';
import { AuthProvider } from '../../app/context/AuthContext';
import { LanguageProvider } from '../../app/context/LanguageContext';
import { ThemeProvider } from '../../app/context/ThemeContext';

// Mock all the required components that HistoryPageLayout depends on
jest.mock('../../app/components/PageContainer', () => {
  return function MockPageContainer({ children, className }: any) {
    return <div data-testid="page-container" className={className}>{children}</div>;
  };
});

jest.mock('../../app/components/TranslatedNavigation', () => {
  return function MockTranslatedNavigation() {
    return <nav data-testid="translated-navigation">Navigation Menu</nav>;
  };
});

jest.mock('../../app/components/AuthButton', () => {
  return function MockAuthButton() {
    return <button data-testid="auth-button">Sign In/Out</button>;
  };
});

jest.mock('../../app/components/GlobalLanguageSelector', () => {
  return function MockGlobalLanguageSelector() {
    return (
      <select data-testid="language-selector" title="Language Selector">
        <option value="en">English</option>
        <option value="es">Spanish</option>
      </select>
    );
  };
});

jest.mock('../../app/components/ThemeToggle', () => ({
  SimpleThemeToggle: function MockSimpleThemeToggle() {
    return <button data-testid="theme-toggle">🌙/☀️</button>;
  }
}));

jest.mock('../../app/components/LoadingState', () => {
  return function MockLoadingState() {
    return (
      <div data-testid="loading-state" className="flex justify-center p-8">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  };
});

jest.mock('../../app/components/ErrorState', () => {
  return function MockErrorState({ error, onRetry }: any) {
    return (
      <div data-testid="error-state" className="text-center p-8">
        <div className="text-red-600 mb-4">
          <h3>Something went wrong</h3>
          <p>{error}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            data-testid="retry-button"
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Try Again
          </button>
        )}
      </div>
    );
  };
});

const MockProviders = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <LanguageProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </LanguageProvider>
  </AuthProvider>
);

describe('HistoryPageLayout Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders all header elements correctly', () => {
      render(
        <MockProviders>
          <HistoryPageLayout
            title="Test Page"
            isLoading={false}
            error={null}
            onRetry={jest.fn()}
          >
            <div>Content</div>
          </HistoryPageLayout>
        </MockProviders>
      );

      expect(screen.getByText('Test Page')).toBeInTheDocument();
      expect(screen.getByTestId('translated-navigation')).toBeInTheDocument();
      expect(screen.getByTestId('auth-button')).toBeInTheDocument();
      expect(screen.getByTestId('language-selector')).toBeInTheDocument();
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });

    it('renders content area with proper styling', () => {
      render(
        <MockProviders>
          <HistoryPageLayout
            title="Test Page"
            isLoading={false}
            error={null}
          >
            <div data-testid="test-content">Test Content</div>
          </HistoryPageLayout>
        </MockProviders>
      );

      const pageContainer = screen.getByTestId('page-container');
      expect(pageContainer).toHaveClass('p-3', 'md:p-6');
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('shows loading state when isLoading is true', () => {
      render(
        <MockProviders>
          <HistoryPageLayout
            title="Loading Page"
            isLoading={true}
            error={null}
          >
            <div>Should not see this</div>
          </HistoryPageLayout>
        </MockProviders>
      );

      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Should not see this')).not.toBeInTheDocument();
    });

    it('shows loading state with proper styling', () => {
      render(
        <MockProviders>
          <HistoryPageLayout
            title="Loading Page"
            isLoading={true}
            error={null}
          >
            <div>Content</div>
          </HistoryPageLayout>
        </MockProviders>
      );

      const loadingState = screen.getByTestId('loading-state');
      expect(loadingState).toHaveClass('flex', 'justify-center', 'p-8');
    });
  });

  describe('Error States', () => {
    it('shows error state when error exists and not loading', () => {
      const testError = 'Failed to load data';
      render(
        <MockProviders>
          <HistoryPageLayout
            title="Error Page"
            isLoading={false}
            error={testError}
            onRetry={jest.fn()}
          >
            <div>Should not see this</div>
          </HistoryPageLayout>
        </MockProviders>
      );

      expect(screen.getByTestId('error-state')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText(testError)).toBeInTheDocument();
      expect(screen.getByTestId('retry-button')).toBeInTheDocument();
      expect(screen.queryByText('Should not see this')).not.toBeInTheDocument();
    });

    it('prioritizes loading state over error state', () => {
      render(
        <MockProviders>
          <HistoryPageLayout
            title="Loading vs Error"
            isLoading={true}
            error="Some error"
            onRetry={jest.fn()}
          >
            <div>Content</div>
          </HistoryPageLayout>
        </MockProviders>
      );

      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
      expect(screen.queryByTestId('error-state')).not.toBeInTheDocument();
    });

    it('calls onRetry when retry button is clicked', () => {
      const mockRetry = jest.fn();
      render(
        <MockProviders>
          <HistoryPageLayout
            title="Error Page"
            isLoading={false}
            error="Network error"
            onRetry={mockRetry}
          >
            <div>Content</div>
          </HistoryPageLayout>
        </MockProviders>
      );

      const retryButton = screen.getByTestId('retry-button');
      fireEvent.click(retryButton);

      expect(mockRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('Content Display', () => {
    it('shows content when not loading and no error', () => {
      render(
        <MockProviders>
          <HistoryPageLayout
            title="Content Page"
            isLoading={false}
            error={null}
          >
            <div data-testid="main-content">
              <h2>Page Content</h2>
              <p>This is the main content area</p>
            </div>
          </HistoryPageLayout>
        </MockProviders>
      );

      expect(screen.getByTestId('main-content')).toBeInTheDocument();
      expect(screen.getByText('Page Content')).toBeInTheDocument();
      expect(screen.getByText('This is the main content area')).toBeInTheDocument();
    });

    it('handles complex nested children', () => {
      render(
        <MockProviders>
          <HistoryPageLayout
            title="Complex Content"
            isLoading={false}
            error={null}
          >
            <div data-testid="complex-content">
              <section>
                <h2>Section 1</h2>
                <ul>
                  <li>Item 1</li>
                  <li>Item 2</li>
                </ul>
              </section>
              <section>
                <h2>Section 2</h2>
                <button>Action Button</button>
              </section>
            </div>
          </HistoryPageLayout>
        </MockProviders>
      );

      expect(screen.getByTestId('complex-content')).toBeInTheDocument();
      expect(screen.getByText('Section 1')).toBeInTheDocument();
      expect(screen.getByText('Section 2')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Action Button')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined onRetry gracefully', () => {
      render(
        <MockProviders>
          <HistoryPageLayout
            title="No Retry"
            isLoading={false}
            error="Some error"
            onRetry={undefined}
          >
            <div>Content</div>
          </HistoryPageLayout>
        </MockProviders>
      );

      expect(screen.getByTestId('error-state')).toBeInTheDocument();

      // Should not render retry button if onRetry is undefined
      expect(screen.queryByTestId('retry-button')).not.toBeInTheDocument();
    });

    it('handles empty string error', () => {
      render(
        <MockProviders>
          <HistoryPageLayout
            title="Empty Error"
            isLoading={false}
            error=""
            onRetry={jest.fn()}
          >
            <div data-testid="content">Should show content</div>
          </HistoryPageLayout>
        </MockProviders>
      );

      // Empty string should be falsy, so content should show
      expect(screen.getByTestId('content')).toBeInTheDocument();
      expect(screen.queryByTestId('error-state')).not.toBeInTheDocument();
    });

    it('handles null children gracefully', () => {
      render(
        <MockProviders>
          <HistoryPageLayout
            title="Null Children"
            isLoading={false}
            error={null}
          >
            {null}
          </HistoryPageLayout>
        </MockProviders>
      );

      expect(screen.getByText('Null Children')).toBeInTheDocument();
      expect(screen.getByTestId('page-container')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('maintains accessible structure', () => {
      render(
        <MockProviders>
          <HistoryPageLayout
            title="Accessible Page"
            isLoading={false}
            error={null}
          >
            <main>
              <h1>Main Content</h1>
              <p>Accessible content</p>
            </main>
          </HistoryPageLayout>
        </MockProviders>
      );

      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in\/out/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('error state maintains accessibility', () => {
      render(
        <MockProviders>
          <HistoryPageLayout
            title="Error Page"
            isLoading={false}
            error="Accessibility test error"
            onRetry={jest.fn()}
          >
            <div>Content</div>
          </HistoryPageLayout>
        </MockProviders>
      );

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  describe('State Transitions', () => {
    it('handles loading to content transition', async () => {
      const { rerender } = render(
        <MockProviders>
          <HistoryPageLayout
            title="Transition Test"
            isLoading={true}
            error={null}
          >
            <div data-testid="final-content">Final Content</div>
          </HistoryPageLayout>
        </MockProviders>
      );

      expect(screen.getByTestId('loading-state')).toBeInTheDocument();

      rerender(
        <MockProviders>
          <HistoryPageLayout
            title="Transition Test"
            isLoading={false}
            error={null}
          >
            <div data-testid="final-content">Final Content</div>
          </HistoryPageLayout>
        </MockProviders>
      );

      expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      expect(screen.getByTestId('final-content')).toBeInTheDocument();
    });

    it('handles loading to error transition', () => {
      const { rerender } = render(
        <MockProviders>
          <HistoryPageLayout
            title="Error Transition"
            isLoading={true}
            error={null}
          >
            <div>Content</div>
          </HistoryPageLayout>
        </MockProviders>
      );

      expect(screen.getByTestId('loading-state')).toBeInTheDocument();

      rerender(
        <MockProviders>
          <HistoryPageLayout
            title="Error Transition"
            isLoading={false}
            error="Failed to load"
            onRetry={jest.fn()}
          >
            <div>Content</div>
          </HistoryPageLayout>
        </MockProviders>
      );

      expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      expect(screen.getByTestId('error-state')).toBeInTheDocument();
    });

    it('handles error to content transition', () => {
      const { rerender } = render(
        <MockProviders>
          <HistoryPageLayout
            title="Recovery Test"
            isLoading={false}
            error="Initial error"
            onRetry={jest.fn()}
          >
            <div data-testid="success-content">Success Content</div>
          </HistoryPageLayout>
        </MockProviders>
      );

      expect(screen.getByTestId('error-state')).toBeInTheDocument();

      rerender(
        <MockProviders>
          <HistoryPageLayout
            title="Recovery Test"
            isLoading={false}
            error={null}
          >
            <div data-testid="success-content">Success Content</div>
          </HistoryPageLayout>
        </MockProviders>
      );

      expect(screen.queryByTestId('error-state')).not.toBeInTheDocument();
      expect(screen.getByTestId('success-content')).toBeInTheDocument();
    });
  });
});
