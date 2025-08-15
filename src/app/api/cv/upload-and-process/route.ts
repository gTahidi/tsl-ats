import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobPostings, personas, cvs, candidates } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { parseAndRankCvWithGemini } from '@/lib/gemini/cv-parser';
import { uploadFile } from '@/lib/azure-storage';
import { createCandidateWithInitialStep, updateCandidateWithNewCv } from '@/utils/candidate-creation';
import { createAndStoreCvEmbeddings } from '@/utils/embedding-creation';
import { sendCvReceivedEmail } from '@/lib/email';
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
  ToFull: z.array(z.object({ Email: z.string() })).optional(),
  Subject: z.string().optional(), // To extract job description for matching
});

// --- Job Matching Logic ---

async function findJobBySubject(subject: string): Promise<string | null> {
  if (!subject || subject.trim().length === 0) {
    return null;
  }

  // Get all active jobs from the database
  const jobs = await db.query.jobPostings.findMany({
    where: eq(jobPostings.status, 'Open')
  });

  if (jobs.length === 0) {
    return null;
  }

  // Clean and normalize the subject for matching
  const normalizedSubject = subject
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, ' ') // Replace punctuation with spaces
    .replace(/\s+/g, ' ') // Normalize multiple spaces
    .trim();
  
  // Strategy 1: Exact title match in subject
  for (const job of jobs) {
    const normalizedTitle = job.title.toLowerCase();
    if (normalizedSubject.includes(normalizedTitle)) {
      return job.id;
    }
  }

  // Strategy 2: Flexible keyword matching from job titles
  for (const job of jobs) {
    const titleWords = job.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2); // Keep words longer than 2 characters
    
    // Count how many title words appear in the subject
    const matchingWords = titleWords.filter(word => 
      normalizedSubject.includes(word)
    );
    
    // If at least one significant word matches, it's a potential match
    if (matchingWords.length >= 1) {
      // Special handling for sales-related positions
      if (matchingWords.some(word => ['sales', 'marketing', 'representative', 'executive'].includes(word))) {
        return job.id;
      }
      // For other positions, require at least 40% match
      const matchRatio = matchingWords.length / titleWords.length;
      if (matchRatio >= 0.4) {
        return job.id;
      }
    }
  }

  // Strategy 3: Partial word matching for common abbreviations
  for (const job of jobs) {
    const titleWords = job.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
    
    // Check for partial matches (useful for abbreviations like "adm" for "admin")
    const partialMatches = titleWords.filter(word => {
      // Check if the word appears as part of a larger word in subject
      return normalizedSubject.split(' ').some(subjectWord => 
        subjectWord.includes(word) || word.includes(subjectWord)
      );
    });
    
    const partialMatchRatio = partialMatches.length / titleWords.length;
    if (partialMatchRatio >= 0.5 && partialMatches.length >= 1) {
      return job.id;
    }
  }

  return null;
}

// --- Core CV Processing Logic --- 

