import { db } from '@/db';
import { processSteps } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [processStep] = await db
      .select()
      .from(processSteps)
      .where(eq(processSteps.id, id));

    if (!processStep) {
      return NextResponse.json(
        { error: 'process step not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(processStep);
  } catch (error) {
    console.error('Error fetching processStep:', error);
    return NextResponse.json(
      { error: 'Failed to fetch process step' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
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
    console.error('Error updating process step:', error);
    return NextResponse.json(
      { error: 'Failed to update process step' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.delete(processSteps).where(eq(processSteps.id, id));

    return NextResponse.json({ message: 'Process step deleted successfully' });
  } catch (error) {
    console.error('Error deleting process step:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to delete process step', details: errorMessage },
      { status: 500 }
    );
  }
}
