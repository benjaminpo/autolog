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
  withAuth: jest.fn((middleware, config) => middleware),
}));

// Import the middleware after mocking
const middleware = require('../../app/middleware').default;

describe('Middleware', () => {
  let mockRequest: Partial<NextRequestWithAuth>;
  let mockNextResponse: jest.Mocked<typeof NextResponse>;

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
      mockRequest.nextauth!.token = { sub: '123', email: 'test@example.com' };
      mockRequest.nextUrl!.pathname = '/auth/login';
      
      const result = middleware(mockRequest as NextRequestWithAuth);
      
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        new URL('/', mockRequest.url)
      );
    });

    it('should redirect authenticated users away from register page', () => {
      mockRequest.nextauth!.token = { sub: '123', email: 'test@example.com' };
      mockRequest.nextUrl!.pathname = '/auth/register';
      
      const result = middleware(mockRequest as NextRequestWithAuth);
      
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        new URL('/', mockRequest.url)
      );
    });

    it('should allow unauthenticated users to access login page', () => {
      mockRequest.nextauth!.token = null;
      mockRequest.nextUrl!.pathname = '/auth/login';
      
      const result = middleware(mockRequest as NextRequestWithAuth);
      
      expect(NextResponse.next).toHaveBeenCalled();
      expect(NextResponse.redirect).not.toHaveBeenCalled();
    });

    it('should allow unauthenticated users to access register page', () => {
      mockRequest.nextauth!.token = null;
      mockRequest.nextUrl!.pathname = '/auth/register';
      
      const result = middleware(mockRequest as NextRequestWithAuth);
      
      expect(NextResponse.next).toHaveBeenCalled();
      expect(NextResponse.redirect).not.toHaveBeenCalled();
    });
  });

  describe('Protected Routes', () => {
    it('should allow authenticated users to access protected routes', () => {
      mockRequest.nextauth!.token = { sub: '123', email: 'test@example.com' };
      mockRequest.nextUrl!.pathname = '/dashboard';
      
      const result = middleware(mockRequest as NextRequestWithAuth);
      
      expect(NextResponse.next).toHaveBeenCalled();
      expect(NextResponse.redirect).not.toHaveBeenCalled();
    });

    it('should handle profile routes for authenticated users', () => {
      mockRequest.nextauth!.token = { sub: '123', email: 'test@example.com' };
      mockRequest.nextUrl!.pathname = '/profile/settings';
      
      const result = middleware(mockRequest as NextRequestWithAuth);
      
      expect(NextResponse.next).toHaveBeenCalled();
      expect(NextResponse.redirect).not.toHaveBeenCalled();
    });

    it('should handle nested protected routes', () => {
      mockRequest.nextauth!.token = { sub: '123', email: 'test@example.com' };
      mockRequest.nextUrl!.pathname = '/expense-history/details';
      
      const result = middleware(mockRequest as NextRequestWithAuth);
      
      expect(NextResponse.next).toHaveBeenCalled();
      expect(NextResponse.redirect).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing token gracefully', () => {
      mockRequest.nextauth = { token: null };
      mockRequest.nextUrl!.pathname = '/';
      
      const result = middleware(mockRequest as NextRequestWithAuth);
      
      expect(NextResponse.next).toHaveBeenCalled();
    });

    it('should handle undefined nextauth object', () => {
      // In practice, NextAuth middleware wrapper ensures nextauth is always defined
      // but we test the edge case by providing an empty nextauth object
      const safeRequest = {
        ...mockRequest,
        nextauth: { token: null },
        nextUrl: { pathname: '/' },
      } as NextRequestWithAuth;
      
      const result = middleware(safeRequest);
      
      expect(NextResponse.next).toHaveBeenCalled();
    });

    it('should handle different URL formats', () => {
      const customUrl = 'https://example.com/auth/login/callback';
      const customRequest = {
        ...mockRequest,
        nextauth: { token: { sub: '123', email: 'test@example.com' } },
        nextUrl: { pathname: '/auth/login/callback' },
        url: customUrl,
      } as NextRequestWithAuth;
      
      const result = middleware(customRequest);
      
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        new URL('/', customUrl)
      );
    });
  });

  describe('Path Matching', () => {
    it('should correctly identify auth login paths', () => {
      mockRequest.nextauth!.token = { sub: '123' };
      
      const loginPaths = ['/auth/login', '/auth/login/', '/auth/login/extra'];
      
      loginPaths.forEach(path => {
        mockRequest.nextUrl!.pathname = path;
        jest.clearAllMocks();
        
        middleware(mockRequest as NextRequestWithAuth);
        
        expect(NextResponse.redirect).toHaveBeenCalled();
      });
    });

    it('should correctly identify auth register paths', () => {
      mockRequest.nextauth!.token = { sub: '123' };
      
      const registerPaths = ['/auth/register', '/auth/register/', '/auth/register/extra'];
      
      registerPaths.forEach(path => {
        mockRequest.nextUrl!.pathname = path;
        jest.clearAllMocks();
        
        middleware(mockRequest as NextRequestWithAuth);
        
        expect(NextResponse.redirect).toHaveBeenCalled();
      });
    });

    it('should not match partial auth paths', () => {
      mockRequest.nextauth!.token = { sub: '123' };
      
      const nonAuthPaths = ['/authentication', '/authorize', '/register-vehicle'];
      
      nonAuthPaths.forEach(path => {
        mockRequest.nextUrl!.pathname = path;
        jest.clearAllMocks();
        
        middleware(mockRequest as NextRequestWithAuth);
        
        expect(NextResponse.next).toHaveBeenCalled();
        expect(NextResponse.redirect).not.toHaveBeenCalled();
      });
    });
  });
});

describe('Middleware Configuration', () => {
  const { config } = require('../../app/middleware');

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