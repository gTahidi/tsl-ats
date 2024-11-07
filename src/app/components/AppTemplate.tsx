'use client';

import React from 'react';
import { Layout, ConfigProvider } from 'antd';
import { usePathname } from 'next/navigation';
import { theme } from '../theme/themeConfig';
import MainLayout from './MainLayout';

interface AppTemplateProps {
  children: React.ReactNode;
}

const AppTemplate: React.FC<AppTemplateProps> = ({ children }) => {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <ConfigProvider theme={theme}>
      {isLoginPage ? (
        <Layout style={{ minHeight: '100vh' }}>
          {children}
        </Layout>
      ) : (
        <MainLayout>{children}</MainLayout>
      )}
    </ConfigProvider>
  );
};

export default AppTemplate;
