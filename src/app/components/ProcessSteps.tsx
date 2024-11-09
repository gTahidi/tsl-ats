'use client';

import { useState } from 'react';
import { Button, Modal, Form, Input, Select, message, Steps } from 'antd';
import { useRouter } from 'next/navigation';
import { PlusOutlined } from '@ant-design/icons';
import { ProcessStep } from '@/types';

type ProcessStepsProps = {
  candidateId: string;
  steps: ProcessStep[];
};

export default function ProcessSteps({ candidateId, steps }: ProcessStepsProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const handleAddStep = async (values: any) => {
    try {
      const response = await fetch(`/api/candidates/${candidateId}/steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error('Failed to add step');

      message.success('Step added successfully');
      setIsModalOpen(false);
      form.resetFields();
      router.refresh();
    } catch (err) {
      message.error('Failed to add step');
    }
  };

  const items = steps.map(step => ({
    key: step.id,
    title: step.type,
    description: (
      <div>
        <p>Status: {step.status}</p>
        {step.notes && <p>Notes: {step.notes}</p>}
        <p>Created: {new Date(step.createdAt).toLocaleString()}</p>
        <p>Date: {step.date ? new Date(step.date).toLocaleString() : "-"}</p>
      </div>
    ),
  }));

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Process Steps</h3>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          Add Step
        </Button>
      </div>

      <Steps
        direction="vertical"
        items={items}
        current={steps.length - 1}
      />

      <Modal
        title="Add Process Step"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} onFinish={handleAddStep} layout="vertical">
          <Form.Item
            name="type"
            label="Type"
            rules={[{ required: true, message: 'Please select the step type' }]}
          >
            <Select>
              <Select.Option value="Initial Contact">Initial Contact</Select.Option>
              <Select.Option value="Resume Review">Resume Review</Select.Option>
              <Select.Option value="Phone Screen">Phone Screen</Select.Option>
              <Select.Option value="Technical Interview">Technical Interview</Select.Option>
              <Select.Option value="Culture Fit">Culture Fit</Select.Option>
              <Select.Option value="Offer">Offer</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select the status' }]}
          >
            <Select>
              <Select.Option value="Pending">Pending</Select.Option>
              <Select.Option value="In Progress">In Progress</Select.Option>
              <Select.Option value="Completed">Completed</Select.Option>
              <Select.Option value="Failed">Failed</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Add Step
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
