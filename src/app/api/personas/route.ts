import { NextResponse } from 'next/server';
import { db } from '@/db';
import { personas } from '@/db/schema';

export async function GET() {
  try {
    const allPersonas = await db.query.personas.findMany({
      orderBy: (table, { desc }) => desc(table.createdAt),
    });
    return NextResponse.json(allPersonas);
  } catch (error) {
    console.error('Error fetching personas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch personas' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const [newPersona] = await db.insert(personas).values(data).returning();
    return NextResponse.json(newPersona);
  } catch (error) {
    console.error('Error creating persona:', error);
    return NextResponse.json(
      { error: 'Failed to create persona' },
      { status: 500 }
    );
  }
}
