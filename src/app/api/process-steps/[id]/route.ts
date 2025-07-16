import { db } from '@/db';
import { processSteps } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const [processStep] = await db
      .select()
      .from(processSteps)
      .where(eq(processSteps.id, params.id));

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
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const [updatedStep] = await db
      .update(processSteps)
      .set(data)
      .where(eq(processSteps.id, params.id))
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
  { params }: { params: { id: string } }
) {
  try {
    await db.delete(processSteps).where(eq(processSteps.id, params.id));

    return NextResponse.json({ message: 'process step deleted successfully' });
  } catch (error) {
    console.error('Error deleting processs step:', error);
    return NextResponse.json(
      { error: 'Failed to delete processs tep' },
      { status: 500 }
    );
  }
}
