import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobPostings, processGroups } from '@/db/schema';
import { uploadFile } from '@/lib/azure-storage';
import { extractTextWithGemini } from '@/lib/gemini/text-extractor';
import { withAPILogging, logDatabaseOperation, logExternalAPI } from '@/lib/api-middleware';
import { requireCurrentAuthUser, isAuthResponse } from '@/lib/tenant';
import { and, eq } from 'drizzle-orm';

export const GET = withAPILogging(async (request, context) => {
  const authUser = await requireCurrentAuthUser();
  if (isAuthResponse(authUser)) return authUser;

  const dbLogger = logDatabaseOperation(context, 'select', 'jobPostings', {
    'query.includes_relations': true,
    'auth.organization_id': authUser.organizationId,
  });

  dbLogger.info('Executing jobs query with relations');

  const jobs = await db.query.jobPostings.findMany({
    where: eq(jobPostings.organizationId, authUser.organizationId),
    orderBy: (table, { desc }) => desc(table.createdAt),
    with: {
      processGroup: true,
      candidates: {
        with: {
          persona: true,
          steps: true,
        },
      },
    },
  });

  dbLogger.info('Jobs query completed successfully', {
    'result.count': jobs.length,
    'query.duration_ms': Date.now() - context.startTime,
  });

  const serializableJobs = jobs.map(job => ({
    ...job,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    processGroup: job.processGroup ? {
      ...job.processGroup,
      createdAt: job.processGroup.createdAt.toISOString(),
      updatedAt: job.processGroup.updatedAt.toISOString(),
      deletedAt: job.processGroup.deletedAt ? job.processGroup.deletedAt.toISOString() : null,
    } : null,
    candidates: job.candidates.map(candidate => ({
      ...candidate,
      createdAt: candidate.createdAt.toISOString(),
      updatedAt: candidate.updatedAt.toISOString(),
      deletedAt: candidate.deletedAt ? candidate.deletedAt.toISOString() : null,
      persona: candidate.persona ? {
        ...candidate.persona,
        createdAt: candidate.persona.createdAt.toISOString(),
        updatedAt: candidate.persona.updatedAt.toISOString(),
        deletedAt: candidate.persona.deletedAt ? candidate.persona.deletedAt.toISOString() : null,
      } : null,
      steps: candidate.steps.map(step => ({
        ...step,
        createdAt: step.createdAt.toISOString(),
        updatedAt: step.updatedAt.toISOString(),
        deletedAt: step.deletedAt ? step.deletedAt.toISOString() : null,
      }))
    }))
  }));

  context.logger.info('Jobs data serialization completed', {
    'response.job_count': serializableJobs.length,
    'response.total_candidates': serializableJobs.reduce((total, job) => total + job.candidates.length, 0),
  });

  return NextResponse.json(serializableJobs);
}, { operation: 'get_jobs' });

export const POST = withAPILogging(async (request, context) => {
  const authUser = await requireCurrentAuthUser();
  if (isAuthResponse(authUser)) return authUser;

  const formData = await request.formData();
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const linkedinUrl = formData.get('linkedinUrl') as string;
  const status = formData.get('status') as string;
  const processGroupId = formData.get('processGroupId') as string;
  const jdFile = formData.get('jdFile') as File | null;

  // Log the job creation request data
  context.logger.info('Job creation request received', {
    'job.title': title,
    'job.status': status,
    'job.process_group_id': processGroupId,
    'job.has_jd_file': !!jdFile,
    'job.jd_file_size': jdFile?.size,
    'job.jd_file_type': jdFile?.type,
  });

  let jdFileUrl: string | undefined;
  let jdText: string | undefined;

  if (jdFile) {
    const fileLogger = logExternalAPI(context, 'azure-storage', 'uploadFile', {
      'file.name': jdFile.name,
      'file.size': jdFile.size,
      'file.type': jdFile.type,
    });

    fileLogger.info('Starting file upload to Azure Storage');
    
    // 1. Upload file to Azure
    jdFileUrl = await uploadFile(jdFile);
    
    fileLogger.info('File upload completed', {
      'file.url': jdFileUrl,
    });

    // 2. Parse text content using the utility function
    const geminiLogger = logExternalAPI(context, 'gemini-ai', 'extractText', {
      'file.name': jdFile.name,
      'file.size': jdFile.size,
    });

    geminiLogger.info('Starting text extraction with Gemini AI');
    jdText = await extractTextWithGemini(jdFile);
    
    geminiLogger.info('Text extraction completed', {
      'extracted_text.length': jdText?.length || 0,
    });
  }

  const [processGroup] = await db
    .select({ id: processGroups.id })
    .from(processGroups)
    .where(and(
      eq(processGroups.id, processGroupId),
      eq(processGroups.organizationId, authUser.organizationId),
    ))
    .limit(1);

  if (!processGroup) {
    return NextResponse.json(
      { error: 'Process group not found for this organization' },
      { status: 400 }
    );
  }

  const payload: Omit<typeof jobPostings.$inferInsert, 'id' | 'metadata'> = {
    organizationId: authUser.organizationId,
    title,
    description,
    linkedinUrl,
    status,
    processGroupId,
    jdFileUrl,
    jdText,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const dbLogger = logDatabaseOperation(context, 'insert', 'jobPostings', {
    'job.title': title,
    'job.has_jd_file': !!jdFileUrl,
  });

  dbLogger.info('Inserting new job posting');

  const [job] = await db.insert(jobPostings).values(payload).returning();

  dbLogger.info('Job posting created successfully', {
    'job.id': job.id,
    'job.title': job.title,
  });

  context.logger.info('Job creation completed successfully', {
    'job.id': job.id,
    'job.title': job.title,
    'processing.duration_ms': Date.now() - context.startTime,
  });

  return NextResponse.json(job);
}, { operation: 'create_job' });
