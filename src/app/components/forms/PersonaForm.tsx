'use client';

import { Form, Input, Button, Space } from 'antd';

export interface PersonaFormData {
  name: string;
  description: string;
  requirements: string;
}

interface PersonaFormProps {
  onSubmit: (data: PersonaFormData) => void;
  initialValues?: Partial<PersonaFormData>;
  submitText?: string;
}

export default function PersonaForm({
  onSubmit,
  initialValues,
  submitText = 'Submit',
}: PersonaFormProps) {
  const [form] = Form.useForm();

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onSubmit}
      initialValues={initialValues}
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
          <Button type="primary" htmlType="submit">
            {submitText}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
}
