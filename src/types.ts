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

export type Rating = {
  matchScore: number;
  summary: string;
  pros: string[];
  cons: string[];
} | null;

export interface CandidateView {
  id: string;

  cvFileKey?: string | null;
  notes?: string | null;

  personaId: string;
  persona: Persona;

  jobId: string;
  job: JobView;

  rating?: {
    matchScore: number;
    summary: string;
    pros: string[];
    cons: string[];
  } | null;
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

  rating?: Rating;

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

// RBAC Types
export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  metadata: Record<string, string>;
  roles?: string[];
};

export type Role = {
  id: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  metadata: Record<string, string>;
  permissions?: string[];
  users?: UserRole[];
};

export type Permission = {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  metadata: Record<string, string>;
};

export type UserRole = {
  id: string;
  userId: string;
  roleId: string;
  assignedBy?: string | null;
  assignedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  user?: User;
  role?: Role;
  assignedByUser?: User;
};

export type RolePermission = {
  id: string;
  roleId: string;
  permissionId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  role?: Role;
  permission?: Permission;
};

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
};

export type PermissionCheck = {
  resource: string;
  action: string;
};
