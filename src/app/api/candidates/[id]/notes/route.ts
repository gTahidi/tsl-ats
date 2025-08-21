import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { candidates } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyJWT } from '@/lib/jwt';
import { AuthUser } from '@/types';

async function getAuthenticatedUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth')?.value;
  if (!token) return null;

  const verifiedPayload = await verifyJWT(token);
  if (!verifiedPayload) return null;

  return verifiedPayload as unknown as AuthUser;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const candidate = await db.query.candidates.findFirst({
      where: eq(candidates.id, id),
      columns: { notes: true },
    });

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    const notes = candidate.notes ? JSON.parse(candidate.notes) : [];
    return NextResponse.json(notes);
  } catch (error) {
    console.error('API Error fetching candidate notes:', error);
    return NextResponse.json({ error: 'Failed to fetch candidate notes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { content } = await request.json();
    if (!content) {
      return NextResponse.json({ error: 'Note content is required' }, { status: 400 });
    }

    const candidate = await db.query.candidates.findFirst({
      where: eq(candidates.id, id),
      columns: { notes: true },
    });

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    const existingNotes = candidate.notes ? JSON.parse(candidate.notes) : [];
    const newNote = {
      id: `note_${Date.now()}`,
      content,
      author: `${user.firstName} ${user.lastName}`.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedNotes = [...existingNotes, newNote];

    await db
      .update(candidates)
      .set({ notes: JSON.stringify(updatedNotes) })
      .where(eq(candidates.id, id));

    return NextResponse.json(newNote, { status: 201 });
  } catch (error) {
    console.error('API Error adding candidate note:', error);
    return NextResponse.json({ error: 'Failed to add note' }, { status: 500 });
  }
}
