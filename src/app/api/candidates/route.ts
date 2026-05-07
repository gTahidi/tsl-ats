import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { candidates, personas, processSteps } from '@/db/schema';
import { createCandidateWithInitialStep } from '@/utils/candidate-creation';
import { and, eq, inArray } from 'drizzle-orm';
import { requireCurrentAuthUser, isAuthResponse } from '@/lib/tenant';

import { createRequestLogger, createDatabaseLogger, logInfo, logError } from '@/lib/logger';



export async function GET(request: NextRequest) {
  // Create request-specific logger with context
  const requestLogger = createRequestLogger(request, {
    'api.operation': 'get_candidates',
  });

  const startTime = Date.now();
  
  try {
    const authUser = await requireCurrentAuthUser();
    if (isAuthResponse(authUser)) return authUser;

    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('jobId');
    const location = searchParams.get('location') || undefined;
    
    requestLogger.info('Processing GET candidates request', {
      'request.job_id': jobId || undefined,
      'request.has_job_filter': !!jobId,
    });

    const dbLogger = createDatabaseLogger('select', 'candidates', {
      'query.job_id': jobId || undefined,
      'query.location': location || undefined,
    });

    dbLogger.info('Executing candidates query');

    // Build dynamic filters
    const filters = [eq(candidates.organizationId, authUser.organizationId)] as any[];
    if (jobId) filters.push(eq(candidates.jobId, jobId));

    if (location) {
      // Find personas with matching location
      const personaRows = await db
        .select({ id: personas.id })
        .from(personas)
        .where(and(
          eq(personas.location, location),
          eq(personas.organizationId, authUser.organizationId),
        ));
      const personaIds = personaRows.map((p) => p.id);
      if (personaIds.length === 0) {
        dbLogger.info('No personas matched location filter', {
          'result.count': 0,
          'query.duration_ms': Date.now() - startTime,
        });
        return NextResponse.json([]);
      }
      filters.push(inArray(candidates.personaId, personaIds));
    }

    const whereClause = filters.length ? and(...filters) : undefined;

    const allCandidates = await db.query.candidates.findMany({
      where: whereClause,
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

    const responseData = allCandidates.map(c => ({
      ...c,
      persona: c.persona,
      job: c.job,
      steps: c.steps.map(s => ({
        ...s,
        template: s.template,
      })),
    }));

    requestLogger.info('GET candidates request completed successfully', {
      'response.candidate_count': responseData.length,
      'response.duration_ms': Date.now() - startTime,
      'response.status': 200,
    });

    return NextResponse.json(responseData);
  } catch (error) {
    const duration = Date.now() - startTime;
    
    requestLogger.error('Failed to fetch candidates', error as Error, {
      'error.duration_ms': duration,
      'response.status': 500,
    });

    return NextResponse.json(
      { error: 'Failed to fetch candidates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Create request-specific logger with context
  const requestLogger = createRequestLogger(request, {
    'api.operation': 'create_candidate',
  });

  const startTime = Date.now();
  
  try {
    const authUser = await requireCurrentAuthUser();
    if (isAuthResponse(authUser)) return authUser;

    requestLogger.info('Processing POST candidate request');

    const data = await request.json();

    requestLogger.info('Candidate creation data received', {
      'candidate.job_id': data.jobId,
      'candidate.persona_id': data.personaId,
      'candidate.has_cv': !!data.cvId,
      'candidate.source': data.source,
      'candidate.rating': data.rating,
    });

    const dbLogger = createDatabaseLogger('insert', 'candidates', {
      'transaction.type': 'create_candidate_with_step',
    });

    dbLogger.info('Starting candidate creation transaction');

    const newCandidate = await db.transaction(async (tx) => {
      return createCandidateWithInitialStep(tx, {
        organizationId: authUser.organizationId,
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

    requestLogger.info('POST candidate request completed successfully', {
      'candidate.id': newCandidate.id,
      'response.duration_ms': Date.now() - startTime,
      'response.status': 200,
    });

    return NextResponse.json(newCandidate);
  } catch (error) {
    const duration = Date.now() - startTime;
    
    requestLogger.error('Failed to create candidate', error as Error, {
      'error.duration_ms': duration,
      'response.status': 500,
    });

    return NextResponse.json(
      { error: 'Failed to create candidate' },
      { status: 500 }
    );
  }
}
