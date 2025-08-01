import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { candidates, jobPostings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { parseAndRankCvWithGemini } from '@/lib/gemini/cv-parser';
import { z } from 'zod';

const reassignJobSchema = z.object({
  newJobId: z.string().min(1, 'Job ID is required'),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: candidateId } = await params;
    const body = await req.json();
    
    const validatedData = reassignJobSchema.parse(body);
    const { newJobId } = validatedData;

    // 1. Get the candidate with CV and current job info
    const candidate = await db.query.candidates.findFirst({
      where: eq(candidates.id, candidateId),
      with: {
        cv: true,
        persona: true,
        job: true,
      },
    });

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    if (!candidate.cv?.fileUrl) {
      return NextResponse.json({ error: 'Candidate has no CV file to re-rank' }, { status: 400 });
    }

    // 2. Get the new job details
    const newJob = await db.query.jobPostings.findFirst({
      where: eq(jobPostings.id, newJobId),
    });

    if (!newJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // 3. Fetch CV file and re-run AI ranking
    const fileResponse = await fetch(candidate.cv.fileUrl);
    if (!fileResponse.ok) {
      return NextResponse.json({ error: 'Could not fetch CV file' }, { status: 500 });
    }

    const fileBuffer = await fileResponse.arrayBuffer();
    const file = new File(
      [fileBuffer], 
      candidate.cv.originalFilename || 'cv.pdf',
      { type: candidate.cv.mimeType || 'application/pdf' }
    );

    // 4. Re-run AI ranking against the new job
    const unifiedResult = await parseAndRankCvWithGemini(file, newJob);
    const { ranking } = unifiedResult;

    // 5. Update candidate with new job and rating
    await db
      .update(candidates)
      .set({
        jobId: newJobId,
        rating: ranking,
        updatedAt: new Date(),
      })
      .where(eq(candidates.id, candidateId));

    return NextResponse.json({
      success: true,
      message: `Candidate reassigned to "${newJob.title}" and re-ranked`,
      newJobTitle: newJob.title,
      newRating: ranking,
    });

  } catch (error) {
    console.error('Error reassigning candidate:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to reassign candidate', details: errorMessage }, { status: 500 });
  }
}
