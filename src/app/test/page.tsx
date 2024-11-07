'use client';

import React from 'react';
import { Card, Button, Table, Input, Select, Space } from 'antd';

export default function TestPage() {
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
  ];

  const data = [
    {
      key: '1',
      name: 'John Doe',
      email: 'john@example.com',
      status: 'Active',
    },
    {
      key: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      status: 'Pending',
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card title="Ant Design Test Components" style={{ marginBottom: '24px' }}>
        <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
          <div>
            <h3>Buttons</h3>
            <Space>
              <Button type="primary">Primary Button</Button>
              <Button>Default Button</Button>
              <Button type="dashed">Dashed Button</Button>
            </Space>
          </div>

          <div>
            <h3>Input Fields</h3>
            <Space direction="vertical">
              <Input placeholder="Basic Input" />
              <Input.Password placeholder="Password Input" />
              <Select
                defaultValue="option1"
                style={{ width: 200 }}
                options={[
                  { value: 'option1', label: 'Option 1' },
                  { value: 'option2', label: 'Option 2' },
                  { value: 'option3', label: 'Option 3' },
                ]}
              />
            </Space>
          </div>

          <div>
            <h3>Table Component</h3>
            <Table columns={columns} dataSource={data} />
          </div>
        </Space>
      </Card>
    </div>
  );
}
