'use client';

import { Inter } from 'next/font/google';
import StyledComponentsRegistry from './components/AntdRegistry';
import { Providers } from './components/Providers';
import ClientLayout from './components/ClientLayout';

const inter = Inter({ subsets: ['latin'] });

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <body className={inter.className}>
      <StyledComponentsRegistry>
        <Providers>
          <ClientLayout>{children}</ClientLayout>
        </Providers>
      </StyledComponentsRegistry>
    </body>
  );
}
