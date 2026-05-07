import {
  pgTable,
  text,
  timestamp,
  jsonb,
  integer,
  uniqueIndex,
  vector,
  serial,
  pgEnum,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

const timestamps = {
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at'),
};

export const DEFAULT_ORGANIZATION_ID = 'tsl-default-org';

export const organizations = pgTable('organizations', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  websiteUrl: text('website_url'),
  billingEmail: text('billing_email'),
  subscriptionStatus: text('subscription_status').default('trialing').notNull(),
  subscriptionPlan: text('subscription_plan').default('starter').notNull(),
  trialEndsAt: timestamp('trial_ends_at'),
  metadata: jsonb('metadata').default({}).notNull(),
  ...timestamps,
});

export const organizationSubscriptions = pgTable('organization_subscriptions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  provider: text('provider').default('stub').notNull(),
  providerCustomerId: text('provider_customer_id'),
  providerSubscriptionId: text('provider_subscription_id'),
  plan: text('plan').default('starter').notNull(),
  status: text('status').default('trialing').notNull(),
  currentPeriodEndsAt: timestamp('current_period_ends_at'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false).notNull(),
  metadata: jsonb('metadata').default({}).notNull(),
  ...timestamps,
}, (table) => ({
  organizationSubscriptionUnique: uniqueIndex('organization_subscriptions_org_unique').on(table.organizationId),
}));

export const jobPostings = pgTable('job_postings', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  organizationId: text('organization_id')
    .notNull()
    .default(DEFAULT_ORGANIZATION_ID)
    .references(() => organizations.id),
  title: text('title').notNull(),
  description: text('description'),
  jdFileUrl: text('jd_file_url'),
  jdText: text('jd_text'),
  linkedinUrl: text('linkedin_url'),
  status: text('status').default('Open').notNull(),
  processGroupId: text('process_group_id').notNull().references(() => processGroups.id),
  metadata: jsonb('metadata').default({}).notNull(),
  ...timestamps,
});

export const personas = pgTable('personas', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  organizationId: text('organization_id')
    .notNull()
    .default(DEFAULT_ORGANIZATION_ID)
    .references(() => organizations.id),
  name: text('name').notNull(),
  surname: text('surname'),
  location: text('location'),
  email: text('email').notNull(),
  phone: text('phone'),
  linkedinUrl: text('linkedin_url'),
  metadata: jsonb('metadata').default({}).notNull(),
  ...timestamps,
}, (table) => ({
  personaOrganizationEmailUnique: uniqueIndex('personas_org_email_unique').on(table.organizationId, table.email),
}));

export const candidates = pgTable('candidates', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  organizationId: text('organization_id')
    .notNull()
    .default(DEFAULT_ORGANIZATION_ID)
    .references(() => organizations.id),
  notes: text('notes'),
  cvId: text('cv_id').unique().references(() => cvs.id),
  personaId: text('persona_id').notNull().references(() => personas.id),
  jobId: text('job_id').notNull().references(() => jobPostings.id),
  currentStepId: text('current_step_id'),
  rating: jsonb('rating'),
  source: text('source'),
  qualified: boolean('qualified').default(false).notNull(),
  metadata: jsonb('metadata').default({}).notNull(),
  ...timestamps,
}, (table) => ({
  // Prevent duplicate candidates for the same persona and job
  // candidatesJobPersonaUnique: uniqueIndex('candidates_job_persona_unique').on(table.jobId, table.personaId),
}));

export const processGroups = pgTable('process_groups', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  organizationId: text('organization_id')
    .notNull()
    .default(DEFAULT_ORGANIZATION_ID)
    .references(() => organizations.id),
  name: text('name').notNull(),
  metadata: jsonb('metadata').default({}).notNull(),
  ...timestamps,
});

export const processStepTemplates = pgTable('process_step_templates', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  organizationId: text('organization_id')
    .notNull()
    .default(DEFAULT_ORGANIZATION_ID)
    .references(() => organizations.id),
  order: integer('order').notNull(),
  name: text('name').notNull(),
  groupId: text('group_id').notNull().references(() => processGroups.id),
  metadata: jsonb('metadata').default({}).notNull(),
  ...timestamps,
});

export const cvs = pgTable('cvs', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  organizationId: text('organization_id')
    .notNull()
    .default(DEFAULT_ORGANIZATION_ID)
    .references(() => organizations.id),
  content: jsonb('content').notNull(),
  fileUrl: text('file_url'),
  originalFilename: text('original_filename'),
  fileSize: integer('file_size'),
  mimeType: text('mime_type'),
  ...timestamps,
});

export const cvChunks = pgTable('cv_chunks', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  chunkText: text('chunk_text').notNull(),
  embedding: vector('embedding', { dimensions: 768 }).notNull(),
  metadata: jsonb('metadata').default({}).notNull(),
  cvId: text('cv_id').notNull().references(() => cvs.id),
});

