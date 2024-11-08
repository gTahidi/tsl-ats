'use client';

import React from 'react';
import { Modal, Form, Input } from 'antd';
import type { Persona } from '../../types';

interface PersonaModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (values: Partial<Persona>) => void;
  persona?: Persona | null;
}

const PersonaModal: React.FC<PersonaModalProps> = ({
  visible,
  onClose,
  onSubmit,
  persona,
}) => {
  const [form] = Form.useForm();

  return (
    <Modal
      title={persona ? 'Edit Persona' : 'Add Persona'}
      open={visible}
      onOk={() => form.validateFields().then(onSubmit)}
      onCancel={onClose}
      destroyOnClose
    >
      <Form form={form} layout="vertical" initialValues={persona || {}}>
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: 'Please enter the persona name' }]}
        >
          <Input placeholder="Enter persona name" />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Please enter the persona email' },
            { type: 'email', message: 'Please enter a valid email' }
          ]}
        >
          <Input placeholder="Enter persona email" />
        </Form.Item>

        <Form.Item
          name="linkedinUrl"
          label="LinkedIn URL"
        >
          <Input placeholder="Enter LinkedIn persona posting URL" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PersonaModal;
