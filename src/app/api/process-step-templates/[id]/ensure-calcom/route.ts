import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { processGroups, processStepTemplates } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { calcomService } from '@/lib/calcom';

export const dynamic = 'force-dynamic';

function slugify(input: string): string {
  return (input || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 48);
}

export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    const tmpl = await db.query.processStepTemplates.findFirst({ where: eq(processStepTemplates.id, id) });
    if (!tmpl) {
      return NextResponse.json({ error: `process_step_template not found for id ${id}` }, { status: 404 });
    }

    const grp = await db.query.processGroups.findFirst({ where: eq(processGroups.id, tmpl.groupId) });
    const meta: any = tmpl.metadata || {};

    const groupName = grp?.name || 'process';
    const stageName = tmpl.name || 'stage';

    // Deterministic slug to ensure consistency across runs for the same template
    const slug = `ats-${slugify(groupName)}-step-${tmpl.order}-${slugify(stageName)}-${tmpl.id.substring(0, 6)}`;
    const title = `${groupName} – ${stageName}`;

    // 1) If metadata already has an eventTypeId, verify it exists
    const existingRaw = meta.calcomEventTypeId ?? meta.calComEventTypeId;
    if (existingRaw && Number.isFinite(Number(existingRaw))) {
      const existingId = Number(existingRaw);
      try {
        const found = await calcomService.getEventTypeById(existingId);
        if (found) {
          return NextResponse.json({ templateId: tmpl.id, calcomEventTypeId: existingId, eventType: found });
        }
      } catch {
        // fall through to slug resolution
      }
    }

    // 2) Try resolve by slug
    let resolved = null as any;
    try {
      resolved = await calcomService.getEventTypeBySlug(slug);
    } catch (e) {
      // continue to creation
    }

    // 3) If not found, create static event type
    if (!resolved) {
      const lengthInMinutes = Number(meta.lengthInMinutes) && Number(meta.lengthInMinutes) > 0 ? Number(meta.lengthInMinutes) : 30;
      const created = await calcomService.createStaticEventType({ title, slug, lengthInMinutes, description: `ATS interview stage for ${title}` });
      resolved = created;
    }

    const newId = Number(resolved?.id ?? resolved?.data?.id);
    if (!Number.isFinite(newId)) {
      return NextResponse.json({ error: 'Failed to resolve or create Cal.com event type id' }, { status: 500 });
    }

    // 4) Persist to template metadata
    const newMeta = { ...meta, calcomEventTypeId: newId };
    const [updated] = await db
      .update(processStepTemplates)
      .set({ metadata: newMeta, updatedAt: new Date() })
      .where(eq(processStepTemplates.id, tmpl.id))
      .returning();

    return NextResponse.json({ templateId: updated.id, calcomEventTypeId: newId, eventType: resolved, slug });
  } catch (error) {
    console.error('Error ensuring calcom event type:', error);
    return NextResponse.json({ error: 'Failed to ensure calcom event type', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
