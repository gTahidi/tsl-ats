'use client';

import React from 'react';
import { Modal, Form, Input, message } from 'antd';
import type { CandidateView } from '../types';

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

  React.useEffect(() => {
    if (visible && candidate) {
      form.setFieldsValue({
        name: candidate.name,
        email: candidate.email,
        linkedinUrl: candidate.linkedinUrl,
      });
    } else {
      form.resetFields();
    }
  }, [visible, candidate, form]);

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
        initialValues={candidate || {}}
      >
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: 'Please input the name' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Please input the email' },
            { type: 'email', message: 'Please enter a valid email' },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="linkedinUrl"
          label="LinkedIn URL"
        >
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CandidateModal;
