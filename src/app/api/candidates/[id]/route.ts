import { db } from '@/db';
import { candidates, cvs, cvChunks, processSteps, referees } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const candidate = await db.query.candidates.findFirst({
      where: eq(candidates.id, id),
      with: {
        persona: true,
        job: {
          with: {
            processGroup: {
              with: {
                stepTemplates: true,
              },
            },
          },
        },
        steps: {
          with: {
            template: true,
          },
        },
      },
    });

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(candidate);
  } catch (error) {
    console.error('Error fetching candidate:', error);
    return NextResponse.json(
      { error: 'Failed to fetch candidate' },
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
    const { currentStep, ...data } = await request.json();

    const updatedCandidate = await db.transaction(async (tx) => {
      if (currentStep) {
        const stepId = currentStep.id || crypto.randomUUID();

        await tx
          .insert(processSteps)
          .values({ ...currentStep, id: stepId, candidateId: id })
          .onConflictDoUpdate({ target: processSteps.id, set: currentStep });

        data.currentStepId = stepId;
      }

      const [updated] = await tx
        .update(candidates)
        .set(data)
        .where(eq(candidates.id, id))
        .returning();

      return updated;
    });

    return NextResponse.json(updatedCandidate);
  } catch (error) {
    console.error('Error updating candidate:', error);
    return NextResponse.json(
      { error: 'Failed to update candidate' },
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
      // 1. Delete direct dependencies
      await tx.delete(processSteps).where(eq(processSteps.candidateId, id));

      // 2. Gather all unique CV IDs associated with the candidate and their referees
      const candidateCv = await tx.query.candidates.findFirst({
        where: eq(candidates.id, id),
        columns: { cvId: true },
      });

      const refereeCvs = await tx.query.referees.findMany({
        where: eq(referees.candidateId, id),
        columns: { cvId: true },
      });

      const cvIdsToDelete = new Set<string>();
      if (candidateCv?.cvId) {
        cvIdsToDelete.add(candidateCv.cvId);
      }
      refereeCvs.forEach(r => {
        if (r.cvId) cvIdsToDelete.add(r.cvId);
      });

      // 3. Delete referees associated with the candidate
      await tx.delete(referees).where(eq(referees.candidateId, id));
      
      // 4. Nullify the cvId in the candidate table to break the direct link
      if (candidateCv?.cvId) {
        await tx.update(candidates).set({ cvId: null }).where(eq(candidates.id, id));
      }

      // 5. Cascade delete all related CVs and their chunks
      if (cvIdsToDelete.size > 0) {
        const cvIdArray = Array.from(cvIdsToDelete);
        for (const cvId of cvIdArray) {
          await tx.delete(cvChunks).where(eq(cvChunks.cvId, cvId));
          await tx.delete(cvs).where(eq(cvs.id, cvId));
        }
      }

      // 6. Finally, delete the candidate itself
      await tx.delete(candidates).where(eq(candidates.id, id));
    });

    return NextResponse.json({ message: 'Candidate deleted successfully' });
  } catch (error) {
    console.error('Error deleting candidate:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to delete candidate', details: errorMessage },
      { status: 500 }
    );
  }
}
