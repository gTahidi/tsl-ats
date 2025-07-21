'use client';

import { useState } from 'react';
import { App, Button, Flex, Layout, Menu, Typography } from 'antd';
import { 
  UserOutlined, 
  SnippetsOutlined, 
  TeamOutlined, 
  OrderedListOutlined,
  HomeOutlined, 
  FileTextOutlined, 
  SolutionOutlined, 
  DatabaseOutlined,
  UploadOutlined 
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';

const { Sider, Content } = Layout;

interface Props {
  children: React.ReactNode;
}

const MainLayout = ({ children }: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isLogin = pathname === '/login';

  const menuItems = [
    {
      key: '/jobs',
      icon: <SnippetsOutlined />,
      label: 'Jobs',
    },
    {
      key: '/personas',
      icon: <UserOutlined />,
      label: 'Personas',
    },
    {
      key: '/candidates',
      icon: <TeamOutlined />,
      label: 'Candidates',
    },
    {
      key: '/cv-upload',
      icon: <UploadOutlined />,
      label: 'Upload CV',
    },
    {
      key: '/process-groups',
      icon: <OrderedListOutlined />,
      label: 'Process Groups',
    },
    {
      key: '/legacy-dashboard',
      icon: <DatabaseOutlined />,
      label: 'Legacy Candidates',
    },
    {
      key: '/referees',
      icon: <SolutionOutlined />,
      label: 'Referees',
    }
  ];

  const handleMenuClick = (key: string) => {
    router.push(key);
  };


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
              items={menuItems}
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