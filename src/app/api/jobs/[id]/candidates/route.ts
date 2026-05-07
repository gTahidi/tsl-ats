import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { candidates, personas } from '@/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { requireCurrentAuthUser, isAuthResponse } from '@/lib/tenant';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: jobId } = await params;
    const authUser = await requireCurrentAuthUser();
    if (isAuthResponse(authUser)) return authUser;

    const searchParams = req.nextUrl.searchParams;
    const location = searchParams.get('location') || undefined;

    const filters = [
      eq(candidates.jobId, jobId),
      eq(candidates.organizationId, authUser.organizationId),
    ] as any[];

    if (location) {
      const personaRows = await db
        .select({ id: personas.id })
        .from(personas)
        .where(and(
          eq(personas.location, location),
          eq(personas.organizationId, authUser.organizationId),
        ));
      const personaIds = personaRows.map((p) => p.id);
      if (personaIds.length === 0) {
        return NextResponse.json([]);
      }
      filters.push(inArray(candidates.personaId, personaIds));
    }

    const whereClause = filters.length ? and(...filters) : undefined;

    const jobCandidates = await db.query.candidates.findMany({
      where: whereClause,
      with: {
        persona: true,
        job: true,
        steps: {
          with: {
            template: true,
          },
        },
      },
      orderBy: (table, { desc }) => desc(table.createdAt),
    });

    // Manually construct the response to ensure all relations are included
    const responseData = jobCandidates.map(c => ({
      ...c,
      persona: c.persona,
      job: c.job,
      steps: c.steps.map(s => ({
        ...s,
        template: s.template,
      })),
    }));

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching candidates for job:', error);
    return NextResponse.json(
      { error: 'Failed to fetch candidates for job' },
      { status: 500 }
    );
  }
}
