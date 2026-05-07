import type { Metadata } from 'next';
import { Roboto, Roboto_Condensed } from 'next/font/google';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { App } from 'antd';
import MainLayout from './components/MainLayout';
import { Providers } from './providers';
import { UserProvider } from './contexts/UserContext';
import './globals.css';

const roboto = Roboto({ subsets: ['latin'], variable: '--font-sans' });
const robotoCondensed = Roboto_Condensed({ subsets: ['latin'], variable: '--font-heading' });

export const metadata: Metadata = {
  title: 'Qchungi 0.0.1',
  description: 'Helping you find hidden gems - JobHuntly ATS',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${roboto.variable} ${robotoCondensed.variable}`}>
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
