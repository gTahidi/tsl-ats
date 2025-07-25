export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { roles, permissions, rolePermissions } from '@/db/schema';
import { eq, inArray, isNull } from 'drizzle-orm';
import { hasPermission, hasAnyPermission } from '@/lib/rbac';
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

    const allRoles = await db
      .select({
        id: roles.id,
        name: roles.name,
        description: roles.description,
        isSystem: roles.isSystem,
        createdAt: roles.createdAt,
        updatedAt: roles.updatedAt,
        permissionName: permissions.name,
      })
      .from(roles)
      .leftJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
      .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(isNull(roles.deletedAt));

    // Group roles with their permissions
    const roleMap = new Map();
    allRoles.forEach(row => {
      if (!roleMap.has(row.id)) {
        roleMap.set(row.id, {
          id: row.id,
          name: row.name,
          description: row.description,
          isSystem: row.isSystem === 'true',
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          permissions: [],
        });
      }
      if (row.permissionName) {
        roleMap.get(row.id).permissions.push(row.permissionName);
      }
    });

    return NextResponse.json({ roles: Array.from(roleMap.values()) });
  } catch (error) {
    console.error('Get roles error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const hasCreatePermission = await hasPermission(authUser.id as string, { resource: 'roles', action: 'create' });
    if (!hasCreatePermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, permissionIds } = body;

    if (!name) {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 });
    }

    // Check if role already exists
    const existingRole = await db
      .select()
      .from(roles)
      .where(eq(roles.name, name))
      .limit(1);

    if (existingRole.length > 0) {
      return NextResponse.json(
        { error: 'Role with this name already exists' },
        { status: 400 }
      );
    }

    const [newRole] = await db.insert(roles)
      .values({
        name,
        description,
        isSystem: 'false',
      })
      .returning();

    // Assign permissions if provided
    if (permissionIds && permissionIds.length > 0) {
      const permissionAssignments = permissionIds.map((permissionId: string) => ({
        roleId: newRole.id,
        permissionId,
      }));

      await db.insert(rolePermissions).values(permissionAssignments);
    }

    return NextResponse.json({ 
      role: {
        id: newRole.id,
        name: newRole.name,
        description: newRole.description,
        isSystem: newRole.isSystem === 'true',
        createdAt: newRole.createdAt,
        updatedAt: newRole.updatedAt,
      }
    });
  } catch (error) {
    console.error('Create role error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}