import { NextResponse } from 'next/server';
import { prisma } from '@/utils/db/prisma';

export async function GET() {
  try {
    const candidates = await prisma.candidate.findMany({
      include: {
        persona: true,
        job: true,
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
    const candidate = await prisma.candidate.create({
      data: {
        name: data.name,
        email: data.email,
        linkedinUrl: data.linkedinUrl,
        cvUrl: data.cvUrl,
        notes: data.notes,
        personaId: data.personaId,
        jobId: data.jobId,
      },
      include: {
        persona: true,
        job: true,
      },
    });
    return NextResponse.json(candidate);
  } catch (error) {
    console.error('Error creating candidate:', error);
    return NextResponse.json({ error: 'Failed to create candidate' }, { status: 500 });
  }
}
