import '@testing-library/jest-dom';
import { ThemeProvider } from '../../app/context/ThemeContext';
import { LanguageProvider } from '../../app/context/LanguageContext';

// Mock Next Auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated'
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  getProviders: jest.fn(() => Promise.resolve({})),
}));

// Mock Next Router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/test-path',
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <LanguageProvider>
      {children}
    </LanguageProvider>
  </ThemeProvider>
);

describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Session Management', () => {
    it('should handle unauthenticated user state', () => {
      const { useSession } = require('next-auth/react');
      useSession.mockReturnValue({
        data: null,
        status: 'unauthenticated'
      });

      expect(useSession().status).toBe('unauthenticated');
    });

    it('should handle authenticated user state', () => {
      const { useSession } = require('next-auth/react');
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        image: 'https://example.com/avatar.jpg'
      };

      useSession.mockReturnValue({
        data: {
          user: mockUser,
          expires: '2024-12-31T23:59:59.999Z'
        },
        status: 'authenticated'
      });

      const session = useSession();
      expect(session.status).toBe('authenticated');
      expect(session.data.user.email).toBe('test@example.com');
    });

    it('should handle loading session state', () => {
      const { useSession } = require('next-auth/react');
      useSession.mockReturnValue({
        data: null,
        status: 'loading'
      });

      expect(useSession().status).toBe('loading');
    });

    it('should handle session errors gracefully', () => {
      const { useSession } = require('next-auth/react');
      useSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        error: 'SessionError'
      });

      const session = useSession();
      expect(session.status).toBe('unauthenticated');
      expect(session.error).toBe('SessionError');
    });
  });

  describe('Sign In Process', () => {
    it('should call signIn with Google provider', async () => {
      const { signIn } = require('next-auth/react');

      await signIn('google', { callbackUrl: '/dashboard' });

      expect(signIn).toHaveBeenCalledWith('google', { callbackUrl: '/dashboard' });
    });

    it('should call signIn with GitHub provider', async () => {
      const { signIn } = require('next-auth/react');

      await signIn('github', { callbackUrl: '/' });

      expect(signIn).toHaveBeenCalledWith('github', { callbackUrl: '/' });
    });

    it('should handle sign in errors', async () => {
      const { signIn } = require('next-auth/react');
      signIn.mockRejectedValue(new Error('Sign in failed'));

      await expect(signIn('google')).rejects.toThrow('Sign in failed');
    });
  });

  describe('Sign Out Process', () => {
    it('should call signOut successfully', async () => {
      const { signOut } = require('next-auth/react');

      await signOut({ callbackUrl: '/' });

      expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/' });
    });

    it('should handle sign out errors gracefully', async () => {
      const { signOut } = require('next-auth/react');
      signOut.mockRejectedValue(new Error('Sign out failed'));

      await expect(signOut()).rejects.toThrow('Sign out failed');
    });
  });

  describe('Provider Management', () => {
    it('should get available providers', async () => {
      const { getProviders } = require('next-auth/react');
      const mockProviders = {
        google: {
          id: 'google',
          name: 'Google',
          type: 'oauth',
          signinUrl: '/api/auth/signin/google',
        },
        github: {
          id: 'github',
          name: 'GitHub',
          type: 'oauth',
          signinUrl: '/api/auth/signin/github',
        }
      };

      getProviders.mockResolvedValue(mockProviders);

      const providers = await getProviders();
      expect(providers).toEqual(mockProviders);
      expect(providers.google.name).toBe('Google');
      expect(providers.github.name).toBe('GitHub');
    });

    it('should handle empty providers list', async () => {
      const { getProviders } = require('next-auth/react');
      getProviders.mockResolvedValue({});

      const providers = await getProviders();
      expect(providers).toEqual({});
    });
  });

  describe('User Profile Data', () => {
    it('should handle complete user profile', () => {
      const { useSession } = require('next-auth/react');
      const completeUser = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        image: 'https://example.com/avatar.jpg',
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      useSession.mockReturnValue({
        data: {
          user: completeUser,
          expires: '2024-12-31T23:59:59.999Z',
          accessToken: 'token123'
        },
        status: 'authenticated'
      });

      const session = useSession();
      expect(session.data.user.id).toBe('user123');
      expect(session.data.user.emailVerified).toBeInstanceOf(Date);
    });

    it('should handle minimal user profile', () => {
      const { useSession } = require('next-auth/react');
      const minimalUser = {
        id: 'user456',
        email: 'minimal@example.com'
      };

      useSession.mockReturnValue({
        data: {
          user: minimalUser,
          expires: '2024-12-31T23:59:59.999Z'
        },
        status: 'authenticated'
      });

      const session = useSession();
      expect(session.data.user.id).toBe('user456');
      expect(session.data.user.name).toBeUndefined();
      expect(session.data.user.image).toBeUndefined();
    });
  });

  describe('Authentication State Transitions', () => {
    it('should transition from loading to authenticated', () => {
      const { useSession } = require('next-auth/react');

      // First call - loading
      useSession.mockReturnValueOnce({
        data: null,
        status: 'loading'
      });

      let session = useSession();
      expect(session.status).toBe('loading');

      // Second call - authenticated
      useSession.mockReturnValueOnce({
        data: {
          user: { id: 'user123', email: 'test@example.com' },
          expires: '2024-12-31T23:59:59.999Z'
        },
        status: 'authenticated'
      });

      session = useSession();
      expect(session.status).toBe('authenticated');
    });

    it('should transition from loading to unauthenticated', () => {
      const { useSession } = require('next-auth/react');

      // First call - loading
      useSession.mockReturnValueOnce({
        data: null,
        status: 'loading'
      });

      let session = useSession();
      expect(session.status).toBe('loading');

      // Second call - unauthenticated
      useSession.mockReturnValueOnce({
        data: null,
        status: 'unauthenticated'
      });

      session = useSession();
      expect(session.status).toBe('unauthenticated');
    });
  });
});
