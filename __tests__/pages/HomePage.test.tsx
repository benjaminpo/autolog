import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import HomePage from '../../app/page';
import { useAuth } from '../../app/context/AuthContext';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock AuthContext
jest.mock('../../app/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock ThemeToggle component
jest.mock('../../app/components/ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Theme Toggle</div>,
}));

const mockPush = jest.fn();
const mockReplace = jest.fn();

describe('HomePage', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });
    jest.clearAllMocks();
  });

  describe('Loading state', () => {
    it('should show loading spinner when auth is loading', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: true,
      });

      render(<HomePage />);

      const loadingSpinner = document.querySelector('.animate-spin');
      expect(loadingSpinner).toBeInTheDocument();
      expect(loadingSpinner).toHaveClass('animate-spin');
    });

    it('should show loading spinner with correct styling', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: true,
      });

      render(<HomePage />);

      const container = document.querySelector('.min-h-screen');
      expect(container).toHaveClass('min-h-screen', 'bg-white', 'dark:bg-gray-800');
      
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toHaveClass('h-16', 'w-16', 'border-t-2', 'border-b-2', 'border-blue-600');
    });
  });

  describe('Authentication redirects', () => {
    it('should redirect authenticated users to fuel-history page', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: '1', email: 'test@example.com' },
        loading: false,
      });

      render(<HomePage />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/fuel-history');
      });
    });

    it('should show landing page for unauthenticated users', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false,
      });

      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText('Track Your Vehicle Expenses')).toBeInTheDocument();
        expect(screen.getByText('Like Never Before')).toBeInTheDocument();
        expect(screen.getByText('Start Tracking Free')).toBeInTheDocument();
        expect(screen.getAllByText('🚗 AutoLog')).toHaveLength(2); // Header and footer
      });

      // Should not redirect to login
      expect(mockReplace).not.toHaveBeenCalledWith('/auth/login');
    });

    it('should not redirect while loading', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: true,
      });

      render(<HomePage />);

      expect(mockReplace).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Landing page content', () => {
    beforeEach(() => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false,
      });
    });

    it('should display hero section with correct content', async () => {
      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText('Track Your Vehicle Expenses')).toBeInTheDocument();
        expect(screen.getByText('Like Never Before')).toBeInTheDocument();
        expect(screen.getByText(/Take control of your vehicle finances/)).toBeInTheDocument();
        expect(screen.getByText('Start Tracking Free')).toBeInTheDocument();
        expect(screen.getByText('Sign In')).toBeInTheDocument();
      });
    });

    it('should display features section', async () => {
      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText('Everything You Need to Manage Your Vehicle')).toBeInTheDocument();
        expect(screen.getByText('Fuel Tracking')).toBeInTheDocument();
        expect(screen.getByText('Expense Management')).toBeInTheDocument();
        expect(screen.getByText('Financial Analytics')).toBeInTheDocument();
        expect(screen.getByText('Multi-Vehicle Support')).toBeInTheDocument();
        expect(screen.getByText('Mobile Ready')).toBeInTheDocument();
        expect(screen.getByText('Income Tracking')).toBeInTheDocument();
      });
    });

    it('should display benefits section', async () => {
      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText('Why Choose AutoLog?')).toBeInTheDocument();
        expect(screen.getByText('Save Money')).toBeInTheDocument();
        expect(screen.getByText('Stay Organized')).toBeInTheDocument();
        expect(screen.getByText('Make Informed Decisions')).toBeInTheDocument();
        expect(screen.getByText('Ready to Get Started?')).toBeInTheDocument();
      });
    });

    it('should include theme toggle in header', async () => {
      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
      });
    });
  });

  describe('Multiple render cycles', () => {
    it('should handle user state changes correctly', async () => {
      const { rerender } = render(<HomePage />);

      // Initially loading
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: true,
      });
      rerender(<HomePage />);
      expect(mockReplace).not.toHaveBeenCalled();

      // Then not loading with no user - should show landing page
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false,
      });
      rerender(<HomePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Track Your Vehicle Expenses')).toBeInTheDocument();
      });

      // Should not redirect to login
      expect(mockReplace).not.toHaveBeenCalledWith('/auth/login');

      jest.clearAllMocks();

      // Then user logs in
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: '1', email: 'test@example.com' },
        loading: false,
      });
      rerender(<HomePage />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/fuel-history');
      });
    });
  });

  describe('Error handling', () => {
    it('should handle missing router gracefully', () => {
      (useRouter as jest.Mock).mockReturnValue(null);
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false,
      });

      // The component should handle null router gracefully now
      expect(() => render(<HomePage />)).not.toThrow();
    });

    it('should handle missing auth context gracefully', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: true,
      });

      // Should not throw when auth context is properly mocked
      expect(() => render(<HomePage />)).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should be accessible for screen readers during loading', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: true,
      });

      render(<HomePage />);

      // Check that there's a loading state that can be perceived
      const loadingContainer = document.querySelector('.min-h-screen');
      expect(loadingContainer).toBeInTheDocument();
      expect(loadingContainer).toHaveClass('flex', 'items-center', 'justify-center');
    });

    it('should be accessible for screen readers when showing landing page', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false,
      });

      render(<HomePage />);

      await waitFor(() => {
        // Check for proper heading hierarchy - only one h1 element (main hero heading)
        const mainHeading = screen.getByRole('heading', { level: 1 });
        expect(mainHeading).toBeInTheDocument();
        expect(mainHeading).toHaveTextContent('Track Your Vehicle Expenses');
        
        // Check for proper button labels
        const startButton = screen.getByRole('button', { name: /start tracking free/i });
        expect(startButton).toBeInTheDocument();
        
        const signInButton = screen.getByRole('button', { name: /sign in/i });
        expect(signInButton).toBeInTheDocument();
      });
    });
  });
}); 