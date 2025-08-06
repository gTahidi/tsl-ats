import * as Sentry from '@sentry/nextjs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { BatchLogRecordProcessor, LoggerProvider as SDKLoggerProvider } from '@opentelemetry/sdk-logs';
import { logs } from '@opentelemetry/api-logs';
import { Resource } from '@opentelemetry/resources';

let initialized = false;

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
    
    // Initialize OpenTelemetry with minimal setup to avoid gRPC issues
    if (!initialized && process.env.OTEL_EXPORTER_OTLP_ENDPOINT && process.env.OTEL_EXPORTER_OTLP_HEADERS) {
      const serviceName = process.env.OTEL_SERVICE_NAME || 'tsl-ats';
      const serviceNamespace = process.env.OTEL_SERVICE_NAMESPACE || 'tsl-grp';
      const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
      const otlpHeaders = parseOtlpHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS);
      
      console.log('Initializing OpenTelemetry with Grafana Cloud OTLP Gateway');
      console.log('Service Name:', serviceName);
      console.log('Service Namespace:', serviceNamespace);
      console.log('OTLP Endpoint:', otlpEndpoint);

      try {
        // Configure log exporter to Grafana Cloud OTLP Gateway with optimized settings
        const logExporter = new OTLPLogExporter({
          url: `${otlpEndpoint}/v1/logs`,
          headers: otlpHeaders,
          timeoutMillis: 10000, // 10 second timeout
        });

        const logProcessor = new BatchLogRecordProcessor(logExporter, {
          maxQueueSize: 1000,
          exportTimeoutMillis: 5000,
          scheduledDelayMillis: 2000, // Export every 2 seconds
        });
        
        const loggerProvider = new SDKLoggerProvider({
          resource: new Resource({
            'service.name': serviceName,
            'service.namespace': serviceNamespace,
            'service.version': process.env.NEXT_PUBLIC_FARO_APP_VERSION || '1.0.0',
            'deployment.environment': process.env.NEXT_PUBLIC_FARO_ENVIRONMENT || 'production',
          }),
        });
        loggerProvider.addLogRecordProcessor(logProcessor);
        logs.setGlobalLoggerProvider(loggerProvider);

        console.log('OpenTelemetry logging configured for Grafana Cloud OTLP Gateway');
        
        initialized = true;
        console.log('OpenTelemetry initialized successfully with optimized setup');
        
      } catch (error) {
        console.error('Failed to initialize OpenTelemetry logging:', error);
      }
      
    } else if (!initialized) {
      console.warn('OpenTelemetry environment variables not found. Skipping initialization.');
    }
    
    // Graceful shutdown for Node.js environment
    process.on('SIGTERM', () => {
      if (initialized) {
        // Manual cleanup of providers if needed
        console.log('OpenTelemetry shutting down');
      }
      process.exit(0);
    });
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
