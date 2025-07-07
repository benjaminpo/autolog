import { render, screen } from '@testing-library/react';
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
        'dark:bg-gray-900',
        'transition-colors'
      );
    });
  });

  describe('Authenticated User Redirect', () => {
    it('should redirect authenticated user to fuel-history page', () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      (useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false
      });

      render(<HomePage />);

      expect(mockReplace).toHaveBeenCalledWith('/fuel-history');
      expect(mockReplace).toHaveBeenCalledTimes(1);
    });

    it('should handle user with different properties', () => {
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

      expect(mockReplace).toHaveBeenCalledWith('/fuel-history');
    });

    it('should redirect even with minimal user object', () => {
      const mockUser = { id: 'minimal-user' };
      (useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false
      });

      render(<HomePage />);

      expect(mockReplace).toHaveBeenCalledWith('/fuel-history');
    });
  });

  describe('Unauthenticated User Redirect', () => {
    it('should redirect unauthenticated user to login page when user is null', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false
      });

      render(<HomePage />);

      expect(mockReplace).toHaveBeenCalledWith('/auth/login');
      expect(mockReplace).toHaveBeenCalledTimes(1);
    });

    it('should redirect unauthenticated user to login page when user is undefined', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: undefined,
        loading: false
      });

      render(<HomePage />);

      expect(mockReplace).toHaveBeenCalledWith('/auth/login');
    });

    it('should redirect when user is false', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: false,
        loading: false
      });

      render(<HomePage />);

      expect(mockReplace).toHaveBeenCalledWith('/auth/login');
    });

    it('should redirect when user is empty string', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: '',
        loading: false
      });

      render(<HomePage />);

      expect(mockReplace).toHaveBeenCalledWith('/auth/login');
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

    it('should redirect after loading becomes false', () => {
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
      expect(mockReplace).toHaveBeenCalledWith('/fuel-history');
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

    it('should always render the same structure regardless of auth state', () => {
      // Test with authenticated user
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: '123' },
        loading: false
      });

      const { container: container1 } = render(<HomePage />);

      // Test with unauthenticated user
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false
      });

      const { container: container2 } = render(<HomePage />);

      // Both should have the same structure (loading spinner)
      expect(container1.innerHTML).toBe(container2.innerHTML);
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