import { db } from '@/db';
import { jobPostings, candidates, processSteps, cvs, cvChunks } from '@/db/schema';
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
    
    // Use transaction to handle cascading deletes
    await db.transaction(async (tx) => {
      // Get all candidates for this job
      const jobCandidates = await tx.select({ id: candidates.id, cvId: candidates.cvId })
        .from(candidates)
        .where(eq(candidates.jobId, id));
      
      // Delete all related data for each candidate
      for (const candidate of jobCandidates) {
        // Delete process steps for this candidate
        await tx.delete(processSteps).where(eq(processSteps.candidateId, candidate.id));
        
        // Delete CV and CV chunks if they exist
        if (candidate.cvId) {
          // First, nullify the cvId to remove the foreign key reference
          await tx.update(candidates)
            .set({ cvId: null })
            .where(eq(candidates.id, candidate.id));
          
          // Now we can safely delete CV chunks and CV
          await tx.delete(cvChunks).where(eq(cvChunks.cvId, candidate.cvId));
          await tx.delete(cvs).where(eq(cvs.id, candidate.cvId));
        }
      }
      
      // Delete all candidates for this job
      await tx.delete(candidates).where(eq(candidates.jobId, id));
      
      // Finally, delete the job posting
      await tx.delete(jobPostings).where(eq(jobPostings.id, id));
    });

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
