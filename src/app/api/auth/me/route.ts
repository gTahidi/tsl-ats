import { NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt';
import { cookies } from 'next/headers';
import { getUserWithPermissions } from '@/lib/rbac';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const verifiedToken = await verifyJWT(token);
    if (!verifiedToken || !verifiedToken.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await getUserWithPermissions(verifiedToken.sub);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}