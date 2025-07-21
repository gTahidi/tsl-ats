import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { cvs } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const cv = await db.query.cvs.findFirst({
      where: eq(cvs.id, id),
      columns: {
        fileUrl: true,
        originalFilename: true,
      }
    });

    if (!cv) {
      return NextResponse.json(
        { error: 'CV not found' },
        { status: 404 }
      );
    }

    if (!cv.fileUrl) {
      return NextResponse.json({
        url: null,
      });
    }

    return NextResponse.json({
      url: cv.fileUrl,
      filename: cv.originalFilename || 'CV Document',
    });
  } catch (error) {
    console.error('Error fetching CV:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CV' },
      { status: 500 }
    );
  }
}
