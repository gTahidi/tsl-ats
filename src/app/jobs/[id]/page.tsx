'use client';

import { useEffect, useState } from 'react';
import { Form, Input, Button, Select, message, Spin, Card } from 'antd';
import { useRouter } from 'next/navigation';

const { TextArea } = Input;

interface JobFormData {
  title: string;
  description?: string;
  linkedinUrl?: string;
  status: string;
}

interface JobPosting extends JobFormData {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export default function EditJobPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [job, setJob] = useState<JobPosting | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await fetch(`/api/jobs/${params.id}`);
        if (!response.ok) throw new Error('Failed to fetch job');
        const data = await response.json();
        setJob(data.job);
      } catch (error) {
        console.error('Error fetching job:', error);
        message.error('Failed to load job');
        router.push('/jobs');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [params.id, router]);

  const onFinish = async (values: JobFormData) => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/jobs/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error('Failed to update job');

      message.success('Job updated successfully');
      router.push('/jobs');
    } catch (error) {
      console.error('Error updating job:', error);
      message.error('Failed to update job');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!job) {
    return null;
  }

  return (
    <Card>
      <h1 className="text-2xl font-semibold mb-6">Edit Job</h1>
      <Form
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          title: job.title,
          description: job.description,
          linkedinUrl: job.linkedinUrl,
          status: job.status,
        }}
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
          <Button type="primary" htmlType="submit" loading={submitting}>
            Update Job
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
