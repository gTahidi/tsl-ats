import { db } from '@/db';
import { personas, candidates, processSteps, cvs, cvChunks } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { requireCurrentAuthUser, isAuthResponse } from '@/lib/tenant';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await requireCurrentAuthUser();
    if (isAuthResponse(authUser)) return authUser;

    const [persona] = await db
      .select()
      .from(personas)
      .where(and(
        eq(personas.id, id),
        eq(personas.organizationId, authUser.organizationId),
      ));

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
    const authUser = await requireCurrentAuthUser();
    if (isAuthResponse(authUser)) return authUser;

    const data = await request.json();
    const personaData = { ...data, organizationId: authUser.organizationId };
    const [updatedPersona] = await db
      .update(personas)
      .set(personaData)
      .where(and(
        eq(personas.id, id),
        eq(personas.organizationId, authUser.organizationId),
      ))
      .returning();

    if (!updatedPersona) {
      return NextResponse.json({ error: 'persona not found' }, { status: 404 });
    }

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
    const authUser = await requireCurrentAuthUser();
    if (isAuthResponse(authUser)) return authUser;
    
    // Use transaction to handle cascading deletes
    await db.transaction(async (tx) => {
      // Get all candidates for this persona
      const personaCandidates = await tx.select({ id: candidates.id, cvId: candidates.cvId })
        .from(candidates)
        .where(and(
          eq(candidates.personaId, id),
          eq(candidates.organizationId, authUser.organizationId),
        ));
      
      // Delete all related data for each candidate
      for (const candidate of personaCandidates) {
        // Delete process steps for this candidate
        await tx.delete(processSteps).where(eq(processSteps.candidateId, candidate.id));
        
        // Delete CV and CV chunks if they exist
        if (candidate.cvId) {
          // First, nullify the cvId to remove the foreign key reference
          await tx.update(candidates)
            .set({ cvId: null })
            .where(and(
              eq(candidates.id, candidate.id),
              eq(candidates.organizationId, authUser.organizationId),
            ));
          
          // Now we can safely delete CV chunks and CV
          await tx.delete(cvChunks).where(eq(cvChunks.cvId, candidate.cvId));
          await tx.delete(cvs).where(and(
            eq(cvs.id, candidate.cvId),
            eq(cvs.organizationId, authUser.organizationId),
          ));
        }
      }
      
      // Delete all candidates for this persona
      await tx.delete(candidates).where(and(
        eq(candidates.personaId, id),
        eq(candidates.organizationId, authUser.organizationId),
      ));
      
      // Finally, delete the persona
      await tx.delete(personas).where(and(
        eq(personas.id, id),
        eq(personas.organizationId, authUser.organizationId),
      ));
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
