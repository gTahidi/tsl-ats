'use client';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import MainLayout from './components/MainLayout';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'OSS ATS',
  description: 'Open Source Applicant Tracking System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AntdRegistry>
          <MainLayout>{children}</MainLayout>
        </AntdRegistry>
      </body>
    </html>
  );
}
