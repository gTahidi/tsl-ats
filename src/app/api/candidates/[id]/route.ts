import { db } from '@/db';
import { candidates, cvs, cvChunks, processSteps, referees } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { requireCurrentAuthUser, isAuthResponse } from '@/lib/tenant';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authUser = await requireCurrentAuthUser();
    if (isAuthResponse(authUser)) return authUser;

    const candidate = await db.query.candidates.findFirst({
      where: and(
        eq(candidates.id, id),
        eq(candidates.organizationId, authUser.organizationId),
      ),
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
    const authUser = await requireCurrentAuthUser();
    if (isAuthResponse(authUser)) return authUser;

    const { currentStep, ...data } = await request.json();

    const updatedCandidate = await db.transaction(async (tx) => {
      if (currentStep) {
        const stepId = currentStep.id || crypto.randomUUID();

        await tx
          .insert(processSteps)
          .values({
            ...currentStep,
            id: stepId,
            candidateId: id,
            organizationId: authUser.organizationId,
          })
          .onConflictDoUpdate({ target: processSteps.id, set: currentStep });

        data.currentStepId = stepId;
      }

      const [updated] = await tx
        .update(candidates)
        .set(data)
        .where(and(
          eq(candidates.id, id),
          eq(candidates.organizationId, authUser.organizationId),
        ))
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
    const authUser = await requireCurrentAuthUser();
    if (isAuthResponse(authUser)) return authUser;
    
    // Use transaction to handle cascading deletes
    await db.transaction(async (tx) => {
      // 1. Delete direct dependencies
      await tx.delete(processSteps).where(and(
        eq(processSteps.candidateId, id),
        eq(processSteps.organizationId, authUser.organizationId),
      ));

      // 2. Gather all unique CV IDs associated with the candidate and their referees
      const candidateCv = await tx.query.candidates.findFirst({
        where: and(
          eq(candidates.id, id),
          eq(candidates.organizationId, authUser.organizationId),
        ),
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
        await tx.update(candidates).set({ cvId: null }).where(and(
          eq(candidates.id, id),
          eq(candidates.organizationId, authUser.organizationId),
        ));
      }

      // 5. Cascade delete all related CVs and their chunks
      if (cvIdsToDelete.size > 0) {
        const cvIdArray = Array.from(cvIdsToDelete);
        for (const cvId of cvIdArray) {
          await tx.delete(cvChunks).where(eq(cvChunks.cvId, cvId));
          await tx.delete(cvs).where(and(
            eq(cvs.id, cvId),
            eq(cvs.organizationId, authUser.organizationId),
          ));
        }
      }

      // 6. Finally, delete the candidate itself
      await tx.delete(candidates).where(and(
        eq(candidates.id, id),
        eq(candidates.organizationId, authUser.organizationId),
      ));
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
