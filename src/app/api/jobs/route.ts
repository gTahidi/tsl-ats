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
    return NextResponse.json(jobs);
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
      // Explicitly set closingDate to null if it's not a valid string
      closingDate: (body.closingDate && typeof body.closingDate === 'string') 
        ? new Date(body.closingDate) 
        : null,
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
