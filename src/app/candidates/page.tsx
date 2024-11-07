'use client';

import { useState } from 'react';
import { Typography, Card, Space, Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import CandidatesTable from '@/app/components/tables/CandidatesTable';

const { Title } = Typography;

// Mock data for initial testing
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
    name: 'Jane Smith',
    email: 'jane@example.com',
    processStatus: 'Interviewing',
    cvUrl: 'mock://cv2.pdf',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export default function CandidatesPage() {
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState(mockCandidates);

  const handleEdit = (candidate: any) => {
    message.info(`Edit clicked for ${candidate.name}`);
  };

  const handleDelete = (id: string) => {
    setLoading(true);
    setTimeout(() => {
      setCandidates(prev => prev.filter(c => c.id !== id));
      message.success('Candidate deleted successfully');
      setLoading(false);
    }, 1000);
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Space direction="horizontal" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={2}>Candidates</Title>
          <Button type="primary" icon={<PlusOutlined />}>Add Candidate</Button>
        </Space>
      </Card>
      <Card>
        <CandidatesTable
          candidates={candidates}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
        />
      </Card>
    </Space>
  );
}
