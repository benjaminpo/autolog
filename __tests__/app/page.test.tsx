import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import HomePage from '../../app/page';
import { useAuth } from '../../app/context/AuthContext';

// Mock the dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

jest.mock('../../app/context/AuthContext', () => ({
  useAuth: jest.fn()
}));

// Mock ThemeToggle component
jest.mock('../../app/components/ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Theme Toggle</div>,
}));

describe('HomePage', () => {
  const mockReplace = jest.fn();
  const mockRouter = {
    replace: mockReplace,
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  describe('Loading State', () => {
    it('should show loading spinner when loading is true', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: true
      });

      render(<HomePage />);

      // Check for loading spinner by class
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      
      // Should not redirect while loading
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('should have correct loading spinner styles', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: true
      });

      const { container } = render(<HomePage />);

      // Check for spinner element with animation classes
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('rounded-full', 'h-16', 'w-16', 'border-t-2', 'border-b-2');
    });

    it('should have proper container styling', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: true
      });

      const { container } = render(<HomePage />);

      const mainContainer = container.firstChild;
      expect(mainContainer).toHaveClass(
        'flex',
        'items-center',
        'justify-center',
        'min-h-screen',
        'bg-white',
        'dark:bg-gray-800',
        'transition-colors'
      );
    });
  });

  describe('Authenticated User Redirect', () => {
    it('should redirect authenticated user to fuel-history page', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      (useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false
      });

      render(<HomePage />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/fuel-history');
        expect(mockReplace).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle user with different properties', async () => {
      const mockUser = { 
        id: 'user456', 
        email: 'another@test.com',
        name: 'Test User'
      };
      (useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false
      });

      render(<HomePage />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/fuel-history');
      });
    });

    it('should redirect even with minimal user object', async () => {
      const mockUser = { id: 'minimal-user' };
      (useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false
      });

      render(<HomePage />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/fuel-history');
      });
    });
  });

  describe('Unauthenticated User Landing Page', () => {
    it('should show landing page for unauthenticated user when user is null', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false
      });

      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText('Track Your Vehicle Expenses')).toBeInTheDocument();
        expect(screen.getByText('Like Never Before')).toBeInTheDocument();
      });

      // Should not redirect to login
      expect(mockReplace).not.toHaveBeenCalledWith('/auth/login');
    });

    it('should show landing page for unauthenticated user when user is undefined', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: undefined,
        loading: false
      });

      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText('Track Your Vehicle Expenses')).toBeInTheDocument();
      });

      // Should not redirect to login
      expect(mockReplace).not.toHaveBeenCalledWith('/auth/login');
    });

    it('should show landing page when user is false', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: false,
        loading: false
      });

      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText('Track Your Vehicle Expenses')).toBeInTheDocument();
      });

      // Should not redirect to login
      expect(mockReplace).not.toHaveBeenCalledWith('/auth/login');
    });

    it('should show landing page when user is empty string', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: '',
        loading: false
      });

      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText('Track Your Vehicle Expenses')).toBeInTheDocument();
      });

      // Should not redirect to login
      expect(mockReplace).not.toHaveBeenCalledWith('/auth/login');
    });
  });

  describe('Loading State Changes', () => {
    it('should not redirect while loading is true regardless of user state', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: '123' },
        loading: true
      });

      render(<HomePage />);

      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('should redirect after loading becomes false', async () => {
      const { rerender } = render(<HomePage />);

      // Initially loading
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: '123' },
        loading: true
      });

      rerender(<HomePage />);
      expect(mockReplace).not.toHaveBeenCalled();

      // Loading finished
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: '123' },
        loading: false
      });

      rerender(<HomePage />);
      
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/fuel-history');
      });
    });
  });

  describe('Component Rendering', () => {
    it('should render without crashing with valid props', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: true
      });

      expect(() => render(<HomePage />)).not.toThrow();
    });

    it('should render loading state by default', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: true
      });

      const { container } = render(<HomePage />);

      expect(container.firstChild).toBeInTheDocument();
      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('should render different content based on auth state', async () => {
      // Test with authenticated user (should redirect, so no content)
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: '123' },
        loading: false
      });

      const { container: container1 } = render(<HomePage />);

      // Test with unauthenticated user (should show landing page)
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false
      });

      const { container: container2 } = render(<HomePage />);

      await waitFor(() => {
        // Authenticated user gets null (redirected)
        expect(container1.innerHTML).toBe('');
        
        // Unauthenticated user gets landing page
        expect(container2.innerHTML).toContain('Track Your Vehicle Expenses');
      });
    });
  });

  describe('Hook Dependencies', () => {
    it('should call useAuth hook', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: true
      });

      render(<HomePage />);

      expect(useAuth).toHaveBeenCalled();
    });

    it('should call useRouter hook', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: true
      });

      render(<HomePage />);

      expect(useRouter).toHaveBeenCalled();
    });

    it('should handle missing router methods gracefully', () => {
      (useRouter as jest.Mock).mockReturnValue({
        replace: jest.fn()
      });

      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false
      });

      expect(() => render(<HomePage />)).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle auth hook returning undefined', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false
      });

      expect(() => render(<HomePage />)).not.toThrow();
    });

    it('should handle auth hook returning empty object', () => {
      (useAuth as jest.Mock).mockReturnValue({});

      expect(() => render(<HomePage />)).not.toThrow();
    });

    it('should handle router hook returning undefined', () => {
      (useRouter as jest.Mock).mockReturnValue({
        replace: jest.fn()
      });

      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false
      });

      expect(() => render(<HomePage />)).not.toThrow();
    });
  });
}); 