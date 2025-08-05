import { db } from '@/db';
import { jobPostings, candidates, processSteps, cvs, cvChunks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { uploadFile } from '@/lib/azure-storage';
import { extractTextWithGemini } from '@/lib/gemini/text-extractor';

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
    const formData = await request.formData();

    const updatePayload: { [key: string]: any } = {
      updatedAt: new Date(),
    };

    if (formData.has('title')) updatePayload.title = formData.get('title');
    if (formData.has('description')) updatePayload.description = formData.get('description');
    if (formData.has('linkedinUrl')) updatePayload.linkedinUrl = formData.get('linkedinUrl');
    if (formData.has('status')) updatePayload.status = formData.get('status');
    if (formData.has('processGroupId')) updatePayload.processGroupId = formData.get('processGroupId');
    if (formData.has('closingDate')) {
      updatePayload.closingDate = new Date(formData.get('closingDate') as string);
    }

    const jdFile = formData.get('jdFile') as File | null;

    if (jdFile) {
      const jdFileUrl = await uploadFile(jdFile);
            const jdText = await extractTextWithGemini(jdFile);

      updatePayload.jdFileUrl = jdFileUrl;
      if (jdText) {
        updatePayload.jdText = jdText;
      }
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
