'use client';

import { useState, useEffect } from 'react';
import { Card, Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import ProcessStepsTable from '../components/tables/ProcessStepsTable';
import StepModal from '../components/StepModal';
import { ProcessStep } from '@/types';

export default function ProcessStepsPage() {
  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStep, setEditingStep] = useState<ProcessStep | null>(null);

  useEffect(() => {
    fetchSteps();
  }, []);

  const fetchSteps = async () => {
    try {
      const response = await fetch('/api/process-steps');
      if (!response.ok) throw new Error('Failed to fetch steps');
      const data = await response.json();
      // Ensure all required fields are present
      const processedSteps = data.map((step: any) => ({
        id: step.id,
        name: step.name,
        description: step.description || '', // Provide default empty string if missing
        order: step.order,
        status: step.status,
        createdAt: step.createdAt,
        updatedAt: step.updatedAt,
      }));
      setSteps(processedSteps);
    } catch (error) {
      console.error('Error fetching steps:', error);
      message.error('Failed to load process steps');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingStep(null);
    setModalVisible(true);
  };

  const handleEdit = (step: ProcessStep) => {
    setEditingStep(step);
    setModalVisible(true);
  };

  const handleDelete = async (step: ProcessStep) => {
    try {
      const response = await fetch(`/api/process-steps/${step.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete step');
      message.success('Process step deleted successfully');
      fetchSteps();
    } catch (error) {
      console.error('Error deleting step:', error);
      message.error('Failed to delete process step');
    }
  };

  const handleModalClose = (refresh?: boolean) => {
    setModalVisible(false);
    setEditingStep(null);
    if (refresh) {
      fetchSteps();
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Process Steps</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          Add Step
        </Button>
      </div>
      <Card>
        <ProcessStepsTable
          steps={steps}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
        />
      </Card>
      <StepModal
        visible={modalVisible}
        onClose={handleModalClose}
        step={editingStep}
      />
    </div>
  );
}
