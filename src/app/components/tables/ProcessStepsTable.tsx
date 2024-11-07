'use client';

import { Table, Space, Button, Tag, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { format } from 'date-fns';

interface ProcessStep {
  id: string;
  name: string;
  order: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ProcessStepsTableProps {
  steps: ProcessStep[];
  onEdit: (step: ProcessStep) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

export default function ProcessStepsTable({
  steps,
  onEdit,
  onDelete,
  loading = false,
}: ProcessStepsTableProps) {
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: ProcessStep, b: ProcessStep) => a.name.localeCompare(b.name),
    },
    {
      title: 'Order',
      dataIndex: 'order',
      key: 'order',
      width: 80,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'Active' ? 'green' : 'red'}>{status}</Tag>
      ),
      filters: [
        { text: 'Active', value: 'Active' },
        { text: 'Inactive', value: 'Inactive' },
      ],
      onFilter: (value: string | number | boolean, record: ProcessStep) =>
        record.status === value,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => format(new Date(date), 'MMM d, yyyy'),
    },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: string) => format(new Date(date), 'MMM d, yyyy'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: ProcessStep) => (
        <Space size="middle">
          <Tooltip title="Edit">
            <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(record)} />
          </Tooltip>
          <Tooltip title="Delete">
            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => onDelete(record.id)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={steps}
      rowKey="id"
      loading={loading}
      pagination={{
        defaultPageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} steps`,
      }}
    />
  );
}
