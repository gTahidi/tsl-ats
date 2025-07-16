import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { candidates } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const candidate = await db.query.candidates.findFirst({
      where: eq(candidates.id, id),
      with: {
        cv: {
          columns: {
            fileUrl: true,
          },
        },
      },
    });

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    if (!candidate.cv?.fileUrl) {
      return NextResponse.json({
        url: null,
      });
    }

    return NextResponse.json({
      url: candidate.cv.fileUrl,
      downloadUrl: candidate.cv.fileUrl,
    });
  } catch (error) {
    console.error('Error fetching candidate CV:', error);
    return NextResponse.json(
      { error: 'Failed to fetch candidate CV' },
      { status: 500 }
    );
  }
}
