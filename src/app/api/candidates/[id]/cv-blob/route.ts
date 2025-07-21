import { db } from '@/db';
import { candidates } from '@/db/schema';
import { list } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id:string }> }
) {
  try {
    const { id } = await params;
    const candidate = await db.query.candidates.findFirst({
      where: eq(candidates.id, id),
      with: {
        cv: {
          columns: {
            id: true,
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

    if (!candidate.cv?.id) {
      console.warn(`Candidate ${id} has no CV`);

      return NextResponse.json({
        url: null,
      });
    }

    const prefix = candidate.cv.id;

    const fs = await list({
      prefix,
    });

    if (fs.blobs.length === 0) {
      console.warn(
        `Candidate ${id} has no CV blob files at prefix ${prefix}: ${fs.blobs.length}`
      );

      return NextResponse.json({
        url: null,
      });
    }

    return NextResponse.json({
      url: fs.blobs[0].url,
      downloadUrl: fs.blobs[0].downloadUrl,
    });
  } catch (error) {
    console.error('Error fetching candidates blob CV:', error);
    return NextResponse.json(
      { error: 'Failed to fetch candidates blob CV' },
      { status: 500 }
    );
  }
}