export const referees = pgTable('referees', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  organization: text('organization'),
  cvId: text('cv_id').notNull().references(() => cvs.id),
  candidateId: text('candidate_id').references(() => candidates.id),
  ...timestamps,
});

export const processSteps = pgTable('process_steps', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  organizationId: text('organization_id')
    .notNull()
    .default(DEFAULT_ORGANIZATION_ID)
    .references(() => organizations.id),
  status: text('status').default('Pending').notNull(),
  notes: text('notes'),
  date: timestamp('date'),
  rating: text('rating'),
  groupId: text('group_id').notNull().references(() => processGroups.id),
  templateId: text('template_id').notNull().references(() => processStepTemplates.id),
  candidateId: text('candidate_id').notNull().references(() => candidates.id),
  metadata: jsonb('metadata').default({}).notNull(),
  ...timestamps,
});

// Relations
export const jobPostingsRelations = relations(jobPostings, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [jobPostings.organizationId],
    references: [organizations.id],
  }),
  processGroup: one(processGroups, {
    fields: [jobPostings.processGroupId],
    references: [processGroups.id],
  }),
  candidates: many(candidates),
}));

export const personasRelations = relations(personas, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [personas.organizationId],
    references: [organizations.id],
  }),
  candidates: many(candidates),
}));

export const candidatesRelations = relations(candidates, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [candidates.organizationId],
    references: [organizations.id],
  }),
  persona: one(personas, {
    fields: [candidates.personaId],
    references: [personas.id],
  }),
  job: one(jobPostings, {
    fields: [candidates.jobId],
    references: [jobPostings.id],
  }),
  cv: one(cvs, {
    fields: [candidates.cvId],
    references: [cvs.id],
  }),
  steps: many(processSteps, { relationName: 'CandidateSteps' }),
}));

export const processGroupsRelations = relations(processGroups, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [processGroups.organizationId],
    references: [organizations.id],
  }),
  jobs: many(jobPostings),
  stepTemplates: many(processStepTemplates),
  processSteps: many(processSteps),
}));

// Staging table for raw data from the legacy Excel file
export const legacyCandidates = pgTable('legacy_candidates', {
  id: serial('id').primaryKey(),
  name: text('name'),
  phoneNo: text('phone_no'),
  email: text('email'),
  paymentStatus: text('payment_status'),
  gender: text('gender'),
  yearsOfExperience: text('years_of_experience'),
  positionApplying1: text('position_applying_1'),
  positionApplying2: text('position_applying_2'),
  positionApplying3: text('position_applying_3'),
  dateOfReceivingCv: text('date_of_receiving_cv'),
  highestEducation: text('highest_education'),
  qualifications: text('qualifications'),
  universityOrInstitution: text('university_or_institution'),
  interviews: text('interviews'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const cvsRelations = relations(cvs, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [cvs.organizationId],
    references: [organizations.id],
  }),
  candidate: one(candidates),
  chunks: many(cvChunks),
  referees: many(referees),
}));

export const cvChunksRelations = relations(cvChunks, ({ one }) => ({
  cv: one(cvs, {
    fields: [cvChunks.cvId],
    references: [cvs.id],
  }),
}));

export const processStepTemplatesRelations = relations(processStepTemplates, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [processStepTemplates.organizationId],
    references: [organizations.id],
  }),
  group: one(processGroups, {
    fields: [processStepTemplates.groupId],
    references: [processGroups.id],
  }),
  steps: many(processSteps),
}));

export const processStepsRelations = relations(processSteps, ({ one }) => ({
  organization: one(organizations, {
    fields: [processSteps.organizationId],
    references: [organizations.id],
  }),
  group: one(processGroups, {
    fields: [processSteps.groupId],
    references: [processGroups.id],
  }),
  template: one(processStepTemplates, {
    fields: [processSteps.templateId],
    references: [processStepTemplates.id],
  }),
  candidate: one(candidates, {
    fields: [processSteps.candidateId],
    references: [candidates.id],
    relationName: 'CandidateSteps',
  }),
}));

export const refereesRelations = relations(referees, ({ one }) => ({
  cv: one(cvs, {
    fields: [referees.cvId],
    references: [cvs.id],
  }),
  candidate: one(candidates, {
    fields: [referees.candidateId],
    references: [candidates.id],
  }),
}));

// RBAC Tables
export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  organizationId: text('organization_id')
    .notNull()
    .default(DEFAULT_ORGANIZATION_ID)
    .references(() => organizations.id),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  isActive: text('is_active').default('true').notNull(),
  lastLoginAt: timestamp('last_login_at'),
  calComUsername: text('cal_com_username').unique(),
  metadata: jsonb('metadata').default({}).notNull(),
  ...timestamps,
});

