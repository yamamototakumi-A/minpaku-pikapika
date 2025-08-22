import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/role-selection',
  '/company-register',
  '/individual-register', 
  '/client-register',
  '/login'
]

// Define protected dashboard routes that require authentication
const protectedRoutes = [
  '/hq-dashboard',
  '/branch-dashboard',
  '/staff-dashboard',
  '/client-dashboard'
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )
  
  // For now, allow access to all routes and let client-side authentication handle protection
  // This prevents the middleware from blocking authenticated users
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
