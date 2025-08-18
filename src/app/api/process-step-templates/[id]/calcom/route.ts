import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { processStepTemplates } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { calcomService } from '@/lib/calcom';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const template = await db.query.processStepTemplates.findFirst({ where: eq(processStepTemplates.id, id) });
    if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 });

    const meta: any = template.metadata || {};
    const value = meta.calcomEventTypeId ?? meta.calComEventTypeId;

    let eventType: any = null;
    if (value && Number.isFinite(Number(value))) {
      try {
        eventType = await calcomService.getEventTypeById(Number(value));
      } catch {
        eventType = null;
      }
    }

    return NextResponse.json({
      templateId: template.id,
      calcomEventTypeId: value ?? null,
      eventType,
    });
  } catch (error) {
    console.error('Error reading calcom config:', error);
    return NextResponse.json({ error: 'Failed to read config' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const raw = body.calcomEventTypeId ?? body.eventTypeId;
    if (raw === undefined || raw === null || `${raw}`.trim() === '') {
      return NextResponse.json({ error: 'calcomEventTypeId is required' }, { status: 400 });
    }

    const calcomEventTypeId = Number(raw);
    if (!Number.isFinite(calcomEventTypeId) || calcomEventTypeId <= 0) {
      return NextResponse.json({ error: 'calcomEventTypeId must be a positive number' }, { status: 400 });
    }

    // Verify event type exists on Cal.com
    const eventType = await calcomService.getEventTypeById(calcomEventTypeId);
    if (!eventType) {
      return NextResponse.json({ error: `Cal.com event type not found for id ${calcomEventTypeId}` }, { status: 404 });
    }

    const template = await db.query.processStepTemplates.findFirst({ where: eq(processStepTemplates.id, id) });
    if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 });

    const meta: any = template.metadata || {};
    const newMeta = { ...meta, calcomEventTypeId };

    const [updated] = await db
      .update(processStepTemplates)
      .set({ metadata: newMeta, updatedAt: new Date() })
      .where(eq(processStepTemplates.id, id))
      .returning();

    return NextResponse.json({
      templateId: updated.id,
      calcomEventTypeId,
      eventType,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    console.error('Error saving calcom event type id:', error);
    return NextResponse.json({ error: 'Failed to save config', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
