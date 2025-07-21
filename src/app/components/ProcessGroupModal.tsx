'use client';

import React, { useEffect } from 'react';
import { Modal, Form, Input, Button, InputNumber } from 'antd';
import type { ProcessGroup } from '../../types';

interface ProcessGroupModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (values: Partial<ProcessGroup>) => void;
  group?: ProcessGroup | null;
}

const ProcessGroupModal: React.FC<ProcessGroupModalProps> = ({
  visible,
  onClose,
  onSubmit,
  group,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (!group) {
      form.resetFields();
      return;
    }

    form.setFieldsValue(group || {});
  }, [group, form]);

  return (
    <Modal
      title={group ? 'Edit Process Group' : 'Add Process Group'}
      open={visible}
      onOk={() => form.validateFields().then(onSubmit)}
      onCancel={onClose}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: 'Please enter the group name' }]}
        >
          <Input placeholder="Enter group name" />
        </Form.Item>

        {/* TODO: This item will define each of the step template as a list of steps. Each step has: order and name */}

        <Form.List name="steps">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Form.Item
                    {...restField}
                    name={[name, 'order']}
                    label="Order"
                    rules={[{ required: true, message: 'Please enter the step order' }]}
                  >
                    <InputNumber placeholder="Enter step order" />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, 'name']}
                    label="Step Name"
                    rules={[{ required: true, message: 'Please enter the step name' }]}
                  >
                    <Input placeholder="Enter step name" />
                  </Form.Item>
                  <Button onClick={() => remove(name)}>
                    Remove
                  </Button>
                </div>
              ))}
              <Button onClick={() => add()}>
                Add Step
              </Button>
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
};

export default ProcessGroupModal;
