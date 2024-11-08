'use client';

import React from 'react';
import { ConfigProvider, App, Layout } from 'antd';
import { StyleProvider } from '@ant-design/cssinjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { Header, Content } = Layout;

const theme = {
  token: {
    colorPrimary: '#7B8C98',
    colorSuccess: '#90B77D',
    colorWarning: '#D2AB67',
    colorError: '#C15B5B',
    colorBgContainer: '#F5F5F0',
    colorText: '#2C363F',
    colorBorder: '#D9D9D4',
    fontSize: 14,
    fontFamily: "'IBM Plex Mono', monospace",
    borderRadius: 2,
    controlHeight: 32,
    lineWidth: 1.5,
    wireframe: true,
  },
  components: {
    Table: {
      colorBgContainer: '#F5F5F0',
      headerBg: '#E8E8E3',
      borderRadius: 2,
    },
    Button: {
      borderRadius: 2,
      controlHeight: 32,
    },
    Card: {
      borderRadius: 2,
    },
    Input: {
      borderRadius: 2,
      controlHeight: 32,
    },
    Select: {
      borderRadius: 2,
      controlHeight: 32,
    },
  },
};

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
            <Layout style={{ minHeight: '100vh' }}>
              <Header style={{
                background: '#fff',
                borderBottom: '1.5px solid #D9D9D4',
                padding: '0 24px',
                display: 'flex',
                alignItems: 'center',
              }}>
                <h1 style={{
                  margin: 0,
                  fontSize: '20px',
                  color: '#2C363F',
                  fontFamily: "'IBM Plex Mono', monospace",
                }}>
                  ATS Platform
                </h1>
              </Header>
              <Content className="main-container">
                {children}
              </Content>
            </Layout>
          </App>
        </ConfigProvider>
      </StyleProvider>
    </QueryClientProvider>
  );
}
