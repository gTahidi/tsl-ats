'use client';

import { Form, Input, Upload, Button, Space, Select } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { Job, Persona } from '@/types';

export interface CandidateFormData {
  name: string;
  email: string;
  linkedinUrl?: string;
  notes?: string;
  personaId: string;
  jobId: string;
  cvFile?: UploadFile;
}

interface Props {
  initialValues?: CandidateFormData;
  onSubmit: (values: CandidateFormData) => Promise<void>;
  onCancel: () => void;
  personas: Persona[];
  jobs: Job[];
  loading?: boolean;
}

const CandidateForm = ({
  initialValues,
  onSubmit,
  onCancel,
  personas,
  jobs,
  loading = false,
}: Props) => {
  const [form] = Form.useForm();

  const handleSubmit = async (values: CandidateFormData) => {
    try {
      await onSubmit(values);
      form.resetFields();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  console.log('Rendering CandidateForm with personas:', personas);

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={handleSubmit}
      disabled={loading}
      style={{ maxWidth: '600px', margin: '0 auto' }}
    >
      <Form.Item
        name="name"
        label="Name"
        rules={[{ required: true, message: 'Please enter a name' }]}
      >
        <Input placeholder="Enter name" />
      </Form.Item>

      <Form.Item
        name="email"
        label="Email"
        rules={[
          { required: true, message: 'Please enter an email' },
          { type: 'email', message: 'Please enter a valid email' }
        ]}
      >
        <Input placeholder="Enter email" />
      </Form.Item>

      <Form.Item
        name="personaId"
        label="Persona"
        rules={[{ required: true, message: 'Please select a persona' }]}
      >
        <Select
          placeholder="Select a persona"
          style={{ width: '100%' }}
          options={personas.map((persona) => ({
            value: persona.id,
            label: `${persona.name} (${persona.email})`
          }))}
        />
      </Form.Item>

      <Form.Item
        name="jobId"
        label="Job"
        rules={[{ required: true, message: 'Please select a job' }]}
      >
        <Select
          placeholder="Select a job"
          style={{ width: '100%' }}
          options={jobs.map((job) => ({
            value: job.id,
            label: job.title
          }))}
        />
      </Form.Item>

      <Form.Item
        name="linkedinUrl"
        label="LinkedIn URL"
        rules={[
          { type: 'url', message: 'Please enter a valid URL' }
        ]}
      >
        <Input placeholder="Enter LinkedIn URL" />
      </Form.Item>

      <Form.Item
        name="cvFile"
        label="CV"
        valuePropName="fileList"
        getValueFromEvent={normFile}
      >
        <Upload
          maxCount={1}
          beforeUpload={() => false}
          accept=".pdf,.doc,.docx"
          disabled={loading}
        >
          <Button icon={<UploadOutlined />} disabled={loading}>Upload CV</Button>
        </Upload>
      </Form.Item>

      <Form.Item
        name="notes"
        label="Notes"
      >
        <Input.TextArea rows={4} placeholder="Enter notes" />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
          >
            Create Candidate
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
};

export default CandidateForm;
