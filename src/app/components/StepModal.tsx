'use client';

import { useState } from 'react';
import { Modal, Form, Select, Input, Alert } from 'antd';
import type { FormInstance } from 'antd/es/form';

const { TextArea } = Input;

type StepModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { type: string; status: string; notes?: string }) => Promise<void>;
};

const STEP_TYPES = [
  'applied',
  'screening',
  'interview',
  'technical',
  'offer',
  'hired',
  'rejected',
] as const;

const STATUS_OPTIONS = [
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
] as const;

export default function StepModal({ isOpen, onClose, onSubmit }: StepModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      const values = await form.validateFields();
      await onSubmit(values);
      form.resetFields();
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to add step');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Add Process Step"
      open={isOpen}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText={loading ? 'Adding...' : 'Add Step'}
      width={520}
    >
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          type: STEP_TYPES[0],
          status: STATUS_OPTIONS[0],
        }}
      >
        <Form.Item
          name="type"
          label="Step Type"
          rules={[{ required: true, message: 'Please select a step type' }]}
        >
          <Select>
            {STEP_TYPES.map((type) => (
              <Select.Option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="status"
          label="Status"
          rules={[{ required: true, message: 'Please select a status' }]}
        >
          <Select>
            {STATUS_OPTIONS.map((status) => (
              <Select.Option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="notes"
          label="Notes"
        >
          <TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
