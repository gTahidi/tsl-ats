import { NextResponse } from 'next/server';
import { getCurrentAuthUser } from '@/lib/tenant';
import { withAPILogging, logDatabaseOperation } from '@/lib/api-middleware';

export const runtime = 'nodejs';

export const GET = withAPILogging<any>(async (request, context) => {
  context.logger.info('Authentication check requested', {
    'auth.token_present': !!request.headers.get('cookie')?.includes('auth='),
  });

  const dbLogger = logDatabaseOperation(context, 'select', 'users', {
    'auth.lookup': 'current_user',
  });

  dbLogger.info('Fetching user with permissions');
  const user = await getCurrentAuthUser();

  if (!user) {
    context.logger.warn('Authentication failed - user not found', {
      'auth.failure_reason': 'user_not_found',
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
