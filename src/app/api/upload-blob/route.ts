import { NextResponse } from 'next/server';
import { uploadFile, getBlobUrl } from '@/lib/azure-storage';

export async function POST(request: Request) {
    try {
        const data = await request.formData();
        const file = data.get('file') as File | null;
        const candidateId = data.get('candidateId') as string | null;

        if (!file) {
            return NextResponse.json({ error: 'Missing file' }, { status: 400 });
        }

        const blobName = await uploadFile(file);
        const fileUrl = getBlobUrl(blobName);
        
        // If candidateId is provided, update the candidate's CV
        if (candidateId) {
            // You'll need to implement this function to update the candidate's CV
            // await updateCandidateCV(candidateId, blobName);
        }

        return NextResponse.json({
            key: blobName,
            url: fileUrl
        });
    } catch (error) {
        console.error('Azure Blob upload error:', error);
        return NextResponse.json(
            { error: 'File upload failed' },
            { status: 500 }
        );
    }
}
