
import { db } from '@/db';
import { candidates, jobPostings, processGroups, processSteps, processStepTemplates, referees } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { CvRanking, Referee } from '@/lib/gemini/schema';

// This type defines the expected shape of the transaction client from Drizzle.
// It's a bit complex, but ensures type safety within the function.
type DrizzleTransactionClient = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface CandidateUpdateData {
    candidateId: string;
    cvId: string;
    rating?: CvRanking;
    referees?: Referee[];
}

export interface CandidateCreationData {
    jobId: string;
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
    const insertPayload: typeof candidates.$inferInsert = {
        jobId: data.jobId,
        personaId: data.personaId,
        cvId: data.cvId,
    };

    if (data.notes) insertPayload.notes = data.notes;
    if (data.source) insertPayload.source = data.source;
    if (data.metadata) insertPayload.metadata = data.metadata;
    if (data.rating) insertPayload.rating = data.rating;

    const [newCandidate] = await tx.insert(candidates).values(insertPayload).returning();

    // 3. Create the first process step for this candidate.
    await tx.insert(processSteps).values({
        candidateId: newCandidate.id,
        templateId: initialStepTemplate.id,
        status: 'PENDING',
        groupId: job.processGroupId,
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
            candidateId: newCandidate.id, // FIX: Link referee to the new candidate
        }));
        await tx.insert(referees).values(refereeValues);
    }

    return newCandidate;
}

export async function updateCandidateWithNewCv(tx: DrizzleTransactionClient, data: CandidateUpdateData) {
    // 1. Update the candidate's main record with the new CV and rating
    const updatePayload: Partial<typeof candidates.$inferInsert> = {
        cvId: data.cvId,
        updatedAt: new Date(),
    };

    if (data.rating) {
        updatePayload.rating = data.rating;
    }

    const [updatedCandidate] = await tx
        .update(candidates)
        .set(updatePayload)
        .where(eq(candidates.id, data.candidateId))
        .returning();

    if (!updatedCandidate) {
        throw new Error('Failed to update candidate. Candidate not found.');
    }

    // 2. Insert new referees if they exist, associated with the new CV
    if (data.referees && data.referees.length > 0) {
        const refereeValues = data.referees.map(ref => ({
            ...ref,
            cvId: data.cvId, // Link new referees to the new CV
            candidateId: data.candidateId, // FIX: Link referee to the updated candidate
        }));
        await tx.insert(referees).values(refereeValues);
    }

    // 3. Optionally, you could add logic here to re-evaluate process steps
    //    or notify recruiters about the updated CV.

    return updatedCandidate;
}