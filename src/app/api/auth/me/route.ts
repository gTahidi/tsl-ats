import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt';
import { cookies } from 'next/headers';
import { getUserWithPermissions } from '@/lib/rbac';
import { withAPILogging, logDatabaseOperation } from '@/lib/api-middleware';

export const runtime = 'nodejs';

export const GET = withAPILogging<any>(async (request, context) => {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth')?.value;

  context.logger.info('Authentication check requested', {
    'auth.token_present': !!token,
  });

  if (!token) {
    context.logger.warn('Authentication failed - no token provided', {
      'auth.failure_reason': 'no_token',
    });
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  context.logger.info('Verifying JWT token');
  const verifiedToken = await verifyJWT(token);
  
  if (!verifiedToken || !verifiedToken.sub) {
    context.logger.warn('Authentication failed - invalid token', {
      'auth.failure_reason': 'invalid_token',
      'auth.token_has_sub': !!verifiedToken?.sub,
    });
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const dbLogger = logDatabaseOperation(context, 'select', 'users', {
    'auth.user_id': verifiedToken.sub,
  });

  dbLogger.info('Fetching user with permissions');
  const user = await getUserWithPermissions(verifiedToken.sub);

  if (!user) {
    context.logger.warn('Authentication failed - user not found', {
      'auth.failure_reason': 'user_not_found',
      'auth.user_id': verifiedToken.sub,
    });
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  context.logger.info('User authentication successful', {
    'auth.success': true,
    'auth.user_id': user.id,
    'auth.user_email': user.email,
    'auth.duration_ms': Date.now() - context.startTime,
  });

  return NextResponse.json({ user });
}, { operation: 'get_current_user' });