import { NextResponse } from 'next/server';
import { sendBulkEmailWithTemplate } from '@/lib/email';
import { db } from '@/db';
import { candidates, personas } from '@/db/schema';
import { inArray, eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const { candidateIds, templateAlias, templateModel } = await request.json();

    if (!Array.isArray(candidateIds) || !templateAlias || typeof templateModel !== 'object') {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const recipients = await db
      .select({
        email: personas.email,
        name: personas.name,
      })
      .from(candidates)
      .innerJoin(personas, eq(candidates.personaId, personas.id))
      .where(inArray(candidates.id, candidateIds));

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'No valid recipients found for the given IDs' }, { status: 404 });
    }

    await sendBulkEmailWithTemplate(recipients, templateAlias, templateModel);

    return NextResponse.json({ message: 'Bulk email sent successfully' });
  } catch (error) {
    console.error('API Error sending bulk email:', error);
    return NextResponse.json({ error: 'Failed to send bulk email' }, { status: 500 });
  }
}
