import { NextResponse } from 'next/server';
import { db } from '@/db';
import { jobPostings } from '@/db/schema';

export async function GET() {
  try {
    const jobs = await db.query.jobPostings.findMany({
      orderBy: (table, { desc }) => desc(table.createdAt),
      with: {
        processGroup: true,
        candidates: {
          with: {
            persona: true,
            steps: true,
          },
        },
      },
    });

    const serializableJobs = jobs.map(job => ({
      ...job,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
      processGroup: job.processGroup ? {
        ...job.processGroup,
        createdAt: job.processGroup.createdAt.toISOString(),
        updatedAt: job.processGroup.updatedAt.toISOString(),
        deletedAt: job.processGroup.deletedAt ? job.processGroup.deletedAt.toISOString() : null,
      } : null,
      candidates: job.candidates.map(candidate => ({
        ...candidate,
        createdAt: candidate.createdAt.toISOString(),
        updatedAt: candidate.updatedAt.toISOString(),
        deletedAt: candidate.deletedAt ? candidate.deletedAt.toISOString() : null,
        persona: candidate.persona ? {
          ...candidate.persona,
          createdAt: candidate.persona.createdAt.toISOString(),
          updatedAt: candidate.persona.updatedAt.toISOString(),
          deletedAt: candidate.persona.deletedAt ? candidate.persona.deletedAt.toISOString() : null,
        } : null,
        steps: candidate.steps.map(step => ({
          ...step,
          createdAt: step.createdAt.toISOString(),
          updatedAt: step.updatedAt.toISOString(),
          deletedAt: step.deletedAt ? step.deletedAt.toISOString() : null,
        }))
      }))
    }));

    return NextResponse.json(serializableJobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Build a clean and validated payload, explicitly handling dates
    const payload: Omit<typeof jobPostings.$inferInsert, 'id' | 'metadata'> = {
      title: body.title,
      description: body.description,
      linkedinUrl: body.linkedinUrl,
      status: body.status,
      processGroupId: body.processGroupId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const [job] = await db.insert(jobPostings).values(payload).returning();
    return NextResponse.json(job);
  } catch (error) {
    console.error('Error creating job:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to create job', details: errorMessage },
      { status: 500 }
    );
  }
}
