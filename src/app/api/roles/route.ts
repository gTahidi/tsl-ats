export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { roles, permissions, rolePermissions } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { hasPermission, hasAnyPermission } from '@/lib/rbac';
import { requireCurrentAuthUser, isAuthResponse } from '@/lib/tenant';

export async function GET() {
  try {
    const authUser = await requireCurrentAuthUser();
    if (isAuthResponse(authUser)) return authUser;

    const canManageRoles = await hasAnyPermission(authUser.id, [
      { resource: 'roles', action: 'read' },
      { resource: 'users', action: 'create' },
      { resource: 'users', action: 'update' }
    ]);
    if (!canManageRoles) {
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
      .where(and(isNull(roles.deletedAt), eq(roles.organizationId, authUser.organizationId)));

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
    const authUser = await requireCurrentAuthUser();
    if (isAuthResponse(authUser)) return authUser;

    const hasCreatePermission = await hasPermission(authUser.id, { resource: 'roles', action: 'create' });
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
      .where(and(eq(roles.name, name), eq(roles.organizationId, authUser.organizationId)))
      .limit(1);

    if (existingRole.length > 0) {
      return NextResponse.json(
        { error: 'Role with this name already exists' },
        { status: 400 }
      );
    }

    const [newRole] = await db.insert(roles)
      .values({
        organizationId: authUser.organizationId,
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
