'use client';

import { useState } from 'react';
import { Form, Input, Button, Select, message } from 'antd';
import { useRouter } from 'next/navigation';

const { TextArea } = Input;

interface JobFormData {
  title: string;
  description?: string;
  linkedinUrl?: string;
  status: string;
}

export default function NewJobPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values: JobFormData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error('Failed to create job');

      message.success('Job created successfully');
      router.push('/jobs');
    } catch (error) {
      console.error('Error creating job:', error);
      message.error('Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Create New Job</h1>
      <Form
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ status: 'Open' }}
      >
        <Form.Item
          label="Title"
          name="title"
          rules={[{ required: true, message: 'Please enter the job title' }]}
        >
          <Input placeholder="e.g., Senior Software Engineer" />
        </Form.Item>

        <Form.Item label="Description" name="description">
          <TextArea rows={4} placeholder="Job description..." />
        </Form.Item>

        <Form.Item label="LinkedIn URL" name="linkedinUrl">
          <Input placeholder="https://www.linkedin.com/jobs/..." />
        </Form.Item>

        <Form.Item label="Status" name="status">
          <Select>
            <Select.Option value="Open">Open</Select.Option>
            <Select.Option value="Closed">Closed</Select.Option>
            <Select.Option value="Draft">Draft</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Create Job
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
