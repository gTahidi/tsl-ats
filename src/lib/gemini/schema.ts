import { z } from 'zod';

// Schema for contact information
export const ContactInfoSchema = z.object({
  name: z.string().optional(),
  surname: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedinUrl: z.string().url().optional(),
  website: z.string().url().optional(),
});

// Schema for work experience
export const WorkExperienceSchema = z.object({
  jobTitle: z.string(),
  company: z.string(),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().optional(),
});

// Schema for education
export const EducationSchema = z.object({
  institution: z.string(),
  degree: z.string(),
  fieldOfStudy: z.string().optional(),
  graduationDate: z.string().optional(),
});

// The main schema for the entire parsed CV
export const ParsedCvSchema = z.object({
  contactInfo: ContactInfoSchema,
  summary: z.string().optional().describe('A brief professional summary or objective from the CV.'),
  skills: z.array(z.string()).describe('A list of key skills, technologies, or competencies.'),
  workExperience: z.array(WorkExperienceSchema),
  education: z.array(EducationSchema),
  languages: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
});

// We can infer the TypeScript type directly from the schema
export type ParsedCv = z.infer<typeof ParsedCvSchema>;
