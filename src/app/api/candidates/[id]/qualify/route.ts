import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { candidates, interviews, interviewRooms, jobPostings, cvs, personas } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { calcomService } from '@/lib/calcom';
import { sendInterviewInvitationEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { qualified } = await request.json();
    const candidateId = params.id;
    

    if (typeof qualified !== 'boolean') {
      return NextResponse.json(
        { error: 'qualified field must be a boolean' },
        { status: 400 }
      );
    }

    // Update candidate qualification status first
    const [updatedCandidate] = await db
      .update(candidates)
      .set({ 
        qualified: qualified ? 'true' : 'false',
        updatedAt: new Date()
      })
      .where(eq(candidates.id, candidateId))
      .returning();

    if (!updatedCandidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    // If not qualifying, we're done
    if (!qualified) {
      return NextResponse.json(updatedCandidate);
    }

    // If qualifying, proceed to create interview and book with Cal.com
    try {
      const candidateDetails = await db
        .select({
          candidate: candidates,
          job: jobPostings,
          cv: cvs,
          persona: personas
        })
        .from(candidates)
        .leftJoin(jobPostings, eq(candidates.jobId, jobPostings.id))
        .leftJoin(cvs, eq(candidates.cvId, cvs.id))
        .leftJoin(personas, eq(candidates.personaId, personas.id))
        .where(eq(candidates.id, candidateId))
        .limit(1);

      if (candidateDetails.length === 0) {
        throw new Error('Candidate details not found for interview creation');
      }

      const { job, cv, persona } = candidateDetails[0];

      // Check if there's already an interview for this candidate
      const existingInterview = await db
        .select()
        .from(interviews)
        .where(eq(interviews.applicationId, candidateId))
        .limit(1);

      if (existingInterview.length > 0) {
        // Interview already exists, no action needed
        return NextResponse.json(updatedCandidate);
      }

      // Schedule interview 24 hours from now (default)
      const interviewStartTime = new Date();
      interviewStartTime.setHours(interviewStartTime.getHours() + 24);
      const interviewEndTime = new Date(interviewStartTime.getTime() + 60 * 60 * 1000); // 1-hour interview

      let calcomBookingUid: string | null = null;

      try {
        // Create Cal.com booking with Google Meet
        const calcomBooking = await calcomService.createBooking({
          candidateName: `${persona?.name} ${persona?.surname}`,
          candidateEmail: persona?.email || '',
          candidateTimeZone: 'UTC', // Default timezone, could be enhanced
          startTime: interviewStartTime,
          lengthInMinutes: 60,
          jobTitle: `Interview for ${job?.title}`,
          eventTypeSlug: 'interview',
          username: 'interviewer', // This should be configurable
          metadata: {
            candidateId,
            jobId: job?.id || '',
            jobTitle: job?.title || '',
            candidateName: `${persona?.name} ${persona?.surname}`,
            candidateEmail: persona?.email || '',
            cvId: cv?.id || '',
            cvUrl: cv?.fileUrl || '',
            jobDescription: job?.description || job?.jdText || ''
          }
        });
        calcomBookingUid = calcomBooking.data.uid;

        console.log(`Interview scheduled via Cal.com for candidate ${candidateId}:`, {
          bookingId: calcomBooking.data.uid,
          meetingUrl: calcomBooking.data.meetingUrl,
          startTime: interviewStartTime.toISOString()
        });

        // Send interview invitation email
        if (persona?.email && calcomBooking.data.meetingUrl) {
          sendInterviewInvitationEmail(
            persona.email,
            `${persona.name} ${persona.surname}`.trim(),
            job?.title || 'the position',
            calcomBooking.data.meetingUrl
          );
        }

      } catch (calcomError) {
        console.error('Failed to create Cal.com booking, creating interview without scheduling:', calcomError);
        // Proceed to create interview record without Cal.com booking ID
      }

      // Use a transaction for creating room and interview records
      await db.transaction(async (tx) => {
        // Get or create a default interview room
        let room = await tx
          .select()
          .from(interviewRooms)
          .where(eq(interviewRooms.is_active, 'true'))
          .limit(1);

        if (room.length === 0) {
          const [newRoom] = await tx
            .insert(interviewRooms)
            .values({
              id: createId(),
              name: 'Virtual Interview Room',
              location: 'Google Meet',
              is_active: 'true'
            })
            .returning();
          room = [newRoom];
        }

        // Create interview record with or without Cal.com booking details
        const interviewData = {
          id: createId(),
          applicationId: candidateId,
          roomId: room[0].id,
          startTime: interviewStartTime,
          endTime: interviewEndTime,
          calComBookingId: calcomBookingUid
        };

        await tx.insert(interviews).values(interviewData);
      });

      return NextResponse.json(updatedCandidate);

    } catch (error) {
      console.error('Error during interview creation process:', error);
      // Return the successfully updated candidate but acknowledge the interview creation failure
      return NextResponse.json({
        message: 'Candidate qualified, but failed to create interview.',
        error: error instanceof Error ? error.message : String(error),
        candidate: updatedCandidate
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error updating candidate qualification:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update candidate qualification',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}