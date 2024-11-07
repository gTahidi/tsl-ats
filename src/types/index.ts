export interface Job {
  id: string;
  title: string;
  description?: string;
  linkedinUrl?: string;
  status: string;
}

export interface Persona {
  id: string;
  name: string;
  email: string;
  notes?: string;
}

export interface Candidate {
  id: string;
  linkedinUrl?: string;
  cvUrl?: string;
  notes?: string;
  personaId: string;
  jobId: string;
}
