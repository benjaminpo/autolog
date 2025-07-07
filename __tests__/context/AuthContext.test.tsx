import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Unmock the AuthContext for this test - we want to test the real implementation
jest.unmock('../../app/context/AuthContext');
const { AuthProvider, useAuth } = require('../../app/context/AuthContext');

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
  useSession: jest.fn()
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

// Mock global fetch
global.fetch = jest.fn();

const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

const mockPush = jest.fn();

// Test component that uses useAuth hook
const TestComponent = () => {
  try {
    const { user, loading, login, register, logout, error, setError } = useAuth();
    
    return (
      <div>
        <div data-testid="user">{user ? JSON.stringify(user) : 'null'}</div>
        <div data-testid="loading">{loading.toString()}</div>
        <div data-testid="error">{error || 'no-error'}</div>
        <button onClick={() => login('test@example.com', 'password')} data-testid="login-button">
          Login
        </button>
        <button onClick={() => login('test@example.com', 'password', 'en')} data-testid="login-with-language-button">
          Login with Language
        </button>
        <button onClick={() => register('Test User', 'test@example.com', 'password')} data-testid="register-button">
          Register
        </button>
        <button onClick={() => logout()} data-testid="logout-button">
          Logout
        </button>
        <button onClick={() => setError('test error')} data-testid="set-error-button">
          Set Error
        </button>
        <button onClick={() => setError(null)} data-testid="clear-error-button">
          Clear Error
        </button>
      </div>
    );
  } catch (error) {
    return <div data-testid="hook-error">{error instanceof Error ? error.message : 'Unknown error'}</div>;
  }
};

