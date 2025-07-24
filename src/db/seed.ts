import 'dotenv/config';
import { db } from '.';
import * as schema from './schema';
import { drizzle } from 'drizzle-orm/node-postgres';
import { hashPassword } from '../lib/rbac';
import { Pool } from 'pg';

if (!process.env.POSTGRES_URL_NON_POOLING) {
  throw new Error('POSTGRES_URL_NON_POOLING is not set in the environment variables.');
}

const main = async () => {
  const client = new Pool({
    connectionString: process.env.POSTGRES_URL_NON_POOLING,
  });
  const db = drizzle(client, { schema });

  console.log('Seeding database...');

  // Define Roles
  const allRoles = [
    { name: 'ADMIN', description: 'System administrator with all permissions.' },
    { name: 'HR', description: 'HR manager with access to all recruitment features.' },
    { name: 'HIRING_MANAGER', description: 'Manager with access to specific jobs and candidates.' },
  ];

  // Define Permissions (Resource:Action)
  const allPermissions = [
    // Jobs
    { name: 'jobs:create', resource: 'jobs', action: 'create' },
    { name: 'jobs:read', resource: 'jobs', action: 'read' },
    { name: 'jobs:update', resource: 'jobs', action: 'update' },
    { name: 'jobs:delete', resource: 'jobs', action: 'delete' },
    // Personas
    { name: 'personas:read', resource: 'personas', action: 'read' },
    { name: 'personas:create', resource: 'personas', action: 'create' },
    // Candidates
    { name: 'candidates:read', resource: 'candidates', action: 'read' },
    { name: 'candidates:create', resource: 'candidates', action: 'create' },
    // CV Upload
    { name: 'cv:upload', resource: 'cv', action: 'upload' },
    // Process Groups
    { name: 'process_groups:read', resource: 'process_groups', action: 'read' },
    { name: 'process_groups:create', resource: 'process_groups', action: 'create' },
    // Legacy Candidates
    { name: 'legacy_candidates:read', resource: 'legacy_candidates', action: 'read' },
    // Referees
    { name: 'referees:read', resource: 'referees', action: 'read' },
    // User Management
    { name: 'users:manage', resource: 'users', action: 'manage' },
  ];

  // Role to Permission Mapping
  const rolePermissionMapping = {
    ADMIN: allPermissions.map(p => p.name),
    HR: allPermissions.filter(p => p.resource !== 'users').map(p => p.name),
    HIRING_MANAGER: [
      'jobs:read',
      'candidates:read',
      'legacy_candidates:read',
      'referees:read',
    ],
  };

  // Insert Roles
  console.log('Inserting roles...');
  await db.insert(schema.roles).values(allRoles).onConflictDoNothing();
  const dbRoles = await db.query.roles.findMany();

  // Insert Permissions
  console.log('Inserting permissions...');
  await db.insert(schema.permissions).values(allPermissions).onConflictDoNothing();
  const dbPermissions = await db.query.permissions.findMany();

  // Insert Role-Permission Links
  console.log('Linking roles to permissions...');
  const rolePermissionsToInsert = [];
  for (const role of dbRoles) {
    const permissionsForRole = rolePermissionMapping[role.name as keyof typeof rolePermissionMapping] || [];
    for (const permissionName of permissionsForRole) {
      const permission = dbPermissions.find(p => p.name === permissionName);
      if (permission) {
        rolePermissionsToInsert.push({ roleId: role.id, permissionId: permission.id });
      }
    }
  }
    if (rolePermissionsToInsert.length > 0) {
    await db.insert(schema.rolePermissions).values(rolePermissionsToInsert).onConflictDoNothing();
  }

  // Create Test Users
  console.log('Creating test users...');
  const hashedPassword = await hashPassword('password');
  const testUsers = [
    {
      email: 'admin@test.com',
      passwordHash: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
    },
    {
      email: 'hr@test.com',
      passwordHash: hashedPassword,
      firstName: 'HR',
      lastName: 'User',
      role: 'HR',
    },
    {
      email: 'manager@test.com',
      passwordHash: hashedPassword,
      firstName: 'Manager',
      lastName: 'User',
      role: 'HIRING_MANAGER',
    },
  ];

  for (const userData of testUsers) {
    const { role, ...userToInsert } = userData;
    const [newUser] = await db.insert(schema.users).values(userToInsert).onConflictDoNothing().returning();
    
    if (newUser) {
      const dbRole = dbRoles.find(r => r.name === role);
      if (dbRole) {
        await db.insert(schema.userRoles).values({ userId: newUser.id, roleId: dbRole.id }).onConflictDoNothing();
      }
    }
  }

  console.log('Seeding complete!');
  await client.end();
};

main().catch((error) => {
  console.error('Error seeding database:', error);
  process.exit(1);
});
