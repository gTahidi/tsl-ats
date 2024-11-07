import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Parse URL to get query parameters
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId'); // Retrieve jobId from query params

    // Query the database with optional filtering by jobId
    const candidates = await prisma.candidate.findMany({
      where: jobId ? { jobId } : {},
      include: {
        persona: true,
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
    const { name, email, linkedinUrl, notes, jobId } = await request.json();

    console.log({
      name,
      email,
      linkedinUrl,
      notes,
      jobId,
    })

    // Create or find persona
    const cand = await prisma.candidate.findFirst({
      where: {
        persona: { email },
        job: { id: jobId }
      }
    });

    if (cand) {
      return NextResponse.json(
        { error: 'Candidate with this email already exists' },
        { status: 400 }
      );
    }

    // Create candidate and associated process
    const newCand = await prisma.candidate.create({
      data: {
        persona: {
          connectOrCreate: {
            where: { email },
            create: {
              name,
              email,
            },
          },
        },
        notes,
        linkedinUrl,
        job: { connect: { id: jobId } },
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

    return NextResponse.json(newCand);
  } catch (error) {
    console.error('Failed to create candidate:', error);
    return NextResponse.json(
      { error: 'Failed to create candidate' },
      { status: 500 }
    );
  }
}
