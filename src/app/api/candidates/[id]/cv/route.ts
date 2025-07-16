import { db } from '@/db';
import { candidates } from '@/db/schema';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const candidate = await db.query.candidates.findFirst({
      where: eq(candidates.id, id),
      with: {
        cv: {
          columns: {
            originalFilename: true,
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

    const s3Client = new S3Client({
      region: 'auto',
      endpoint: process.env.S3_ENDPOINT!,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    });

    if (!candidate.cv?.originalFilename) {
      return NextResponse.json({
        url: null,
      });
    }

    const url = await getSignedUrl(
      s3Client,
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: candidate.cv.originalFilename,
      }),
      { expiresIn: 60 * 60 }
    );

    return NextResponse.json({
      url,
    });
  } catch (error) {
    console.error('Error fetching candidate:', error);
    return NextResponse.json(
      { error: 'Failed to fetch candidate' },
      { status: 500 }
    );
  }
}
