import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { interviews, interviewRooms, candidates, personas, jobPostings } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getInterviewStatus, getMeetingUrl } from '@/lib/interview-utils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const candidateId = searchParams.get('candidateId');

    // Build where conditions
    let whereConditions = [];
    if (candidateId) {
      whereConditions.push(eq(interviews.candidateId, candidateId));
    }

    const allInterviews = await db.query.interviews.findMany({
      where: whereConditions.length > 0 ? whereConditions[0] : undefined,
      with: {
        room: true,
      },
      orderBy: [desc(interviews.scheduledTime)],
    });

    // Fetch candidate details for each interview
    const interviewsWithDetails = await Promise.all(
      allInterviews.map(async (interview) => {
        const candidateDetails = await db.query.candidates.findFirst({
          where: eq(candidates.id, interview.candidateId),
          with: {
            persona: true,
            job: true,
          },
        });

        return {
          ...interview,
          candidate: candidateDetails,
          status: interview.scheduledTime
            ? getInterviewStatus(
                new Date(interview.scheduledTime),
                new Date(new Date(interview.scheduledTime).getTime() + 30 * 60000) // Assume 30 mins duration
              )
            : 'scheduled',
          meetingUrl: await getMeetingUrl(interview.calComBookingId),
        };
      })
    );

    // Filter by status if provided
    const filteredInterviews = status 
      ? interviewsWithDetails.filter(interview => interview.status === status)
      : interviewsWithDetails;

    return NextResponse.json(filteredInterviews);
  } catch (error) {
    console.error('Error fetching interviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interviews' },
      { status: 500 }
    );
  }
}


