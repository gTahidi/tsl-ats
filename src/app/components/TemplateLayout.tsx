'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import MainLayout from './MainLayout';

interface TemplateLayoutProps {
  children: React.ReactNode;
}

const TemplateLayout: React.FC<TemplateLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  return <MainLayout>{children}</MainLayout>;
};

export default TemplateLayout;
