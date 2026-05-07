import { NextResponse } from 'next/server';
import { db } from '@/db';
import { organizationSubscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireCurrentAuthUser, isAuthResponse } from '@/lib/tenant';

export async function GET() {
  const authUser = await requireCurrentAuthUser();
  if (isAuthResponse(authUser)) return authUser;

  const subscription = await db.query.organizationSubscriptions.findFirst({
    where: eq(organizationSubscriptions.organizationId, authUser.organizationId),
  });

  return NextResponse.json({
    organization: authUser.organization,
    subscription: subscription ?? {
      provider: 'stub',
      plan: authUser.organization.subscriptionPlan,
      status: authUser.organization.subscriptionStatus,
      currentPeriodEndsAt: null,
      cancelAtPeriodEnd: false,
    },
  });
}
