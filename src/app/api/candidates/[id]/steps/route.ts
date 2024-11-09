import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/utils/db/prisma';

export async function POST(
  request: NextRequest,
) {
  try {
    const { templateId, notes, groupId, candidateId } = await request.json();

    if (!groupId || !templateId || !candidateId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const step = await prisma.processStep.create({
      data: {
        notes,
        group: {
          connect: {
            id: groupId,
          },
        },
        template: {
          connect: {
            id: templateId,
          },
        },
        candidate: {
          connect: {
            id: candidateId,
          },
        },
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
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.processStep.delete({
      where: {
        id: params.id,
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
    const data = await request.json();

    const step = await prisma.processStep.update({
      where: {
        id: params.id,
      },
      data: data,
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
