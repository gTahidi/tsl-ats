import {
  pgTable,
  text,
  timestamp,
  jsonb,
  integer,
  uniqueIndex,
  vector,
  serial,
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
  candidateId: text('candidate_id').notNull().references(() => candidates.id),
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
}));
