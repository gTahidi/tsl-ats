'use client';

import { useState } from 'react';
import { Typography, Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import ProcessStepsTable from '@/app/components/tables/ProcessStepsTable';

const { Title } = Typography;

// Mock data for initial testing
const mockSteps = [
  {
    id: '1',
    name: 'Initial Screening',
    order: 1,
    status: 'Active',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    name: 'Technical Interview',
    order: 2,
    status: 'Active',
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    name: 'HR Interview',
    order: 3,
    status: 'Active',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    name: 'Take Home Test',
    order: 4,
    status: 'Inactive',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export default function ProcessStepsPage() {
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState(mockSteps);

  const handleEdit = (step: any) => {
    message.info(`Edit clicked for ${step.name}`);
  };

  const handleDelete = (id: string) => {
    setLoading(true);
    setTimeout(() => {
      setSteps(prev => prev.filter(s => s.id !== id));
      message.success('Process step deleted successfully');
      setLoading(false);
    }, 1000);
  };

  return (
    <div>
      <Card>
        <div>
          <Title level={2}>Process Steps</Title>
          <Button type="primary" icon={<PlusOutlined />}>Add Step</Button>
        </div>
      </Card>
      <Card>
        <ProcessStepsTable
          steps={steps}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
        />
      </Card>
    </div>
  );
}
