'use client';

import { Form, Input, Select, Button, Space } from 'antd';
import type { Job } from '@/types';

export interface JobFormData {
  title: string;
  description?: string;
  linkedinUrl?: string;
  status: string;
}

interface Props {
  initialValues?: JobFormData;
  onSubmit: (values: JobFormData) => Promise<void>;
  onCancel: () => void;
}

const JOB_STATUSES = ['Open', 'Closed', 'On Hold', 'Draft'] as const;

const JobForm = ({
  initialValues,
  onSubmit,
  onCancel,
}: Props) => {
  const [form] = Form.useForm();

  const handleSubmit = async (values: JobFormData) => {
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
        name="title"
        label="Job Title"
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
        rules={[
          { type: 'url', message: 'Please enter a valid URL' },
        ]}
      >
        <Input placeholder="Enter LinkedIn URL" />
      </Form.Item>

      <Form.Item
        name="status"
        label="Status"
        rules={[{ required: true, message: 'Please select the job status' }]}
      >
        <Select>
          {JOB_STATUSES.map((status) => (
            <Select.Option key={status} value={status}>
              {status}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit">
            {initialValues ? 'Update' : 'Create'} Job
          </Button>
          <Button onClick={onCancel}>Cancel</Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default JobForm;
