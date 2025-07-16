import { db } from '@/db';
import { personas } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const [persona] = await db
      .select()
      .from(personas)
      .where(eq(personas.id, params.id));

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
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const [updatedPersona] = await db
      .insert(personas)
      .values({ ...data, id: params.id })
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
  { params }: { params: { id: string } }
) {
  try {
    await db.delete(personas).where(eq(personas.id, params.id));

    return NextResponse.json({ message: 'persona deleted successfully' });
  } catch (error) {
    console.error('Error deleting persona:', error);
    return NextResponse.json(
      { error: 'Failed to delete persona' },
      { status: 500 }
    );
  }
}
