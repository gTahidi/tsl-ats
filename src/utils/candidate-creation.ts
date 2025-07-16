import { db } from '@/db';
import { candidates, jobPostings, processSteps, processStepTemplates } from '@/db/schema';
import { eq } from 'drizzle-orm';

// This type defines the expected shape of the transaction client from Drizzle.
// It's a bit complex, but ensures type safety within the function.
type DrizzleTransactionClient = Parameters<Parameters<typeof db.transaction>[0]>[0];

interface CandidateCreationData {
    jobId: string;
    personaId: string;
    cvId?: string;
    notes?: string;
    source?: string;
    rating?: number;
    metadata?: any;
}

export async function createCandidateWithInitialStep(tx: DrizzleTransactionClient, data: CandidateCreationData) {
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

    if (!job || !job.processGroup || job.processGroup.stepTemplates.length === 0) {
        throw new Error('Could not find the initial process step for the specified job.');
    }

    const initialStepTemplate = job.processGroup.stepTemplates[0];

    // 2. Create the new candidate.
    const [newCandidate] = await tx.insert(candidates).values({
        jobId: data.jobId,
        personaId: data.personaId,
        cvId: data.cvId,
        notes: data.notes,
        source: data.source,
        // Drizzle expects rating to be a string based on schema, ensure conversion if needed
        rating: data.rating ? String(data.rating) : undefined,
        metadata: data.metadata,
    }).returning();

    // 3. Create the first process step for this candidate.
    await tx.insert(processSteps).values({
        candidateId: newCandidate.id,
        templateId: initialStepTemplate.id,
        groupId: job.processGroupId,
        status: 'PENDING',
    });

    return newCandidate;
}
