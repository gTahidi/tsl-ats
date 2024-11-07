'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Timeline, Button, Card, Typography, Alert } from 'antd';
import { PlusOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import StepModal from './StepModal';

const { Title } = Typography;

type Step = {
  id: string;
  type: string;
  status: string;
  notes?: string | null;
  date: Date;
};

type ProcessStepsProps = {
  candidateId: string;
  jobId: string;
  steps: Step[];
};

export default function ProcessSteps({ candidateId, jobId, steps }: ProcessStepsProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');

  const handleAddStep = async (data: { type: string; status: string; notes?: string }) => {
    try {
      const response = await fetch(`/api/candidates/${candidateId}/steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to add step');
      router.refresh();
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add step');
      throw err;
    }
  };

  const columns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (text: string) => text.charAt(0).toUpperCase() + text.slice(1),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const icon = status === 'completed' ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> :
                    status === 'cancelled' ? <CloseCircleOutlined style={{ color: '#ff4d4f' }} /> :
                    <ClockCircleOutlined style={{ color: '#1890ff' }} />;
        return (
          <span>
            {icon}{' '}
            {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
          </span>
        );
      },
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      render: (text: string | null) => text || '-',
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: Date) => new Date(date).toLocaleDateString(),
    },
  ];

  return (
    <Card>
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Process Steps</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalOpen(true)}
        >
          Add Step
        </Button>
      </div>

      <Table
        dataSource={steps}
        columns={columns}
        rowKey="id"
        pagination={false}
        style={{ marginBottom: 24 }}
      />

      <Card title="Timeline View" size="small">
        <Timeline
          items={steps.map(step => ({
            color: step.status === 'completed' ? 'green' :
                   step.status === 'cancelled' ? 'red' : 'blue',
            children: (
              <div>
                <div style={{ fontWeight: 'bold' }}>
                  {step.type.charAt(0).toUpperCase() + step.type.slice(1)}
                </div>
                <div>{step.notes}</div>
                <div style={{ color: '#888', fontSize: '0.9em' }}>
                  {new Date(step.date).toLocaleDateString()}
                </div>
              </div>
            ),
          }))}
        />
      </Card>

      <StepModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddStep}
      />
    </Card>
  );
}
