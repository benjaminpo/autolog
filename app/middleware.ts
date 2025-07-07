import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';
import { NextRequestWithAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(request: NextRequestWithAuth) {
    // If authenticated but trying to access login or register
    if (
      request.nextauth.token &&
      (request.nextUrl.pathname.startsWith('/auth/login') ||
        request.nextUrl.pathname.startsWith('/auth/register'))
    ) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  // Protect these paths (require authentication)
  matcher: [
    '/',
    '/profile/:path*',
    // Exclude API and authentication routes
    '/((?!api|auth|_next/static|favicon.ico).*)',
  ],
};
