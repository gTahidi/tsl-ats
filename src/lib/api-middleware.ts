import { NextRequest, NextResponse } from 'next/server';
import { createRequestLogger } from './logger';

export interface APIContext {
  logger: ReturnType<typeof createRequestLogger>;
  startTime: number;
}

/**
 * API Request logging middleware for Next.js API routes
 * Provides consistent logging and tracing across all API endpoints
 */
export function withAPILogging<T = any>(
  handler: (request: NextRequest | Request, context: APIContext) => Promise<NextResponse<T>>,
  options: {
    operation: string;
    tracerName?: string;
    spanName?: string;
  }
) {
  const { operation } = options;

  return async function(request: NextRequest | Request): Promise<NextResponse<T>> {
    const startTime = Date.now();
    const url = new URL(request.url);
    const requestLogger = createRequestLogger(request, {
      'api.operation': operation,
    });

    requestLogger.info(`Processing ${request.method} ${url.pathname} request`, {
      'request.method': request.method,
      'request.path': url.pathname,
      'request.query': url.search,
      'request.user_agent': request.headers.get('user-agent') || 'unknown',
      'request.content_type': request.headers.get('content-type') || undefined,
    });

    const context: APIContext = {
      logger: requestLogger,
      startTime,
    };

    try {
      const response = await handler(request, context);
      const duration = Date.now() - startTime;

      requestLogger.info(`${request.method} ${url.pathname} request completed successfully`, {
        'response.status': response.status,
        'response.duration_ms': duration,
        'response.content_type': response.headers.get('content-type') || undefined,
      });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      requestLogger.error(`Failed to process ${request.method} ${url.pathname}`, error as Error, {
        'error.duration_ms': duration,
        'response.status': 500,
      });

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      ) as NextResponse<T>;
    }
  };
}

/**
 * Simple wrapper for API routes that only need basic logging without custom context
 */
export function withSimpleAPILogging<T = any>(
  handler: (request: NextRequest | Request) => Promise<NextResponse<T>>,
  operation: string
) {
  return withAPILogging(
    async (request, context) => {
      return handler(request);
    },
    { operation }
  );
}

/**
 * Middleware for database operations within API routes
 */
export function logDatabaseOperation(
  context: APIContext,
  operation: string,
  table?: string,
  additionalAttributes?: Record<string, any>
) {
  const dbLogger = context.logger.child({
    'db.operation': operation,
    'db.table': table,
    'db.system': 'postgresql',
    ...additionalAttributes,
  });
  
  return {
    info: (message: string, attributes?: Record<string, any>) =>
      dbLogger.info(message, attributes),
    error: (message: string, error?: Error, attributes?: Record<string, any>) =>
      dbLogger.error(message, error, attributes),
    warn: (message: string, attributes?: Record<string, any>) =>
      dbLogger.warn(message, attributes),
  };
}

/**
 * Middleware for external API calls within API routes
 */
export function logExternalAPI(
  context: APIContext,
  service: string,
  endpoint: string,
  additionalAttributes?: Record<string, any>
) {
  const extLogger = context.logger.child({
    'external.service': service,
    'external.endpoint': endpoint,
    ...additionalAttributes,
  });
  
  return {
    info: (message: string, attributes?: Record<string, any>) =>
      extLogger.info(message, attributes),
    error: (message: string, error?: Error, attributes?: Record<string, any>) =>
      extLogger.error(message, error, attributes),
    warn: (message: string, attributes?: Record<string, any>) =>
      extLogger.warn(message, attributes),
  };
}