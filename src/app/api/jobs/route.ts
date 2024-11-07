import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const jobs = await prisma.jobPosting.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Failed to fetch jobs:', error);
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
      data: {
        title: data.title,
        description: data.description,
        linkedinUrl: data.linkedinUrl,
      },
    });
    return NextResponse.json(job);
  } catch (error) {
    console.error('Failed to create job:', error);
    return NextResponse.json(
      { error: 'Failed to create job posting' },
      { status: 500 }
    );
  }
}
