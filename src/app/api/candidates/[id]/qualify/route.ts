import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { candidates, interviews, interviewRooms, jobPostings, cvs, personas } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { calcomService } from '@/lib/calcom';

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

    // Start a transaction to handle both candidate update and interview creation
    const result = await db.transaction(async (tx) => {
      // Update candidate qualification status
      const [updatedCandidate] = await tx
        .update(candidates)
        .set({ 
          qualified: qualified ? 'true' : 'false',
          updatedAt: new Date()
        })
        .where(eq(candidates.id, candidateId))
        .returning();

      if (!updatedCandidate) {
        throw new Error('Candidate not found');
      }

      // If qualifying the candidate, create an interview record
      if (qualified) {
        // Get candidate details with job and CV information
        const candidateDetails = await tx
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
          throw new Error('Candidate details not found');
        }

        const { candidate, job, cv, persona } = candidateDetails[0];

        // Check if there's already an interview for this candidate
        const existingInterview = await tx
          .select()
          .from(interviews)
          .where(eq(interviews.applicationId, candidateId))
          .limit(1);

        if (existingInterview.length === 0) {
          // Get or create a default interview room
          let room = await tx
            .select()
            .from(interviewRooms)
            .where(eq(interviewRooms.is_active, 'true'))
            .limit(1);

          if (room.length === 0) {
            // Create a default interview room if none exists
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

          // Schedule interview 24 hours from now (default)
          const interviewStartTime = new Date();
          interviewStartTime.setHours(interviewStartTime.getHours() + 24);
          const interviewEndTime = new Date(interviewStartTime.getTime() + 60 * 60 * 1000); // 1-hour interview

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

            // Create interview record with Cal.com booking details
            const interviewData = {
              id: createId(),
              applicationId: candidateId,
              roomId: room[0].id,
              startTime: interviewStartTime,
              endTime: interviewEndTime,
              calComBookingId: calcomBooking.data.uid // Store Cal.com booking UID
            };

            await tx.insert(interviews).values(interviewData);

            console.log(`Interview scheduled via Cal.com for candidate ${candidateId}:`, {
              bookingId: calcomBooking.data.uid,
              meetingUrl: calcomBooking.data.meetingUrl,
              startTime: interviewStartTime.toISOString()
            });

          } catch (calcomError) {
            console.error('Failed to create Cal.com booking, creating interview without scheduling:', calcomError);
            
            // Fallback: create interview record without Cal.com booking
            const interviewData = {
              id: createId(),
              applicationId: candidateId,
              roomId: room[0].id,
              startTime: interviewStartTime,
              endTime: interviewEndTime,
              calComBookingId: null
            };

            await tx.insert(interviews).values(interviewData);
          }
        }
      }

      return updatedCandidate;
    });

    return NextResponse.json({
      success: true,
      candidate: result,
      message: qualified 
        ? 'Candidate qualified and moved to interview stage'
        : 'Candidate qualification status updated'
    });

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