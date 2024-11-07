import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const candidates = await prisma.candidate.findMany({
      include: {
        steps: {
          orderBy: {
            date: 'desc',
          },
        },
      },
    });
    return NextResponse.json(candidates);
  } catch (error) {
    console.error('Failed to fetch candidates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch candidates' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, email, linkedinUrl, notes, jobPostingId } = await request.json();

    // Create or find persona
    const persona = await prisma.candidate.findFirst({
      where: { email },
    });

    if (persona) {
      return NextResponse.json(
        { error: 'Candidate with this email already exists' },
        { status: 400 }
      );
    }

    // Create candidate and associated process
    const candidate = await prisma.candidate.create({
      data: {
        name,
        email,
        notes,
        linkedinUrl,
        job: { connect: { id: jobPostingId } },
        steps: {
          create: {
            type: 'application',
            status: 'completed',
            date: new Date(),
            notes: 'Initial application',
          },
        },
      },
      include: {
        steps: {
          orderBy: {
            date: 'desc',
          },
        }
      },
    });

    return NextResponse.json(candidate);
  } catch (error) {
    console.error('Failed to create candidate:', error);
    return NextResponse.json(
      { error: 'Failed to create candidate' },
      { status: 500 }
    );
  }
}