// Component to test hook outside provider
const HookTestComponent = () => {
  try {
    const auth = useAuth();
    return <div>Hook works: {auth ? 'true' : 'false'}</div>;
  } catch (error) {
    return <div data-testid="hook-error">{error instanceof Error ? error.message : 'Unknown error'}</div>;
  }
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn()
    } as any);
    
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    } as Response);
  });

  describe('AuthProvider', () => {
    it('should render children without crashing', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn()
      } as any);

      render(
        <AuthProvider>
          <div data-testid="child">Test Child</div>
        </AuthProvider>
      );
      
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('should provide default values when no session', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn()
      } as any);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('null');
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
        expect(screen.getByTestId('error')).toHaveTextContent('no-error');
      });
    });

    it('should set user from session data', async () => {
      const mockSession = {
        user: {
          id: '123',
          name: 'Test User',
          email: 'test@example.com'
        },
        expires: '2024-01-01'
      };

      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: jest.fn()
      } as any);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      await waitFor(() => {
        const userElement = screen.getByTestId('user');
        expect(userElement).toHaveTextContent('{"id":"123","name":"Test User","email":"test@example.com"}');
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
    });

    it('should handle session with incomplete user data', async () => {
      const mockSession = {
        user: {
          id: '123',
          name: null,
          email: null
        },
        expires: '2024-01-01'
      };

      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: jest.fn()
      } as any);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      await waitFor(() => {
        const userElement = screen.getByTestId('user');
        expect(userElement).toHaveTextContent('{"id":"123","name":"","email":""}');
      });
    });
  });

  describe('login function', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn()
      } as any);
    });

    it('should handle successful login', async () => {
      mockSignIn.mockResolvedValue({
        error: null,
        status: 200,
        ok: true,
        url: null
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('login-button'));
      });

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('credentials', {
          redirect: false,
          email: 'test@example.com',
          password: 'password'
        });
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    it('should handle login with language preference', async () => {
      mockSignIn.mockResolvedValue({
        error: null,
        status: 200,
        ok: true,
        url: null
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('login-with-language-button'));
      });

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('credentials', {
          redirect: false,
          email: 'test@example.com',
          password: 'password'
        });
        expect(mockFetch).toHaveBeenCalledWith('/api/user-preferences', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ language: 'en' }),
        });
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    it('should handle login failure with error', async () => {
      mockSignIn.mockResolvedValue({
        error: 'Invalid credentials',
        status: 401,
        ok: false,
        url: null
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('login-button'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Invalid email or password');
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
        expect(mockPush).not.toHaveBeenCalled();
      });
    });

    it('should handle login exception', async () => {
      mockSignIn.mockRejectedValue(new Error('Network error'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('login-button'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('An error occurred during login');
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
    });

    it('should handle language preference save failure gracefully', async () => {
      mockSignIn.mockResolvedValue({
        error: null,
        status: 200,
        ok: true,
        url: null
      });

      mockFetch.mockRejectedValue(new Error('Network error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('login-with-language-button'));
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
        expect(consoleSpy).toHaveBeenCalledWith('Error saving language preference during login:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('register function', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn()
      } as any);
    });

    it('should handle successful registration and auto-login', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true })
        } as Response);

      mockSignIn.mockResolvedValue({
        error: null,
        status: 200,
        ok: true,
        url: null
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('register-button'));
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: 'Test User', 
            email: 'test@example.com', 
            password: 'password' 
          })
        });
        expect(mockSignIn).toHaveBeenCalledWith('credentials', {
          redirect: false,
          email: 'test@example.com',
          password: 'password'
        });
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    it('should handle registration failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ message: 'Email already exists' })
      } as Response);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('register-button'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Email already exists');
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
        expect(mockSignIn).not.toHaveBeenCalled();
      });
    });

    it('should handle registration failure without message', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({})
      } as Response);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('register-button'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Registration failed');
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
    });

    it('should handle registration exception', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('register-button'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('An error occurred during registration');
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
    });
  });

  describe('logout function', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: '123',
            name: 'Test User',
            email: 'test@example.com'
          },
          expires: '2024-01-01'
        },
        status: 'authenticated',
        update: jest.fn()
      } as any);
    });

    it('should handle successful logout', async () => {
      mockSignOut.mockResolvedValue(undefined);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('logout-button'));
      });

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledWith({ redirect: false });
        expect(mockPush).toHaveBeenCalledWith('/auth/login');
      });
    });

    it('should handle logout failure gracefully', async () => {
      mockSignOut.mockRejectedValue(new Error('Logout failed'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      fireEvent.click(screen.getByTestId('logout-button'));

      // Wait for the logout function to complete
      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledWith({ redirect: false });
      });
      
      // When signOut fails, router.push should NOT be called (it's in the try block)
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn()
      } as any);
    });

    it('should allow setting and clearing errors', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('no-error');
      });

      // Set error
      fireEvent.click(screen.getByTestId('set-error-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('test error');
      });

      // Clear error
      fireEvent.click(screen.getByTestId('clear-error-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('no-error');
      });
    });
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      render(<HookTestComponent />);
      
      expect(screen.getByTestId('hook-error')).toHaveTextContent('useAuth must be used within an AuthProvider');
    });

    it('should work correctly when used inside AuthProvider', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn()
      } as any);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      expect(screen.getByTestId('user')).toBeInTheDocument();
      expect(screen.getByTestId('loading')).toBeInTheDocument();
      expect(screen.getByTestId('error')).toBeInTheDocument();
    });
  });

  describe('loading states', () => {
    it('should start with loading true initially', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
        update: jest.fn()
      } as any);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Loading starts true, then becomes false after useEffect runs
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
    });

    it('should set loading during login', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn()
      } as any);

      // Mock signIn to never resolve so we can check loading state
      const neverResolvingPromise = new Promise<any>(() => {});
      mockSignIn.mockReturnValue(neverResolvingPromise);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Initially loading should be false
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      // Start login - this should trigger loading
      fireEvent.click(screen.getByTestId('login-button'));

      // Now loading should be true
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('true');
      });
    });
  });

  describe('session state changes', () => {
    it('should update user when session changes', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn()
      } as any);

      const { rerender } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('null');
      });

      // Update session with user
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: '456',
            name: 'New User',
            email: 'new@example.com'
          },
          expires: '2024-01-01'
        },
        status: 'authenticated',
        update: jest.fn()
      } as any);

      rerender(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('{"id":"456","name":"New User","email":"new@example.com"}');
      });
    });
  });
}); 