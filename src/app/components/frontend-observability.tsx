'use client';

import { faro, getWebInstrumentations, initializeFaro } from '@grafana/faro-web-sdk';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';
import { useEffect } from 'react';

export default function FrontendObservability() {
  useEffect(() => {
    // skip if already initialized
    if (faro.api) {
      console.log('Faro already initialized');
      return;
    }

    console.log('Initializing Faro with URL:', process.env.NEXT_PUBLIC_FARO_URL);
    console.log('Faro app name:', process.env.NEXT_PUBLIC_FARO_APP_NAME);
    console.log('Faro app namespace:', process.env.NEXT_PUBLIC_FARO_APP_NAMESPACE);
    console.log('Faro app version:', process.env.NEXT_PUBLIC_FARO_APP_VERSION);
    console.log('Faro environment:', process.env.NEXT_PUBLIC_FARO_ENVIRONMENT);

    try {
      const initializedFaro = initializeFaro({
        url: process.env.NEXT_PUBLIC_FARO_URL || '',
        app: {
          name: process.env.NEXT_PUBLIC_FARO_APP_NAME || 'unknown_service:webjs',
          namespace: process.env.NEXT_PUBLIC_FARO_APP_NAMESPACE || undefined,
          version: process.env.NEXT_PUBLIC_FARO_APP_VERSION || '1.0.0',
          environment: process.env.NEXT_PUBLIC_FARO_ENVIRONMENT || 'development',
        },

        instrumentations: [
          // Mandatory, omits default instrumentations otherwise.
          ...getWebInstrumentations(),

          // Tracing package to get end-to-end visibility for HTTP requests.
          new TracingInstrumentation(),
        ],
      });
      
      console.log('Faro initialized successfully', initializedFaro);
    } catch (e) {
      console.error('Failed to initialize Faro', e);
      return;
    }
  }, []);

  return null;
}
