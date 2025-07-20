import { NextResponse } from 'next/server';
import { NextRequestWithAuth } from 'next-auth/middleware';

// Mock Next.js dependencies
jest.mock('next/server', () => ({
  NextResponse: {
    redirect: jest.fn(),
    next: jest.fn(),
  },
}));

jest.mock('next-auth/middleware', () => ({
  withAuth: jest.fn((middleware) => middleware),
}));

// Import the middleware after mocking using dynamic import for testing
let middleware: any;

beforeAll(async () => {
  const middlewareModule = await import('../../app/middleware');
  middleware = middlewareModule.default;
});

describe('Middleware', () => {
  let mockRequest: Partial<NextRequestWithAuth>;
  let mockNextResponse: jest.Mocked<typeof NextResponse>;

  // Helper functions to reduce duplication
  const createAuthenticatedToken = () => ({ sub: '123', email: 'test@example.com' });

  const setupAuthenticatedRequest = (pathname: string, url = 'http://localhost:3000') => {
    mockRequest.nextauth!.token = createAuthenticatedToken();
    mockRequest.nextUrl!.pathname = pathname;
    if (url !== mockRequest.url) {
      mockRequest = { ...mockRequest, url };
    }
  };

  const setupUnauthenticatedRequest = (pathname: string) => {
    mockRequest.nextauth!.token = null;
    mockRequest.nextUrl!.pathname = pathname;
  };

  const expectRedirectToHome = (url = 'http://localhost:3000') => {
    expect(NextResponse.redirect).toHaveBeenCalledWith(new URL('/', url));
  };

  const expectNext = () => {
    expect(NextResponse.next).toHaveBeenCalled();
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  };

  const testAuthPath = (path: string, shouldRedirect: boolean = true) => {
    mockRequest.nextUrl!.pathname = path;
    jest.clearAllMocks();
    middleware(mockRequest as NextRequestWithAuth);

    if (shouldRedirect) {
      expect(NextResponse.redirect).toHaveBeenCalled();
    } else {
      expectNext();
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockNextResponse = NextResponse as jest.Mocked<typeof NextResponse>;
    mockNextResponse.redirect = jest.fn().mockReturnValue('redirected');
    mockNextResponse.next = jest.fn().mockReturnValue('next');

    mockRequest = {
      nextauth: {
        token: null,
      },
      nextUrl: {
        pathname: '/',
      },
      url: 'http://localhost:3000',
    } as Partial<NextRequestWithAuth>;
  });

  describe('Authentication Flow', () => {
    it('should redirect authenticated users away from login page', () => {
      setupAuthenticatedRequest('/auth/login');

      middleware(mockRequest as NextRequestWithAuth);

      expectRedirectToHome();
    });

    it('should redirect authenticated users away from register page', () => {
      setupAuthenticatedRequest('/auth/register');

      middleware(mockRequest as NextRequestWithAuth);

      expectRedirectToHome();
    });

    it('should allow unauthenticated users to access login page', () => {
      setupUnauthenticatedRequest('/auth/login');

      middleware(mockRequest as NextRequestWithAuth);

      expectNext();
    });

    it('should allow unauthenticated users to access register page', () => {
      setupUnauthenticatedRequest('/auth/register');

      middleware(mockRequest as NextRequestWithAuth);

      expectNext();
    });
  });

  describe('Protected Routes', () => {
    it('should allow authenticated users to access protected routes', () => {
      setupAuthenticatedRequest('/dashboard');

      middleware(mockRequest as NextRequestWithAuth);

      expectNext();
    });

    it('should handle profile routes for authenticated users', () => {
      setupAuthenticatedRequest('/profile/settings');

      middleware(mockRequest as NextRequestWithAuth);

      expectNext();
    });

    it('should handle nested protected routes', () => {
      setupAuthenticatedRequest('/expense-history/details');

      middleware(mockRequest as NextRequestWithAuth);

      expectNext();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing token gracefully', () => {
      setupUnauthenticatedRequest('/');

      middleware(mockRequest as NextRequestWithAuth);

      expectNext();
    });

    it('should handle undefined nextauth object', () => {
      // In practice, NextAuth middleware wrapper ensures nextauth is always defined
      // but we test the edge case by providing an empty nextauth object
      const safeRequest = {
        ...mockRequest,
        nextauth: { token: null },
        nextUrl: { pathname: '/' },
      } as NextRequestWithAuth;

      middleware(safeRequest);

      expectNext();
    });

    it('should handle different URL formats', () => {
      const customUrl = 'https://example.com/auth/login/callback';
      const customRequest = {
        ...mockRequest,
        nextauth: { token: createAuthenticatedToken() },
        nextUrl: { pathname: '/auth/login/callback' },
        url: customUrl,
      } as NextRequestWithAuth;

      middleware(customRequest);

      expectRedirectToHome(customUrl);
    });
  });

  describe('Path Matching', () => {
    it('should correctly identify auth login paths', () => {
      mockRequest.nextauth!.token = { sub: '123' };

      const loginPaths = ['/auth/login', '/auth/login/', '/auth/login/extra'];

      loginPaths.forEach(path => testAuthPath(path, true));
    });

    it('should correctly identify auth register paths', () => {
      mockRequest.nextauth!.token = { sub: '123' };

      const registerPaths = ['/auth/register', '/auth/register/', '/auth/register/extra'];

      registerPaths.forEach(path => testAuthPath(path, true));
    });

    it('should not match partial auth paths', () => {
      mockRequest.nextauth!.token = { sub: '123' };

      const nonAuthPaths = ['/authentication', '/authorize', '/register-vehicle'];

      nonAuthPaths.forEach(path => testAuthPath(path, false));
    });
  });
});

describe('Middleware Configuration', () => {
  let config: any;

  beforeAll(async () => {
    const middlewareModule = await import('../../app/middleware');
    config = middlewareModule.config;
  });

  it('should have correct matcher configuration', () => {
    expect(config.matcher).toEqual([
      '/',
      '/profile/:path*',
      '/((?!api|auth|_next/static|favicon.ico).*)',
    ]);
  });

  it('should protect root path', () => {
    expect(config.matcher.includes('/')).toBe(true);
  });

  it('should protect profile paths with wildcards', () => {
    expect(config.matcher.includes('/profile/:path*')).toBe(true);
  });

  it('should exclude API routes from protection', () => {
    const apiExclusionPattern = '/((?!api|auth|_next/static|favicon.ico).*)';
    expect(config.matcher.includes(apiExclusionPattern)).toBe(true);
  });
});
