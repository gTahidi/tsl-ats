'use client';

import React from 'react';
import { Modal, Form, Input, Select } from 'antd';
import type { JobView, ProcessGroup } from '../../types';
import { useQuery } from '@tanstack/react-query';

interface JobModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (values: Partial<JobView>) => void;
  job?: JobView | null;
}

const JobModal: React.FC<JobModalProps> = ({
  visible,
  onClose,
  onSubmit,
  job,
}) => {
  const [form] = Form.useForm();

  const {
    data: groups,
    isLoading: groupsLoading,
  } = useQuery<ProcessGroup[]>({
    queryKey: ['processGroups'],
    queryFn: async () => {
      const response = await fetch('/api/process-groups');
      if (!response.ok) {
        throw new Error('Failed to fetch process groups');
      }
      return response.json();
    },
  });

  return (
    <Modal
      title={job ? 'Edit Job' : 'Add Job'}
      open={visible}
      onOk={() => form.validateFields().then(onSubmit)}
      onCancel={onClose}
      destroyOnClose
    >
      <Form form={form} layout="vertical" initialValues={job || {}}>
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
          rules={[{ required: false, message: 'Please enter the job description' }]}
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
          initialValue={job?.status || 'Open'}
        >
          <Select>
            <Select.Option value="Open">Open</Select.Option>
            <Select.Option value="Closed">Closed</Select.Option>
            <Select.Option value="Draft">Draft</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="processGroupId"
          label="Process Group"
          rules={[{ required: true, message: 'Please select a process group' }]}
          initialValue={job?.processGroupId}
        >
          <Select
            placeholder="Select a group"
            style={{ width: '100%' }}
            disabled={groupsLoading}
            defaultValue={job?.processGroupId}
            options={(groups || []).map((g) => ({
              value: g.id,
              label: g.name,
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default JobModal;
