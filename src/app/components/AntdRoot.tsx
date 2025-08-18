'use client';

import React from 'react';
import ConfigProvider from 'antd/es/config-provider';
import Layout from 'antd/es/layout';
import App from 'antd/es/app';
import { StyleProvider } from '@ant-design/cssinjs';

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
    fontFamily: "var(--font-sans), ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Liberation Sans', sans-serif",
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

export function AntdRoot({ children }: { children: React.ReactNode }) {
  return (
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
              height: '64px',
            }}>
              <h1 style={{
                margin: 0,
                fontSize: '20px',
                color: '#2C363F',
                fontFamily: "var(--font-heading)",
              }}>
                ATS Platform
              </h1>
            </Header>
            <Content style={{ padding: '24px' }}>
              {children}
            </Content>
          </Layout>
        </App>
      </ConfigProvider>
    </StyleProvider>
  );
}
