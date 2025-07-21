import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { candidates, processSteps } from '@/db/schema';
import { createCandidateWithInitialStep } from '@/utils/candidate-creation';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('jobId');

    const allCandidates = await db.query.candidates.findMany({
      where: jobId ? eq(candidates.jobId, jobId) : undefined,
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
    const responseData = allCandidates.map(c => ({
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
    console.error('Error fetching candidates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch candidates' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const newCandidate = await db.transaction(async (tx) => {
      return createCandidateWithInitialStep(tx, {
        jobId: data.jobId,
        personaId: data.personaId,
        notes: data.notes,
        source: data.source,
        rating: data.rating,
        metadata: data.metadata,
        cvId: data.cvId,
      });
    });

    return NextResponse.json(newCandidate);
  } catch (error) {
    console.error('Error creating candidate:', error);
    return NextResponse.json(
      { error: 'Failed to create candidate' },
      { status: 500 }
    );
  }
}
