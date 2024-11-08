'use client';

import React, { useEffect } from 'react';
import { Modal, Form, Input, message, Select } from 'antd';
import type { CandidateView, JobView, Persona } from '@/types';
import { useQuery } from '@tanstack/react-query';
import CVUpload from './CVUpload';

interface CandidateModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (values: any) => void;
  candidate?: CandidateView | null;
}

const CandidateModal: React.FC<CandidateModalProps> = ({
  visible,
  onClose,
  onSubmit,
  candidate,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (!candidate) {
      form.resetFields();
      return;
    }

    form.setFieldsValue(candidate || {});
  }, [candidate, form]);

  const {
    data: personas,
    isLoading: personasLoading,
  } = useQuery<Persona[]>({
    queryKey: ['personas'],
    queryFn: async () => {
      const response = await fetch('/api/personas');
      if (!response.ok) {
        throw new Error('Failed to fetch personas');
      }
      return response.json();
    },
  });

  const {
    data: jobs,
    isLoading: jobsLoading,
  } = useQuery<JobView[]>({
    queryKey: ['jobs'],
    queryFn: async () => {
      const response = await fetch('/api/jobs');
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      return response.json();
    },
  });

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
      form.resetFields();
    } catch (error) {
      message.error('Please check your input');
    }
  };

  return (
    <Modal
      title={candidate ? 'Edit Candidate' : 'Add Candidate'}
      open={visible}
      onOk={handleSubmit}
      onCancel={onClose}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          name="personaId"
          label="Persona"
          rules={[{ required: true, message: 'Please select a persona' }]}
        >
          <Select
            placeholder="Select a persona"
            style={{ width: '100%' }}
            disabled={personasLoading}
            defaultValue={candidate?.personaId}
            options={(personas || []).map((persona) => ({
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
            disabled={jobsLoading}
            defaultValue={candidate?.jobId}
            options={(jobs || []).map((job) => ({
              value: job.id,
              label: job.title
            }))}
          />
        </Form.Item>

        <Form.Item
          name="notes"
          label="Notes"
        >
          <Input.TextArea rows={4} placeholder="Enter notes" />
        </Form.Item>

        <Form.Item
          name="cvFileKey"
          label="CV"
        >
          <CVUpload
            candidateId={candidate?.id}
            onUploadComplete={(fileKey: string) => {
              form.setFieldValue('cvFileKey', fileKey);
            }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CandidateModal;
