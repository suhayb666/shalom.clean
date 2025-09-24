import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const { pathname } = request.nextUrl;

  // List of unprotected routes (auth pages and auth API routes)
  const unprotectedRoutes = [
    '/', // Allow root page
    '/auth',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/logout',
    '/api/migrate',
    '/api/migrate-add-position', // Assuming this is still needed as a migration route
    '/api/migrate-add-schedule-date',
    '/api/migrate-schedules',
    '/api/migrate-shifts',
    '/api/migrate-unavailabilities',
    '/api/migrate-schedules-employee-id-status', // New migration route
    '/api/migrate-employee-requests', // New migration route
    '/api/seed',
    '/api/test-db',
    '/api/test-prisma',
  ];

  // If accessing an unprotected route, allow it
  if (unprotectedRoutes.includes(pathname) || pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // Attempt to verify the token
  let isAuthenticated = false;
  if (token) {
    try {
      jwt.verify(token, JWT_SECRET);
      isAuthenticated = true;
    } catch (error) {
      console.error("Token verification failed:", error);
      // Token is invalid, treat as unauthenticated
      isAuthenticated = false;
    }
  }

  // If not authenticated and trying to access a protected route, redirect to login
  if (!isAuthenticated && pathname !== '/auth') {
    const url = request.nextUrl.clone();
    url.pathname = '/auth';
    // Clear the token cookie to ensure a clean state
    const response = NextResponse.redirect(url);
    response.cookies.set('auth-token', '', { maxAge: 0, path: '/' });
    return response;
  }

  // If authenticated, allow the request to proceed
  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*) ',
  ],
};
