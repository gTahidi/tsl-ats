import * as Sentry from '@sentry/nextjs';
import { registerOTel } from '@vercel/otel';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
    
    // Register OpenTelemetry for Faro backend instrumentation
    registerOTel({
      serviceName: process.env.OTEL_SERVICE_NAME || 'unknown_service:node',
      spanProcessors: ['auto'],
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
