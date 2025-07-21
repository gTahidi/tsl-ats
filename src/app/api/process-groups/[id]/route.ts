import { db } from '@/db';
import { processGroups, processStepTemplates } from '@/db/schema';
import { and, eq, notInArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const data = await request.json();

        const groupData: any = { ...data };
        if (groupData.createdAt) groupData.createdAt = new Date(groupData.createdAt);
        if (groupData.updatedAt) groupData.updatedAt = new Date(groupData.updatedAt);
        if (groupData.deletedAt) groupData.deletedAt = new Date(groupData.deletedAt);
        delete groupData.steps;

        const updatedGroup = await db.transaction(async (tx) => {
            // Update the process group itself
            await tx.update(processGroups).set(groupData).where(eq(processGroups.id, id));

            if (data.steps) {
                const stepIds = data.steps.map((s: any) => s.id).filter(Boolean);

                // Delete steps that are no longer in the list
                if (stepIds.length > 0) {
                    await tx.delete(processStepTemplates).where(and(
                        eq(processStepTemplates.groupId, id),
                        notInArray(processStepTemplates.id, stepIds)
                    ));
                } else {
                    // If no steps are provided, delete all existing steps for the group
                    await tx.delete(processStepTemplates).where(eq(processStepTemplates.groupId, id));
                }

                // Upsert the remaining steps
                for (const step of data.steps) {
                    const stepData: any = { ...step, groupId: id };
                    if (stepData.createdAt) stepData.createdAt = new Date(stepData.createdAt);
                    if (stepData.updatedAt) stepData.updatedAt = new Date(stepData.updatedAt);

                    await tx.insert(processStepTemplates)
                        .values(stepData)
                        .onConflictDoUpdate({ target: processStepTemplates.id, set: stepData });
                }
            }

            return db.query.processGroups.findFirst({
                where: eq(processGroups.id, id),
                with: {
                    stepTemplates: true,
                },
            });
        });

        const serializableGroup = updatedGroup ? {
            ...updatedGroup,
            createdAt: updatedGroup.createdAt.toISOString(),
            updatedAt: updatedGroup.updatedAt.toISOString(),
            deletedAt: updatedGroup.deletedAt ? updatedGroup.deletedAt.toISOString() : null,
            stepTemplates: updatedGroup.stepTemplates.map(step => ({
                ...step,
                createdAt: step.createdAt.toISOString(),
                updatedAt: step.updatedAt.toISOString(),
                deletedAt: step.deletedAt ? step.deletedAt.toISOString() : null,
            }))
        } : null;

        return NextResponse.json(serializableGroup);
    } catch (error) {
        console.error('Error updating process group:', error);
        return NextResponse.json(
            { error: 'Failed to update process group' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await db.transaction(async (tx) => {
            await tx.delete(processStepTemplates).where(eq(processStepTemplates.groupId, id));
            await tx.delete(processGroups).where(eq(processGroups.id, id));
        });

        return NextResponse.json({ message: 'Process group deleted successfully' });
    } catch (error) {
        console.error('Error deleting process group:', error);
        return NextResponse.json(
            { error: 'Failed to delete process group' },
            { status: 500 }
        );
    }
}
