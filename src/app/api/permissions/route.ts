export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { permissions } from '@/db/schema';
import { eq, isNull } from 'drizzle-orm';
import { hasPermission } from '@/lib/rbac';
import { verifyJWT } from '@/lib/jwt';
import { cookies } from 'next/headers';

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth')?.value;
  if (!token) return null;
  return verifyJWT(token);
}

export async function GET() {
  try {
    const verifiedToken = await getAuthUser();
    if (!verifiedToken || !verifiedToken.sub) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const hasReadPermission = await hasPermission(verifiedToken.sub, { resource: 'roles', action: 'read' });
    if (!hasReadPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const allPermissions = await db
      .select()
      .from(permissions)
      .where(isNull(permissions.deletedAt))
      .orderBy(permissions.resource, permissions.action);

    return NextResponse.json({ permissions: allPermissions });
  } catch (error) {
    console.error('Get permissions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}