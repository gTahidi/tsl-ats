import { db } from '../src/db';
import { users, roles, userRoles } from '../src/db/schema';
import { initializeRBAC, hashPassword } from '../src/lib/rbac';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('Initializing RBAC system...');
  
  // Initialize permissions and roles
  await initializeRBAC();
  console.log('✅ Default permissions and roles created');

  // Create default admin user if it doesn't exist
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin';

  const existingAdmin = await db
    .select()
    .from(users)
    .where(eq(users.email, adminEmail))
    .limit(1);

  if (existingAdmin.length === 0) {
    const passwordHash = await hashPassword(adminPassword);
    
    const [newUser] = await db.insert(users)
      .values({
        email: adminEmail,
        passwordHash,
        firstName: 'System',
        lastName: 'Administrator',
        isActive: 'true',
      })
      .returning();

    // Assign admin role
    const [adminRole] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, 'admin'))
      .limit(1);

    if (adminRole) {
      await db.insert(userRoles)
        .values({
          userId: newUser.id,
          roleId: adminRole.id,
        });
    }

    console.log(`✅ Admin user created: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
  } else {
    console.log('✅ Admin user already exists');
  }

  console.log('RBAC initialization complete!');
}

main().catch(console.error);