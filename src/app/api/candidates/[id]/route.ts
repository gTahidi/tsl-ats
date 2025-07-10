import { prisma } from '@/utils/db/prisma';
import { NextResponse } from 'next/server';

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const candidate = await prisma.candidate.findUnique({
      where: {
        id,
      },
      include: {
        persona: true,
        job: {
          include: {
            processGroup: {
              include: {
                steps: true,
              },
            }
          },
        },
        steps: {
          include: {
            group: {
              include: {
                steps: true,
              },
            },
            template: true,
          }
        }
      },
    });

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    const currStep = await prisma.processStep.findFirst({
      where: {
        candidateId: candidate.id,
        id: candidate.currentStepId
      },
      include: {
        group: true,
        template: true,
      }
    });

    return NextResponse.json({
      ...candidate,
      currentStep: currStep
    });
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
    const {
      currentStep,
      ...data
    } = await request.json();

    const candidate = await prisma.$transaction(async (tx) => {
      if (currentStep) {
        const stepId = currentStep.id || crypto.randomUUID();

        await tx.processStep.upsert({
          where: { id: stepId },
          update: currentStep,
          create: {
            ...currentStep,
            id: stepId,
            candidate: {
              connect: { id },
            },
            group: {
              connect: { id: currentStep.groupId },
            },
            template: {
              connect: { id: currentStep.templateId },
            },
            groupId: undefined,
            templateId: undefined,
          },
        });

        data.currentStepId = stepId;
      }

      await tx.candidate.update({
        where: { id },
        data,
      });


      return prisma.candidate.findUnique({
        where: { id },
      });
    });

    return NextResponse.json(candidate);
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
    await prisma.candidate.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Candidate deleted successfully' });
  } catch (error) {
    console.error('Error deleting candidate:', error);
    return NextResponse.json(
      { error: 'Failed to delete candidate' },
      { status: 500 }
    );
  }
}
