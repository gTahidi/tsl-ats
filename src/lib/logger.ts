import { logs } from '@opentelemetry/api-logs';
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

// Create an OpenTelemetry logger instance
const otelLogger = logs.getLogger('tsl-ats-backend', '1.0.0');

export interface LogAttributes {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Enhanced logging utility with OpenTelemetry integration
 * Automatically includes trace correlation and structured attributes
 */
export class Logger {
  private serviceName: string;

  constructor(serviceName: string = 'tsl-ats-backend') {
    this.serviceName = serviceName;
  }

  /**
   * Get trace context from active span
   */
  private getTraceContext() {
    const span = trace.getActiveSpan();
    const spanContext = span?.spanContext();
    
    return {
      traceId: spanContext?.traceId,
      spanId: spanContext?.spanId,
      traceFlags: spanContext?.traceFlags,
    };
  }

  /**
   * Create base attributes for all log entries
   */
  private createBaseAttributes(attributes?: LogAttributes) {
    const traceContext = this.getTraceContext();
    
    return {
      'service.name': this.serviceName,
      'service.version': process.env.OTEL_SERVICE_VERSION || '1.0.0',
      'deployment.environment': process.env.NODE_ENV || 'development',
      ...traceContext,
      timestamp: new Date().toISOString(),
      ...attributes,
    };
  }

  /**
   * Log info level message
   */
  info(message: string, attributes?: LogAttributes) {
    otelLogger.emit({
      severityText: 'INFO',
      severityNumber: 9, // INFO level
      body: message,
      attributes: this.createBaseAttributes(attributes),
    });
  }

  /**
   * Log error level message
   */
  error(message: string, error?: Error, attributes?: LogAttributes) {
    const errorAttributes = error ? {
      'error.name': error.name,
      'error.message': error.message,
      'error.stack': error.stack,
      'error.type': error.constructor.name,
    } : {};

    otelLogger.emit({
      severityText: 'ERROR',
      severityNumber: 17, // ERROR level
      body: message,
      attributes: this.createBaseAttributes({
        ...errorAttributes,
        ...attributes,
      }),
    });

    // Also record the exception in the active span if available
    const span = trace.getActiveSpan();
    if (span && error) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    }
  }

  /**
   * Log warning level message
   */
  warn(message: string, attributes?: LogAttributes) {
    otelLogger.emit({
      severityText: 'WARN',
      severityNumber: 13, // WARN level
      body: message,
      attributes: this.createBaseAttributes(attributes),
    });
  }

  /**
   * Log debug level message
   */
  debug(message: string, attributes?: LogAttributes) {
    // Only log debug messages in development
    if (process.env.NODE_ENV === 'development') {
      otelLogger.emit({
        severityText: 'DEBUG',
        severityNumber: 5, // DEBUG level
        body: message,
        attributes: this.createBaseAttributes(attributes),
      });
    }
  }

  /**
   * Log trace level message (most verbose)
   */
  trace(message: string, attributes?: LogAttributes) {
    // Only log trace messages in development
    if (process.env.NODE_ENV === 'development') {
      otelLogger.emit({
        severityText: 'TRACE',
        severityNumber: 1, // TRACE level
        body: message,
        attributes: this.createBaseAttributes(attributes),
      });
    }
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalAttributes: LogAttributes): Logger {
    const childLogger = new Logger(this.serviceName);
    const originalCreateBaseAttributes = childLogger.createBaseAttributes.bind(childLogger);
    
    childLogger.createBaseAttributes = (attributes?: LogAttributes) => {
      return originalCreateBaseAttributes({
        ...additionalAttributes,
        ...attributes,
      });
    };
    
    return childLogger;
  }
}

// Create default logger instance
export const appLogger = new Logger();

// Convenience functions for quick access
export const logInfo = (message: string, attributes?: LogAttributes) => appLogger.info(message, attributes);
export const logError = (message: string, error?: Error, attributes?: LogAttributes) => appLogger.error(message, error, attributes);
export const logWarn = (message: string, attributes?: LogAttributes) => appLogger.warn(message, attributes);
export const logDebug = (message: string, attributes?: LogAttributes) => appLogger.debug(message, attributes);
export const logTrace = (message: string, attributes?: LogAttributes) => appLogger.trace(message, attributes);

/**
 * HTTP request logger middleware helper
 */
export function createRequestLogger(request: Request, additionalAttributes?: LogAttributes) {
  const url = new URL(request.url);
  
  return appLogger.child({
    'http.method': request.method,
    'http.url': request.url,
    'http.route': url.pathname,
    'http.user_agent': request.headers.get('user-agent') || 'unknown',
    'http.remote_addr': request.headers.get('x-forwarded-for') || 'unknown',
    ...additionalAttributes,
  });
}

/**
 * Database operation logger helper
 */
export function createDatabaseLogger(operation: string, table?: string, additionalAttributes?: LogAttributes) {
  return appLogger.child({
    'db.operation': operation,
    'db.table': table,
    'db.system': 'postgresql',
    ...additionalAttributes,
  });
}

/**
 * External API call logger helper
 */
export function createExternalAPILogger(service: string, endpoint: string, additionalAttributes?: LogAttributes) {
  return appLogger.child({
    'external.service': service,
    'external.endpoint': endpoint,
    ...additionalAttributes,
  });
}