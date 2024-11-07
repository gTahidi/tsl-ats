'use client';

import { useState } from 'react';
import { Layout, Menu } from 'antd';
import {
  UserOutlined,
  SnippetsOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import RightSidePanel from './RightSidePanel';

const { Sider, Content } = Layout;

interface Props {
  children: React.ReactNode;
}

const MainLayout = ({ children }: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [sidePanel, setSidePanel] = useState({
    open: false,
    entityType: null as 'job' | 'persona' | 'candidate' | null,
    mode: 'create' as 'create' | 'edit',
    initialValues: null,
  });

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
  ];

  const handleMenuClick = (key: string) => {
    router.push(key);
  };

  const handleSidePanelClose = () => {
    setSidePanel((prev) => ({ ...prev, open: false }));
  };

  const handleSidePanelSubmit = async (values: any) => {
    // Handle form submission based on entityType
    console.log('Form submitted:', values);
    handleSidePanelClose();
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        theme="light"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div style={{ height: 32, margin: 16, background: 'rgba(0, 0, 0, 0.2)' }} />
        <Menu
          theme="light"
          selectedKeys={[pathname]}
          mode="inline"
          items={menuItems}
          onClick={({ key }) => handleMenuClick(key)}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 200 }}>
        <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280 }}>
          {children}
        </Content>
      </Layout>

      <RightSidePanel
        open={sidePanel.open}
        onClose={handleSidePanelClose}
        entityType={sidePanel.entityType || 'job'}
        mode={sidePanel.mode}
        initialValues={sidePanel.initialValues}
        onSubmit={handleSidePanelSubmit}
      />
    </Layout>
  );
};

export default MainLayout;
