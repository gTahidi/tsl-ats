import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { candidates, jobPostings, personas, interviews } from '@/db/schema';
import { and, eq, gte, ne } from 'drizzle-orm';
import { calcomService } from '@/lib/calcom';
import { sendInterviewInvitationEmail } from '@/lib/email';
import { createId } from '@paralleldrive/cuid2';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      candidateId,
      templateId,
      eventTypeId: eventTypeIdRaw,
      start,
      timeZone = 'UTC',
      lengthInMinutes = 60,
      interviewerEmail,
      interviewerName,
      interviewerTimeZone,
    } = body as {
      candidateId: string;
      templateId?: string;
      eventTypeId?: number | string;
      start: string;
      timeZone?: string;
      lengthInMinutes?: number;
      interviewerEmail?: string;
      interviewerName?: string;
      interviewerTimeZone?: string;
    };

    if (!candidateId) {
      return NextResponse.json({ error: 'candidateId is required' }, { status: 400 });
    }
    if (!start) {
      return NextResponse.json({ error: 'start (ISO string) is required' }, { status: 400 });
    }

    const startDate = new Date(start);
    if (isNaN(startDate.getTime())) {
      return NextResponse.json({ error: 'start must be a valid ISO date string' }, { status: 400 });
    }

    // Load candidate + persona + job
    const rows = await db
      .select({ candidate: candidates, persona: personas, job: jobPostings })
      .from(candidates)
      .leftJoin(personas, eq(personas.id, candidates.personaId))
      .leftJoin(jobPostings, eq(jobPostings.id, candidates.jobId))
      .where(eq(candidates.id, candidateId))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    const { candidate, persona, job } = rows[0];
    if (!persona || !persona.email) {
      return NextResponse.json({ error: 'Candidate persona or email missing' }, { status: 400 });
    }
    if (!job) {
      return NextResponse.json({ error: 'Candidate is not associated with a job' }, { status: 400 });
    }

    // Prevent duplicate future interviews for this candidate (basic guard)
    const existing = await db
      .select({ id: interviews.id })
      .from(interviews)
      .where(
        and(
          eq(interviews.candidateId, candidateId),
          gte(interviews.startTime, new Date()),
          ne(interviews.status, 'Cancelled' as any)
        )
      )
      .limit(1);
    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Candidate already has a scheduled/upcoming interview' },
        { status: 409 }
      );
    }

    // Resolve eventTypeId
    let eventTypeId: number | null = null;
    if (eventTypeIdRaw !== undefined && eventTypeIdRaw !== null && `${eventTypeIdRaw}`.trim() !== '') {
      const parsed = Number(eventTypeIdRaw);
      if (!Number.isFinite(parsed)) {
        return NextResponse.json({ error: 'eventTypeId must be a number' }, { status: 400 });
      }
      eventTypeId = parsed;
    } else if (templateId) {
      const tmpl = await db.query.processStepTemplates.findFirst({ where: eq((await import('@/db/schema')).processStepTemplates.id, templateId) });
      if (!tmpl) {
        return NextResponse.json({ error: `process_step_template not found for id ${templateId}` }, { status: 404 });
      }
      const meta: any = tmpl.metadata || {};
      const metaEventTypeId = meta.calcomEventTypeId ?? meta.calComEventTypeId;
      if (!metaEventTypeId || !Number.isFinite(Number(metaEventTypeId))) {
        return NextResponse.json({ error: 'No calcomEventTypeId in process_step_templates.metadata' }, { status: 400 });
      }
      eventTypeId = Number(metaEventTypeId);
    } else {
      return NextResponse.json({ error: 'Provide eventTypeId or templateId' }, { status: 400 });
    }

    const endDate = new Date(startDate.getTime() + lengthInMinutes * 60 * 1000);

    // Create booking on Cal.com
    const booking = await calcomService.createBooking({
      candidateName: `${persona.name ?? ''} ${persona.surname ?? ''}`.trim(),
      candidateEmail: persona.email,
      candidateTimeZone: timeZone,
      interviewerEmail,
      interviewerName,
      interviewerTimeZone,
      startTime: startDate,
      jobTitle: job.title ?? 'Interview',
      eventTypeId: eventTypeId!,
      lengthInMinutes,
      metadata: {
        candidateId,
        jobId: job.id,
        templateId: templateId ?? null,
      },
    });

    const bookingUid: string | null = booking?.data?.uid ?? null;
    const meetingUrl: string | null = booking?.data?.meetingUrl ?? null;

    // Persist interview
    const interviewId = createId();
    await db.insert(interviews).values({
      id: interviewId,
      candidateId,
      jobId: job.id,
      status: 'Scheduled' as any,
      startTime: startDate,
      endTime: endDate,
      calComBookingId: bookingUid,
      meetingUrl,
    });

    // Send invitation email
    if (persona.email && meetingUrl) {
      await sendInterviewInvitationEmail(
        persona.email,
        `${persona.name ?? ''} ${persona.surname ?? ''}`.trim(),
        job.title ?? 'the position',
        meetingUrl
      );
    }

    return NextResponse.json({
      id: interviewId,
      calComBookingId: bookingUid,
      meetingUrl,
      startTime: startDate,
      endTime: endDate,
    });
  } catch (error) {
    console.error('Error booking interview:', error);
    return NextResponse.json({ error: 'Failed to book interview', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
