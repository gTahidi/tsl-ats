import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/jwt';
import { trace } from '@opentelemetry/api';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth')?.value;
  const isLoginPage = request.nextUrl.pathname === '/login';
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');

  // Allow API routes to handle their own auth
  if (isApiRoute) {
    return NextResponse.next();
  }

  let isLoggedIn = false;
  if (token) {
    const user = await verifyJWT(token);
    isLoggedIn = !!user;
  }

  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL('/jobs', request.url));
  }

  const response = NextResponse.next();
  const current = trace.getActiveSpan();

  // set server-timing header with traceparent for Faro correlation
  if (current) {
    response.headers.set(
      'server-timing',
      `traceparent;desc="00-${current.spanContext().traceId}-${current.spanContext().spanId}-01"`
    );
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|images|favicon.ico).*)']
}
