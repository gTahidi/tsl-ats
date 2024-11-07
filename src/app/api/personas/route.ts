import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const personas = await prisma.persona.findMany();
    return NextResponse.json({ personas });
  } catch (error) {
    console.error('Failed to fetch personas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch personas' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const persona = await prisma.persona.create({
      data: {
        name: body.name,
        email: body.email,
        notes: body.notes || null,
      },
    });
    return NextResponse.json({ persona });
  } catch (error) {
    console.error('Failed to create persona:', error);
    return NextResponse.json(
      { error: 'Failed to create persona' },
      { status: 500 }
    );
  }
}
