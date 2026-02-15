import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/helpers',
  '/tasks',
  '/skills',
  '/payments',
  '/payouts',
  '/ledger',
  '/audit',
  '/disputes',
  '/settings',
];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/register'];

// Role-based access control
const rolePermissions: Record<string, string[]> = {
  super_admin: ['*'],
  ops_manager: [
    '/dashboard',
    '/helpers',
    '/tasks',
    '/skills',
    '/disputes',
  ],
  support: [
    '/dashboard',
    '/helpers',
    '/tasks',
    '/disputes',
  ],
  finance: [
    '/dashboard',
    '/payments',
    '/payouts',
    '/ledger',
    '/audit',
  ],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  
  // Get tokens from cookies or localStorage
  const accessToken = request.cookies.get('accessToken')?.value || 
    (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
  
  const userRole = request.cookies.get('userRole')?.value ||
    (typeof window !== 'undefined' ? localStorage.getItem('userRole') : null);
  
  // Redirect to login if accessing protected route without token
  if (isProtectedRoute && !accessToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Redirect to dashboard if accessing auth routes while authenticated
  if (isAuthRoute && accessToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Role-based access control
  if (isProtectedRoute && accessToken && userRole) {
    const allowedRoutes = rolePermissions[userRole] || [];
    const hasAccess = allowedRoutes.includes('*') || 
      allowedRoutes.some(route => pathname.startsWith(route));
    
    if (!hasAccess) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/helpers/:path*',
    '/tasks/:path*',
    '/skills/:path*',
    '/payments/:path*',
    '/payouts/:path*',
    '/ledger/:path*',
    '/audit/:path*',
    '/disputes/:path*',
    '/settings/:path*',
    '/login',
    '/register',
  ],
};
