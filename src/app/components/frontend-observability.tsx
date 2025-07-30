'use client';

import { faro, getWebInstrumentations, initializeFaro } from '@grafana/faro-web-sdk';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';

export default function FrontendObservability() {
  // skip if already initialized
  if (faro.api) {
    console.log('🔍 FARO DEBUG: Already initialized, skipping');
    return null;
  }

  // Debug environment variables
  console.log('🔍 FARO DEBUG: Environment variables:', {
    url: process.env.NEXT_PUBLIC_FARO_URL,
    appName: process.env.NEXT_PUBLIC_FARO_APP_NAME,
    namespace: process.env.NEXT_PUBLIC_FARO_APP_NAMESPACE,
    environment: process.env.NEXT_PUBLIC_FARO_ENVIRONMENT, // Fixed typo
    environmentTypo: process.env.NEXT_PUBLIC_FARO_ENVIRONMNENT, // Show the typo value
  });

  try {
    const faroConfig = {
      url: process.env.NEXT_PUBLIC_FARO_URL,
      app: {
        name: process.env.NEXT_PUBLIC_FARO_APP_NAME || 'unknown_service:webjs',
        namespace: process.env.NEXT_PUBLIC_FARO_APP_NAMESPACE || undefined,
        version: process.env.VERCEL_DEPLOYMENT_ID || '1.0.0',
        environment: process.env.NEXT_PUBLIC_FARO_ENVIRONMENT || 'development', // Fixed typo
      },

      instrumentations: [
        // Mandatory, omits default instrumentations otherwise.
        ...getWebInstrumentations(),

        // Tracing package to get end-to-end visibility for HTTP requests.
        new TracingInstrumentation(),
      ],
    };

    console.log('🔍 FARO DEBUG: Initializing with config:', faroConfig);
    
    const faroInstance = initializeFaro(faroConfig);
    
    console.log('🔍 FARO DEBUG: Successfully initialized:', faroInstance);
    
    // Test that tracing is working
    console.log('🔍 FARO DEBUG: Testing trace...');
    faroInstance.api?.pushEvent('faro_initialization_test', {
      timestamp: new Date().toISOString(),
      message: 'Faro initialized successfully'
    });
    
  } catch (e) {
    console.error('🔍 FARO DEBUG: Initialization failed:', e);
    return null;
  }
  return null;
}