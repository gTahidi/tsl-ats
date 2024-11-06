import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { name, email, linkedinUrl, notes, jobPostingId } = await request.json();

    // Create or find persona
    const persona = await prisma.persona.upsert({
      where: { email },
      update: {
        name,
        linkedinUrl,
      },
      create: {
        name,
        email,
        linkedinUrl,
      },
    });

    // Create candidate and associated process
    const candidate = await prisma.candidate.create({
      data: {
        notes,
        jobPosting: { connect: { id: jobPostingId } },
        persona: { connect: { id: persona.id } },
        process: {
          create: {
            steps: {
              create: {
                type: 'application',
                status: 'completed',
                date: new Date(),
                notes: 'Initial application',
              },
            },
          },
        },
      },
      include: {
        persona: true,
        process: {
          include: {
            steps: true,
          },
        },
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
