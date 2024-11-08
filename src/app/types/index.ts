import { Prisma } from '@prisma/client';

// Base Prisma types with relations
export type CandidateWithRelations = Prisma.CandidateGetPayload<{
  include: {
    persona: true;
    steps: true;
    job: true;
  }
}>;

// View types for UI components
export interface CandidateView {
  id: string;
  name: string;
  email: string;
  status: string;
  cvUrl: string | null;
  linkedinUrl: string | null;
  jobTitle?: string;
  createdAt: string;
  updatedAt: string;
}
