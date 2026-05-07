import { NextResponse } from 'next/server';
import { requireCurrentAuthUser, isAuthResponse } from '@/lib/tenant';

export async function POST() {
  const authUser = await requireCurrentAuthUser();
  if (isAuthResponse(authUser)) return authUser;

  return NextResponse.json({
    provider: 'stub',
    status: 'ready_for_provider_integration',
    organizationId: authUser.organizationId,
    portalUrl: process.env.BILLING_PORTAL_URL || null,
    message: 'Billing portal is stubbed. Return the provider-hosted customer portal URL here.',
  });
}
