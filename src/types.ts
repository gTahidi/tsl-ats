export type JobView = {
  id: string;

  title: string;
  description?: string | null;
  linkedinUrl?: string | null;
  status: "Open" | "Closed" | "Draft";

  createdAt: Date;
  updatedAt: Date;

  candidates?: CandidateView[];
};

export type Persona = {
  id: string;

  name: string;
  email: string;
  linkedinUrl?: string | null;
  notes?: string | null;

  createdAt: Date;
  updatedAt: Date;
};

export interface CandidateView {
  id: string;

  cvFileKey?: string | null;
  notes?: string | null;

  steps?: ProcessStep[];

  personaId: string;
  persona: Persona;

  jobId: string;
  job: JobView;

  createdAt: Date;
  updatedAt: Date;
}

export type ProcessStep = {
  id: string;
  type: "Backlog" | "Screen" | "Interview" | "Offer" | "Hired" | "Rejected";
  status: "Pending" | "Completed" | "Failed";

  notes?: string | null;
  date?: Date | null;

  createdAt: Date;
  updatedAt: Date;

  candidateId: string;
  candidate: CandidateView;
};
