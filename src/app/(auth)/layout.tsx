'use client';

import { Flex, Layout } from 'antd';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Flex justify={"center"} align="center" style={{ padding: '24px' }}>
        <Layout.Content>
          {children}
        </Layout.Content>
      </Flex>
    </Layout>
  );
}
