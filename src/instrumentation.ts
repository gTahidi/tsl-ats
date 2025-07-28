import * as Sentry from '@sentry/nextjs';
import { Context } from '@opentelemetry/api';
import { Span as SpanInterface, SpanProcessor } from '@opentelemetry/sdk-trace-base';
import { registerOTel } from '@vercel/otel';

/**
 * Span processor to reduce cardinality of span names.
 *
 * Customize with care!
 */
class SpanNameProcessor implements SpanProcessor {
  forceFlush(): Promise<void> {
    return Promise.resolve();
  }
  onStart(span: SpanInterface, parentContext: Context): void {
    // Reduce cardinality of span names for static assets
    if (span.name.startsWith('GET /_next/static')) {
      span.updateName('GET /_next/static');
    } else if (span.name.startsWith('GET /_next/data')) {
      span.updateName('GET /_next/data');
    }
  }
  onEnd(): void {}
  shutdown(): Promise<void> {
    return Promise.resolve();
  }
}

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
    
    // Register OpenTelemetry for Faro backend instrumentation
    registerOTel({
      serviceName: process.env.OTEL_SERVICE_NAME || 'unknown_service:node',
      spanProcessors: ['auto', new SpanNameProcessor()],
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
