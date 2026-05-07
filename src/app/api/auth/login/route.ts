import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyPassword, getUserWithPermissions } from '@/lib/rbac';
import { createJWT } from '@/lib/jwt';
import { withAPILogging, logDatabaseOperation } from '@/lib/api-middleware';

export const POST = withAPILogging<any>(async (request, context) => {
  const body = await request.json();
  const { email, password } = body;

  // Log login attempt (without sensitive data)
  context.logger.info('Login attempt received', {
    'auth.email_provided': !!email,
    'auth.password_provided': !!password,
    'auth.email_domain': email ? email.split('@')[1] : undefined,
  });

  if (!email || !password) {
    context.logger.warn('Login failed - missing credentials', {
      'auth.failure_reason': 'missing_credentials',
    });
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 }
    );
  }

  const dbLogger = logDatabaseOperation(context, 'select', 'users', {
    'auth.lookup_by': 'email',
  });

  // Find user by email
  dbLogger.info('Looking up user by email');
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email), eq(users.isActive, 'true')))
    .limit(1);

  if (!user) {
    context.logger.warn('Login failed - user not found or inactive', {
      'auth.failure_reason': 'user_not_found',
      'auth.email_domain': email.split('@')[1],
    });
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }

  dbLogger.info('User found, verifying password');

  // Verify password
  const isValidPassword = await verifyPassword(password, user.passwordHash);
  if (!isValidPassword) {
    context.logger.warn('Login failed - invalid password', {
      'auth.failure_reason': 'invalid_password',
      'auth.user_id': user.id,
    });
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }

  dbLogger.info('Password verified, fetching user permissions');

  // Get user with permissions
  const authUser = await getUserWithPermissions(user.id);
  if (!authUser) {
    context.logger.warn('Login failed - user permissions not found', {
      'auth.failure_reason': 'permissions_not_found',
      'auth.user_id': user.id,
    });
    return NextResponse.json(
      { error: 'User not found or inactive' },
      { status: 401 }
    );
  }

  const updateLogger = logDatabaseOperation(context, 'update', 'users', {
    'auth.user_id': user.id,
  });

  // Update last login
  updateLogger.info('Updating user last login timestamp');
  await db
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, user.id));

  // Create JWT token
  context.logger.info('Generating JWT token for authenticated user');
  const token = await createJWT(authUser);

  context.logger.info('Login successful', {
    'auth.success': true,
    'auth.user_id': authUser.id,
    'auth.user_roles': JSON.stringify(authUser.roles),
    'auth.duration_ms': Date.now() - context.startTime,
  });

  const response = NextResponse.json(
    {
      success: true,
      user: {
        id: authUser.id,
        organizationId: authUser.organizationId,
        email: authUser.email,
        firstName: authUser.firstName,
        lastName: authUser.lastName,
        roles: authUser.roles,
        organization: authUser.organization,
      }
    },
    { status: 200 }
  );

  response.cookies.set('auth', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  return response;
}, { operation: 'user_login' });
