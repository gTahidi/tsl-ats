'use client';

import React from 'react';
import { ConfigProvider } from 'antd';
import { theme } from '../theme/themeConfig';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider theme={theme}>
      {children}
    </ConfigProvider>
  );
}
