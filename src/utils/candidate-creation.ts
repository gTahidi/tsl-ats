import { db } from '@/db';
import { candidates, jobPostings, processSteps } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export interface CreateCandidateData {
    jobId: string;
    personaId: string;
    cvId?: string;
    notes?: string;
    source?: string;
    rating?: string;
    metadata?: any;
}

export async function createCandidateWithInitialStep(data: CreateCandidateData) {
    return db.transaction(async (tx) => {
        // 1. Find the job's process group and the first step in the process.
        const job = await tx.query.jobPostings.findFirst({
            where: eq(jobPostings.id, data.jobId),
            with: {
                processGroup: {
                    with: {
                        stepTemplates: {
                            orderBy: (table, { asc }) => asc(table.order),
                            limit: 1,
                        },
                    },
                },
            },
        });

        const firstStepTemplate = job?.processGroup?.stepTemplates[0];
        if (!firstStepTemplate) {
            throw new Error('The job posting does not have any process steps configured.');
        }

        // 2. Create the Candidate.
        const [newCandidate] = await tx
            .insert(candidates)
            .values({
                id: createId(),
                ...data,
            })
            .returning();

        // 3. Create the initial ProcessStep.
        await tx.insert(processSteps).values({
            id: createId(),
            status: 'Pending',
            groupId: job.processGroupId,
            templateId: firstStepTemplate.id,
            candidateId: newCandidate.id,
        });

        // 4. Return the newly created candidate.
        return tx.query.candidates.findFirst({
            where: eq(candidates.id, newCandidate.id),
        });
    });
}
