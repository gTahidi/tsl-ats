import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { processStepTemplates } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { calcomService } from '@/lib/calcom';

export const dynamic = 'force-dynamic';

function parseDateOrThrow(value: string, label: string): Date {
  const d = new Date(value);
  if (isNaN(d.getTime())) {
    throw new Error(`Invalid ${label} date: ${value}`);
  }
  return d;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const eventTypeIdParam = searchParams.get('eventTypeId');
    const templateIdParam = searchParams.get('templateId');
    const timeZone = searchParams.get('timeZone') || 'UTC';
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    const daysParam = searchParams.get('days');

    let eventTypeId: number | null = null;

    if (eventTypeIdParam) {
      const parsed = Number(eventTypeIdParam);
      if (!Number.isFinite(parsed)) {
        return NextResponse.json({ error: 'eventTypeId must be a number' }, { status: 400 });
      }
      eventTypeId = parsed;
    } else if (templateIdParam) {
      const template = await db.query.processStepTemplates.findFirst({
        where: eq(processStepTemplates.id, templateIdParam),
      });
      if (!template) {
        return NextResponse.json({ error: `process_step_template not found for id ${templateIdParam}` }, { status: 404 });
      }
      const meta: any = template.metadata || {};
      const metaEventTypeId = meta.calcomEventTypeId ?? meta.calComEventTypeId;
      if (!metaEventTypeId || !Number.isFinite(Number(metaEventTypeId))) {
        return NextResponse.json({ error: 'No calcomEventTypeId in process_step_templates.metadata' }, { status: 400 });
      }
      eventTypeId = Number(metaEventTypeId);
    } else {
      return NextResponse.json({ error: 'Provide eventTypeId or templateId' }, { status: 400 });
    }

    // Resolve date range
    let fromDate: Date;
    let toDate: Date;

    if (fromParam) {
      fromDate = parseDateOrThrow(fromParam, 'from');
    } else {
      fromDate = new Date();
    }

    if (toParam) {
      toDate = parseDateOrThrow(toParam, 'to');
    } else {
      const days = daysParam ? Number(daysParam) : 14;
      if (!Number.isFinite(days) || days <= 0) {
        return NextResponse.json({ error: 'days must be a positive number' }, { status: 400 });
      }
      toDate = new Date(fromDate.getTime() + days * 24 * 60 * 60 * 1000);
    }

    if (fromDate >= toDate) {
      return NextResponse.json({ error: 'from must be earlier than to' }, { status: 400 });
    }

    const slots = await calcomService.getSlots({
      eventTypeId: eventTypeId!,
      from: fromDate,
      to: toDate,
      timeZone,
    });

    return NextResponse.json(slots);
  } catch (error) {
    console.error('Error fetching slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch slots', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
