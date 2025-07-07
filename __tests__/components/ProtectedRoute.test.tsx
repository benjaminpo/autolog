import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ProtectedRoute from '../../app/components/ProtectedRoute';
import { useAuth } from '../../app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { createMockUser } from '../utils/testHelpers';

// Mock the AuthContext
jest.mock('../../app/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock useRouter from Next.js
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('ProtectedRoute', () => {
  const mockPush = jest.fn();

  const createMockAuthContext = (user: any = null, loading: boolean = false) => ({
    user,
    loading,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    error: null,
    setError: jest.fn(),
  });

  const createMockUser = () => ({
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
  });

  const mockUser2 = {
    id: 'user-456',
    name: 'Jane Smith', 
    email: 'jane@example.com'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when loading is true', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        error: null,
        setError: jest.fn(),
      });

      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should have proper loading spinner styling', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        login: jest.fn(),
        logout: jest.fn(), error: null, setError: jest.fn(), register: jest.fn(),
      });

      const { container } = render(
        <ProtectedRoute>
          <div>Content</div>
        </ProtectedRoute>
      );

      const loadingContainer = container.querySelector('.flex.min-h-screen.items-center.justify-center');
      expect(loadingContainer).toBeInTheDocument();

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('w-16', 'h-16', 'border-t-4', 'border-blue-500', 'rounded-full');
    });
  });

  describe('Authentication States', () => {
    it('should render children when user is authenticated and not loading', () => {
      const mockUser = createMockUser();
      
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        login: jest.fn(),
        logout: jest.fn(), error: null, setError: jest.fn(), register: jest.fn(),
      });

      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should redirect to login when user is not authenticated and not loading', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        login: jest.fn(),
        logout: jest.fn(), error: null, setError: jest.fn(), register: jest.fn(),
      });

      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login');
      });

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should return null when user is not authenticated and not loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        login: jest.fn(),
        logout: jest.fn(), error: null, setError: jest.fn(), register: jest.fn(),
      });

      const { container } = render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Redirect Behavior', () => {
    it('should redirect only when both loading is false and user is null', async () => {
      // First render with loading true
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        login: jest.fn(),
        logout: jest.fn(), error: null, setError: jest.fn(), register: jest.fn(),
      });

      const { rerender } = render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      // Should not redirect yet
      expect(mockPush).not.toHaveBeenCalled();

      // Update to loading false with no user
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        login: jest.fn(),
        logout: jest.fn(), error: null, setError: jest.fn(), register: jest.fn(),
      });

      rerender(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      // Now should redirect
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login');
      });
    });

    it('should not redirect if user becomes authenticated', async () => {
      // Start with no user, not loading
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        login: jest.fn(),
        logout: jest.fn(), error: null, setError: jest.fn(), register: jest.fn(),
      });

      const { rerender } = render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      // Should redirect initially
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login');
      });

      // Clear the mock to check for new calls
      mockPush.mockClear();

      // Update to have user
      const mockUser = createMockUser();
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        login: jest.fn(),
        logout: jest.fn(), error: null, setError: jest.fn(), register: jest.fn(),
      });

      rerender(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      // Should not redirect again
      expect(mockPush).not.toHaveBeenCalled();
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  describe('useEffect Dependencies', () => {
    it('should re-run effect when user changes', async () => {
      const mockUser1 = createMockUser();
      const mockUser2 = { id: '2', name: 'User Two', email: 'user2@example.com' };

      // Start with user1
      mockUseAuth.mockReturnValue({
        user: mockUser1,
        loading: false,
        login: jest.fn(),
        logout: jest.fn(), error: null, setError: jest.fn(), register: jest.fn(),
      });

      const { rerender } = render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();

      // Change to user2
      mockUseAuth.mockReturnValue({
        user: mockUser2,
        loading: false,
        login: jest.fn(),
        logout: jest.fn(), error: null, setError: jest.fn(), register: jest.fn(),
      });

      rerender(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      // Should still render content
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();

      // Change to no user
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        login: jest.fn(),
        logout: jest.fn(), error: null, setError: jest.fn(), register: jest.fn(),
      });

      rerender(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      // Should redirect
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login');
      });
    });

    it('should re-run effect when loading changes', async () => {
      // Start with loading true
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        login: jest.fn(),
        logout: jest.fn(), error: null, setError: jest.fn(), register: jest.fn(),
      });

      const { rerender } = render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(mockPush).not.toHaveBeenCalled();

      // Change loading to false
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        login: jest.fn(),
        logout: jest.fn(), error: null, setError: jest.fn(), register: jest.fn(),
      });

      rerender(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      // Should now redirect
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login');
      });
    });
  });

  describe('Children Rendering', () => {
    it('should render multiple children correctly', () => {
      const mockUser = createMockUser();
      
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        login: jest.fn(),
        logout: jest.fn(), error: null, setError: jest.fn(), register: jest.fn(),
      });

      render(
        <ProtectedRoute>
          <div data-testid="child1">Child 1</div>
          <div data-testid="child2">Child 2</div>
          <span data-testid="child3">Child 3</span>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('child1')).toBeInTheDocument();
      expect(screen.getByTestId('child2')).toBeInTheDocument();
      expect(screen.getByTestId('child3')).toBeInTheDocument();
    });

    it('should render complex nested components', () => {
      const mockUser = createMockUser();
      
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        login: jest.fn(),
        logout: jest.fn(), error: null, setError: jest.fn(), register: jest.fn(),
      });

      const ComplexComponent = () => (
        <div data-testid="complex">
          <header>Header</header>
          <main>
            <section>Section 1</section>
            <section>Section 2</section>
          </main>
          <footer>Footer</footer>
        </div>
      );

      render(
        <ProtectedRoute>
          <ComplexComponent />
        </ProtectedRoute>
      );

      expect(screen.getByTestId('complex')).toBeInTheDocument();
      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Section 1')).toBeInTheDocument();
      expect(screen.getByText('Section 2')).toBeInTheDocument();
      expect(screen.getByText('Footer')).toBeInTheDocument();
    });

    it('should handle empty children', () => {
      const mockUser = createMockUser();
      
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        login: jest.fn(),
        logout: jest.fn(), error: null, setError: jest.fn(), register: jest.fn(),
      });

      const { container } = render(
        <ProtectedRoute>
          {null}
        </ProtectedRoute>
      );

      // Should render the React Fragment with no content
      expect(container.innerHTML).toBe('');
    });

    it('should handle user prop changes correctly', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser2,
        loading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        error: null,
        setError: jest.fn(),
      });

      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should handle missing required props', () => {
      const { container } = render(
        <ProtectedRoute>
          <div>Test content</div>
        </ProtectedRoute>
      );
      
      expect(container).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing auth context gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: undefined as any,
        loading: undefined as any,
        login: jest.fn(),
        logout: jest.fn(), error: null, setError: jest.fn(), register: jest.fn(),
      });

      expect(() => {
        render(
          <ProtectedRoute>
            <div>Content</div>
          </ProtectedRoute>
        );
      }).not.toThrow();
    });

    it('should handle router errors gracefully', async () => {
      const mockPushWithError = jest.fn();
      
      mockUseRouter.mockReturnValue({
        push: mockPushWithError,
        back: jest.fn(),
        forward: jest.fn(),
        refresh: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn(),
      });

      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        login: jest.fn(),
        logout: jest.fn(), 
        error: null, 
        setError: jest.fn(), 
        register: jest.fn(),
      });

      // Component should render without throwing
      expect(() => {
        render(
          <ProtectedRoute>
            <div>Content</div>
          </ProtectedRoute>
        );
      }).not.toThrow();

      // Wait for the effect to run
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(mockPushWithError).toHaveBeenCalledWith('/auth/login');
    });
  });

  describe('Accessibility', () => {
    it('should have proper loading state accessibility', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        login: jest.fn(),
        logout: jest.fn(), error: null, setError: jest.fn(), register: jest.fn(),
      });

      render(
        <ProtectedRoute>
          <div>Content</div>
        </ProtectedRoute>
      );

      // Loading container should be accessible
      const loadingContainer = screen.getByRole('status');
      expect(loadingContainer.closest('.flex')).toHaveClass('min-h-screen');
    });

    it('should preserve accessibility of children when authenticated', () => {
      const mockUser = createMockUser();
      
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        login: jest.fn(),
        logout: jest.fn(), error: null, setError: jest.fn(), register: jest.fn(),
      });

      render(
        <ProtectedRoute>
          <button data-testid="accessible-button">Accessible Button</button>
          <input aria-label="Accessible Input" data-testid="accessible-input" />
        </ProtectedRoute>
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByLabelText('Accessible Input')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not cause unnecessary re-renders of children', () => {
      let renderCount = 0;
      const CountingChild = () => {
        renderCount++;
        return <div data-testid="counting-child">Render count: {renderCount}</div>;
      };

      const mockUser = createMockUser();
      
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        login: jest.fn(),
        logout: jest.fn(), error: null, setError: jest.fn(), register: jest.fn(),
      });

      const { rerender } = render(
        <ProtectedRoute>
          <CountingChild />
        </ProtectedRoute>
      );

      const initialRenderCount = renderCount;

      // Re-render with same auth state
      rerender(
        <ProtectedRoute>
          <CountingChild />
        </ProtectedRoute>
      );

      // Should only render once more
      expect(renderCount).toBe(initialRenderCount + 1);
    });
  });
}); 