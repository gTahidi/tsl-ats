import * as Sentry from '@sentry/nextjs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { BatchLogRecordProcessor, LoggerProvider as SDKLoggerProvider } from '@opentelemetry/sdk-logs';
import { logs } from '@opentelemetry/api-logs';

let initialized = false;

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
    
    // Initialize OpenTelemetry with minimal setup to avoid gRPC issues
    if (!initialized && process.env.OTEL_EXPORTER_OTLP_ENDPOINT && process.env.OTEL_EXPORTER_OTLP_HEADERS) {
      const serviceName = process.env.OTEL_SERVICE_NAME || 'tsl-ats-backend';
      const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
      const otlpHeaders = parseOtlpHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS);
      
      console.log('Initializing OpenTelemetry with Grafana Cloud OTLP Gateway');
      console.log('Service Name:', serviceName);
      console.log('OTLP Endpoint:', otlpEndpoint);

      try {
        // Configure log exporter to Grafana Cloud OTLP Gateway (most important for our use case)
        const logExporter = new OTLPLogExporter({
          url: `${otlpEndpoint}/v1/logs`,
          headers: otlpHeaders,
        });

        const logProcessor = new BatchLogRecordProcessor(logExporter);
        const loggerProvider = new SDKLoggerProvider({
          processors: [logProcessor]
        });
        logs.setGlobalLoggerProvider(loggerProvider);

        console.log('OpenTelemetry logging configured for Grafana Cloud OTLP Gateway');
        
        // Use Vercel's built-in OTel for tracing to avoid module issues
        const { registerOTel } = await import('@vercel/otel');
        registerOTel({
          serviceName,
          spanProcessors: ['auto'],
        });
        
        initialized = true;
        console.log('OpenTelemetry initialized successfully with hybrid setup');
        
      } catch (error) {
        console.warn('Failed to initialize OpenTelemetry logging, falling back to Vercel OTel only:', error);
        
        // Complete fallback to basic Vercel OTel
        const { registerOTel } = await import('@vercel/otel');
        registerOTel({
          serviceName,
          spanProcessors: ['auto'],
        });
        initialized = true;
      }
      
    } else if (!process.env.OTEL_EXPORTER_OTLP_ENDPOINT && !initialized) {
      console.warn('Grafana Cloud OTLP Gateway credentials not found. Falling back to basic Vercel OTel.');
      
      // Fallback to basic Vercel OTel for development
      const { registerOTel } = await import('@vercel/otel');
      registerOTel({
        serviceName: process.env.OTEL_SERVICE_NAME || 'tsl-ats-backend',
        spanProcessors: ['auto'],
      });
      initialized = true;
    }
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

/**
 * Parse OTLP headers from environment variable format
 * Format: "key1=value1,key2=value2"
 */
function parseOtlpHeaders(headersString: string): Record<string, string> {
  const headers: Record<string, string> = {};
  
  if (!headersString) {
    return headers;
  }
  
  // Split by comma and parse key=value pairs
  const pairs = headersString.split(',');
  for (const pair of pairs) {
    const [key, ...valueParts] = pair.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('='); // Rejoin in case value contains '='
      headers[key.trim()] = value.trim();
    }
  }
  
  return headers;
}

export const onRequestError = Sentry.captureRequestError;

// Graceful shutdown - simplified since we're not using NodeSDK
process.on('SIGTERM', () => {
  if (initialized) {
    // Manual cleanup of providers if needed
    console.log('OpenTelemetry shutting down');
  }
  process.exit(0);
});
