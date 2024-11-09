'use client';

import React, { useEffect } from 'react';
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

  useEffect(() => {
    if (!persona) {
      form.resetFields();
      return;
    }

    form.setFieldsValue(persona || {});
  }, [persona, form]);

  return (
    <Modal
      title={persona ? 'Edit Persona' : 'Add Persona'}
      open={visible}
      onOk={() => form.validateFields().then(onSubmit)}
      onCancel={onClose}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: 'Please enter the persona name' }]}
        >
          <Input placeholder="Enter persona name" />
        </Form.Item>

        <Form.Item
          name="surname"
          label="Surame"
          rules={[{ required: true, message: 'Please enter the persona surname' }]}
        >
          <Input placeholder="Enter persona surname" />
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
          name="location"
          label="Location"
          rules={[{ required: false, message: 'Please enter the persona location' }]}
        >
          <Input placeholder="Enter persona location" />
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
