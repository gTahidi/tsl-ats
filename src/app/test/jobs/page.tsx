'use client';

import { useState } from 'react';
import { Card, Typography, Button, message, Space } from 'antd';
import JobsTable from '@/app/components/tables/JobsTable';

const { Title } = Typography;

// Mock data
const mockJobs = [
  {
    id: '1',
    title: 'Senior Frontend Developer',
    linkedinUrl: 'https://linkedin.com/jobs/1',
    status: 'active',
    candidateCount: 5,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    title: 'Backend Engineer',
    status: 'active',
    candidateCount: 3,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    title: 'DevOps Engineer',
    linkedinUrl: 'https://linkedin.com/jobs/3',
    status: 'inactive',
    candidateCount: 0,
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    title: 'Product Manager',
    linkedinUrl: 'https://linkedin.com/jobs/4',
    status: 'active',
    candidateCount: 8,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    title: 'UI/UX Designer',
    status: 'inactive',
    candidateCount: 0,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
] as const;

export default function JobsTestPage() {
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState(mockJobs);

  const handleEdit = (job: any) => {
    message.info(`Edit clicked for ${job.title}`);
  };

  const handleDelete = (id: string) => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setJobs(prev => prev.filter(j => j.id !== id));
      message.success('Job deleted successfully');
      setLoading(false);
    }, 1000);
  };

  const handleAddMockData = () => {
    setJobs(prev => [...prev, ...mockJobs]);
    message.success('Mock data added');
  };

  return (
    <div style={{ maxWidth: 1200, margin: '40px auto', padding: '0 20px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Title level={2}>Jobs Table Test</Title>
            <Space>
              <Button onClick={handleAddMockData}>Add More Mock Data</Button>
            </Space>
          </Space>
        </Card>

        <JobsTable
          jobs={jobs}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
        />
      </Space>
    </div>
  );
}
