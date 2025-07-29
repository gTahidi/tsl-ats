import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobPostings, personas, cvs, candidates } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { parseAndRankCvWithGemini } from '@/lib/gemini/cv-parser';
import { uploadFile } from '@/lib/azure-storage';
import { createCandidateWithInitialStep, updateCandidateWithNewCv } from '@/utils/candidate-creation';
import { createAndStoreCvEmbeddings } from '@/utils/embedding-creation';
import { z } from 'zod';

// --- Zod Schemas for Postmark --- 
const attachmentSchema = z.object({
  Name: z.string(),
  Content: z.string(), // Base64 encoded
  ContentType: z.string(),
  ContentLength: z.number(),
});

const postmarkWebhookSchema = z.object({
  Attachments: z.array(attachmentSchema).optional(),
  ToFull: z.array(z.object({ Email: z.string() })).optional(), // To extract potential metadata
});

// --- Core CV Processing Logic --- 

async function processCv(file: File, jobId: string) {
    // 1. Fetch job details for ranking context
    const job = await db.query.jobPostings.findFirst({
        where: eq(jobPostings.id, jobId)
    });

    if (!job) {
        throw new Error('Job not found');
    }

    // 2. Upload file to Azure Blob Storage
    const fileUrl = await uploadFile(file);

    // 3. Parse, Rank, and Extract Referees with the unified Gemini call
    const unifiedResult = await parseAndRankCvWithGemini(file, job);
    const { ranking, referees, ...parsedCv } = unifiedResult;

    // 4. Validate that we have an email before proceeding
    if (!parsedCv.contactInfo.email) {
        throw new Error('CV parsing failed to extract a valid email address.');
    }

    // 5. Check if a candidate with this email already exists for this job
    const existingPersona = await db.query.personas.findFirst({
        where: eq(personas.email, parsedCv.contactInfo.email!)
    });

    let existingCandidate = null;
    if (existingPersona) {
        existingCandidate = await db.query.candidates.findFirst({
            where: and(
                eq(candidates.jobId, jobId),
                eq(candidates.personaId, existingPersona.id)
            )
        });
    }

    // 6. Use a transaction to create/update all related database records
    const { candidate, cvId } = await db.transaction(async (tx) => {
        // 6a. Create or update the Persona
        const personaData = {
            name: parsedCv.contactInfo.name || 'Unknown',
            email: parsedCv.contactInfo.email!,
            surname: parsedCv.contactInfo.surname,
            location: parsedCv.contactInfo.location,
            linkedinUrl: parsedCv.contactInfo.linkedinUrl,
        };

        const [persona] = await tx.insert(personas).values(personaData).onConflictDoUpdate({
            target: personas.email,
            set: { ...personaData, updatedAt: new Date() },
        }).returning();

        // 6b. Create the new CV record
        const [newCv] = await tx.insert(cvs).values({
            content: parsedCv,
            fileUrl: fileUrl,
            originalFilename: file.name,
            fileSize: file.size,
            mimeType: file.type,
        }).returning();

        let finalCandidate;

        if (existingCandidate) {
            // 6c. If candidate exists, update them with the new CV
            finalCandidate = await updateCandidateWithNewCv(tx, {
                candidateId: existingCandidate.id,
                cvId: newCv.id,
                rating: ranking,
                referees: referees,
            });
        } else {
            // 6d. Otherwise, create a new candidate
            finalCandidate = await createCandidateWithInitialStep(tx, {
                jobId: jobId,
                personaId: persona.id,
                cvId: newCv.id,
                source: 'Upload',
                rating: ranking,
                referees: referees,
            });
        }

        // 6e. Return the full candidate object and the new CV's ID
        return {
            candidate: {
                ...finalCandidate,
                persona: persona,
            },
            cvId: newCv.id,
        };
    });

    // Trigger the embedding process asynchronously (fire and forget)
    createAndStoreCvEmbeddings(cvId, unifiedResult);

    return candidate;
}


export async function POST(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const apiKey = searchParams.get('apiKey');

    if (apiKey !== process.env.INTERNAL_API_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const contentType = req.headers.get('content-type') || '';
        let file: File;
        let jobId: string;

        // --- Handle Postmark JSON Webhook ---
        if (contentType.includes('application/json')) {
            console.log('Processing Postmark inbound webhook...');
            const body = await req.json();
            const parsedData = postmarkWebhookSchema.safeParse(body);

            if (!parsedData.success) {
                return NextResponse.json({ error: 'Invalid Postmark payload', details: parsedData.error }, { status: 400 });
            }

            const { Attachments } = parsedData.data;
            if (!Attachments || Attachments.length === 0) {
                return NextResponse.json({ message: 'No attachments to process.' });
            }

            const allowedMimeTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            const cvAttachment = Attachments.find(att => allowedMimeTypes.includes(att.ContentType));

            if (!cvAttachment) {
                return NextResponse.json({ message: 'No valid CV attachment found.' });
            }

            const fileBuffer = Buffer.from(cvAttachment.Content, 'base64');
            file = new File([fileBuffer], cvAttachment.Name, { type: cvAttachment.ContentType });
            jobId = 'hp3g5hcw8bpyjnrmb8qk3eq0'; // Default Job ID for webhook uploads

        // --- Handle FormData from UI ---
        } else if (contentType.includes('multipart/form-data')) {
            console.log('Processing form-data upload...');
            const formData = await req.formData();
            file = formData.get('file') as File;
            jobId = formData.get('jobId') as string;
        } else {
            return NextResponse.json({ error: 'Unsupported Content-Type' }, { status: 415 });
        }

        if (!file || !jobId) {
            return NextResponse.json({ error: 'File and Job ID are required' }, { status: 400 });
        }

        const candidate = await processCv(file, jobId);
        return NextResponse.json(candidate);

    } catch (error) {
        console.error('Error processing CV upload:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Failed to process CV', details: errorMessage }, { status: 500 });
    }
}
