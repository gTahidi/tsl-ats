import { NextResponse } from 'next/server';
import { prisma } from '@/utils/db/prisma';
import { getBlobUrl } from '@/lib/azure-storage';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const candidate = await prisma.candidate.findUnique({
      where: { id },
      select: { cvFileKey: true }
    });

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    if (!candidate.cvFileKey) {
      return NextResponse.json({
        url: null,
      });
    }

    const url = getBlobUrl(candidate.cvFileKey);

    return NextResponse.json({
      url,
      downloadUrl: url // Azure doesn't have a separate download URL
    });
  } catch (error) {
    console.error('Error fetching candidate CV:', error);
    return NextResponse.json(
      { error: 'Failed to fetch candidate CV' },
      { status: 500 }
    );
  }
}
