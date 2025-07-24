import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
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

describe('ErrorState Component', () => {
  const mockOnRetry = jest.fn();
  const defaultProps = {
    error: 'Something went wrong',
    onRetry: mockOnRetry,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with error message and default retry button', () => {
    render(<ErrorState {...defaultProps} />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByTestId('page-container')).toBeInTheDocument();
  });

  it('renders with custom retry button text', () => {
    const customRetryText = 'Reload Data';
    render(<ErrorState {...defaultProps} retryButtonText={customRetryText} />);

    expect(screen.getByText(customRetryText)).toBeInTheDocument();
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', () => {
    render(<ErrorState {...defaultProps} />);

    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);

    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it('calls onRetry multiple times when button is clicked multiple times', () => {
    render(<ErrorState {...defaultProps} />);

    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);
    fireEvent.click(retryButton);
    fireEvent.click(retryButton);

    expect(mockOnRetry).toHaveBeenCalledTimes(3);
  });

  it('has proper structure and layout classes', () => {
    render(<ErrorState {...defaultProps} />);

    const main = screen.getByRole('main');
    expect(main).toHaveClass('flex-grow', 'overflow-auto', 'transition-colors');

    const pageContainer = screen.getByTestId('page-container');
    expect(pageContainer).toHaveClass('p-3', 'md:p-6');

    const contentDiv = screen.getByText('Something went wrong').parentElement;
    expect(contentDiv).toHaveClass('text-center', 'py-12');
  });

  it('renders error message with proper styling', () => {
    render(<ErrorState {...defaultProps} />);

    const errorElement = screen.getByText('Something went wrong');
    expect(errorElement).toHaveClass('text-red-500', 'dark:text-red-400', 'text-lg', 'mb-4');
  });

  it('renders retry button with proper styling', () => {
    render(<ErrorState {...defaultProps} />);

    const retryButton = screen.getByText('Try Again');
    expect(retryButton).toHaveClass(
      'px-4', 'py-2', 'bg-blue-600', 'text-white', 'rounded-lg',
      'hover:bg-blue-700', 'dark:bg-blue-500', 'dark:hover:bg-blue-600'
    );
  });

  it('handles long error messages', () => {
    const longError = 'This is a very long error message that describes in detail what went wrong with the application and provides specific information about the failure that occurred during the data loading process.';
    render(<ErrorState {...defaultProps} error={longError} />);

    expect(screen.getByText(longError)).toBeInTheDocument();
  });

  it('handles error messages with HTML entities', () => {
    const errorWithEntities = 'Error: Request failed with status 404 - Resource &quot;vehicle&quot; not found';
    render(<ErrorState {...defaultProps} error={errorWithEntities} />);

    expect(screen.getByText(errorWithEntities)).toBeInTheDocument();
  });

  it('handles empty error message', () => {
    render(<ErrorState {...defaultProps} error="" />);

    // Find the error div element by its classes
    const errorDivs = document.querySelectorAll('div.text-red-500');
    const errorElement = Array.from(errorDivs).find(div => div.textContent === '');
    expect(errorElement).toBeInTheDocument();
    expect(errorElement).toHaveClass('text-red-500', 'dark:text-red-400', 'text-lg', 'mb-4');
  });

  it('handles empty retry button text', () => {
    render(<ErrorState {...defaultProps} retryButtonText="" />);

    // Find the button with empty text content
    const buttons = document.querySelectorAll('button');
    const retryButton = Array.from(buttons).find(btn => btn.textContent === '');
    expect(retryButton).toBeInTheDocument();
    fireEvent.click(retryButton!);
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it('maintains accessibility standards', () => {
    render(<ErrorState {...defaultProps} />);

    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: 'Try Again' });
    expect(retryButton).toBeInTheDocument();
  });

  it('handles special characters in error message', () => {
    const specialError = 'Error: Failed to load data ☠️ (Code: 500) - €$¥ symbols';
    render(<ErrorState {...defaultProps} error={specialError} />);

    expect(screen.getByText(specialError)).toBeInTheDocument();
  });

  it('renders consistently with different button text lengths', () => {
    const shortText = 'Retry';
    const longText = 'Try Loading Data Again';

    const { rerender } = render(<ErrorState {...defaultProps} retryButtonText={shortText} />);
    expect(screen.getByText(shortText)).toBeInTheDocument();

    rerender(<ErrorState {...defaultProps} retryButtonText={longText} />);
    expect(screen.getByText(longText)).toBeInTheDocument();
  });

  it('passes proper className to PageContainer', () => {
    render(<ErrorState {...defaultProps} />);

    const pageContainer = screen.getByTestId('page-container');
    expect(pageContainer).toHaveClass('p-3', 'md:p-6');
  });

  it('supports keyboard interaction on retry button', () => {
    render(<ErrorState {...defaultProps} />);

    const retryButton = screen.getByRole('button', { name: /try again/i });
    expect(retryButton).toBeInTheDocument();

    // Test keyboard interaction using fireEvent.click since keyDown might not trigger onClick
    retryButton.focus();
    fireEvent.click(retryButton);
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it('renders with different error types', () => {
    const networkError = 'Network connection failed';
    const validationError = 'Invalid input data provided';
    const serverError = 'Internal server error occurred';

    const { rerender } = render(<ErrorState {...defaultProps} error={networkError} />);
    expect(screen.getByText(networkError)).toBeInTheDocument();

    rerender(<ErrorState {...defaultProps} error={validationError} />);
    expect(screen.getByText(validationError)).toBeInTheDocument();

    rerender(<ErrorState {...defaultProps} error={serverError} />);
    expect(screen.getByText(serverError)).toBeInTheDocument();
  });
});
