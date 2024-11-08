import { Prisma } from '@prisma/client';

// Base Prisma types with relations
export type CandidateWithRelations = Prisma.CandidateGetPayload<{
  include: {
    persona: true;
    steps: true;
    job: true;
  }
}>;