export const interviewRooms = pgTable('interview_rooms', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  organizationId: text('organization_id')
    .notNull()
    .default(DEFAULT_ORGANIZATION_ID)
    .references(() => organizations.id),
  name: text('name').notNull().unique(),
  location: text('location'),
  is_active: text('is_active').default('true'),
});

export const interviewStatusEnum = pgEnum('interview_status', ['Scheduled', 'In Progress', 'Completed', 'Cancelled']);

export const interviews = pgTable('interviews', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  organizationId: text('organization_id')
    .notNull()
    .default(DEFAULT_ORGANIZATION_ID)
    .references(() => organizations.id),
  status: interviewStatusEnum('status').default('Scheduled').notNull(),
  startTime: timestamp('start_time', { withTimezone: true }),
  endTime: timestamp('end_time', { withTimezone: true }),
  notes: text('notes'),
  calComBookingId: text('cal_com_booking_id').unique(),
  meetingUrl: text('meeting_url'),
  candidateId: text('candidate_id').notNull().references(() => candidates.id, { onDelete: 'cascade' }),
  jobId: text('job_id').notNull().references(() => jobPostings.id, { onDelete: 'cascade' }),
  roomId: text('room_id').references(() => interviewRooms.id),
  ...timestamps,
});

export const interviewers = pgTable('interviewers', {
  interviewId: text('interview_id').notNull().references(() => interviews.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: uniqueIndex().on(table.interviewId, table.userId),
}));

export const idempotencyKeys = pgTable('idempotency_keys', {
    id: text('id').primaryKey(),
    status: text('status').notNull(),
    response: jsonb('response'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const roles = pgTable('roles', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  organizationId: text('organization_id')
    .notNull()
    .default(DEFAULT_ORGANIZATION_ID)
    .references(() => organizations.id),
  name: text('name').notNull(),
  description: text('description'),
  isSystem: text('is_system').default('false').notNull(), // System roles can't be deleted
  metadata: jsonb('metadata').default({}).notNull(),
  ...timestamps,
}, (table) => ({
  roleOrganizationNameUnique: uniqueIndex('roles_org_name_unique').on(table.organizationId, table.name),
}));

export const permissions = pgTable('permissions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').unique().notNull(),
  resource: text('resource').notNull(), // e.g., 'jobs', 'candidates', 'users'
  action: text('action').notNull(), // e.g., 'create', 'read', 'update', 'delete'
  description: text('description'),
  metadata: jsonb('metadata').default({}).notNull(),
  ...timestamps,
});

export const userRoles = pgTable('user_roles', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: text('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  assignedBy: text('assigned_by').references(() => users.id),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  ...timestamps,
}, (table) => ({
  userRoleUnique: uniqueIndex('user_role_unique').on(table.userId, table.roleId),
}));

export const rolePermissions = pgTable('role_permissions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  roleId: text('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: text('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  ...timestamps,
}, (table) => ({
  rolePermissionUnique: uniqueIndex('role_permission_unique').on(table.roleId, table.permissionId),
}));

// RBAC Relations
export const organizationsRelations = relations(organizations, ({ many, one }) => ({
  users: many(users),
  roles: many(roles),
  jobPostings: many(jobPostings),
  personas: many(personas),
  processGroups: many(processGroups),
  subscription: one(organizationSubscriptions, {
    fields: [organizations.id],
    references: [organizationSubscriptions.organizationId],
  }),
}));

export const organizationSubscriptionsRelations = relations(organizationSubscriptions, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationSubscriptions.organizationId],
    references: [organizations.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  userRoles: many(userRoles),
  assignedRoles: many(userRoles, { relationName: 'AssignedBy' }),
}));

export const rolesRelations = relations(roles, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [roles.organizationId],
    references: [organizations.id],
  }),
  userRoles: many(userRoles),
  rolePermissions: many(rolePermissions),
}));

export const interviewRoomsRelations = relations(interviewRooms, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [interviewRooms.organizationId],
    references: [organizations.id],
  }),
  interviews: many(interviews),
}));

export const interviewsRelations = relations(interviews, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [interviews.organizationId],
    references: [organizations.id],
  }),
  room: one(interviewRooms, {
    fields: [interviews.roomId],
    references: [interviewRooms.id],
  }),
  interviewers: many(interviewers),
}));

export const interviewersRelations = relations(interviewers, ({ one }) => ({
  interview: one(interviews, {
    fields: [interviewers.interviewId],
    references: [interviews.id],
  }),
  user: one(users, {
    fields: [interviewers.userId],
    references: [users.id],
  }),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
  assignedByUser: one(users, {
    fields: [userRoles.assignedBy],
    references: [users.id],
    relationName: 'AssignedBy',
  }),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));
