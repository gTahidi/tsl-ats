'use client';

import React from 'react';
import { ConfigProvider } from 'antd';
import { theme } from '../theme/themeConfig';

interface AppTemplateProps {
  children: React.ReactNode;
}

const AppTemplate: React.FC<AppTemplateProps> = ({ children }) => {
  return (
    <ConfigProvider theme={theme}>
      {children}
    </ConfigProvider>
  );
};

export default AppTemplate;
