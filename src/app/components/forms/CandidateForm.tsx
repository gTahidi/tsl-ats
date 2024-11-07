'use client';

import { Form, Input, Upload, Button, Space, Select } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { Job, Persona } from '@/types';

export interface CandidateFormData {
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
}

const CandidateForm = ({
  initialValues,
  onSubmit,
  onCancel,
  personas,
  jobs,
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

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={handleSubmit}
    >
      <Form.Item
        name="personaId"
        label="Persona"
        rules={[{ required: true, message: 'Please select a persona' }]}
      >
        <Select placeholder="Select a persona">
          {personas.map((persona) => (
            <Select.Option key={persona.id} value={persona.id}>
              {persona.name} ({persona.email})
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="jobId"
        label="Job"
        rules={[{ required: true, message: 'Please select a job' }]}
      >
        <Select placeholder="Select a job">
          {jobs.map((job) => (
            <Select.Option key={job.id} value={job.id}>
              {job.title}
            </Select.Option>
          ))}
        </Select>
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
        >
          <Button icon={<UploadOutlined />}>Upload CV</Button>
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
          <Button type="primary" htmlType="submit">
            {initialValues ? 'Update' : 'Create'} Candidate
          </Button>
          <Button onClick={onCancel}>Cancel</Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default CandidateForm;
