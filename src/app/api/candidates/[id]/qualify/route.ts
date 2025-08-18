import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { candidates } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { qualified } = await request.json();
    const { id: candidateId } = await context.params;

    if (typeof qualified !== 'boolean') {
      return NextResponse.json(
        { error: 'qualified field must be a boolean' },
        { status: 400 }
      );
    }

    const [updatedCandidate] = await db
      .update(candidates)
      .set({ qualified, updatedAt: new Date() })
      .where(eq(candidates.id, candidateId))
      .returning();

    if (!updatedCandidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    // New behavior: Do NOT auto-create interviews or Cal.com bookings here.
    // Scheduling will be handled separately via the scheduling UI using /api/slots and booking endpoints.
    return NextResponse.json(updatedCandidate);
  } catch (error) {
    console.error('Error updating candidate qualification:', error);
    return NextResponse.json(
      {
        error: 'Failed to update candidate qualification',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}