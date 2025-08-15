'use client';

import React, { useState } from 'react';
import { Card, Tabs, Space, Button, Typography, Statistic, Row, Col } from 'antd';
import { 
  CalendarOutlined, 
  ClockCircleOutlined, 
  CheckCircleOutlined,
  StopOutlined,
  PlusOutlined 
} from '@ant-design/icons';
import InterviewsTable from '@/app/components/tables/InterviewsTable';
import { useQuery } from '@tanstack/react-query';
import type { InterviewView } from '@/types';

const { Title } = Typography;
const { TabPane } = Tabs;

export default function InterviewsPage() {
  const [activeTab, setActiveTab] = useState('all');

  // Fetch all interviews for statistics
  const { data: allInterviews } = useQuery<InterviewView[]>({
    queryKey: ['interviews'],
    queryFn: async () => {
      const response = await fetch('/api/interviews');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    },
  });

  // Calculate statistics
  const stats = React.useMemo(() => {
    if (!allInterviews) return { scheduled: 0, inProgress: 0, completed: 0, cancelled: 0 };
    
    return allInterviews.reduce((acc, interview) => {
      const status = interview.status || 'scheduled';
      acc[status === 'in_progress' ? 'inProgress' : status]++;
      return acc;
    }, { scheduled: 0, inProgress: 0, completed: 0, cancelled: 0 });
  }, [allInterviews]);

  const tabItems = [
    {
      key: 'all',
      label: 'All Interviews',
      children: <InterviewsTable />,
    },
    {
      key: 'scheduled',
      label: `Scheduled (${stats.scheduled})`,
      children: <InterviewsTable status="scheduled" />,
    },
    {
      key: 'in_progress',
      label: `In Progress (${stats.inProgress})`,
      children: <InterviewsTable status="in_progress" />,
    },
    {
      key: 'completed',
      label: `Completed (${stats.completed})`,
      children: <InterviewsTable status="completed" />,
    },
    {
      key: 'cancelled',
      label: `Cancelled (${stats.cancelled})`,
      children: <InterviewsTable status="cancelled" />,
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
          <Title level={2} style={{ margin: 0 }}>
            Interview Management
          </Title>
          <Space>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => {
                // Navigate to candidates page to qualify more candidates
                window.location.href = '/candidates';
              }}
            >
              Qualify Candidates
            </Button>
          </Space>
        </div>

        {/* Statistics Cards */}
        <Row gutter={16} className="mb-6">
          <Col span={6}>
            <Card>
              <Statistic
                title="Scheduled"
                value={stats.scheduled}
                prefix={<CalendarOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="In Progress"
                value={stats.inProgress}
                prefix={<ClockCircleOutlined style={{ color: '#fa8c16' }} />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Completed"
                value={stats.completed}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Cancelled"
                value={stats.cancelled}
                prefix={<StopOutlined style={{ color: '#ff4d4f' }} />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Interviews Table with Tabs */}
      <Card>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={tabItems}
        />
      </Card>
    </div>
  );
}
