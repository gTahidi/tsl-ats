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
      whereConditions.push(eq(interviews.applicationId, candidateId));
    }

    const allInterviews = await db.query.interviews.findMany({
      where: whereConditions.length > 0 ? whereConditions[0] : undefined,
      with: {
        room: true,
      },
      orderBy: [desc(interviews.startTime)],
    });

    // Fetch candidate details for each interview
    const interviewsWithDetails = await Promise.all(
      allInterviews.map(async (interview) => {
        const candidateDetails = await db.query.candidates.findFirst({
          where: eq(candidates.id, interview.applicationId),
          with: {
            persona: true,
            job: true,
          },
        });

        return {
          ...interview,
          candidate: candidateDetails,
          status: getInterviewStatus(interview.startTime, interview.endTime),
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


