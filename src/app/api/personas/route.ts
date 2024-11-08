import { NextResponse } from 'next/server';
import { prisma } from '@/utils/db/prisma';

export async function GET() {
  try {
    const personas = await prisma.persona.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ personas });
  } catch (error) {
    console.error('Error fetching personas:', error);
    return NextResponse.json({ error: 'Failed to fetch personas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const persona = await prisma.persona.create({
      data: {
        name: data.name,
        email: data.email,
        notes: data.notes,
      },
    });
    return NextResponse.json(persona);
  } catch (error) {
    console.error('Error creating persona:', error);
    return NextResponse.json({ error: 'Failed to create persona' }, { status: 500 });
  }
}
