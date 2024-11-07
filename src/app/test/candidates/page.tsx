'use client';

import { useState } from 'react';
import { Card, Typography, Button, message, Space } from 'antd';
import CandidatesTable from '@/app/components/tables/CandidatesTable';

const { Title } = Typography;

// Mock data
const mockCandidates = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    processStatus: 'Applied',
    cvUrl: 'mock://cv1.pdf',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    name: 'Alice Smith',
    email: 'alice@example.com',
    processStatus: 'Interviewing',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    processStatus: 'Offer Made',
    cvUrl: 'mock://cv3.pdf',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Emma Wilson',
    email: 'emma@example.com',
    processStatus: 'Rejected',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    name: 'Michael Brown',
    email: 'michael@example.com',
    processStatus: 'Accepted',
    cvUrl: 'mock://cv5.pdf',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export default function CandidatesTestPage() {
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState(mockCandidates);

  const handleEdit = (candidate: any) => {
    message.info(`Edit clicked for ${candidate.name}`);
  };

  const handleDelete = (id: string) => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setCandidates(prev => prev.filter(c => c.id !== id));
      message.success('Candidate deleted successfully');
      setLoading(false);
    }, 1000);
  };

  const handleAddMockData = () => {
    setCandidates(prev => [...prev, ...mockCandidates]);
    message.success('Mock data added');
  };

  return (
    <div style={{ maxWidth: 1200, margin: '40px auto', padding: '0 20px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Title level={2}>Candidates Table Test</Title>
            <Space>
              <Button onClick={handleAddMockData}>Add More Mock Data</Button>
            </Space>
          </Space>
        </Card>

        <CandidatesTable
          candidates={candidates}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
        />
      </Space>
    </div>
  );
}
