import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/utils/db/prisma';
import { createCandidateWithInitialStep } from '@/utils/candidate-creation';

export async function GET(
  request: NextRequest,
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('jobId');

    const candidates = await prisma.candidate.findMany({
      where: {
        ...(jobId ? { jobId } : {}),
      },
      include: {
        persona: true,
        job: true,
        steps: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const currentSteps = await prisma.processStep.findMany({
      where: {
        id: { in: candidates.map(c => c.currentStepId) },
      },
      include: {
        template: true,
      },
    });

    return NextResponse.json(
      candidates.map(candidate => {
        const currentStep = currentSteps.find(step => step.id === candidate.currentStepId);
        return {
          ...candidate,
          currentStep,
        };
      })
    );
  } catch (error) {
    console.error('Error fetching candidates:', error);
    return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const candidate = await prisma.$transaction(async (tx) => {
      // Use the refactored function to create the candidate and initial step.
      // This flow assumes a cvFileKey is provided for a separate upload process.
      return createCandidateWithInitialStep(tx, {
        jobId: data.jobId,
        personaId: data.personaId,
        notes: data.notes,
        source: data.source,
        rating: data.rating,
        metadata: data.metadata,
      });
    });

    return NextResponse.json(candidate);
  } catch (error) {
    console.error('Error creating candidate:', error);
    return NextResponse.json({ error: 'Failed to create candidate' }, { status: 500 });
  }
}
