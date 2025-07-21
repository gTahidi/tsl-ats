import { db } from '@/db';
import { jobPostings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = await db.query.jobPostings.findFirst({
      where: eq(jobPostings.id, id),
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

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to fetch job', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Build a clean and validated payload to prevent bad data
    const updatePayload: { [key: string]: any } = {
      updatedAt: new Date(),
    };

    if (body.title) updatePayload.title = body.title;
    if (body.description) updatePayload.description = body.description;
    if (body.linkedinUrl) updatePayload.linkedinUrl = body.linkedinUrl;
    if (body.status) updatePayload.status = body.status;
    if (body.processGroupId) updatePayload.processGroupId = body.processGroupId;
    if (body.closingDate) {
      updatePayload.closingDate = new Date(body.closingDate);
    }

    const [updatedJob] = await db
      .update(jobPostings)
      .set(updatePayload)
      .where(eq(jobPostings.id, id))
      .returning();

    if (!updatedJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json(updatedJob);
  } catch (error) {
    console.error('Error updating job:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to update job', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.delete(jobPostings).where(eq(jobPostings.id, id));

    return NextResponse.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to delete job', details: errorMessage },
      { status: 500 }
    );
  }
}
