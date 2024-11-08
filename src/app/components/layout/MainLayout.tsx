'use client';

import { Layout, Menu } from 'antd';
import {
  UserOutlined,
  HomeOutlined,
  TeamOutlined,
  OrderedListOutlined,
  UploadOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

const { Content, Sider } = Layout;

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <HomeOutlined />,
      label: <Link href="/dashboard">Dashboard</Link>,
    },
    {
      key: '/jobs',
      icon: <FolderOutlined />,
      label: <Link href="/jobs">Jobs</Link>,
    },
    {
      key: '/candidates',
      icon: <TeamOutlined />,
      label: <Link href="/candidates">Candidates</Link>,
    },
    {
      key: '/personas',
      icon: <UserOutlined />,
      label: <Link href="/personas">Personas</Link>,
    },
    {
      key: '/process-steps',
      icon: <OrderedListOutlined />,
      label: <Link href="/process-steps">Process Steps</Link>,
    },
    {
      key: '/uploads',
      icon: <UploadOutlined />,
      label: <Link href="/uploads">Uploads</Link>,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)' }} />
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
        />
      </Sider>
      <Layout style={{ marginLeft: 200 }}>
        <Content style={{ margin: '24px 16px 0', overflow: 'initial' }}>
          <div style={{ padding: 24, background: '#fff' }}>
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
