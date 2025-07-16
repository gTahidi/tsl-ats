import { db } from '@/db';
import { candidates, jobPostings, processGroups, processSteps, processStepTemplates, referees } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { CvRanking, Referee } from '@/lib/gemini/schema';

// This type defines the expected shape of the transaction client from Drizzle.
// It's a bit complex, but ensures type safety within the function.
type DrizzleTransactionClient = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface CandidateCreationData {
    jobId: string; // Reverted to string to match the database schema
    personaId: string;
    cvId: string;
    notes?: string;
    source?: string;
    rating?: CvRanking;
    metadata?: any;
    referees?: Referee[];
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
        rating: data.rating, 
        metadata: data.metadata,
    }).returning();

    // 3. Create the first process step for this candidate.
    await tx.insert(processSteps).values({
        candidateId: newCandidate.id,
        templateId: initialStepTemplate.id,
        groupId: job.processGroupId,
        status: 'PENDING',
    });

    // 4. Insert referees if they exist
    if (data.referees && data.referees.length > 0) {
        // Ensure cvId is present before inserting referees
        if (!data.cvId) {
            throw new Error('cvId is required to insert referees.');
        }
        const refereeValues = data.referees.map(ref => ({
            ...ref,
            cvId: data.cvId, // Link referee to the CV
        }));
        await tx.insert(referees).values(refereeValues);
    }

    return newCandidate;
}
