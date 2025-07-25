'use client';

import { useState } from 'react';
import { App, Button, Flex, Layout, Menu, Spin, Typography } from 'antd';
import { 
  UserOutlined, 
  SnippetsOutlined, 
  TeamOutlined, 
  OrderedListOutlined,
  HomeOutlined, 
  FileTextOutlined, 
  SolutionOutlined, 
  DatabaseOutlined,
  UploadOutlined,
  SettingOutlined,
  SafetyOutlined
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
      key: '/cv-upload',
      icon: <UploadOutlined />,
      label: 'Upload CV',
      permission: 'candidates:create', // Placeholder, assuming CV upload is part of creating candidates
    },
        {
      key: '/process-groups',
      icon: <OrderedListOutlined />,
      label: 'Process Groups',
      permission: 'process-groups:read',
    },
        {
      key: '/legacy-dashboard',
      icon: <DatabaseOutlined />,
      label: 'Legacy Candidates',
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
      label: 'User Management',
      permission: 'users:manage',
    }
  ];

    const handleMenuClick = (key: string) => {
    router.push(key);
  };

  const filteredMenuItems = menuItems.filter(
    (item) => !item.permission || hasPermission(item.permission)
  );


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
        <Flex vertical justify="space-between" style={{ height: '100%' }}>
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
              items={filteredMenuItems}
              onClick={({ key }) => handleMenuClick(key)}
            />
          </Flex>
          <Button
            type="dashed"
            onClick={() => {
              router.push('/logout');
            }}
          >
            Logout
          </Button>
        </Flex>
      </Sider>
      <Layout>
        <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280 }}>
          <App>{children}</App>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;