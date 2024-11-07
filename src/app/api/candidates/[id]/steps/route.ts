import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { type, status, notes } = await request.json();

    if (!type || !status) {
      return NextResponse.json(
        { error: 'Type and status are required' },
        { status: 400 }
      );
    }

    const step = await prisma.processStep.create({
      data: {
        type,
        status,
        notes,
        candidateId: params.id,
        date: new Date(),
      },
    });

    return NextResponse.json(step);
  } catch (error) {
    console.error('Error creating step:', error);
    return NextResponse.json(
      { error: 'Failed to create step' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const stepId = searchParams.get('stepId');

    if (!stepId) {
      return NextResponse.json(
        { error: 'Step ID is required' },
        { status: 400 }
      );
    }

    await prisma.processStep.delete({
      where: {
        id: stepId,
        candidateId: params.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting step:', error);
    return NextResponse.json(
      { error: 'Failed to delete step' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { stepId, type, status, notes } = await request.json();

    if (!stepId) {
      return NextResponse.json(
        { error: 'Step ID is required' },
        { status: 400 }
      );
    }

    const step = await prisma.processStep.update({
      where: {
        id: stepId,
        candidateId: params.id,
      },
      data: {
        type,
        status,
        notes,
      },
    });

    return NextResponse.json(step);
  } catch (error) {
    console.error('Error updating step:', error);
    return NextResponse.json(
      { error: 'Failed to update step' },
      { status: 500 }
    );
  }
}
