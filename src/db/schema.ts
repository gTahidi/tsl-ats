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
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

const timestamps = {
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at'),
};

export const jobPostings = pgTable('job_postings', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  title: text('title').notNull(),
  description: text('description'),
  linkedinUrl: text('linkedin_url'),
  status: text('status').default('Open').notNull(),
  processGroupId: text('process_group_id').notNull().references(() => processGroups.id),
  metadata: jsonb('metadata').default({}).notNull(),
  ...timestamps,
});

export const personas = pgTable('personas', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  surname: text('surname'),
  location: text('location'),
  email: text('email').unique().notNull(),
  linkedinUrl: text('linkedin_url'),
  metadata: jsonb('metadata').default({}).notNull(),
  ...timestamps,
});

export const candidates = pgTable('candidates', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  notes: text('notes'),
  cvId: text('cv_id').unique().references(() => cvs.id),
  personaId: text('persona_id').notNull().references(() => personas.id),
  jobId: text('job_id').notNull().references(() => jobPostings.id),
  currentStepId: text('current_step_id'),
  rating: jsonb('rating'),
  source: text('source'),
  metadata: jsonb('metadata').default({}).notNull(),
  ...timestamps,
});

export const processGroups = pgTable('process_groups', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  metadata: jsonb('metadata').default({}).notNull(),
  ...timestamps,
});

export const processStepTemplates = pgTable('process_step_templates', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  order: integer('order').notNull(),
  name: text('name').notNull(),
  groupId: text('group_id').notNull().references(() => processGroups.id),
  metadata: jsonb('metadata').default({}).notNull(),
  ...timestamps,
});

export const cvs = pgTable('cvs', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
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
  processGroup: one(processGroups, {
    fields: [jobPostings.processGroupId],
    references: [processGroups.id],
  }),
  candidates: many(candidates),
}));

export const personasRelations = relations(personas, ({ many }) => ({
  candidates: many(candidates),
}));

export const candidatesRelations = relations(candidates, ({ one, many }) => ({
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

export const processGroupsRelations = relations(processGroups, ({ many }) => ({
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
  group: one(processGroups, {
    fields: [processStepTemplates.groupId],
    references: [processGroups.id],
  }),
  steps: many(processSteps),
}));

export const processStepsRelations = relations(processSteps, ({ one }) => ({
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
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  isActive: text('is_active').default('true').notNull(),
  lastLoginAt: timestamp('last_login_at'),
  metadata: jsonb('metadata').default({}).notNull(),
  ...timestamps,
});

export const roles = pgTable('roles', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').unique().notNull(),
  description: text('description'),
  isSystem: text('is_system').default('false').notNull(), // System roles can't be deleted
  metadata: jsonb('metadata').default({}).notNull(),
  ...timestamps,
});

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
export const usersRelations = relations(users, ({ many }) => ({
  userRoles: many(userRoles),
  assignedRoles: many(userRoles, { relationName: 'AssignedBy' }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
  rolePermissions: many(rolePermissions),
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
