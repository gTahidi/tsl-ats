'use client';

import React from 'react';
import { ConfigProvider } from 'antd';
import { theme } from '../theme/themeConfig';

interface ClientLayoutProps {
  children: React.ReactNode;
}

const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  return (
    <ConfigProvider theme={theme}>
      {children}
    </ConfigProvider>
  );
};

export default ClientLayout;
