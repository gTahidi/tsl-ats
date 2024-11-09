'use server';

import { BLOB_PREFIX } from '@/lib/storage';
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const data = await request.formData();
        const file = data.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'Missing file' }, { status: 400 });
        }

        const key = crypto.randomUUID().replace(/-/g, '');
        const fileKey = `${BLOB_PREFIX}/cvs/${key}__${file.name}`;

        await put(
            fileKey,
            file,
            {
                access: 'public',
                contentType: file.type,
            }
        );

        return NextResponse.json({
            key: fileKey,
        });
    } catch (error) {
        console.error('Blob upload error:', error);

        return NextResponse.json(
            { error: 'Blob upload failed' },
            { status: 500 }
        );
    }
}
