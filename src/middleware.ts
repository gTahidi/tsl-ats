import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAuthenticated } from './lib/auth';

const publicPaths = ['/login'];

export function middleware(request: NextRequest) {
  const isAuthOk = isAuthenticated(request);
  const isPublicPath = publicPaths.includes(request.nextUrl.pathname);

  if (!isAuthOk && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthOk && isPublicPath) {
    return NextResponse.redirect(new URL('/candidates', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
