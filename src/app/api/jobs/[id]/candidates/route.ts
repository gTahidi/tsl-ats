import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { candidates } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const jobId = params.id;

    const jobCandidates = await db.query.candidates.findMany({
      where: eq(candidates.jobId, jobId),
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
