'use client';

import { useState } from 'react';
import { Card, Typography, Button, message, Space } from 'antd';
import ProcessStepsTable from '@/app/components/tables/ProcessStepsTable';

const { Title } = Typography;

// Mock data remains the same as previously defined
const mockSteps = [
  // ... existing mock steps array content ...
];

export default function ProcessStepsTestPage() {
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState(mockSteps);

  const handleEdit = (step: any) => {
    message.info(`Edit clicked for ${step.name}`);
  };

  const handleDelete = (id: string) => {
    setLoading(true);
    setTimeout(() => {
      setSteps(prev => prev.filter(s => s.id !== id));
      message.success('Step deleted successfully');
      setLoading(false);
    }, 1000);
  };

  const handleReorder = (draggedId: string, droppedId: string) => {
    setLoading(true);
    setTimeout(() => {
      const draggedStep = steps.find(s => s.id === draggedId);
      const droppedStep = steps.find(s => s.id === droppedId);

      if (draggedStep && droppedStep) {
        const newSteps = steps.map(step => {
          if (step.id === draggedId) return { ...step, sequence: droppedStep.sequence };
          if (step.id === droppedId) return { ...step, sequence: draggedStep.sequence };
          return step;
        });

        setSteps(newSteps.sort((a, b) => a.sequence - b.sequence));
        message.success('Steps reordered successfully');
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div style={{ maxWidth: 1200, margin: '40px auto', padding: '0 20px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Title level={2}>Process Steps Table Test</Title>
            <Button onClick={() => setSteps([...steps, ...mockSteps])}>
              Add More Mock Data
            </Button>
          </Space>
        </Card>

        <ProcessStepsTable
          steps={steps}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onReorder={handleReorder}
          loading={loading}
        />
      </Space>
    </div>
  );
}
