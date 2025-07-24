import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { App } from 'antd';
import MainLayout from './components/MainLayout';
import { Providers } from './providers';
import { UserProvider } from './contexts/UserContext';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Qchungi 0.0.1',
  description: 'Helping you find hidden gems - The Open Source Applicant Tracking System',
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
          <UserProvider>
            <Providers>
              <App>
                <MainLayout>{children}</MainLayout>
              </App>
            </Providers>
          </UserProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}