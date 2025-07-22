import { db } from '@/db';
import { personas, candidates, processSteps, cvs, cvChunks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [persona] = await db
      .select()
      .from(personas)
      .where(eq(personas.id, id));

    if (!persona) {
      return NextResponse.json(
        { error: 'persona not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(persona);
  } catch (error) {
    console.error('Error fetching persona:', error);
    return NextResponse.json(
      { error: 'Failed to fetch persona' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const [updatedPersona] = await db
      .insert(personas)
      .values({ ...data, id })
      .onConflictDoUpdate({ target: personas.id, set: data })
      .returning();

    return NextResponse.json(updatedPersona);
  } catch (error) {
    console.error('Error updating persona:', error);
    return NextResponse.json(
      { error: 'Failed to update persona' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Use transaction to handle cascading deletes
    await db.transaction(async (tx) => {
      // Get all candidates for this persona
      const personaCandidates = await tx.select({ id: candidates.id, cvId: candidates.cvId })
        .from(candidates)
        .where(eq(candidates.personaId, id));
      
      // Delete all related data for each candidate
      for (const candidate of personaCandidates) {
        // Delete process steps for this candidate
        await tx.delete(processSteps).where(eq(processSteps.candidateId, candidate.id));
        
        // Delete CV and CV chunks if they exist
        if (candidate.cvId) {
          // First, nullify the cvId to remove the foreign key reference
          await tx.update(candidates)
            .set({ cvId: null })
            .where(eq(candidates.id, candidate.id));
          
          // Now we can safely delete CV chunks and CV
          await tx.delete(cvChunks).where(eq(cvChunks.cvId, candidate.cvId));
          await tx.delete(cvs).where(eq(cvs.id, candidate.cvId));
        }
      }
      
      // Delete all candidates for this persona
      await tx.delete(candidates).where(eq(candidates.personaId, id));
      
      // Finally, delete the persona
      await tx.delete(personas).where(eq(personas.id, id));
    });

    return NextResponse.json({ message: 'Persona deleted successfully' });
  } catch (error) {
    console.error('Error deleting persona:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to delete persona', details: errorMessage },
      { status: 500 }
    );
  }
}
