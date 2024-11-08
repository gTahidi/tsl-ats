'use client';

import { useState, useEffect } from 'react';
import { Layout, Menu, message } from 'antd';
import {
  UserOutlined,
  SnippetsOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import RightSidePanel from './RightSidePanel';
import type { Job, Persona } from '@/types';

const { Sider, Content } = Layout;

interface Props {
  children: React.ReactNode;
}

const MainLayout = ({ children }: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [sidePanel, setSidePanel] = useState({
    open: false,
    entityType: null as 'job' | 'persona' | 'candidate' | null,
    mode: 'create' as 'create' | 'edit',
    initialValues: null,
  });

  const fetchPersonas = async () => {
    try {
      const response = await fetch('/api/personas');
      if (!response.ok) throw new Error('Failed to fetch personas');
      const data = await response.json();
      setPersonas(data);
    } catch (error) {
      console.error('Error fetching personas:', error);
      message.error('Failed to load personas');
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs');
      if (!response.ok) throw new Error('Failed to fetch jobs');
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      message.error('Failed to load jobs');
    }
  };

  useEffect(() => {
    if (sidePanel.open && sidePanel.entityType === 'candidate') {
      fetchPersonas();
      fetchJobs();
    }
  }, [sidePanel.open, sidePanel.entityType]);

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
    setLoading(true);
    try {
      const endpoint = `/api/${sidePanel.entityType}s`;
      const method = sidePanel.mode === 'create' ? 'POST' : 'PUT';
      const url = method === 'PUT' && values.id ? `${endpoint}/${values.id}` : endpoint;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      message.success(`${sidePanel.entityType} ${sidePanel.mode === 'create' ? 'created' : 'updated'} successfully`);
      router.refresh();
      handleSidePanelClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      message.error(`Failed to ${sidePanel.mode} ${sidePanel.entityType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
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
        loading={loading}
        personas={personas}
        jobs={jobs}
      />
    </Layout>
  );
};

export default MainLayout;
