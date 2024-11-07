import { NextResponse } from 'next/server';
import prisma from '@/utils/db/prisma';

export async function GET() {
  try {
    const jobs = await prisma.jobPosting.findMany({
      include: {
        candidates: true,
      },
      orderBy: {
        createdAt: 'desc',
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
    const body = await request.json();
    const { title, description, linkedinUrl, status } = body;

    const job = await prisma.jobPosting.create({
      data: {
        title,
        description,
        linkedinUrl,
        status: status || 'Open',
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