async function processCv(file: File, jobId: string, emailHint?: string): Promise<{ candidate: any; job: any; createdNewCandidate: boolean }> {
    // 1. Fetch job details for ranking context
    const job = await db.query.jobPostings.findFirst({
        where: eq(jobPostings.id, jobId)
    });

    if (!job) {
        throw new Error('Job not found');
    }

    // 2. Parse, Rank, and Extract Referees with the unified Gemini call
    const unifiedResult = await parseAndRankCvWithGemini(file, job);
    const { ranking, referees, ...parsedCv } = unifiedResult;

    // 4. Validate that we have an email before proceeding (allow optional UI-provided hint)
    if (!parsedCv.contactInfo.email && emailHint) {
        const emailParse = z.string().email().safeParse(String(emailHint).trim().toLowerCase());
        if (emailParse.success) {
            parsedCv.contactInfo.email = emailParse.data;
        }
    }

    if (!parsedCv.contactInfo.email) {
        throw new Error('CV parsing failed to extract a valid email address. You can retry the upload and supply an email manually.');
    }

    // 3. Check if a candidate with this email already exists for this job
    const existingPersona = await db.query.personas.findFirst({
        where: eq(personas.email, parsedCv.contactInfo.email!)
    });

    let existingCandidate: any = null;
    if (existingPersona) {
        existingCandidate = await db.query.candidates.findFirst({
            where: and(
                eq(candidates.jobId, jobId),
                eq(candidates.personaId, existingPersona.id)
            ),
            with: { cv: true },
        });
    }

    // 4. If the same candidate for the same job already has an identical file processed recently,
    //    short-circuit to avoid duplicate CVs/candidates.
    if (
        existingCandidate?.cv &&
        existingCandidate.cv.originalFilename === file.name &&
        existingCandidate.cv.fileSize === file.size &&
        existingCandidate.cv.mimeType === file.type
    ) {
        return {
            candidate: {
                ...existingCandidate,
                persona: existingPersona,
            },
            job,
            createdNewCandidate: false,
        };
    }

    // 5. Upload file to Azure Blob Storage (only when we know we need to persist a new CV)
    const fileUrl = await uploadFile(file);

    // 6. Use a transaction to create/update all related database records
    const { candidate, cvId } = await db.transaction(async (tx) => {
        // 6a. Create or update the Persona
        const personaData = {
            name: parsedCv.contactInfo.name || 'Unknown',
            email: parsedCv.contactInfo.email!,
            surname: parsedCv.contactInfo.surname,
            location: parsedCv.contactInfo.location,
            phone: parsedCv.contactInfo.phone,
            linkedinUrl: parsedCv.contactInfo.linkedinUrl,
        };

        const [persona] = await tx.insert(personas).values(personaData).onConflictDoUpdate({
            target: personas.email,
            set: { 
                name: personaData.name,
                surname: personaData.surname,
                location: personaData.location,
                phone: personaData.phone,
                linkedinUrl: personaData.linkedinUrl,
                updatedAt: new Date(),
            },
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

    const createdNewCandidate = !existingCandidate;
    return { candidate, job, createdNewCandidate };
}


export async function POST(req: NextRequest) {
    try {
        const contentType = req.headers.get('content-type') || '';
        let file: File;
        let jobId: string;
        let emailHint: string | undefined;
        let isEmailWebhook = false;

        // --- Handle Postmark JSON Webhook ---
        if (contentType.includes('application/json')) {
            const { searchParams } = new URL(req.url);
            const apiKey = searchParams.get('apiKey');

            if (apiKey !== process.env.INTERNAL_API_KEY) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            console.log('Processing Postmark inbound webhook...');
            isEmailWebhook = true;
            const body = await req.json();
            const parsedData = postmarkWebhookSchema.safeParse(body);

            if (!parsedData.success) {
                return NextResponse.json({ error: 'Invalid Postmark payload', details: parsedData.error }, { status: 400 });
            }

            const { Attachments, Subject } = parsedData.data;
            if (!Attachments || Attachments.length === 0) {
                return NextResponse.json({ message: 'No attachments to process.' });
            }

            const allowedMimeTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            const cvAttachment = Attachments.find(att => allowedMimeTypes.includes(att.ContentType));

            if (!cvAttachment) {
                return NextResponse.json({ message: 'No valid CV attachment found.' });
            }

            // Find job by matching email subject against job titles/descriptions
            const matchedJobId = await findJobBySubject(Subject || '');
            
            if (!matchedJobId) {
                console.log('No job match found, using General job as fallback');
                // Use the General job for unmatched applications
                jobId = 'wpx5injoqsa3dhtca3jh15no';
            } else {
                jobId = matchedJobId;
                console.log(`Processing CV against matched job: ${jobId}`);
            }

            const fileBuffer = Buffer.from(cvAttachment.Content, 'base64');
            file = new File([fileBuffer], cvAttachment.Name, { type: cvAttachment.ContentType });

        // --- Handle FormData from UI ---
        } else if (contentType.includes('multipart/form-data')) {
            console.log('Processing form-data upload...');
            const formData = await req.formData();
            file = formData.get('file') as File;
            jobId = formData.get('jobId') as string;
            const emailField = formData.get('emailHint');
            if (typeof emailField === 'string' && emailField.trim().length > 0) {
                emailHint = emailField;
            }
        } else {
            return NextResponse.json({ error: 'Unsupported Content-Type' }, { status: 415 });
        }

        if (!file || !jobId) {
            return NextResponse.json({ error: 'File and Job ID are required' }, { status: 400 });
        }

        const { candidate, job, createdNewCandidate } = await processCv(file, jobId, emailHint);

        // Send confirmation email only for email-originated applications and only when a new candidate was created
        if (isEmailWebhook && createdNewCandidate && candidate.persona?.email) {
            sendCvReceivedEmail(
                candidate.persona.email,
                `${candidate.persona.name} ${candidate.persona.surname}`.trim(),
                job.title
            );
        }

        return NextResponse.json(candidate);

    } catch (error) {
        console.error('Error processing CV upload:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        const status = errorMessage.toLowerCase().includes('email') ? 422 : 500;
        return NextResponse.json({ error: 'Failed to process CV', details: errorMessage }, { status });
    }
}
