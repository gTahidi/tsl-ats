import * as Sentry from '@sentry/nextjs';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { logs } from '@opentelemetry/api-logs';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { LoggerProvider as SDKLoggerProvider } from '@opentelemetry/sdk-logs';

let sdk: NodeSDK | undefined;

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
    
    // Initialize OpenTelemetry SDK for backend instrumentation
    if (!sdk && process.env.GRAFANA_CLOUD_API_KEY && process.env.GRAFANA_CLOUD_INSTANCE_ID) {
      const serviceName = process.env.OTEL_SERVICE_NAME || 'tsl-ats-backend';
      const serviceVersion = process.env.OTEL_SERVICE_VERSION || '1.0.0';
      
      // Create resource with service information
      const resourceAttributes: Record<string, string> = {};
      resourceAttributes[ATTR_SERVICE_NAME] = serviceName;
      resourceAttributes[ATTR_SERVICE_VERSION] = serviceVersion;
      resourceAttributes['deployment.environment'] = process.env.NODE_ENV || 'development';
      
      const resource = Resource.default().merge(new Resource(resourceAttributes));

      // Create authentication header for Grafana Cloud
      const authHeader = `Basic ${Buffer.from(`${process.env.GRAFANA_CLOUD_INSTANCE_ID}:${process.env.GRAFANA_CLOUD_API_KEY}`).toString('base64')}`;

      // Configure trace exporter to Grafana Cloud Tempo
      const traceExporter = process.env.GRAFANA_CLOUD_TEMPO_ENDPOINT 
        ? new OTLPTraceExporter({
            url: `${process.env.GRAFANA_CLOUD_TEMPO_ENDPOINT}/v1/traces`,
            headers: {
              'Authorization': authHeader,
            },
          })
        : undefined;

      // Configure metrics exporter to Grafana Cloud Prometheus
      const metricsExporter = process.env.GRAFANA_CLOUD_PROMETHEUS_ENDPOINT
        ? new OTLPMetricExporter({
            url: process.env.GRAFANA_CLOUD_PROMETHEUS_ENDPOINT,
            headers: {
              'Authorization': authHeader,
            },
          })
        : undefined;

      const metricReader = metricsExporter 
        ? new PeriodicExportingMetricReader({
            exporter: metricsExporter,
            exportIntervalMillis: 30000, // Export metrics every 30 seconds
          })
        : undefined;

      sdk = new NodeSDK({
        resource,
        
        // Auto-instrumentations for common libraries
        instrumentations: [getNodeAutoInstrumentations({
          // Disable noisy instrumentations
          '@opentelemetry/instrumentation-fs': {
            enabled: false,
          },
          '@opentelemetry/instrumentation-dns': {
            enabled: false,
          },
          // Enable HTTP instrumentation for API routes
          '@opentelemetry/instrumentation-http': {
            enabled: true,
          },
          // Enable database instrumentation
          '@opentelemetry/instrumentation-pg': {
            enabled: true,
          },
        })],
        
        traceExporter,
        metricReader,
      });

      // Initialize the SDK
      sdk.start();
      console.log('OpenTelemetry SDK initialized successfully');
      
      // Set up log exporter to Grafana Cloud Loki
      if (process.env.GRAFANA_CLOUD_LOKI_ENDPOINT) {
        const logExporter = new OTLPLogExporter({
          url: process.env.GRAFANA_CLOUD_LOKI_ENDPOINT,
          headers: {
            'Authorization': authHeader,
          },
        });
        
        const logProcessor = new BatchLogRecordProcessor(logExporter);
        const loggerProvider = new SDKLoggerProvider({
          resource,
          processors: [logProcessor]
        });
        logs.setGlobalLoggerProvider(loggerProvider);
        console.log('OpenTelemetry logging configured for Grafana Cloud Loki');
      }
    } else if (!process.env.GRAFANA_CLOUD_API_KEY || !process.env.GRAFANA_CLOUD_INSTANCE_ID) {
      console.warn('Grafana Cloud credentials not found. OpenTelemetry will not be initialized. Please set GRAFANA_CLOUD_API_KEY and GRAFANA_CLOUD_INSTANCE_ID environment variables.');
      
      // Fallback to basic Vercel OTel for development
      const { registerOTel } = await import('@vercel/otel');
      registerOTel({
        serviceName: process.env.OTEL_SERVICE_NAME || 'tsl-ats-backend',
        spanProcessors: ['auto'],
      });
    }
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;

// Graceful shutdown
process.on('SIGTERM', () => {
  sdk?.shutdown()
    .then(() => console.log('OpenTelemetry SDK terminated'))
    .catch((error) => console.log('Error terminating OpenTelemetry SDK', error))
    .finally(() => process.exit(0));
});
