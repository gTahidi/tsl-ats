export type JobView = {
  id: string;
  organizationId: string;

  title: string;
  description?: string | null;
  linkedinUrl?: string | null;
  status: "Open" | "Closed" | "Draft";
  jdFileUrl?: string | null;
  jdText?: string | null;

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
  organizationId: string;

  name: string;
  surname: string;
  email: string;
  phone?: string | null;

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
  organizationId: string;

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
  qualified?: boolean;

  steps?: ProcessStep[];

  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;

  metadata: Record<string, string>;
}

export type ProcessGroup = {
  id: string;
  organizationId: string;

  name: string;

  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;

  steps?: ProcessStepTemplate[];

  metadata: Record<string, string>;
}


export type ProcessStepTemplate = {
  id: string;
  organizationId: string;

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
  organizationId: string;

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
  organizationId: string;
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
  organizationId: string;
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
  organizationId: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
  organization: {
    id: string;
    name: string;
    slug: string;
    subscriptionStatus: string;
    subscriptionPlan: string;
  };
};

export type PermissionCheck = {
  resource: string;
  action: string;
};

// Interview Types
export type InterviewRoom = {
  id: string;
  name: string;
  location?: string | null;
  is_active: string;
};

export type Interview = {
  id: string;
  applicationId: string;
  roomId?: string | null;
  calComBookingId?: string | null;
  startTime: Date;
  endTime: Date;
  createdAt?: Date;
  updatedAt?: Date;
  room?: InterviewRoom;
  candidate?: CandidateView;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  meetingUrl?: string;
  notes?: string;
};

export type InterviewView = Interview & {
  candidate: CandidateView;
  room: InterviewRoom;
};
