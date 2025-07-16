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
    const data = await request.json();
    // Assuming data is a valid NewJobPosting object
    const [job] = await db.insert(jobPostings).values(data).returning();
    return NextResponse.json(job);
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    );
  }
}
