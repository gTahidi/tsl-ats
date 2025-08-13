import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { candidates, interviews, interviewRooms, jobPostings, cvs, personas } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { calcomService } from '@/lib/calcom';
import { sendInterviewInvitationEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

/// In your src/app/api/candidates/[id]/qualify/route.ts file

async function getOrCreateStaticEventType() {
  // FIX: Changed the slug to a new version to bypass the "stuck" slug on Cal.com
  const eventTypeSlug = 'static-interview-v2'; 
  
  // 1. First, try to GET the event type.
  let eventType = await calcomService.getEventTypeBySlug(eventTypeSlug);
  
  // 2. If it's found, return it immediately.
  if (eventType) {
    return eventType;
  }
  
  // 3. If not found, THEN try to CREATE it.
  try {
    console.log(`Static event type '${eventTypeSlug}' not found, creating a new one...`);
    eventType = await calcomService.createStaticEventType({
      title: 'Candidate Interview',
      slug: eventTypeSlug,
      lengthInMinutes: 60,
      description: 'A static event type for scheduling candidate interviews via the ATS.'
    });
    return eventType;
  } catch (error: any) {
    // 4. If creation fails due to a race condition, try to GET it one last time.
    if (error.message && error.message.includes("User already has an event type with this slug")) {
      console.warn(`Race condition detected for slug '${eventTypeSlug}'. Refetching...`);
      eventType = await calcomService.getEventTypeBySlug(eventTypeSlug);
      if (eventType) return eventType;
    }
    // If it still fails for any reason, throw a clear error.
    console.error(`Fatal: Could not resolve event type with slug '${eventTypeSlug}' after multiple attempts.`, error);
    throw new Error(`Could not initialize the interview scheduling configuration. Please check Cal.com for conflicting event types.`);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    console.log("DEBUG: typeof context.params =", typeof context.params);
    console.log("DEBUG: context.params raw value =", context.params);
    const { qualified } = await request.json();
    const awaitedParams = await context.params;
    console.log("DEBUG: awaitedParams =", awaitedParams);
    const candidateId = awaitedParams.id;

    if (typeof qualified !== 'boolean') {
      return NextResponse.json(
        { error: 'qualified field must be a boolean' },
        { status: 400 }
      );
    }

    console.log("DEBUG: Cal.com booking username configured as:", 'tasksavvy');

    // Update candidate qualification status first
    const [updatedCandidate] = await db
      .update(candidates)
      .set({ 
        qualified: qualified,
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

      if (!job || !job.id) {
        throw new Error(`Cannot create interview for candidate ${candidateId} because they are not associated with a valid job.`);
      }

      if (!persona || !persona.email) {
        console.error(`Cannot schedule interview for candidate ${candidateId} because their persona or email is missing.`);
        // You can either throw an error to stop the process, or just skip scheduling
        // Throwing an error is often better to make the problem visible.
        throw new Error(`Failed to schedule interview: Candidate persona or email is missing.`);
      }

      // Check if there's already an interview for this candidate
      const existingInterview = await db
        .select()
        .from(interviews)
        .where(eq(interviews.candidateId, candidateId))
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
      let meetingUrl: string | null = null;

      try {
        // Create Cal.com booking with Google Meet
        const staticEventType = await getOrCreateStaticEventType();
        if (!staticEventType || !staticEventType.id) {
          throw new Error('Failed to get or create a static event type for interviews.');
        }

        const calcomBooking = await calcomService.createBooking({
          candidateName: `${persona?.name} ${persona?.surname}`,
          candidateEmail: persona?.email || '',
          startTime: interviewStartTime,
          jobTitle: `Interview for ${job?.title}`,
          eventTypeId: staticEventType.id,
          lengthInMinutes: 60,
          interviewerEmail: 'hr@tasksavvy.org',
          metadata: {
            candidateId,
            jobId: job.id,
            jobTitle: job?.title || '',
            candidateName: `${persona?.name} ${persona?.surname}`,
            candidateEmail: persona?.email || '',
            cvId: cv?.id || '',
            cvUrl: cv?.fileUrl || '',
            jobDescription: job?.title || ''
          }
        });
        calcomBookingUid = calcomBooking.data.uid ?? null;
        meetingUrl = calcomBooking.data.meetingUrl ?? null;

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
          candidateId: candidateId,
          jobId: job.id,
          roomId: room[0].id,
          status: 'Scheduled' as const,
          scheduledTime: interviewStartTime,
          calComBookingId: calcomBookingUid,
          meetingUrl: meetingUrl || null,
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