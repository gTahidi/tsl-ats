# Grafana Faro Setup Guide

This document explains how to set up Grafana Faro for frontend observability in the ATS Platform.

## Prerequisites

1. A Grafana Cloud account with Frontend Observability enabled
2. A Frontend Observability application created in Grafana Cloud

## Setup Instructions

### 1. Create a Frontend Observability Application

1. Sign in to your Grafana Cloud instance
2. Navigate to Observability > Frontend > Frontend Apps
3. Click "Create new"
4. Fill in the application details:
   - **Application Name**: ats-platform
   - **CORS Allowed Origins**: Add your development and production URLs
   - **Default attributes**: Optional
5. Copy the collector URL from the Web SDK Configuration tab

### 2. Configure Environment Variables

Update your `.env` file with the following variables:

```env
# Grafana Faro Configuration
NEXT_PUBLIC_FARO_URL=https://faro-collector-prod-me-central-1.grafana.net/collect/your-app-key
NEXT_PUBLIC_FARO_APP_NAME=ats-platform
NEXT_PUBLIC_FARO_APP_NAMESPACE=ats-platform
NEXT_PUBLIC_FARO_APP_VERSION=1.0.0
NEXT_PUBLIC_FARO_ENVIRONMENT=development

# OpenTelemetry Configuration
OTEL_SERVICE_NAME=ats-platform-backend
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
OTEL_RESOURCE_ATTRIBUTES=service.namespace=ats-platform
```

### 3. Verify the Setup

1. Start your development server
2. Open the browser's developer tools
3. Check the Network tab for requests to your Faro collector URL
4. In Grafana Cloud, navigate to your Frontend Observability application to view the incoming data

## Architecture

The implementation includes:

- **Frontend Instrumentation**: `@grafana/faro-web-sdk` and `@grafana/faro-web-tracing`
- **Component**: `src/app/components/frontend-observability.tsx` initializes the SDK
- **Backend Correlation**: `src/middleware.ts` adds traceparent headers
- **Backend Tracing**: `src/instrumentation.ts` configures OpenTelemetry

## Troubleshooting

If you're not seeing data in Grafana Cloud:

1. Verify the collector URL is correct
2. Check that CORS is properly configured in Grafana Cloud
3. Ensure environment variables are set correctly
4. Check the browser's console for any Faro initialization errors
