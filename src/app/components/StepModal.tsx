import { type InferSelectModel } from 'drizzle-orm';
import { processSteps } from '@/db/schema';

type ProcessStep = InferSelectModel<typeof processSteps>;
import { Modal, Form, Input, Select, InputNumber, message } from 'antd';
import { useState } from 'react';

interface StepModalProps {
  visible: boolean;
  onClose: (refresh?: boolean) => void;
  step: ProcessStep | null;
}

export default function StepModal({ visible, onClose, step }: StepModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      const url = step ? `/api/process-steps/${step.id}` : '/api/process-steps';
      const method = step ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error('Failed to save step');

      message.success(`Process step ${step ? 'updated' : 'created'} successfully`);
      form.resetFields();
      onClose(true);
    } catch (error) {
      console.error('Error saving step:', error);
      message.error('Failed to save process step');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={step ? 'Edit Process Step' : 'Create Process Step'}
      open={visible}
      onOk={handleSubmit}
      onCancel={() => onClose()}
      confirmLoading={loading}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={step || {}}
        preserve={false}
      >
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: 'Please enter step name' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true, message: 'Please enter step description' }]}
        >
          <Input.TextArea rows={4} />
        </Form.Item>

        <Form.Item
          name="order"
          label="Order"
          rules={[{ required: true, message: 'Please enter step order' }]}
        >
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="status"
          label="Status"
          rules={[{ required: true, message: 'Please select status' }]}
        >
          <Select>
            <Select.Option value="ACTIVE">Active</Select.Option>
            <Select.Option value="INACTIVE">Inactive</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
}
