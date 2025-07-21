import { db } from '@/db';
import { processGroups, processStepTemplates } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const groups = await db.query.processGroups.findMany({
            orderBy: (table, { desc }) => desc(table.createdAt),
            with: {
                stepTemplates: {
                    orderBy: (table, { asc }) => asc(table.order),
                },
            },
        });

        const serializableGroups = groups.map(group => ({
            ...group,
            createdAt: group.createdAt.toISOString(),
            updatedAt: group.updatedAt.toISOString(),
            deletedAt: group.deletedAt ? group.deletedAt.toISOString() : null,
            stepTemplates: group.stepTemplates.map(step => ({
                ...step,
                createdAt: step.createdAt.toISOString(),
                updatedAt: step.updatedAt.toISOString(),
                deletedAt: step.deletedAt ? step.deletedAt.toISOString() : null,
            }))
        }));

        return NextResponse.json(serializableGroups);
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

        // Sanitize group data by converting date strings to Date objects
        const groupData: any = { ...data };
        if (groupData.createdAt) groupData.createdAt = new Date(groupData.createdAt);
        if (groupData.updatedAt) groupData.updatedAt = new Date(groupData.updatedAt);
        if (groupData.deletedAt) groupData.deletedAt = new Date(groupData.deletedAt);
        delete groupData.steps; // Remove steps from group data to avoid inserting it as a column

        const group = await db.transaction(async (tx) => {
            const [upserted] = await tx
                .insert(processGroups)
                .values(groupData)
                .onConflictDoUpdate({ target: processGroups.id, set: groupData })
                .returning();

            if (data.steps) {
                for (const step of data.steps) {
                    // Sanitize step data
                    const stepData: any = { ...step };
                    if (stepData.createdAt) stepData.createdAt = new Date(stepData.createdAt);
                    if (stepData.updatedAt) stepData.updatedAt = new Date(stepData.updatedAt);
                    if (stepData.deletedAt) stepData.deletedAt = new Date(stepData.deletedAt);

                    await tx
                        .insert(processStepTemplates)
                        .values({ ...stepData, groupId: upserted.id })
                        .onConflictDoUpdate({ target: processStepTemplates.id, set: stepData });
                }
            }

            return db.query.processGroups.findFirst({
                where: eq(processGroups.id, upserted.id),
                with: {
                    stepTemplates: true,
                },
            });
        });

        // Manually serialize the object to handle Date objects
        const serializableGroup = group ? {
            ...group,
            createdAt: group.createdAt.toISOString(),
            updatedAt: group.updatedAt.toISOString(),
            deletedAt: group.deletedAt ? group.deletedAt.toISOString() : null,
            stepTemplates: group.stepTemplates.map(step => ({
                ...step,
                createdAt: step.createdAt.toISOString(),
                updatedAt: step.updatedAt.toISOString(),
                deletedAt: step.deletedAt ? step.deletedAt.toISOString() : null,
            }))
        } : null;

        return NextResponse.json(serializableGroup);
    } catch (error) {
        console.error('Error upserting process group:', error);
        return NextResponse.json(
            { error: 'Failed to upsert process group' },
            { status: 500 }
        );
    }
}
