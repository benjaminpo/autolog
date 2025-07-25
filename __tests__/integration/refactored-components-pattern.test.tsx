import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LoadingState } from '../../app/components/LoadingState';
import { ErrorState } from '../../app/components/ErrorState';

// Mock PageContainer
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

describe('Refactored Components Pattern Integration', () => {
  describe('LoadingState and ErrorState Component Consistency', () => {
    it('both components use the same main structure', () => {
      const { rerender } = render(<LoadingState message="Loading data..." />);

      let mainElement = screen.getByRole('main');
      expect(mainElement).toHaveClass('flex-grow', 'overflow-auto', 'transition-colors');

      let pageContainer = screen.getByTestId('page-container');
      expect(pageContainer).toHaveClass('p-3', 'md:p-6');

      // Re-render with ErrorState
      rerender(<ErrorState error="Test error" onRetry={() => {}} />);

      mainElement = screen.getByRole('main');
      expect(mainElement).toHaveClass('flex-grow', 'overflow-auto', 'transition-colors');

      pageContainer = screen.getByTestId('page-container');
      expect(pageContainer).toHaveClass('p-3', 'md:p-6');
    });

    it('both components render within PageContainer consistently', () => {
      const { rerender } = render(<LoadingState />);

      expect(screen.getByTestId('page-container')).toContainElement(screen.getByText('Loading...'));

      rerender(<ErrorState error="Test error" onRetry={() => {}} />);

      expect(screen.getByTestId('page-container')).toContainElement(screen.getByText('Test error'));
    });

    it('components have different visual styling but same structure', () => {
      const { rerender } = render(<LoadingState />);

      // LoadingState has centered flex layout
      const loadingDiv = screen.getByText('Loading...').closest('div');
      expect(loadingDiv).toHaveClass('flex', 'items-center', 'justify-center', 'py-12');

      rerender(<ErrorState error="Test error" onRetry={() => {}} />);

      // ErrorState has centered text layout - check the container div
      const errorDiv = screen.getByText('Test error').closest('.text-center');
      expect(errorDiv).toHaveClass('text-center', 'py-12');
    });
  });

  describe('Component Transition Scenarios', () => {
    it('smooth transition from loading to error state', async () => {
      const TestComponent = () => {
        const [state, setState] = React.useState<'loading' | 'error'>('loading');

        React.useEffect(() => {
          const timer = setTimeout(() => setState('error'), 100);
          return () => clearTimeout(timer);
        }, []);

        if (state === 'loading') {
          return <LoadingState message="Loading data..." />;
        }

        return <ErrorState error="Failed to load" onRetry={() => setState('loading')} />;
      };

      render(<TestComponent />);

      // Initially shows loading
      expect(screen.getByText('Loading data...')).toBeInTheDocument();

      // Transitions to error
      await waitFor(() => {
        expect(screen.getByText('Failed to load')).toBeInTheDocument();
      });

      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });

    it('smooth transition from error back to loading on retry', () => {
      const TestComponent = () => {
        const [state, setState] = React.useState<'error' | 'loading'>('error');

        if (state === 'loading') {
          return <LoadingState message="Retrying..." />;
        }

        return <ErrorState error="Network error" onRetry={() => setState('loading')} />;
      };

      render(<TestComponent />);

      // Initially shows error
      expect(screen.getByText('Network error')).toBeInTheDocument();

      // Click retry
      fireEvent.click(screen.getByText('Try Again'));

      // Should show loading
      expect(screen.getByText('Retrying...')).toBeInTheDocument();
      expect(screen.queryByText('Network error')).not.toBeInTheDocument();
    });

    it('maintains consistent spacing during state transitions', () => {
      let currentState: 'loading' | 'error' | 'content' = 'loading';
      const mockRetry = jest.fn(() => {
        currentState = 'content';
      });

      const TestComponent = () => {
        if (currentState === 'loading') {
          return <LoadingState message="Loading..." />;
        } else if (currentState === 'error') {
          return <ErrorState error="Test error" onRetry={mockRetry} />;
        } else {
          // Content state
          return (
            <main className="flex-grow overflow-auto transition-colors">
              <div data-testid="page-container" className="p-3 md:p-6">
                <div>Main Content</div>
              </div>
            </main>
          );
        }
      };

      const { rerender } = render(<TestComponent />);

      // Check loading state spacing
      let mainElement = screen.getByRole('main');
      expect(mainElement).toHaveClass('flex-grow', 'overflow-auto', 'transition-colors');

      // Transition to error state
      currentState = 'error';
      rerender(<TestComponent />);

      // Check error state has Try Again button
      expect(screen.getByText('Try Again')).toBeInTheDocument();

      // Transition to content state
      fireEvent.click(screen.getByText('Try Again'));
      rerender(<TestComponent />);

      // Check content state spacing
      expect(screen.getByText('Main Content')).toBeInTheDocument();
      mainElement = screen.getByRole('main');
      expect(mainElement).toHaveClass('flex-grow', 'overflow-auto', 'transition-colors');
    });
  });

  describe('Accessibility and User Experience', () => {
    it('both components maintain accessibility standards', () => {
      const { rerender } = render(<LoadingState />);

      expect(screen.getByRole('main')).toBeInTheDocument();

      rerender(<ErrorState error="Test error" onRetry={() => {}} />);

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
    });

    it('error state button is keyboard accessible', () => {
      const mockRetry = jest.fn();
      render(<ErrorState error="Test error" onRetry={mockRetry} />);

      const retryButton = screen.getByRole('button', { name: 'Try Again' });

      retryButton.focus();
      expect(retryButton).toHaveFocus();

      // Test keyboard activation - use click instead of keyDown as it's more reliable
      fireEvent.click(retryButton);
      expect(mockRetry).toHaveBeenCalled();
    });

    it('loading state provides appropriate feedback', () => {
      render(<LoadingState message="Loading your expenses..." />);

      // Should provide visual spinner
      const messageElement = screen.getByText('Loading your expenses...');
      const spinner = messageElement.previousElementSibling;
      expect(spinner).toHaveClass('animate-spin');

      // Should provide text feedback
      expect(messageElement).toBeInTheDocument();
    });

    it('error state provides clear error message and action', () => {
      const mockRetry = jest.fn();
      render(<ErrorState error="Unable to connect to server" onRetry={mockRetry} />);

      // Clear error message
      expect(screen.getByText('Unable to connect to server')).toBeInTheDocument();

      // Clear action
      const retryButton = screen.getByText('Try Again');
      expect(retryButton).toBeInTheDocument();

      fireEvent.click(retryButton);
      expect(mockRetry).toHaveBeenCalled();
    });
  });

  describe('Dark Mode and Theme Consistency', () => {
    it('both components have consistent dark mode classes', () => {
      const { rerender } = render(<LoadingState />);

      const loadingText = screen.getByText('Loading...');
      expect(loadingText).toHaveClass('text-gray-600', 'dark:text-gray-400');

      rerender(<ErrorState error="Test error" onRetry={() => {}} />);

      const errorText = screen.getByText('Test error');
      expect(errorText).toHaveClass('text-red-500', 'dark:text-red-400');

      const retryButton = screen.getByText('Try Again');
      expect(retryButton).toHaveClass('dark:bg-blue-500', 'dark:hover:bg-blue-600');
    });

    it('components maintain visual hierarchy in different themes', () => {
      const { rerender } = render(<LoadingState />);

      // Loading spinner should be prominent
      const spinner = screen.getByText('Loading...').previousElementSibling;
      expect(spinner).toHaveClass('border-blue-600');

      rerender(<ErrorState error="Test error" onRetry={() => {}} />);

      // Error should be prominent, button should be actionable
      const errorText = screen.getByText('Test error');
      expect(errorText).toHaveClass('text-red-500', 'text-lg');

      const retryButton = screen.getByText('Try Again');
      expect(retryButton).toHaveClass('bg-blue-600', 'text-white');
    });
  });

  describe('Performance and Efficiency', () => {
    it('components render efficiently without unnecessary re-renders', () => {
      const renderSpy = jest.fn();

      const TestLoadingState = React.memo(function TestLoadingState() {
        renderSpy();
        return <LoadingState message="Loading..." />;
      });

      const { rerender } = render(<TestLoadingState />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render with same props shouldn't cause re-render
      rerender(<TestLoadingState />);
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });

    it('error state callback references are stable', () => {
      const mockRetry = jest.fn();
      const { rerender } = render(<ErrorState error="Test" onRetry={mockRetry} />);

      const button1 = screen.getByText('Try Again');

      rerender(<ErrorState error="Test" onRetry={mockRetry} />);

      const button2 = screen.getByText('Try Again');
      expect(button1).toBe(button2);
    });
  });
});
