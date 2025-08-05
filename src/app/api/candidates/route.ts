import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { candidates, processSteps } from '@/db/schema';
import { createCandidateWithInitialStep } from '@/utils/candidate-creation';
import { eq } from 'drizzle-orm';
import { trace } from '@opentelemetry/api';
import { createRequestLogger, createDatabaseLogger, logInfo, logError } from '@/lib/logger';

// Create a tracer for this module
const tracer = trace.getTracer('candidates-api', '1.0.0');

export async function GET(request: NextRequest) {
  // Create request-specific logger with context
  const requestLogger = createRequestLogger(request, {
    'api.operation': 'get_candidates',
  });

  return tracer.startActiveSpan('get-candidates', async (span) => {
    const startTime = Date.now();
    
    try {
      const searchParams = request.nextUrl.searchParams;
      const jobId = searchParams.get('jobId');
      
      // Log the incoming request
      requestLogger.info('Processing GET candidates request', {
        'request.job_id': jobId || undefined,
        'request.has_job_filter': !!jobId,
      });

      // Set span attributes
      span.setAttributes({
        'http.method': 'GET',
        'http.route': '/api/candidates',
        'candidates.job_id': jobId || 'all',
        'candidates.filtered': !!jobId,
      });

      // Database operation with logging
      const dbLogger = createDatabaseLogger('select', 'candidates', {
        'query.job_id': jobId || undefined,
      });

      dbLogger.info('Executing candidates query');

      const allCandidates = await db.query.candidates.findMany({
        where: jobId ? eq(candidates.jobId, jobId) : undefined,
        with: {
          persona: true,
          job: true,
          steps: {
            with: {
              template: true,
            },
          },
        },
        orderBy: (table, { desc }) => desc(table.createdAt),
      });

      dbLogger.info('Candidates query completed', {
        'result.count': allCandidates.length,
        'query.duration_ms': Date.now() - startTime,
      });

      // Manually construct the response to ensure all relations are included
      const responseData = allCandidates.map(c => ({
        ...c,
        persona: c.persona,
        job: c.job,
        steps: c.steps.map(s => ({
          ...s,
          template: s.template,
        })),
      }));

      // Log successful response
      requestLogger.info('GET candidates request completed successfully', {
        'response.candidate_count': responseData.length,
        'response.duration_ms': Date.now() - startTime,
        'response.status': 200,
      });

      // Set success metrics on span
      span.setAttributes({
        'candidates.count': responseData.length,
        'response.status_code': 200,
        'response.duration_ms': Date.now() - startTime,
      });

      return NextResponse.json(responseData);
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log the error with full context
      requestLogger.error('Failed to fetch candidates', error as Error, {
        'error.duration_ms': duration,
        'response.status': 500,
      });

      // Record exception in span
      span.recordException(error as Error);
      span.setAttributes({
        'error': true,
        'response.status_code': 500,
        'response.duration_ms': duration,
      });

      return NextResponse.json(
        { error: 'Failed to fetch candidates' },
        { status: 500 }
      );
    } finally {
      span.end();
    }
  });
}

export async function POST(request: Request) {
  // Create request-specific logger with context
  const requestLogger = createRequestLogger(request, {
    'api.operation': 'create_candidate',
  });

  return tracer.startActiveSpan('create-candidate', async (span) => {
    const startTime = Date.now();
    
    try {
      requestLogger.info('Processing POST candidate request');

      const data = await request.json();

      // Log the request data (excluding sensitive information)
      requestLogger.info('Candidate creation data received', {
        'candidate.job_id': data.jobId,
        'candidate.persona_id': data.personaId,
        'candidate.has_cv': !!data.cvId,
        'candidate.source': data.source,
        'candidate.rating': data.rating,
      });

      // Set span attributes
      span.setAttributes({
        'http.method': 'POST',
        'http.route': '/api/candidates',
        'candidate.job_id': data.jobId,
        'candidate.persona_id': data.personaId,
        'candidate.source': data.source || 'unknown',
        'candidate.has_cv': !!data.cvId,
      });

      // Database transaction with logging
      const dbLogger = createDatabaseLogger('insert', 'candidates', {
        'transaction.type': 'create_candidate_with_step',
      });

      dbLogger.info('Starting candidate creation transaction');

      const newCandidate = await db.transaction(async (tx) => {
        return createCandidateWithInitialStep(tx, {
          jobId: data.jobId,
          personaId: data.personaId,
          notes: data.notes,
          source: data.source,
          rating: data.rating,
          metadata: data.metadata,
          cvId: data.cvId,
        });
      });

      dbLogger.info('Candidate creation transaction completed', {
        'candidate.id': newCandidate.id,
        'transaction.duration_ms': Date.now() - startTime,
      });

      // Log successful creation
      requestLogger.info('POST candidate request completed successfully', {
        'candidate.id': newCandidate.id,
        'response.duration_ms': Date.now() - startTime,
        'response.status': 200,
      });

      // Set success metrics on span
      span.setAttributes({
        'candidate.id': newCandidate.id,
        'response.status_code': 200,
        'response.duration_ms': Date.now() - startTime,
      });

      return NextResponse.json(newCandidate);
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log the error with full context
      requestLogger.error('Failed to create candidate', error as Error, {
        'error.duration_ms': duration,
        'response.status': 500,
      });

      // Record exception in span
      span.recordException(error as Error);
      span.setAttributes({
        'error': true,
        'response.status_code': 500,
        'response.duration_ms': duration,
      });

      return NextResponse.json(
        { error: 'Failed to create candidate' },
        { status: 500 }
      );
    } finally {
      span.end();
    }
  });
}
