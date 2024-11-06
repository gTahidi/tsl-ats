import { NextResponse } from 'next/server';
import { createPresignedUploadUrl } from '@/lib/s3';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { candidateId, fileName } = await request.json();
    const fileKey = `${candidateId}/${Date.now()}-${fileName}`;
    const uploadUrl = await createPresignedUploadUrl(fileKey);

    await prisma.candidate.update({
      where: { id: candidateId },
      data: { cvUrl: fileKey },
    });

    return NextResponse.json({ uploadUrl, fileKey });
  } catch (error) {
    console.error('Failed to generate upload URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
