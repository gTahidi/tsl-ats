export type JobView = {
  id: string;

  title: string;
  description?: string | null;
  linkedinUrl?: string | null;
  status: "Open" | "Closed" | "Draft";

  createdAt: Date;
  updatedAt: Date;

  candidates?: CandidateView[];

  processGroupId?: string | null;
  processGroup?: ProcessGroup;
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

  candidates?: CandidateView[];
};

export interface CandidateView {
  id: string;

  cvFileKey?: string | null;
  notes?: string | null;

  personaId: string;
  persona: Persona;

  jobId: string;
  job: JobView;

  currentStepId?: string | null;
  currentStep?: ProcessStep | null;

  createdAt: Date;
  updatedAt: Date;
}

export type ProcessGroup = {
  id: string;

  name: string;

  createdAt: Date;
  updatedAt: Date;

  steps?: ProcessStepTemplate[];
}

export type ProcessStepTemplate = {
  id: string;

  order: number;
  name: "Backlog" | "Screen" | "Interview" | "Offer" | "Hired" | "Rejected";

  createdAt: Date;
  updatedAt: Date;

  groupId: string;
  group: ProcessGroup;

  steps?: ProcessStep[];
};

export type ProcessStep = {
  id: string;

  status: "Pending" | "Completed" | "Failed";

  notes?: string | null;
  date?: Date | null;

  createdAt: Date;
  updatedAt: Date;

  groupId: string;
  group: ProcessGroup;

  templateId: string;
  template: ProcessStepTemplate;
};
