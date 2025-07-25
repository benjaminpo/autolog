import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LoadingState } from '../../app/components/LoadingState';
import { ErrorState } from '../../app/components/ErrorState';

// Mock PageContainer
jest.mock('../../app/components/PageContainer', () => {
  return function MockPageContainer({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={className} data-testid="page-container">{children}</div>;
  };
});

describe('LoadingState and ErrorState Edge Cases', () => {
  let mockRetry: jest.Mock;

  beforeEach(() => {
    mockRetry = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('LoadingState Edge Cases', () => {
    it('handles extremely long loading messages', () => {
      const longMessage = 'Loading data from multiple sources including databases, APIs, external services, and cache layers.';

      render(<LoadingState message={longMessage} />);

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('handles loading message with special HTML characters', () => {
      const messageWithHTML = 'Loading data... <script>alert("test")</script> & entities > test';

      render(<LoadingState message={messageWithHTML} />);

      expect(screen.getByText(messageWithHTML)).toBeInTheDocument();
    });

    it('renders with null message gracefully', () => {
      render(<LoadingState message={null as any} />);

      // Should fallback to default message
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('ErrorState Edge Cases', () => {
    it('handles extremely long error messages', () => {
      const longError = 'An unexpected error occurred while processing your request. This could be due to network connectivity issues.';

      render(<ErrorState error={longError} onRetry={mockRetry} />);

      expect(screen.getByText(longError)).toBeInTheDocument();
    });

    it('handles error message with special characters', () => {
      const errorWithSpecialChars = 'Error: Connection failed! @#$%';

      render(<ErrorState error={errorWithSpecialChars} onRetry={mockRetry} />);

      expect(screen.getByText(errorWithSpecialChars)).toBeInTheDocument();
    });

    it('handles rapid retry button clicks', () => {
      render(<ErrorState error="Network error" onRetry={mockRetry} />);

      const retryButton = screen.getByText('Try Again');

      // Simulate rapid clicking
      for (let i = 0; i < 5; i++) {
        fireEvent.click(retryButton);
      }

      expect(mockRetry).toHaveBeenCalledTimes(5);
    });
  });
});
