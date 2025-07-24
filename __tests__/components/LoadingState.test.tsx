import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LoadingState } from '../../app/components/LoadingState';

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

describe('LoadingState Component', () => {
  it('renders with default loading message', () => {
    render(<LoadingState />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByTestId('page-container')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    const customMessage = 'Loading expense data...';
    render(<LoadingState message={customMessage} />);

    expect(screen.getByText(customMessage)).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('renders spinner with proper classes', () => {
    render(<LoadingState />);

    const spinner = screen.getByText('Loading...').previousElementSibling;
    expect(spinner).toHaveClass('animate-spin', 'rounded-full', 'h-12', 'w-12', 'border-t-2', 'border-b-2', 'border-blue-600');
  });

  it('has proper structure and layout classes', () => {
    render(<LoadingState />);

    const main = screen.getByRole('main');
    expect(main).toHaveClass('flex-grow', 'overflow-auto', 'transition-colors');

    const pageContainer = screen.getByTestId('page-container');
    expect(pageContainer).toHaveClass('p-3', 'md:p-6');

    const contentDiv = screen.getByText('Loading...').parentElement;
    expect(contentDiv).toHaveClass('flex', 'items-center', 'justify-center', 'py-12');
  });

  it('renders message with proper styling', () => {
    render(<LoadingState message="Test message" />);

    const messageElement = screen.getByText('Test message');
    expect(messageElement).toHaveClass('ml-3', 'text-gray-600', 'dark:text-gray-400');
  });

  it('handles empty message prop', () => {
    render(<LoadingState message="" />);

    // Empty message should fallback to default "Loading..."
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('handles undefined message prop gracefully', () => {
    render(<LoadingState message={undefined} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('passes proper className to PageContainer', () => {
    render(<LoadingState />);

    const pageContainer = screen.getByTestId('page-container');
    expect(pageContainer).toHaveClass('p-3', 'md:p-6');
  });

  it('maintains accessibility standards', () => {
    render(<LoadingState />);

    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
  });

  it('renders consistently with different message lengths', () => {
    const shortMessage = 'Wait...';
    const longMessage = 'Loading a very long list of expense entries with detailed information...';

    const { rerender } = render(<LoadingState message={shortMessage} />);
    expect(screen.getByText(shortMessage)).toBeInTheDocument();

    rerender(<LoadingState message={longMessage} />);
    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  it('supports special characters in message', () => {
    const specialMessage = 'Loading... 100% ☀️ 🚗 €$¥';
    render(<LoadingState message={specialMessage} />);

    expect(screen.getByText(specialMessage)).toBeInTheDocument();
  });
});
