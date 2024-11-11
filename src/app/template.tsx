'use client';

import { Inter } from 'next/font/google';
import StyledComponentsRegistry from './components/AntdRegistry';
import { Providers } from './components/Providers';
import ClientLayout from './components/ClientLayout';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className={inter.className}>
      <StyledComponentsRegistry>
        <Providers>
          <ClientLayout>{children}</ClientLayout>
        </Providers>
      </StyledComponentsRegistry>
      <Script defer data-domain={process.env.DOMAIN} src="https://plausible.io/js/script.js" />
    </div>
  );
}
