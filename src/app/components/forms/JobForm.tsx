'use client';

import { Form, Input, Select, Button, Space } from 'antd';

export interface JobFormData {
  title: string;
  description: string;
  linkedinUrl?: string;
  status: string;
}

interface JobFormProps {
  onSubmit: (data: JobFormData) => void;
  onCancel: () => void;
  initialValues?: Partial<JobFormData>;
  submitText?: string;
  loading?: boolean;
}

export default function JobForm({
  onSubmit,
  onCancel,
  initialValues,
  submitText = 'Submit',
  loading = false,
}: JobFormProps) {
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
        name="title"
        label="Title"
        rules={[{ required: true, message: 'Please enter the job title' }]}
      >
        <Input placeholder="Enter job title" />
      </Form.Item>

      <Form.Item
        name="description"
        label="Description"
        rules={[{ required: true, message: 'Please enter the job description' }]}
      >
        <Input.TextArea rows={4} placeholder="Enter job description" />
      </Form.Item>

      <Form.Item
        name="linkedinUrl"
        label="LinkedIn URL"
      >
        <Input placeholder="Enter LinkedIn job posting URL" />
      </Form.Item>

      <Form.Item
        name="status"
        label="Status"
        rules={[{ required: true, message: 'Please select the job status' }]}
      >
        <Select placeholder="Select job status">
          <Select.Option value="DRAFT">Draft</Select.Option>
          <Select.Option value="PUBLISHED">Published</Select.Option>
          <Select.Option value="CLOSED">Closed</Select.Option>
        </Select>
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
