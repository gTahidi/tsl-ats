'use client';

import { Form, Input, Button, Space } from 'antd';

export interface PersonaFormData {
  name: string;
  description: string;
  requirements: string;
}

interface PersonaFormProps {
  onSubmit: (data: PersonaFormData) => void;
  onCancel: () => void;
  initialValues?: Partial<PersonaFormData>;
  submitText?: string;
  loading?: boolean;
}

export default function PersonaForm({
  onSubmit,
  onCancel,
  initialValues,
  submitText = 'Submit',
  loading = false,
}: PersonaFormProps) {
  const [form] = Form.useForm();

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onSubmit}
      initialValues={initialValues}
      disabled={loading}
    >
      <Form.Item
        name="name"
        label="Name"
        rules={[{ required: true, message: 'Please enter the persona name' }]}
      >
        <Input placeholder="Enter persona name" />
      </Form.Item>

      <Form.Item
        name="description"
        label="Description"
        rules={[{ required: true, message: 'Please enter the persona description' }]}
      >
        <Input.TextArea rows={4} placeholder="Enter persona description" />
      </Form.Item>

      <Form.Item
        name="requirements"
        label="Requirements"
        rules={[{ required: true, message: 'Please enter the persona requirements' }]}
      >
        <Input.TextArea rows={4} placeholder="Enter persona requirements" />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
          >
            {submitText}
          </Button>
          <Button
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
}
