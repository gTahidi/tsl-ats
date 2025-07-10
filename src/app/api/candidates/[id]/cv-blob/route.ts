import { prisma } from '@/utils/db/prisma';
import { list } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const candidate = await prisma.candidate.findUnique({
            where: { id },
        });

        if (!candidate) {
            return NextResponse.json(
                { error: 'Candidate not found' },
                { status: 404 }
            );
        }

        if (!candidate.cvFileKey) {
            console.warn(`Candidate ${id} has no CV file key`);

            return NextResponse.json({
                url: null,
            });
        }

        const prefix = candidate.cvFileKey.split('__')[0];

        const fs = await list({
            prefix,
        });

        if (fs.blobs.length === 0) {
            console.warn(`Candidate ${id} has no CV blob files at ${prefix}: ${fs.blobs.length}`);

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
