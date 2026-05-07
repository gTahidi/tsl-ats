import 'server-only';

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt';
import { getUserWithPermissions } from '@/lib/rbac';
import type { AuthUser } from '@/types';

export async function getCurrentAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth')?.value;
  if (!token) return null;

  const verifiedToken = await verifyJWT(token);
  if (!verifiedToken?.sub) return null;

  return getUserWithPermissions(String(verifiedToken.sub));
}

export async function requireCurrentAuthUser(): Promise<AuthUser | NextResponse> {
  const user = await getCurrentAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  return user;
}

export function isAuthResponse(value: AuthUser | NextResponse): value is NextResponse {
  return value instanceof NextResponse;
}
