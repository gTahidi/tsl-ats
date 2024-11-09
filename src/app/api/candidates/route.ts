import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/utils/db/prisma';

export async function GET(
  request: NextRequest,
) {
  try {
    const searchParams = request.nextUrl.searchParams
    const jobId = searchParams.get('jobId')

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
    return NextResponse.json(candidates);
  } catch (error) {
    console.error('Error fetching candidates:', error);
    return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const candidate = await prisma.$transaction(async (tx) => {
      const {
        processGroup: {
          id: groupId,
          steps
        }
      } = await tx.jobPosting.findUniqueOrThrow({
        where: { id: data.jobId },
        select: {
          processGroup: {
            select: {
              id: true,
              steps: true,
            }
          }
        }
      });

      if (steps.length === 0) {
        throw new Error('Job does not have any steps');
      }

      const id = data.id || crypto.randomUUID();
      const stepId = crypto.randomUUID();

      await tx.processStep.create({
        data: {
          id: stepId,
          status: 'Pending',
          candidate: {
            create: {
              id,
              cvFileKey: data.cvFileKey,
              notes: data.notes,
              persona: {
                connect: { id: data.personaId },
              },
              job: {
                connect: { id: data.jobId },
              },
              currentStepId: stepId,
            }
          },
          group: {
            connect: { id: groupId },
          },
          template: {
            connect: {
              id: steps[0].id,
            },
          },
        },
      });


      return prisma.candidate.findUnique({
        where: { id },
      });
    });

    return NextResponse.json(candidate);
  } catch (error) {
    console.error('Error creating candidate:', error);
    return NextResponse.json({ error: 'Failed to create candidate' }, { status: 500 });
  }
}
