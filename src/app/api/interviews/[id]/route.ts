import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { interviews, candidates, personas, jobPostings } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const interviewId = params.id;

    const interview = await db.query.interviews.findFirst({
      where: eq(interviews.id, interviewId),
      with: {
        room: true,
      },
    });

    if (!interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }

    // Fetch candidate details
    const candidateDetails = await db.query.candidates.findFirst({
      where: eq(candidates.id, interview.applicationId),
      with: {
        persona: true,
        job: true,
      },
    });

    const interviewWithDetails = {
      ...interview,
      candidate: candidateDetails,
      status: getInterviewStatus(interview.startTime, interview.endTime),
      meetingUrl: await getMeetingUrl(interview.calComBookingId),
    };

    return NextResponse.json(interviewWithDetails);
  } catch (error) {
    console.error('Error fetching interview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interview' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const interviewId = params.id;
    const { notes, status } = await request.json();

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    const [updatedInterview] = await db
      .update(interviews)
      .set(updateData)
      .where(eq(interviews.id, interviewId))
      .returning();

    if (!updatedInterview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      interview: updatedInterview,
    });
  } catch (error) {
    console.error('Error updating interview:', error);
    return NextResponse.json(
      { error: 'Failed to update interview' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const interviewId = params.id;

    // First get the interview to check if it has a Cal.com booking
    const interview = await db.query.interviews.findFirst({
      where: eq(interviews.id, interviewId),
    });

    if (!interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }

    // If there's a Cal.com booking, we should cancel it
    if (interview.calComBookingId) {
      try {
        const { calcomService } = await import('@/lib/calcom');
        await calcomService.cancelBooking(interview.calComBookingId, 'Interview cancelled');
      } catch (calcomError) {
        console.error('Failed to cancel Cal.com booking:', calcomError);
        // Continue with deletion even if Cal.com cancellation fails
      }
    }

    // Delete the interview record
    await db
      .delete(interviews)
      .where(eq(interviews.id, interviewId));

    return NextResponse.json({
      success: true,
      message: 'Interview cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling interview:', error);
    return NextResponse.json(
      { error: 'Failed to cancel interview' },
      { status: 500 }
    );
  }
}

function getInterviewStatus(startTime: Date, endTime: Date): 'scheduled' | 'in_progress' | 'completed' | 'cancelled' {
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (now < start) {
    return 'scheduled';
  } else if (now >= start && now <= end) {
    return 'in_progress';
  } else {
    return 'completed';
  }
}

async function getMeetingUrl(calComBookingId: string | null): Promise<string | null> {
  if (!calComBookingId) return null;
  
  // In a real implementation, you might fetch this from Cal.com API
  // For now, we'll return a placeholder or stored URL
  return `https://meet.google.com/generated-from-calcom-${calComBookingId}`;
}
