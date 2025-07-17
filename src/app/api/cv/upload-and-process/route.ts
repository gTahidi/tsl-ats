import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobPostings, personas, cvs, candidates } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { parseAndRankCvWithGemini } from '@/lib/gemini/cv-parser';
import { uploadFile } from '@/lib/azure-storage';
import { createCandidateWithInitialStep, updateCandidateWithNewCv } from '@/utils/candidate-creation';
import { createAndStoreCvEmbeddings } from '@/utils/embedding-creation';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const jobId = formData.get('jobId') as string;

        if (!file || !jobId) {
            return NextResponse.json({ error: 'File and Job ID are required' }, { status: 400 });
        }

        // 1. Fetch job details for ranking context
        const job = await db.query.jobPostings.findFirst({
            where: eq(jobPostings.id, jobId)
        });

        if (!job) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
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

        return NextResponse.json(candidate);

    } catch (error) {
        console.error('Error processing CV upload:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Failed to process CV', details: errorMessage }, { status: 500 });
    }
}
