import { db } from '@/db';
import { processGroups, processStepTemplates, jobPostings, candidates, processSteps, cvs, cvChunks } from '@/db/schema';
import { and, eq, notInArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { requireCurrentAuthUser, isAuthResponse } from '@/lib/tenant';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const authUser = await requireCurrentAuthUser();
        if (isAuthResponse(authUser)) return authUser;

        const data = await request.json();

        const groupData: any = { ...data, organizationId: authUser.organizationId };
        if (groupData.createdAt) groupData.createdAt = new Date(groupData.createdAt);
        if (groupData.updatedAt) groupData.updatedAt = new Date(groupData.updatedAt);
        if (groupData.deletedAt) groupData.deletedAt = new Date(groupData.deletedAt);
        delete groupData.steps;

        const updatedGroup = await db.transaction(async (tx) => {
            // Update the process group itself
            await tx.update(processGroups).set(groupData).where(and(
                eq(processGroups.id, id),
                eq(processGroups.organizationId, authUser.organizationId),
            ));

            if (data.steps) {
                const stepIds = data.steps.map((s: any) => s.id).filter(Boolean);

                // Delete steps that are no longer in the list
                if (stepIds.length > 0) {
                    await tx.delete(processStepTemplates).where(and(
                        eq(processStepTemplates.groupId, id),
                        eq(processStepTemplates.organizationId, authUser.organizationId),
                        notInArray(processStepTemplates.id, stepIds)
                    ));
                } else {
                    // If no steps are provided, delete all existing steps for the group
                    await tx.delete(processStepTemplates).where(and(
                        eq(processStepTemplates.groupId, id),
                        eq(processStepTemplates.organizationId, authUser.organizationId),
                    ));
                }

                // Upsert the remaining steps
                for (const step of data.steps) {
                    const stepData: any = { ...step, groupId: id, organizationId: authUser.organizationId };
                    if (stepData.createdAt) stepData.createdAt = new Date(stepData.createdAt);
                    if (stepData.updatedAt) stepData.updatedAt = new Date(stepData.updatedAt);

                    await tx.insert(processStepTemplates)
                        .values(stepData)
                        .onConflictDoUpdate({ target: processStepTemplates.id, set: stepData });
                }
            }

            return db.query.processGroups.findFirst({
                where: and(
                    eq(processGroups.id, id),
                    eq(processGroups.organizationId, authUser.organizationId),
                ),
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
        const authUser = await requireCurrentAuthUser();
        if (isAuthResponse(authUser)) return authUser;

        await db.transaction(async (tx) => {
            // Get all jobs for this process group
            const groupJobs = await tx.select({ id: jobPostings.id })
                .from(jobPostings)
                .where(and(
                    eq(jobPostings.processGroupId, id),
                    eq(jobPostings.organizationId, authUser.organizationId),
                ));
            
            // Delete all related data for each job
            for (const job of groupJobs) {
                // Get all candidates for this job
                const jobCandidates = await tx.select({ id: candidates.id, cvId: candidates.cvId })
                    .from(candidates)
                    .where(and(
                        eq(candidates.jobId, job.id),
                        eq(candidates.organizationId, authUser.organizationId),
                    ));
                
                // Delete all related data for each candidate
                for (const candidate of jobCandidates) {
                    // Delete process steps for this candidate
                    await tx.delete(processSteps).where(eq(processSteps.candidateId, candidate.id));
                    
                    // Delete CV and CV chunks if they exist
                    if (candidate.cvId) {
                        // First, nullify the cvId to remove the foreign key reference
                        await tx.update(candidates)
                            .set({ cvId: null })
                            .where(and(
                                eq(candidates.id, candidate.id),
                                eq(candidates.organizationId, authUser.organizationId),
                            ));
                        
                        // Now we can safely delete CV chunks and CV
                        await tx.delete(cvChunks).where(eq(cvChunks.cvId, candidate.cvId));
                        await tx.delete(cvs).where(and(
                            eq(cvs.id, candidate.cvId),
                            eq(cvs.organizationId, authUser.organizationId),
                        ));
                    }
                }
                
                // Delete all candidates for this job
                await tx.delete(candidates).where(and(
                    eq(candidates.jobId, job.id),
                    eq(candidates.organizationId, authUser.organizationId),
                ));
            }
            
            // Delete all jobs for this process group
            await tx.delete(jobPostings).where(and(
                eq(jobPostings.processGroupId, id),
                eq(jobPostings.organizationId, authUser.organizationId),
            ));
            
            // Delete any remaining process steps for this group
            await tx.delete(processSteps).where(and(
                eq(processSteps.groupId, id),
                eq(processSteps.organizationId, authUser.organizationId),
            ));
            
            // Delete process step templates for this group
            await tx.delete(processStepTemplates).where(and(
                eq(processStepTemplates.groupId, id),
                eq(processStepTemplates.organizationId, authUser.organizationId),
            ));
            
            // Finally, delete the process group
            await tx.delete(processGroups).where(and(
                eq(processGroups.id, id),
                eq(processGroups.organizationId, authUser.organizationId),
            ));
        });

        return NextResponse.json({ message: 'Process group deleted successfully' });
    } catch (error) {
        console.error('Error deleting process group:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json(
            { error: 'Failed to delete process group', details: errorMessage },
            { status: 500 }
        );
    }
}
