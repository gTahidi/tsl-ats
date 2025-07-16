import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { cvs, personas } from '@/db/schema';
import { createCandidateWithInitialStep } from '@/utils/candidate-creation';
import { parseCvWithGemini } from '@/lib/gemini/cv-parser';
import { uploadFile } from '@/lib/azure-storage';



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

        // --- Step 1: Upload CV to Azure Blob Storage ---
    const fileUrl = await uploadFile(file);
    
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

    // --- Step 3: Use a Drizzle Transaction to Create Persona, CV, and Candidate ---
    const candidate = await db.transaction(async (tx) => {
      // 1. Create or update the Persona
      const [persona] = await tx.insert(personas).values(personaData).onConflictDoUpdate({
        target: personas.email,
        set: personaData,
      }).returning();

      // 2. Create the CV record
      const [newCv] = await tx.insert(cvs).values({
        content: parsedCvData as any, // Drizzle handles JSON conversion
        fileUrl,
        originalFilename: file.name,
        fileSize: file.size,
        mimeType: file.type,
      }).returning();

      // 3. Use the refactored function to create the candidate and initial step
      return createCandidateWithInitialStep(tx, {
        jobId: jobId!,
        personaId: persona.id,
        cvId: newCv.id,
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
