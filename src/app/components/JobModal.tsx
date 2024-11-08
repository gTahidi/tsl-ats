'use client';

import React from 'react';
import { Modal, Form, Input, Select, message } from 'antd';
import type { JobView } from '../types/jobs';

const { TextArea } = Input;

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

  // ... existing useEffect implementation ...

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
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true }]}
        >
          <TextArea rows={4} />
        </Form.Item>
        <Form.Item
          name="linkedinUrl"
          label="LinkedIn URL"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="status"
          label="Status"
          rules={[{ required: true }]}
        >
          <Select>
            <Select.Option value="active">Active</Select.Option>
            <Select.Option value="closed">Closed</Select.Option>
            <Select.Option value="draft">Draft</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default JobModal;
