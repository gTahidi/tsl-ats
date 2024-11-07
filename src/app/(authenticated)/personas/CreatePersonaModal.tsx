'use client';

import { Modal, Form, Input, Button } from 'antd';

interface CreatePersonaModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: any) => Promise<void>;
}

export default function CreatePersonaModal({ open, onCancel, onSubmit }: CreatePersonaModalProps) {
  const [form] = Form.useForm();

  const handleSubmit = async (values: any) => {
    await onSubmit(values);
    form.resetFields();
  };

  return (
    <Modal
      title="Create New Persona"
      open={open}
      onCancel={onCancel}
      footer={null}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: 'Please input the name!' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Please input the email!' },
            { type: 'email', message: 'Please input a valid email!' }
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="notes"
          label="Notes"
        >
          <Input.TextArea />
        </Form.Item>
        <Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={onCancel}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              Create
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
}
