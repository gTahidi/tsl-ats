'use client';

import React from 'react';
import { ConfigProvider, App } from 'antd';
import { StyleProvider } from '@ant-design/cssinjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FrontendObservability from './components/frontend-observability';
import { theme } from './theme/themeConfig';

// Using shared theme from themeConfig for consistency across the app

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <StyleProvider hashPriority="high">
        <ConfigProvider theme={theme}>
          <App>
            <FrontendObservability />
            {children}
          </App>
        </ConfigProvider>
      </StyleProvider>
    </QueryClientProvider>
  );
}
