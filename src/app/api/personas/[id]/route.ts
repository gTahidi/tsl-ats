import { prisma } from '@/utils/db/prisma';
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const persona = await prisma.persona.findUnique({
      where: { id: params.id },
    });

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
    const persona = await prisma.persona.upsert({
      where: { id: params.id },
      update: data,
      create: data,
    });

    return NextResponse.json(persona);
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
    await prisma.persona.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'persona deleted successfully' });
  } catch (error) {
    console.error('Error deleting persona:', error);
    return NextResponse.json(
      { error: 'Failed to delete persona' },
      { status: 500 }
    );
  }
}
