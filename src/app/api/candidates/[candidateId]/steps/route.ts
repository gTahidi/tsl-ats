import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { candidateId: string } }
) {
  try {
    const { type, status, notes } = await request.json();

    // Get the process ID for the candidate
    const candidate = await prisma.candidate.findUnique({
      where: { id: params.candidateId },
      include: { process: true },
    });

    if (!candidate?.process) {
      return NextResponse.json(
        { error: 'Process not found for candidate' },
        { status: 404 }
      );
    }

    // Create new step
    const step = await prisma.step.create({
      data: {
        type,
        status,
        notes,
        date: new Date(),
        processId: candidate.process.id,
      },
    });

    // Update candidate status based on the new step
    await prisma.candidate.update({
      where: { id: params.candidateId },
      data: { status },
    });

    return NextResponse.json(step);
  } catch (error) {
    console.error('Failed to create process step:', error);
    return NextResponse.json(
      { error: 'Failed to create process step' },
      { status: 500 }
    );
  }
}
