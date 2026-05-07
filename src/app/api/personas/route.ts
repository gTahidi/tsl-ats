import { NextResponse } from 'next/server';
import { db } from '@/db';
import { personas } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireCurrentAuthUser, isAuthResponse } from '@/lib/tenant';

export async function GET() {
  try {
    const authUser = await requireCurrentAuthUser();
    if (isAuthResponse(authUser)) return authUser;

    const allPersonas = await db.query.personas.findMany({
      where: eq(personas.organizationId, authUser.organizationId),
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
    const authUser = await requireCurrentAuthUser();
    if (isAuthResponse(authUser)) return authUser;

    const data = await request.json();
    const [newPersona] = await db.insert(personas).values({
      ...data,
      organizationId: authUser.organizationId,
    }).returning();
    return NextResponse.json(newPersona);
  } catch (error) {
    console.error('Error creating persona:', error);
    return NextResponse.json(
      { error: 'Failed to create persona' },
      { status: 500 }
    );
  }
}
