import { db } from '@/db';
import { processGroups, processStepTemplates } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const groups = await db.query.processGroups.findMany({
            orderBy: (table, { desc }) => desc(table.createdAt),
            with: {
                stepTemplates: true,
            },
        });
        return NextResponse.json(groups);
    } catch (error) {
        console.error('Error fetching process groups:', error);
        return NextResponse.json(
            { error: 'Failed to fetch process groups' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();

        const group = await db.transaction(async (tx) => {
            const [upserted] = await tx
                .insert(processGroups)
                .values(data)
                .onConflictDoUpdate({ target: processGroups.id, set: data })
                .returning();

            if (data.steps) {
                for (const step of data.steps) {
                    await tx
                        .insert(processStepTemplates)
                        .values({ ...step, groupId: upserted.id })
                        .onConflictDoUpdate({ target: processStepTemplates.id, set: step });
                }
            }

            return db.query.processGroups.findFirst({
                where: eq(processGroups.id, upserted.id),
                with: {
                    stepTemplates: true,
                },
            });
        });

        return NextResponse.json(group);
    } catch (error) {
        console.error('Error upserting process group:', error);
        return NextResponse.json(
            { error: 'Failed to upsert process group' },
            { status: 500 }
        );
    }
}
