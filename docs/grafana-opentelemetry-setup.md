# Grafana Cloud + OpenTelemetry Setup Guide

This document explains how to configure and use Grafana Cloud with OpenTelemetry for comprehensive backend logging and observability in your TSL ATS application.

## Overview

The implementation provides:
- **Distributed Tracing**: Track requests across your entire system
- **Structured Logging**: Searchable logs with trace correlation
- **Metrics Collection**: Performance and business metrics
- **Real-time Monitoring**: Dashboards and alerting in Grafana Cloud

## Architecture

```
Next.js Backend → OpenTelemetry SDK → Grafana Cloud
                                   ├── Loki (Logs)
                                   ├── Tempo (Traces)
                                   └── Prometheus (Metrics)
```

## Setup Instructions

### 1. Grafana Cloud Account Setup

1. Create a free account at [Grafana Cloud](https://grafana.com/auth/sign-up/create-user)
2. Create a new stack or use an existing one
3. Navigate to your stack's "Details" page to get:
   - **Stack URL**: `https://your-stack.grafana.net`
   - **Instance ID**: Usually a numeric value
   - **API Key**: Generate from "Security" → "API Keys"

### 2. Get Service Endpoints

From your Grafana Cloud stack, find these endpoints:

- **Loki (Logs)**: Usually `https://logs-prod-{region}.grafana.net/loki/api/v1/push`
- **Tempo (Traces)**: Usually `https://tempo-prod-{region}.grafana.net:443`
- **Prometheus (Metrics)**: Usually `https://prometheus-prod-{region}.grafana.net/api/v1/push`

### 3. Environment Configuration

Copy the `.env.example` file to `.env.local` and fill in your values:

```bash
# OpenTelemetry Configuration
OTEL_SERVICE_NAME=tsl-ats-backend
OTEL_SERVICE_VERSION=1.0.0

# Grafana Cloud Configuration
GRAFANA_CLOUD_API_KEY=your_api_key_here
GRAFANA_CLOUD_INSTANCE_ID=your_instance_id_here

# Grafana Cloud Endpoints (replace with your actual endpoints)
GRAFANA_CLOUD_LOKI_ENDPOINT=https://logs-prod-us-central1.grafana.net/loki/api/v1/push
GRAFANA_CLOUD_TEMPO_ENDPOINT=https://tempo-prod-04-prod-us-central-0.grafana.net:443
GRAFANA_CLOUD_PROMETHEUS_ENDPOINT=https://prometheus-prod-01-prod-us-central-0.grafana.net/api/v1/push
```

## Usage Examples

### Basic Logging

```typescript
import { logInfo, logError, logWarn } from '@/lib/logger';

// Simple info logging
logInfo('User logged in successfully', { 
  userId: '123',
  method: 'oauth' 
});

// Error logging with exception
try {
  // some operation
} catch (error) {
  logError('Failed to process request', error as Error, {
    operation: 'user-creation',
    userId: '123'
  });
}
```

### Request Logging

```typescript
import { createRequestLogger } from '@/lib/logger';

export async function GET(request: Request) {
  const requestLogger = createRequestLogger(request, {
    'api.operation': 'get_users',
  });
  
  requestLogger.info('Processing request');
  // ... your logic
  requestLogger.info('Request completed successfully');
}
```

### Database Logging

```typescript
import { createDatabaseLogger } from '@/lib/logger';

const dbLogger = createDatabaseLogger('select', 'users');
dbLogger.info('Executing user query');
const users = await db.query.users.findMany();
dbLogger.info('Query completed', { count: users.length });
```

### Distributed Tracing

```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('my-service');

export async function processUser(userId: string) {
  return tracer.startActiveSpan('process-user', async (span) => {
    try {
      span.setAttributes({ 'user.id': userId });
      
      // Your logic here - all logs will be correlated to this trace
      
      span.setAttributes({ 'operation.success': true });
      return result;
    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}
```

## Features Implemented

### 1. Enhanced Instrumentation (`src/instrumentation.ts`)
- Automatic instrumentation for HTTP, database, and other operations
- Configurable exporters for Grafana Cloud services
- Graceful fallback when Grafana Cloud credentials are missing

### 2. Structured Logger (`src/lib/logger.ts`)
- **Logger Class**: Full-featured logger with trace correlation
- **Convenience Functions**: `logInfo()`, `logError()`, `logWarn()`, etc.
- **Specialized Loggers**: Request, database, and external API loggers
- **Child Loggers**: Create contextual loggers with additional attributes

### 3. API Route Integration (`src/app/api/candidates/route.ts`)
- Complete example showing tracing and logging integration
- Performance monitoring with duration tracking
- Error handling with proper trace correlation
- Structured attributes for filtering and analysis

## Grafana Cloud Dashboard Setup

### 1. Log Queries (Loki)

```logql
# All error logs
{service_name="tsl-ats-backend"} |= "ERROR"

# API requests with duration > 1000ms
{service_name="tsl-ats-backend"} | json | response_duration_ms > 1000

# Database operations
{service_name="tsl-ats-backend"} | json | db_operation != ""
```

### 2. Trace Queries (Tempo)

Use trace IDs from logs to correlate with traces in Tempo.

### 3. Metrics (Prometheus)

OpenTelemetry will automatically collect and export metrics like:
- Request duration
- Request rate
- Error rate
- Database connection pool metrics

## Benefits

1. **Debugging**: Trace requests end-to-end across your application
2. **Performance**: Identify slow operations and bottlenecks
3. **Monitoring**: Set up alerts for errors or performance degradation
4. **Business Intelligence**: Track user behavior and system usage
5. **Compliance**: Comprehensive audit trails

## Best Practices

1. **Use Structured Logging**: Always include relevant attributes
2. **Trace Correlation**: Ensure all logs include trace context
3. **Performance Monitoring**: Track operation durations
4. **Error Handling**: Always log errors with full context
5. **Security**: Avoid logging sensitive information

## Troubleshooting

### Common Issues

1. **No logs appearing**: Check your Grafana Cloud endpoints and credentials
2. **Missing traces**: Ensure `GRAFANA_CLOUD_TEMPO_ENDPOINT` is set correctly
3. **TypeScript errors**: Make sure all OpenTelemetry packages are installed
4. **Performance impact**: Adjust sampling rates if needed

### Debug Mode

The logger includes debug and trace levels that only log in development:

```typescript
logDebug('Debug information', { detail: 'value' });
logTrace('Very verbose tracing', { step: 'initialization' });
```

## Next Steps

1. Set up Grafana dashboards for your specific use cases
2. Configure alerting rules for critical errors
3. Implement custom metrics for business KPIs
4. Extend logging to other API routes and services