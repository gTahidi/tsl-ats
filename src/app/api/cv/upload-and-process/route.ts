import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/utils/db/prisma';
import { createCandidateWithInitialStep } from '@/utils/candidate-creation';
import { parseCvWithGemini } from '@/lib/gemini/cv-parser';
import { randomUUID } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// Simple local file storage for development
async function storeFileLocally(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  // Create uploads directory if it doesn't exist
  const uploadDir = join(process.cwd(), 'public/uploads/cvs');
  await mkdir(uploadDir, { recursive: true });
  
  // Generate a unique filename
  const ext = file.name.split('.').pop();
  const filename = `${randomUUID()}.${ext}`;
  const path = join(uploadDir, filename);
  
  await writeFile(path, buffer);
  return `/uploads/cvs/${filename}`;
}



export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('cv') as File | null;
    const jobId = formData.get('jobId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No CV file provided' }, { status: 400 });
    }
    if (!jobId) {
      return NextResponse.json({ error: 'No Job ID provided' }, { status: 400 });
    }

        // --- Step 1: Store the file locally
    const fileUrl = await storeFileLocally(file);
    
    // --- Step 2: Process the CV with Gemini ---
    const parsedCvData = await parseCvWithGemini(file);
    
    // Extract contact info for persona creation
    const { contactInfo } = parsedCvData;
    if (!contactInfo?.email) {
      throw new Error('No email found in the CV');
    }
    
    // Ensure required fields are present
    const personaData = {
      name: contactInfo.name || 'Unknown',
      email: contactInfo.email,
      surname: contactInfo.surname || '',
      location: contactInfo.location || '',
      linkedinUrl: contactInfo.linkedinUrl || '',
      // Remove phone field as it's not in the schema
    };

    // --- Step 3: Use a Transaction to Create Persona, Candidate, and CV ---
    const candidate = await prisma.$transaction(async (tx) => {
      // 1. Create or update the Persona
      const persona = await tx.persona.upsert({
        where: { email: contactInfo.email },
        update: personaData,
        create: personaData,
      });

      // 2. Create the CV record
      const cv = await tx.cv.create({
        data: {
          content: parsedCvData as any,
          fileUrl,
          originalFilename: file.name,
          fileSize: file.size,
          mimeType: file.type,
        },
      });

      // 3. Create the Candidate
      return createCandidateWithInitialStep(tx, {
        jobId: jobId!,
        personaId: persona.id,
        cvId: cv.id,
      });
    });

    // --- Step 3: (Future) Trigger CV Chunking and Embedding ---
    // This can be a call to another service or a background job
    // await processCvChunks(candidate.cv.id, parsedCvData);

    return NextResponse.json({
      message: 'CV processed and candidate created successfully',
      candidateId: candidate.id,
    });

  } catch (error) {
    console.error('Error processing uploaded CV:', error);
    return NextResponse.json({ error: 'Failed to process CV' }, { status: 500 });
  }
}
