import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const AUTH_COOKIE = 'ats-auth';
const AUTH_PASSWORD = process.env.AUTH_PASSWORD || 'admin';

export async function validatePassword(password: string): Promise<boolean> {
  return password === AUTH_PASSWORD;
}

export async function setAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
}

export function isAuthenticated(request: NextRequest): boolean {
  return request.cookies.get(AUTH_COOKIE)?.value === 'authenticated';
}
