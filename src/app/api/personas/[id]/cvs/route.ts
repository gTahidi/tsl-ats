import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { personas, candidates, cvs } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Find all candidates associated with this persona, and their CVs
    const persona = await db.query.personas.findFirst({
      where: eq(personas.id, id),
      with: {
        candidates: {
          with: {
            cv: {
              columns: {
                id: true,
                fileUrl: true,
                originalFilename: true,
              }
            }
          }
        }
      }
    });

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
    }

    // Extract CV information from candidates
    const personaCvs = persona.candidates
      .map(candidate => candidate.cv)
      .filter(cv => cv !== null && cv.fileUrl !== null)
      .map(cv => ({
        id: cv!.id,
        url: cv!.fileUrl,
        filename: cv!.originalFilename || 'CV Document'
      }));

    return NextResponse.json(personaCvs);
  } catch (error) {
    console.error('Error fetching persona CVs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch persona CVs' },
      { status: 500 }
    );
  }
}
