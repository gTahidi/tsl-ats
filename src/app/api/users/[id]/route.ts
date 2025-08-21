import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/db';
import { users, userRoles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyJWT } from '@/lib/jwt';
import { AuthUser } from '@/types';

async function getAuthenticatedUser(request: NextRequest): Promise<AuthUser | null> {
  const token = request.cookies.get('auth')?.value;
  if (!token) return null;

  const verifiedPayload = await verifyJWT(token);
  if (!verifiedPayload) return null;

  // A basic check for admin role, you might have a more complex permission system
  const user = verifiedPayload as unknown as AuthUser;
  if (!user.roles.includes('ADMIN')) {
      return null; // Or handle unauthorized access more specifically
  }

  return user;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authenticatedUser = await getAuthenticatedUser(request);
  if (!authenticatedUser) {
    return NextResponse.json({ error: 'Unauthorized or insufficient permissions' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  try {
    // Update basic user info
    const { firstName, lastName, isActive, roleIds } = body;
    await db.update(users)
      .set({
        firstName,
        lastName,
        isActive: isActive.toString(),
      })
      .where(eq(users.id, id));

    // Handle roles update
    if (roleIds && Array.isArray(roleIds)) {
      // First, remove existing roles for the user
      await db.delete(userRoles).where(eq(userRoles.userId, id));
      // Then, add the new roles
      const rolesToInsert = roleIds.map(roleId => ({
        userId: id,
        roleId: roleId,
      }));
      if (rolesToInsert.length > 0) {
        await db.insert(userRoles).values(rolesToInsert);
      }
    }

    return NextResponse.json({ message: 'User updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('API Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authenticatedUser = await getAuthenticatedUser(request);
  if (!authenticatedUser) {
    return NextResponse.json({ error: 'Unauthorized or insufficient permissions' }, { status: 401 });
  }

  const { id } = await params;

  // Prevent a user from deleting themselves
  if (authenticatedUser.id === id) {
    return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 400 });
  }

  try {
    const result = await db
      .update(users)
      .set({ isActive: 'false', deletedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User deactivated successfully' }, { status: 200 });
  } catch (error) {
    console.error('API Error deactivating user:', error);
    return NextResponse.json({ error: 'Failed to deactivate user' }, { status: 500 });
  }
}
