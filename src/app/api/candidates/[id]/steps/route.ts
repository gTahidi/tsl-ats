import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { processSteps } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { templateId, notes, groupId, candidateId } = await request.json();

    if (!groupId || !templateId || !candidateId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const [newStep] = await db
      .insert(processSteps)
      .values({
        notes,
        groupId,
        templateId,
        candidateId,
      })
      .returning();

    return NextResponse.json(newStep);
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.delete(processSteps).where(eq(processSteps.id, id));

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    const [updatedStep] = await db
      .update(processSteps)
      .set(data)
      .where(eq(processSteps.id, id))
      .returning();

    return NextResponse.json(updatedStep);
  } catch (error) {
    console.error('Error updating step:', error);
    return NextResponse.json(
      { error: 'Failed to update step' },
      { status: 500 }
    );
  }
}
