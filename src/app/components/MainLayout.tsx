'use client';

import { useState } from 'react';
import { App, Button, Flex, Layout, Menu, Spin, Typography } from 'antd';
import { 
  UserOutlined, 
  SnippetsOutlined, 
  TeamOutlined, 
  SolutionOutlined, 
  DatabaseOutlined,
  UploadOutlined,
  SettingOutlined,
  VideoCameraOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '../contexts/UserContext';

const { Sider, Content } = Layout;

interface Props {
  children: React.ReactNode;
}

const MainLayout = ({ children }: Props) => {
  const { user, loading, hasPermission } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isLogin = pathname === '/login';

    const menuItems = [
        {
      key: '/jobs',
      icon: <SnippetsOutlined />,
      label: 'Jobs',
      permission: 'jobs:read',
    },
        {
      key: '/personas',
      icon: <UserOutlined />,
      label: 'Personas',
      permission: 'personas:read',
    },
        {
      key: '/candidates',
      icon: <TeamOutlined />,
      label: 'Candidates',
      permission: 'candidates:read',
    },
    {
      key: '/interviews',
      icon: <VideoCameraOutlined />,
      label: 'Interviews',
    },
        {
      key: '/cv-upload',
      icon: <UploadOutlined />,
      label: 'Upload CV',
      permission: 'candidates:create', // Placeholder, assuming CV upload is part of creating candidates
    },
        // Process Groups menu temporarily removed (using standard/general process group)
        {
      key: '/legacy-dashboard',
      icon: <DatabaseOutlined />,
      label: 'Legacy',
      permission: 'candidates:read', // Placeholder, assuming legacy is part of reading candidates
    },
            {
      key: '/referees',
      icon: <SolutionOutlined />,
      label: 'Referees',
      permission: 'candidates:read', // Placeholder, assuming referees are part of reading candidates
    },
    {
      key: '/users',
      icon: <SettingOutlined />,
      label: 'Users',
      permission: 'users:manage',
    }
  ];

    const handleMenuClick = (key: string) => {
    router.push(key);
  };

  const filteredMenuItems = menuItems.filter(
    (item) => !item.permission || hasPermission(item.permission)
  );

  // Split items so that 'User Management' is anchored at the bottom
  const topMenuItems = filteredMenuItems.filter((item) => item.key !== '/users');
  const bottomMenuItems = filteredMenuItems.filter((item) => item.key === '/users');


    if (loading) {
    return <Spin size="large" fullscreen />;
  }

  if (isLogin) {
    return children;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        theme="light"
      >
        <Flex vertical justify="space-between" style={{ height: '100%', padding: '12px 8px' }}>
          <Flex vertical>
            <Flex justify={"center"} align="center" style={{ padding: '24px' }}>
              <Typography.Title level={collapsed ? 5 : 4} style={{ margin: 0 }}>
                {collapsed ? 'Q' : 'Qchungi 0.0.1'}
              </Typography.Title>
            </Flex>
            <Menu
              theme="light"
              selectedKeys={[pathname]}
              mode="inline"
              items={topMenuItems}
              onClick={({ key }) => handleMenuClick(key)}
            />
          </Flex>
          <Flex vertical gap={8}>
            {bottomMenuItems.length > 0 && (
              <Menu
                theme="light"
                selectedKeys={[pathname]}
                mode="inline"
                items={bottomMenuItems}
                onClick={({ key }) => handleMenuClick(key)}
              />
            )}
            <Button
              type="primary"
              danger
              block
              size="large"
              icon={<LogoutOutlined />}
              style={{ borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', paddingLeft: 24 }}
              onClick={() => {
                router.push('/logout');
              }}
            >
              Logout
            </Button>
          </Flex>
        </Flex>
      </Sider>
      <Layout style={{ height: '100vh', overflow: 'hidden' }}>
        <Content style={{ margin: '24px 16px', padding: 24, height: 'calc(100vh - 48px)', overflow: 'auto' }}>
          <App>{children}</App>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;