'use client';

import { Form, Input, Button, Space } from 'antd';
import type { Persona } from '@/types';

export interface PersonaFormData {
  name: string;
  email: string;
  notes?: string;
}

interface Props {
  initialValues?: PersonaFormData;
  onSubmit: (values: PersonaFormData) => Promise<void>;
  onCancel: () => void;
}

const PersonaForm = ({
  initialValues,
  onSubmit,
  onCancel,
}: Props) => {
  const [form] = Form.useForm();

  const handleSubmit = async (values: PersonaFormData) => {
    try {
      await onSubmit(values);
      form.resetFields();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={handleSubmit}
    >
      <Form.Item
        name="name"
        label="Name"
        rules={[{ required: true, message: 'Please enter the name' }]}
      >
        <Input placeholder="Enter name" />
      </Form.Item>

      <Form.Item
        name="email"
        label="Email"
        rules={[
          { required: true, message: 'Please enter the email' },
          { type: 'email', message: 'Please enter a valid email' }
        ]}
      >
        <Input placeholder="Enter email" />
      </Form.Item>

      <Form.Item
        name="notes"
        label="Notes"
      >
        <Input.TextArea rows={4} placeholder="Enter notes" />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit">
            {initialValues ? 'Update' : 'Create'} Persona
          </Button>
          <Button onClick={onCancel}>Cancel</Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default PersonaForm;
