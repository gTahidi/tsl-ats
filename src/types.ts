export type JobView = {
  id: string;

  title: string;
  description?: string | null;
  linkedinUrl?: string | null;
  status: "Open" | "Closed" | "Draft";

  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;

  candidates?: CandidateView[];

  processGroupId?: string | null;
  processGroup?: ProcessGroup;

  metadata: Record<string, string>;
};

export type Persona = {
  id: string;

  name: string;
  surname: string;
  email: string;

  location?: string | null;

  linkedinUrl?: string | null;
  notes?: string | null;

  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;

  candidates?: CandidateView[];

  metadata: Record<string, string>;
};

export interface CandidateView {
  id: string;

  cvFileKey?: string | null;
  notes?: string | null;

  personaId: string;
  persona: Persona;

  jobId: string;
  job: JobView;

  currentStepId: string;
  currentStep: ProcessStep;

  rating?: "Strong no hire" | "No hire" | "Maybe" | "Hire" | "Strong hire" | null;
  source?: "LinkedIn" | "Email" | "Referral" | "Other" | string | null;

  steps?: ProcessStep[];

  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;

  metadata: Record<string, string>;
}

export type ProcessGroup = {
  id: string;

  name: string;

  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;

  steps?: ProcessStepTemplate[];

  metadata: Record<string, string>;
}

export type ProcessStepTemplate = {
  id: string;

  order: number;
  name: "Backlog" | "Screen" | "Interview" | "Offer" | "Hired" | "Rejected";

  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;

  groupId: string;
  group: ProcessGroup;

  steps?: ProcessStep[];

  metadata: Record<string, string>;
};

export type ProcessStep = {
  id: string;

  status: "Pending" | "Completed" | "Failed";

  notes?: string | null;
  date?: Date | null;

  rating?: "Strong no hire" | "No hire" | "Maybe" | "Hire" | "Strong hire" | null;

  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;

  groupId: string;
  group: ProcessGroup;

  templateId: string;
  template: ProcessStepTemplate;

  candidates?: CandidateView[];

  metadata: Record<string, string>;
};
