import { NextResponse } from 'next/server';
import { requireCurrentAuthUser, isAuthResponse } from '@/lib/tenant';

export async function POST(request: Request) {
  const authUser = await requireCurrentAuthUser();
  if (isAuthResponse(authUser)) return authUser;

  const body = await request.json().catch(() => ({}));
  const requestedPlan = typeof body.plan === 'string' ? body.plan : 'starter';

  return NextResponse.json({
    provider: 'stub',
    status: 'ready_for_provider_integration',
    organizationId: authUser.organizationId,
    plan: requestedPlan,
    checkoutUrl: process.env.BILLING_CHECKOUT_URL || null,
    message: 'Billing checkout is stubbed. Wire this endpoint to Stripe, Paddle, or the selected provider.',
  });
}
