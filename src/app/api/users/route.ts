export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, userRoles, roles } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { hashPassword, hasPermission } from '@/lib/rbac';
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
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const canManageUsers = await hasPermission(authUser.id as string, { resource: 'users', action: 'manage' });
    if (!canManageUsers) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        roleName: roles.name,
      })
      .from(users)
      .leftJoin(userRoles, eq(users.id, userRoles.userId))
      .leftJoin(roles, eq(userRoles.roleId, roles.id))
      .where(isNull(users.deletedAt));

    // Group users with their roles
    const userMap = new Map();
    allUsers.forEach(row => {
      if (!userMap.has(row.id)) {
        userMap.set(row.id, {
          id: row.id,
          email: row.email,
          firstName: row.firstName,
          lastName: row.lastName,
          isActive: row.isActive === 'true',
          lastLoginAt: row.lastLoginAt,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          roles: [],
        });
      }
      if (row.roleName) {
        userMap.get(row.id).roles.push(row.roleName);
      }
    });

    return NextResponse.json({ users: Array.from(userMap.values()) });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const canManageUsers = await hasPermission(authUser.id as string, { resource: 'users', action: 'manage' });
    if (!canManageUsers) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, firstName, lastName, roleIds } = body;

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Email, password, firstName, and lastName are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    const [newUser] = await db.insert(users)
      .values({
        email,
        passwordHash,
        firstName,
        lastName,
        isActive: 'true',
      })
      .returning();

    // Assign roles if provided
    if (roleIds && roleIds.length > 0) {
      const roleAssignments = roleIds.map((roleId: string) => ({
        userId: newUser.id,
        roleId,
        assignedBy: authUser.id,
      }));

      await db.insert(userRoles).values(roleAssignments);
    }

    return NextResponse.json({ 
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        isActive: newUser.isActive === 'true',
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}