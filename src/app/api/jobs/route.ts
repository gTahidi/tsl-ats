import { prisma } from '@/utils/db/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const jobs = await prisma.jobPosting.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        candidates: {
          include: {
            persona: true,
            steps: true,
          },
        },
      },
    });
    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const job = await prisma.jobPosting.create({
      data,
      include: {
        candidates: {
          include: {
            persona: true,
            steps: true,
          },
        },
      },
    });
    return NextResponse.json(job);
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    );
  }
}
