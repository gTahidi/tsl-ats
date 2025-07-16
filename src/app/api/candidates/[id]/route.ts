import { db } from '@/db';
import { candidates, processSteps } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await db.delete(candidates).where(eq(candidates.id, id));

    return NextResponse.json({ message: 'Candidate deleted successfully' });
  } catch (error) {
    console.error('Error deleting candidate:', error);
    return NextResponse.json(
      { error: 'Failed to delete candidate' },
      { status: 500 }
    );
  }
}
