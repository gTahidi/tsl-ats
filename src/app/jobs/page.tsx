'use client';

import { useState } from 'react';
import { Typography, Card, Space, Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import JobsTable from '@/app/components/tables/JobsTable';

const { Title } = Typography;

// Mock data for initial testing
const mockJobs = [
  {
    id: '1',
    title: 'Senior Frontend Developer',
    status: 'Open',
    linkedinUrl: 'https://linkedin.com/jobs/1',
    candidateCount: 5,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    title: 'DevOps Engineer',
    status: 'Draft',
    candidateCount: 0,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    title: 'Product Manager',
    status: 'Closed',
    linkedinUrl: 'https://linkedin.com/jobs/3',
    candidateCount: 12,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export default function JobsPage() {
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState(mockJobs);

  const handleEdit = (job: any) => {
    message.info(`Edit clicked for ${job.title}`);
  };

  const handleDelete = (id: string) => {
    setLoading(true);
    setTimeout(() => {
      setJobs(prev => prev.filter(j => j.id !== id));
      message.success('Job deleted successfully');
      setLoading(false);
    }, 1000);
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Space direction="horizontal" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={2}>Jobs</Title>
          <Button type="primary" icon={<PlusOutlined />}>Add Job</Button>
        </Space>
      </Card>
      <Card>
        <JobsTable
          jobs={jobs}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
        />
      </Card>
    </Space>
  );
}
