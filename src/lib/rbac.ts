import { db } from '@/db';
import { users, roles, permissions, userRoles, rolePermissions } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { AuthUser, PermissionCheck } from '@/types';
import bcrypt from 'bcryptjs';




// Default permissions for the system
export const DEFAULT_PERMISSIONS = [
  // Jobs
  { name: 'jobs:create', resource: 'jobs', action: 'create', description: 'Create new job postings' },
  { name: 'jobs:read', resource: 'jobs', action: 'read', description: 'View job postings' },
  { name: 'jobs:update', resource: 'jobs', action: 'update', description: 'Update job postings' },
  { name: 'jobs:delete', resource: 'jobs', action: 'delete', description: 'Delete job postings' },
  
  // Candidates
  { name: 'candidates:create', resource: 'candidates', action: 'create', description: 'Add new candidates' },
  { name: 'candidates:read', resource: 'candidates', action: 'read', description: 'View candidates' },
  { name: 'candidates:update', resource: 'candidates', action: 'update', description: 'Update candidate information' },
  { name: 'candidates:delete', resource: 'candidates', action: 'delete', description: 'Delete candidates' },
  
  // Personas
  { name: 'personas:create', resource: 'personas', action: 'create', description: 'Create new personas' },
  { name: 'personas:read', resource: 'personas', action: 'read', description: 'View personas' },
  { name: 'personas:update', resource: 'personas', action: 'update', description: 'Update personas' },
  { name: 'personas:delete', resource: 'personas', action: 'delete', description: 'Delete personas' },
  
  // Process Groups
  { name: 'process-groups:create', resource: 'process-groups', action: 'create', description: 'Create process groups' },
  { name: 'process-groups:read', resource: 'process-groups', action: 'read', description: 'View process groups' },
  { name: 'process-groups:update', resource: 'process-groups', action: 'update', description: 'Update process groups' },
  { name: 'process-groups:delete', resource: 'process-groups', action: 'delete', description: 'Delete process groups' },
  
  // Users (Admin only)
  { name: 'users:create', resource: 'users', action: 'create', description: 'Create new users' },
  { name: 'users:read', resource: 'users', action: 'read', description: 'View users' },
  { name: 'users:update', resource: 'users', action: 'update', description: 'Update user information' },
  { name: 'users:delete', resource: 'users', action: 'delete', description: 'Delete users' },
  
  // Roles (Admin only)
  { name: 'roles:create', resource: 'roles', action: 'create', description: 'Create new roles' },
  { name: 'roles:read', resource: 'roles', action: 'read', description: 'View roles' },
  { name: 'roles:update', resource: 'roles', action: 'update', description: 'Update roles' },
  { name: 'roles:delete', resource: 'roles', action: 'delete', description: 'Delete roles' },
];

// Default roles
export const DEFAULT_ROLES = [
  {
    name: 'admin',
    description: 'Full system access',
    isSystem: true,
    permissions: DEFAULT_PERMISSIONS.map(p => p.name),
  },
  {
    name: 'hr_manager',
    description: 'HR Manager with full candidate and job management access',
    isSystem: true,
    permissions: [
      'jobs:create', 'jobs:read', 'jobs:update', 'jobs:delete',
      'candidates:create', 'candidates:read', 'candidates:update', 'candidates:delete',
      'personas:create', 'personas:read', 'personas:update', 'personas:delete',
      'process-groups:create', 'process-groups:read', 'process-groups:update', 'process-groups:delete',
    ],
  },
  {
    name: 'recruiter',
    description: 'Recruiter with candidate management access',
    isSystem: true,
    permissions: [
      'jobs:read',
      'candidates:create', 'candidates:read', 'candidates:update',
      'personas:create', 'personas:read', 'personas:update',
      'process-groups:read',
    ],
  },
  {
    name: 'viewer',
    description: 'Read-only access to jobs and candidates',
    isSystem: true,
    permissions: [
      'jobs:read',
      'candidates:read',
      'personas:read',
      'process-groups:read',
    ],
  },
];

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}



export async function getUserWithPermissions(userId: string): Promise<AuthUser | null> {
  const userWithRoles = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      roleName: roles.name,
      permissionName: permissions.name,
    })
    .from(users)
    .leftJoin(userRoles, eq(users.id, userRoles.userId))
    .leftJoin(roles, eq(userRoles.roleId, roles.id))
    .leftJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
    .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(and(eq(users.id, userId), eq(users.isActive, 'true')));

  if (!userWithRoles.length) return null;

  const user = userWithRoles[0];
  const roleSet = new Set<string>();
  const permissionSet = new Set<string>();

  userWithRoles.forEach(row => {
    if (row.roleName) roleSet.add(row.roleName);
    if (row.permissionName) permissionSet.add(row.permissionName);
  });

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    roles: Array.from(roleSet),
    permissions: Array.from(permissionSet),
  };
}

export async function hasPermission(userId: string, check: PermissionCheck): Promise<boolean> {
  const user = await getUserWithPermissions(userId);
  if (!user) return false;
  
  const permissionName = `${check.resource}:${check.action}`;
  return user.permissions.includes(permissionName);
}

export async function hasAnyPermission(userId: string, checks: PermissionCheck[]): Promise<boolean> {
  const user = await getUserWithPermissions(userId);
  if (!user) return false;
  
  return checks.some(check => {
    const permissionName = `${check.resource}:${check.action}`;
    return user.permissions.includes(permissionName);
  });
}

export async function hasRole(userId: string, roleName: string): Promise<boolean> {
  const user = await getUserWithPermissions(userId);
  if (!user) return false;
  
  return user.roles.includes(roleName);
}

export async function initializeRBAC(): Promise<void> {
  // Create default permissions
  for (const perm of DEFAULT_PERMISSIONS) {
    await db.insert(permissions)
      .values(perm)
      .onConflictDoNothing();
  }

  // Create default roles
  for (const roleData of DEFAULT_ROLES) {
    const [role] = await db.insert(roles)
      .values({
        name: roleData.name,
        description: roleData.description,
        isSystem: roleData.isSystem ? 'true' : 'false',
      })
      .onConflictDoNothing()
      .returning();

    if (role) {
      // Get permission IDs
      const permissionIds = await db
        .select({ id: permissions.id })
        .from(permissions)
        .where(inArray(permissions.name, roleData.permissions));

      // Assign permissions to role
      for (const perm of permissionIds) {
        await db.insert(rolePermissions)
          .values({
            roleId: role.id,
            permissionId: perm.id,
          })
          .onConflictDoNothing();
      }
    }
  }
}