import { NextResponse } from 'next/server';
import { prisma } from '@/utils/db/prisma';

export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const job = await prisma.job.create({
      data: {
        title: data.title,
        description: data.description,
        linkedinUrl: data.linkedinUrl,
        status: data.status,
      },
    });
    return NextResponse.json(job);
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}
