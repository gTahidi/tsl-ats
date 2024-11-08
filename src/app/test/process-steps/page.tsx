'use client';

import React, { useState } from 'react';
import { Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ProcessStep } from '../../types/process';

const mockSteps: ProcessStep[] = [
  {
    id: '1',
    name: 'Initial Screening',
    description: 'Review of candidate resume and initial qualifications',
    order: 1,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Technical Interview',
    description: 'In-depth technical assessment',
    order: 2,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Culture Fit',
    description: 'Evaluation of cultural alignment',
    order: 3,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function ProcessStepsPage(): JSX.Element {
  const [steps, setSteps] = useState<ProcessStep[]>(mockSteps);
  const [loading, setLoading] = useState(false);

  const handleAddStep = () => {
    // Implementation for adding a new step
    message.info('Add step functionality to be implemented');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Process Steps</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddStep}
        >
          Add Step
        </Button>
      </div>

      {/* Table implementation will go here */}
      <pre>{JSON.stringify(steps, null, 2)}</pre>
    </div>
  );
}
