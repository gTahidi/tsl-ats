'use client';

import { useEffect, useState } from 'react';
import { Typography, Card, Space, Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import CandidatesTable from '@/app/components/tables/CandidatesTable';

const { Title } = Typography;


export default function CandidatesPage() {
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const response = await fetch('/api/candidates', {
          method: 'GET',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch candidates');
        }

        const data = await response.json();
        setCandidates(data);
      } catch (error) {
        console.error('Failed to fetch candidates:', error);
        message.error('Failed to fetch candidates');
      }
    }

    fetchCandidates();
  }, []);

  const handleEdit = (candidate: any) => {
    message.info(`Edit clicked for ${candidate.name}`);
  };

  const handleDelete = (id: string) => {
    setLoading(true);
    setTimeout(() => {
      message.success('Candidate deleted successfully');
      setLoading(false);
    }, 1000);
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Space direction="horizontal" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={2}>Candidates</Title>
          <Button
            onClick={() => {
              const path = `/jobs/new`;
              window.location.href = path;
            }}
            type="primary"
            icon={<PlusOutlined />}>
            Add Candidate
          </Button>
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
