import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { interviews, candidates, personas, jobPostings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { calcomService } from '@/lib/calcom';
import { getInterviewStatus, getMeetingUrl } from '@/lib/interview-utils';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const interviewId = context.params.id;

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

    const candidateDetails = await db.query.candidates.findFirst({
      where: eq(candidates.id, interview.candidateId),
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
  context: { params: { id: string } }
) {
  try {
    const { startTime } = await request.json();
    const interviewId = context.params.id;

    if (!startTime || isNaN(new Date(startTime).getTime())) {
      return NextResponse.json(
        { error: 'A valid startTime is required for rescheduling' },
        { status: 400 }
      );
    }

    const existingInterview = await db.query.interviews.findFirst({
      where: eq(interviews.id, interviewId),
    });

    if (!existingInterview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }

    const newStartTime = new Date(startTime);
    const duration = existingInterview.endTime.getTime() - existingInterview.startTime.getTime();
    const newEndTime = new Date(newStartTime.getTime() + duration);

    if (existingInterview.calComBookingId) {
      try {
        await calcomService.rescheduleBooking(
          existingInterview.calComBookingId,
          newStartTime
        );
      } catch (error) {
        console.error('Failed to reschedule Cal.com booking:', error);
        return NextResponse.json(
          { error: 'Failed to reschedule Cal.com booking' },
          { status: 500 }
        );
      }
    }

    const [updatedInterview] = await db
      .update(interviews)
      .set({
        startTime: newStartTime,
        endTime: newEndTime,
        updatedAt: new Date(),
      })
      .where(eq(interviews.id, interviewId))
      .returning();

    return NextResponse.json(updatedInterview);
  } catch (error) {
    console.error('Error rescheduling interview:', error);
    return NextResponse.json(
      { error: 'Failed to reschedule interview' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const interviewId = context.params.id;

    const interview = await db.query.interviews.findFirst({
      where: eq(interviews.id, interviewId),
    });

    if (!interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }

    if (interview.calComBookingId) {
      try {
        await calcomService.cancelBooking(interview.calComBookingId);
      } catch (error) {
        console.error('Failed to cancel Cal.com booking:', error);
        return NextResponse.json(
          { error: 'Failed to cancel Cal.com booking' },
          { status: 500 }
        );
      }
    }

    await db.delete(interviews).where(eq(interviews.id, interviewId));

    return NextResponse.json({ message: 'Interview cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling interview:', error);
    return NextResponse.json(
      { error: 'Failed to cancel interview' },
      { status: 500 }
    );
  }
}
