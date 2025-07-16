import { z } from 'zod';

// Schema for contact information
export const ContactInfoSchema = z.object({
  name: z.string().optional(),
  surname: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  location: z.string().nullable(),
  linkedinUrl: z.string().url().nullable(),
  githubUrl: z.string().url().nullable(),
  portfolioUrl: z.string().url().nullable(),
});

// Schema for work experience
export const WorkExperienceSchema = z.object({
  company: z.string(),
  jobTitle: z.string(),
  startDate: z.string(),
  endDate: z.string().optional(),
  current: z.boolean(),
  description: z.string().nullable(),
  achievements: z.array(z.string()).optional(),
});

// Schema for education
export const EducationSchema = z.object({
  institution: z.string(),
  degree: z.string(),
  field: z.string().nullable(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  current: z.boolean(),
});

// Schema for skills
export const SkillsSchema = z.object({
    languages: z.array(z.string()),
    frameworks: z.array(z.string()),
    tools: z.array(z.string()),
    methodologies: z.array(z.string()),
});

// Schema for certifications
export const CertificationSchema = z.object({
    name: z.string(),
    issuer: z.string().nullable(),
    date: z.string(),
    credentialUrl: z.string().url().nullable(),
});

// Schema for Ranking
export const CvRankingSchema = z.object({
  matchScore: z.number().min(0).max(100).describe('A score from 0-100 indicating how well the candidate matches the job description.'),
  summary: z.string().describe('A brief summary explaining the score, highlighting strengths and weaknesses.'),
  questions: z.array(z.object({
    question: z.string(),
    answer: z.string().describe('A detailed answer to the question based on the CV content.'),
  })).describe('Answers to key interview questions based on the CV.'),
});

// Schema for Referees
export const RefereeSchema = z.object({
    name: z.string(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    organization: z.string().optional(),
});

// The main schema for the entire parsed CV
export const ParsedCvSchema = z.object({
  contactInfo: ContactInfoSchema,
  workExperience: z.array(WorkExperienceSchema),
  education: z.array(EducationSchema),
  skills: SkillsSchema,
  projects: z.array(z.any()).optional(), // Define a proper schema if projects are expected
  certifications: z.array(CertificationSchema).optional(),
  ranking: CvRankingSchema, // Add ranking to the main schema
  referees: z.array(RefereeSchema).optional(), // Add referees to the main schema
});

// We can infer the TypeScript type directly from the schema
export type ParsedCv = z.infer<typeof ParsedCvSchema>;
export type CvRanking = z.infer<typeof CvRankingSchema>;
export type Referee = z.infer<typeof RefereeSchema>;
